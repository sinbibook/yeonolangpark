(function (global) {
  'use strict';

  var YBS_BASE_URL = 'https://www.yapen.co.kr/external?ypIdx=';
  // 로고 색상 보정을 적용할 최소 투명 픽셀 비율 (미만이면 사각 배경 로고로 보고 원본 유지)
  var LOGO_MIN_TRANSPARENT_RATIO = 0.15;

  function HeaderFooterMapper() {
    BaseDataMapper.call(this);
  }
  HeaderFooterMapper.prototype = Object.create(BaseDataMapper.prototype);
  HeaderFooterMapper.prototype.constructor = HeaderFooterMapper;

  HeaderFooterMapper.prototype.mapPage = function () {
    this.mapLogo();
    this.mapFavicon();
    this.mapBookingLinks();
    this.mapYbs();
    this.mapRoomMenu();
    this.mapFacilityMenu();
    this.mapPageToggles();
    this.mapAllmenuBg();
    this.mapFooter();
    // SEO: homepage.seo → title + description/keywords + 네이버/구글 사이트 인증 (전 페이지 공통)
    this.updateMetaTags();
  };

  // 숙소 대표이미지: property.images[0].thumbnail[isSelected][0] (없으면 exterior)
  HeaderFooterMapper.prototype.getRepresentativeImage = function () {
    var images = (this.getProperty().images || [])[0] || {};
    return (
      this.getFirstSelectedImage(images.thumbnail || []) ||
      this.getFirstSelectedImage(images.exterior || [])
    );
  };

  // customFields.roomtypes (localhost / preview 경로 모두 대응)
  HeaderFooterMapper.prototype.getRoomtypes = function () {
    var cf = this.getCustomFields();
    if (cf.roomtypes && cf.roomtypes.length) return cf.roomtypes;
    if (this.data && this.data.customFields && this.data.customFields.roomtypes) {
      return this.data.customFields.roomtypes;
    }
    return cf.roomtypes || [];
  };

  // 페이지 enabled 여부 (sections[0].enabled === false 이면 비활성)
  HeaderFooterMapper.prototype.isPageEnabled = function (pageKey) {
    var page = this.getPages()[pageKey];
    var section = page && page.sections && page.sections[0];
    return !(section && section.enabled === false);
  };

  // MAPPER: homepage.images[0].logo[isSelected].url → [data-logo]
  //   [data-logo]        → 기본 로고 (헤더 투명 / 최상단)
  //   [data-logo-scroll] → 스크롤 시 로고 (.header.on) — logo[1], 없으면 logo[0] 재사용
  // F 템플릿 로고는 <a data-logo style="background-image:..."> (배경이미지). <img data-logo>도 호환.
  HeaderFooterMapper.prototype.mapLogo = function () {
    var topUrl = this.getLogo();
    var scrollUrl = this.getScrollLogo();
    this.applyLogo('[data-logo]', topUrl);
    this.applyLogo('[data-logo-scroll]', scrollUrl);
    // 로고 색상 자동 보정 — 헤더 배경(투명/흰색)에 맞춰 로고 색을 칠한다
    this.tintLogo('[data-logo]', topUrl);
    this.tintLogo('[data-logo-scroll]', scrollUrl);
  };

  // 업로드된 로고를 헤더 상태별 테마 색으로 칠한다.
  //   최상단(투명 헤더)      → --logo-color-top    (기본 흰색)
  //   스크롤(.header.on)     → --logo-color-scroll (기본 --color-secondary)
  // 색상은 styles/theme.css에서 관리하고, 여기서는 로고 알파 채널을 CSS mask로 넘겨 모양만 보존한다.
  // 투명 배경 로고가 아니거나(사각 배경) CORS로 픽셀을 못 읽으면 원본 이미지를 그대로 둔다.
  HeaderFooterMapper.prototype.tintLogo = function (selector, url) {
    var els = document.querySelectorAll(selector);
    if (!els.length || !url) return;
    if (!ImageHelpers.supportsMask()) return;

    ImageHelpers.analyzeImage(url).then(function (info) {
      // 배경이 불투명한 로고는 mask로 칠하면 사각형이 통째로 칠해지므로 제외
      if (!info || info.transparentRatio < LOGO_MIN_TRANSPARENT_RATIO) return;

      // CSS 변수 안의 상대 경로는 스타일시트(styles/style.css) 기준으로 해석되므로 절대 URL로 변환
      var maskUrl = url;
      try {
        maskUrl = new URL(url, document.baseURI).href;
      } catch (e) {
        /* 절대 URL 변환 실패 시 원본 그대로 */
      }

      els.forEach(function (el) {
        el.style.setProperty('--logo-mask', "url('" + maskUrl + "')");
        el.style.backgroundImage = 'none';
        el.classList.add('is-logo-tinted');
      });
    });
  };

  // 로고 이미지 주입 — 배경이미지(<a data-logo>) / <img data-logo> 모두 호환
  HeaderFooterMapper.prototype.applyLogo = function (selector, logoUrl) {
    document.querySelectorAll(selector).forEach(function (el) {
      // 직전 색상 보정 초기화 — 로고가 교체돼도 이전 mask가 남지 않도록
      el.classList.remove('is-logo-tinted');
      el.style.removeProperty('--logo-mask');
      if (el.tagName === 'IMG') {
        if (logoUrl) {
          el.src = logoUrl;
          el.classList.remove('empty-image-placeholder');
        } else {
          ImageHelpers.applyPlaceholder(el);
        }
      } else if (logoUrl) {
        // 배경이미지 로고 — 직전 placeholder 잔상(회색 배경) 제거
        el.style.backgroundImage = "url('" + logoUrl + "')";
        el.style.backgroundColor = '';
        el.classList.remove('empty-image-placeholder');
      } else {
        // 데이터 없으면 empty placeholder (정적 logo.png fallback 안 씀)
        ImageHelpers.applyBackgroundPlaceholder(el);
      }
    });
  };

  // MAPPER: favicon ← homepage.images[0].logo[isSelected].url (로고 데이터 재사용)
  HeaderFooterMapper.prototype.mapFavicon = function () {
    var logoUrl = this.getLogo();
    if (!logoUrl) return;
    var link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logoUrl;
  };

  // MAPPER: property.realtimeBookingId → [data-booking-link] (href 직접 주입)
  HeaderFooterMapper.prototype.mapBookingLinks = function () {
    var bookingUrl = this.getBookingUrl();
    document.querySelectorAll('[data-booking-link]').forEach(function (el) {
      if (bookingUrl && bookingUrl !== '#!') {
        el.href = bookingUrl;
        el.setAttribute('target', '_blank');
      }
    });
  };

  // MAPPER: property.ybsId → [data-ybs-button] (없으면 숨김)
  HeaderFooterMapper.prototype.mapYbs = function () {
    var ybsId = this.getProperty().ybsId;
    document.querySelectorAll('[data-ybs-button]').forEach(function (el) {
      if (!ybsId) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      el.setAttribute('data-ybs-id', ybsId);
      var target = el.tagName === 'A' ? el : el.querySelector('a');
      if (target) {
        target.href = YBS_BASE_URL + ybsId;
        target.setAttribute('target', '_blank');
      }
    });
  };

  // MAPPER: roomtypes[].name → [data-rooms-submenu] (data-room-menu-link 앵커 뒤에 li 동적 생성)
  HeaderFooterMapper.prototype.mapRoomMenu = function () {
    var roomtypes = this.getRoomtypes();
    document.querySelectorAll('[data-rooms-submenu]').forEach(function (container) {
      // 이전 생성분 제거 (preview 재렌더 대비)
      container.querySelectorAll('[data-generated="room"]').forEach(function (li) {
        li.remove();
      });
      roomtypes.forEach(function (rt) {
        // 이름 없는 객실타입은 빈 메뉴 항목(여백)이 되므로 건너뜀
        if (!rt.name || !rt.name.trim()) return;
        var li = document.createElement('li');
        li.setAttribute('data-generated', 'room');
        var a = document.createElement('a');
        a.href = 'room.html?room_id=' + rt.id;
        a.textContent = rt.name;
        li.appendChild(a);
        container.appendChild(li);
      });
    });
  };

  // MAPPER: property.facilities[].name → [data-facility-menu-link] (컨테이너 비우고 li 동적 생성)
  HeaderFooterMapper.prototype.mapFacilityMenu = function () {
    var facilities = this.getProperty().facilities || [];
    document.querySelectorAll('[data-facility-menu-link]').forEach(function (container) {
      container.innerHTML = '';
      facilities.forEach(function (f) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = 'facility.html?id=' + f.id;
        a.textContent = f.name || '';
        li.appendChild(a);
        container.appendChild(li);
      });
    });
  };

  // MAPPER: pages.layoutMap / nearbyAttractions enabled → 메뉴 표시/숨김
  HeaderFooterMapper.prototype.mapPageToggles = function () {
    var layoutMapEnabled = this.isPageEnabled('layoutMap');
    document.querySelectorAll('[data-menu-id="layout-map"]').forEach(function (el) {
      el.style.display = layoutMapEnabled ? '' : 'none';
    });

    var nearbyEnabled = this.isPageEnabled('nearbyAttractions');
    document.querySelectorAll('[data-travel-menu]').forEach(function (el) {
      el.style.display = nearbyEnabled ? '' : 'none';
    });
  };

  // MAPPER: 숙소 대표이미지 → [data-allmenu-bg] (전체메뉴 오버레이 배경, 없으면 empty placeholder)
  HeaderFooterMapper.prototype.mapAllmenuBg = function () {
    var url = this.getRepresentativeImage();
    document.querySelectorAll('[data-allmenu-bg]').forEach(function (el) {
      if (url) {
        el.style.background = 'url(' + url + ') no-repeat center bottom';
        el.style.backgroundSize = 'cover';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(el);
      }
    });
  };

  // 전화번호 링크(<a data-footer-phone-link>)를 번호 개수만큼 복제해 한 줄씩 노출
  HeaderFooterMapper.prototype.renderFooterPhones = function (phones) {
    var links = document.querySelectorAll('[data-footer-phone-link]');
    if (!links.length) return;
    var base = links[0];
    var parent = base.parentNode;
    // 재매핑 대비: 앞서 복제한 링크는 제거하고 원본만 템플릿으로 사용
    for (var i = links.length - 1; i >= 1; i--) {
      links[i].parentNode.removeChild(links[i]);
    }
    phones.forEach(function (phone, idx) {
      var el = idx === 0 ? base : base.cloneNode(true);
      var span = el.querySelector('[data-footer-phone]');
      if (span) span.textContent = phone;
      el.setAttribute('href', 'tel:' + String(phone).replace(/[^0-9+]/g, ''));
      if (idx > 0) parent.appendChild(el);
    });
  };

  // MAPPER: property.contactPhone / property.businessInfo → footer 라인별 텍스트
  HeaderFooterMapper.prototype.mapFooter = function () {
    var prop = this.getProperty();
    var biz = prop.businessInfo || {};
    var phones = this.toPhoneList(prop.contactPhone);
    var fields = {
      '[data-footer-address]': biz.businessAddress,
      '[data-footer-business-name]': biz.businessName,
      '[data-footer-representative]': biz.representativeName,
      '[data-footer-business-number]': biz.businessNumber
    };
    Object.keys(fields).forEach(function (selector) {
      var value = fields[selector];
      if (value === undefined || value === null || value === '') return;
      document.querySelectorAll(selector).forEach(function (el) {
        el.textContent = value;
      });
    });

    // 전화번호: 배열에 담긴 번호를 전부 줄바꿈해 노출 (각각 tel: 링크)
    this.renderFooterPhones(phones);

    // 푸터 ROOMS 링크: layoutMap(미리보기) 활성 시 layout-map.html, 아니면 첫 번째 객실 room.html
    // (헤더 ROOMS 메뉴의 미리보기 노출 로직 isPageEnabled('layoutMap')과 일관)
    var roomLink;
    if (this.isPageEnabled('layoutMap')) {
      roomLink = 'layout-map.html';
    } else {
      var firstRoom = this.getRoomtypes().filter(function (rt) {
        return rt.name && rt.name.trim();
      })[0];
      roomLink = firstRoom ? 'room.html?room_id=' + firstRoom.id : 'room.html';
    }
    document.querySelectorAll('[data-footer-room-link]').forEach(function (el) {
      el.setAttribute('href', roomLink);
    });
  };

  document.addEventListener('headerFooterLoaded', function () {
    var mapper = new HeaderFooterMapper();
    mapper.initialize();
    global.headerFooterMapperInstance = mapper;
  });

  global.HeaderFooterMapper = HeaderFooterMapper;
})(window);
