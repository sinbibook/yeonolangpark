(function (global) {
  'use strict';

  function nl2br(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />');
  }

  // totalRoomCount 한글 변환 테이블 (값 1 이상인 항목만 나열)
  var ROOM_COUNT_LABELS = {
    bedroom: '침대룸',
    bathroom: '화장실',
    livingRoom: '거실',
    ondol: '온돌룸',
    kitchen: '주방'
  };

  // roomStructures[0] + "/ " + totalRoomCount 값≥1 항목 한글 나열
  function buildRoomStructure(room) {
    if (!room) return '';
    var structures = room.roomStructures || [];
    var base = structures.length ? structures[0] : '';
    var counts = room.totalRoomCount || {};
    var labels = [];
    Object.keys(ROOM_COUNT_LABELS).forEach(function (key) {
      if (counts[key] >= 1) labels.push(ROOM_COUNT_LABELS[key]);
    });
    if (base && labels.length) return base + '/ ' + labels.join(' ');
    return base || labels.join(' ');
  }

  function pad2(n) {
    return ('0' + n).slice(-2);
  }

  // ── 랜딩 진입 판단 ─────────────────────────────────────────
  // index.html 진입을 landing.html 로 돌려야 하면 true. 쿼리 파라미터 없이 "어디서 왔는지(referrer)" 로 가른다.
  //   - 어드민 프리뷰 iframe → false (운영자가 "홈" 탭을 직접 볼 수 있어야 한다)
  //   - pages.landing.sections[0].enabled !== true → false (명시적으로 켠 경우만. 어드민 저장 시
  //     undefined 는 JSON 에서 키째 빠지므로, 누락을 '켜짐' 으로 보면 랜딩을 안 쓰는 숙소가 튕긴다)
  //   - 같은 사이트 안에서 넘어옴 → false (헤더 로고·메뉴, 랜딩의 자기 자신 카드)
  //   - 랜딩 카드에 등록된 연결 숙소 도메인에서 넘어옴 → false (그 숙소 랜딩의 카드를 눌러 온 경우)
  //   - 그 외(주소 직접 입력·즐겨찾기·검색/외부 링크) → true
  function shouldEnterLanding(landingPage) {
    if (window.top !== window.self) return false;

    var section = landingPage && landingPage.sections && landingPage.sections[0];
    if (!section || section.enabled !== true) return false;

    return !isFromSameSite() && !isFromLinkedProperty(section);
  }

  function getReferrerUrl() {
    try {
      return document.referrer ? new URL(document.referrer) : null;
    } catch (e) {
      return null;
    }
  }

  function isFromSameSite() {
    var ref = getReferrerUrl();
    return !!ref && ref.origin === window.location.origin;
  }

  // 크로스 도메인 referrer 는 브라우저 기본 정책상 origin 만 오므로 호스트로만 비교한다 (www. 유무는 무시).
  function isFromLinkedProperty(section) {
    var ref = getReferrerUrl();
    if (!ref) return false;

    var refHost = normalizeHost(ref.host);
    return ((section && section.about) || []).some(function (card) {
      var domain = card && typeof card.domain === 'string' ? card.domain.trim() : '';
      if (!domain) return false;
      try {
        var url = new URL(/^https?:\/\//i.test(domain) ? domain : 'https://' + domain);
        return normalizeHost(url.host) === refHost;
      } catch (e) {
        return false;
      }
    });
  }

  // 랜딩으로 이동을 시작했으면 true. location.replace 는 즉시 페이지를 떠나지 않으므로,
  // 그 사이 다른 매핑(헤더 등)이 끝나며 부르는 __tplReveal 이 index 를 잠깐 드러내지 않게 막는 데 쓴다.
  var leavingToLanding = false;

  function goToLanding() {
    leavingToLanding = true;
    window.location.replace('landing.html');
  }

  function normalizeHost(host) {
    return String(host || '').toLowerCase().replace(/^www\./, '');
  }

  function IndexMapper() {
    BaseDataMapper.call(this);
  }
  IndexMapper.prototype = Object.create(BaseDataMapper.prototype);
  IndexMapper.prototype.constructor = IndexMapper;

  IndexMapper.prototype.mapPage = function () {
    if (this.maybeRedirectToLanding()) return;

    this.mapHeroSlides();
    this.mapAbout();
    this.mapSpecial();
    this.mapRoomSlides();
    this.mapClosing();
    this.refreshSwipers();
  };

  // 루트 가드: 랜딩 진입 대상이면 index.html 진입을 landing.html 로 되돌린다 (판단은 shouldEnterLanding).
  IndexMapper.prototype.maybeRedirectToLanding = function () {
    if (!shouldEnterLanding(this.getPages().landing)) return false;

    goToLanding();
    return true;
  };

  // customFields.pages.index.sections[0]
  IndexMapper.prototype.getIndexSection = function () {
    var pages = this.getPages();
    return (pages.index && pages.index.sections && pages.index.sections[0]) || {};
  };

  // customFields.roomtypes (localhost / preview 경로 모두 대응)
  IndexMapper.prototype.getRoomtypes = function () {
    var cf = this.getCustomFields();
    if (cf.roomtypes && cf.roomtypes.length) return cf.roomtypes;
    if (this.data && this.data.customFields && this.data.customFields.roomtypes) {
      return this.data.customFields.roomtypes;
    }
    return cf.roomtypes || [];
  };

  // 동적 슬라이드 주입 후 Swiper 재초기화 + Locomotive 높이 갱신
  // (custom.js가 빈/하드코딩 wrapper로 먼저 init하므로 재생성 필요)
  IndexMapper.prototype.refreshSwipers = function () {
    if (typeof window.initSwipers === 'function') window.initSwipers();
    if (window.locoScroll && typeof window.locoScroll.update === 'function') {
      window.setTimeout(function () {
        window.locoScroll.update();
      }, 200);
    }
  };

  // 배경이미지 슬라이드 1개 생성 (F hero 구조: .swiper-slide > .img(background))
  function buildHeroSlide(url) {
    var slide = document.createElement('div');
    slide.className = 'swiper-slide';
    var img = document.createElement('div');
    img.className = 'img';
    if (url) {
      img.style.background = 'url(' + url + ') no-repeat 50%';
      img.style.backgroundSize = 'cover';
    } else {
      ImageHelpers.applyBackgroundPlaceholder(img);
    }
    slide.appendChild(img);
    return slide;
  }

  // MAPPER: index.sections[0].hero.images[isSelected] → [data-index-hero-slides]
  IndexMapper.prototype.mapHeroSlides = function () {
    var wrapper = document.querySelector('[data-index-hero-slides]');
    if (!wrapper) return;
    var hero = this.getIndexSection().hero || {};
    var images = this.getSelectedImages(hero.images || []);

    wrapper.innerHTML = '';
    if (!images.length) {
      wrapper.appendChild(buildHeroSlide(''));
      return;
    }
    images.forEach(function (img) {
      wrapper.appendChild(buildHeroSlide(img.url));
    });
  };

  // MAPPER: index.sections[0].essence (핵심메시지: 타이틀 + 설명 + 이미지) → main_about
  IndexMapper.prototype.mapAbout = function () {
    var essence = this.getIndexSection().essence || {};
    var name = this.getPropertyName();

    var imgEl = document.querySelector('[data-index-about-image]');
    if (imgEl) {
      var url = this.getFirstSelectedImage(essence.images || []);
      if (url) {
        imgEl.style.backgroundImage = 'url(' + url + ')';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(imgEl);
      }
    }

    // 타이틀: essence.title, 없으면 영문 글귀 fallback
    var titleEl = document.querySelector('[data-index-about-title]');
    if (titleEl) {
      if (essence.title) {
        titleEl.textContent = essence.title;
      } else {
        titleEl.innerHTML = 'A quiet moment,<br> surrounded by nature';
      }
    }

    // 설명: essence.description, 없으면 하드코딩 문구 + 숙소명 fallback
    var descEl = document.querySelector('[data-index-about-description]');
    if (descEl) {
      if (essence.description) {
        descEl.innerHTML = nl2br(essence.description);
      } else {
        descEl.innerHTML = nl2br(
          '창밖으로 이어지는 자연의 풍경 속에서 일상의 흐름을 잠시 내려놓고 ' +
          name +
          '에서 조용히 머무는 시간의 여유를 느껴보세요.'
        );
      }
    }
  };

  // MAPPER: property.facilities[] → main_special (spec-img / spec-tit / spec-txt 동기 생성)
  IndexMapper.prototype.mapSpecial = function () {
    var self = this;
    var facilities = (this.getProperty().facilities || []).filter(function (f) {
      return f && f.name && f.name.trim();
    });

    var imgWrap = document.querySelector('[data-index-special-slides]');
    var titWrap = document.querySelector('[data-index-special-titles]');
    var txtWrap = document.querySelector('[data-index-special-texts]');

    if (imgWrap) imgWrap.innerHTML = '';
    if (titWrap) titWrap.innerHTML = '';
    if (txtWrap) txtWrap.innerHTML = '';
    if (!facilities.length) return;

    facilities.forEach(function (f, i) {
      var imgUrl = self.getFirstSelectedImage(f.images || []);

      // spec-img: 이미지 슬라이드
      if (imgWrap) {
        var slide = document.createElement('div');
        slide.className = 'swiper-slide item';
        var a = document.createElement('a');
        a.href = 'facility.html?id=' + f.id;
        var img = document.createElement('div');
        img.className = 'img';
        if (imgUrl) {
          img.style.backgroundImage = 'url(' + imgUrl + ')';
        } else {
          ImageHelpers.applyBackgroundPlaceholder(img);
        }
        a.appendChild(img);
        slide.appendChild(a);
        imgWrap.appendChild(slide);
      }

      // spec-tit: 큰 라벨 (첫 번째 on)
      if (titWrap) {
        var con = document.createElement('div');
        con.className = i === 0 ? 'txt-con on' : 'txt-con';
        con.innerHTML = '<p class="btxt">special</p><p class="stxt"></p>';
        con.querySelector('.stxt').textContent = f.name;
        titWrap.appendChild(con);
      }

      // spec-txt: 번호 + 시설 설명(description)
      if (txtWrap) {
        var tslide = document.createElement('div');
        tslide.className = 'swiper-slide item';
        var txt = document.createElement('div');
        txt.className = 'txt';
        txt.innerHTML = '<p class="btxt">SPECIAL ' + pad2(i + 1) + '</p><p class="stxt"></p>';
        txt.querySelector('.stxt').textContent = f.description || '';
        tslide.appendChild(txt);
        txtWrap.appendChild(tslide);
      }
    });
  };

  // MAPPER: customFields.roomtypes[] (+ rooms[] id매칭) → main_room preview
  IndexMapper.prototype.mapRoomSlides = function () {
    var wrapper = document.querySelector('[data-index-room-slides]');
    if (!wrapper) return;
    var self = this;
    var rooms = (this.data && this.data.rooms) || [];
    var roomtypes = this.getRoomtypes().filter(function (rt) {
      if (!(rt && rt.name && rt.name.trim())) return false;
      var matched = rooms.filter(function (r) { return r.id === rt.id; })[0];
      return !(matched && matched.status === 'inactive');
    });

    wrapper.innerHTML = '';
    if (!roomtypes.length) return;

    // Room Preview 카드는 groupName 과 무관하게 **항상 전체 객실**을 깐다.
    // 그룹으로 접히는 곳은 헤더 ROOMS 메뉴와 객실 상세 탭뿐이고,
    // 카드는 저마다 자기 객실 상세로 연결한다.
    roomtypes.forEach(function (rt) {
      // 원본이 내려둔 객실은 카드도 내지 않는다 — 그룹도 없고 사진도 없으면 보여줄 게 없다.
      // 크롤러가 이름·사진을 못 읽은 경우는 groupName 이 남아 있어 여기서 걸리지 않는다.
      if (rt && !self.getRoomGroupName(rt) && !(rt.images || []).length) return;
      var roomLabel = (rt && rt.name) || '';
      if (!String(roomLabel).trim() || !rt) return;
      var thumbs = (rt.images || []).filter(function (img) { return img.category === 'roomtype_thumbnail'; });
      var selected = thumbs.filter(function (t) { return t.isSelected; });
      var thumbUrl = (selected[0] && selected[0].url) || (thumbs[0] && thumbs[0].url) || '';
      var matched = rooms.filter(function (r) { return r.id === rt.id; })[0];
      var structureText = buildRoomStructure(matched);

      var slide = document.createElement('div');
      slide.className = 'swiper-slide item';
      var a = document.createElement('a');
      a.href = self.getRoomMenuLink(rt);
      a.className = 'custom_mousemove';
      a.setAttribute('data-hover', 'Click');

      var img = document.createElement('div');
      img.className = 'img';
      if (thumbUrl) { img.style.background = 'url(' + thumbUrl + ') no-repeat 50%'; img.style.backgroundSize = 'cover'; }
      else { ImageHelpers.applyBackgroundPlaceholder(img); }

      var txt = document.createElement('div');
      txt.className = 'txt';
      txt.innerHTML = '<p class="btxt"></p><p class="stxt"></p>';
      txt.querySelector('.btxt').textContent = roomLabel;
      txt.querySelector('.stxt').textContent = structureText;

      a.appendChild(img);
      a.appendChild(txt);
      slide.appendChild(a);
      wrapper.appendChild(slide);
    });
  };

  IndexMapper.prototype.mapClosing = function () {
    var closing = this.getIndexSection().closing || {};
    var descEl = document.querySelector('[data-index-closing-description]');
    if (descEl && closing.description) descEl.innerHTML = nl2br(closing.description);
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.previewHandler) return;
    var mapper = new IndexMapper();
    mapper.initialize();
    global.indexMapperInstance = mapper;
  });

  // 조기 랜딩 가드 — 매핑을 기다리지 않고 이 스크립트가 로드되자마자 랜딩 여부부터 판단한다.
  //   standalone 에서는 preview-handler 가 어드민 데이터를 2초 기다린 뒤에야 index 를 매핑하는데,
  //   그 사이 헤더 매핑이 렌더 게이트를 먼저 풀어 매핑 전 index(히어로 < > 화살표 등)가 보였다가
  //   랜딩으로 넘어갔다. 판단이 끝날 때까지 __tplReveal 을 붙잡아 둔다.
  //   - 랜딩 진입 대상(shouldEnterLanding) → 화면을 풀지 않고 곧장 landing.html. 이동 판단 뒤에 헤더 매핑이
  //     끝나며 노출을 요청해도 무시한다 (판단 = 노출 허용으로 보면 페이지를 떠나기 직전 index 가 비친다)
  //   - 그 외 → 붙잡아 둔 노출을 그대로 진행 (기존과 같은 화면. JSON 한 번 더 읽는 시간만큼 늦게 뜰 수 있다)
  //   - 네트워크 실패/지연 대비 3초 뒤에는 무조건 판단을 끝낸다 (head 의 렌더 게이트 타임아웃과 같은 값)
  //   iframe(어드민 프리뷰)·내부 이동은 JSON 을 읽기 전에 바로 건너뛴다 (어차피 랜딩으로 안 보낸다).
  (function earlyLandingGate() {
    if (window.top !== window.self) return;
    if (isFromSameSite()) return;

    var reveal = window.__tplReveal;
    var decided = false;
    var pending = false;

    function finish() {
      if (decided) return;
      decided = true;
      if (pending && reveal) reveal();
    }

    window.__tplReveal = function () {
      if (leavingToLanding) return; // 랜딩으로 떠나는 중 — 노출하지 않는다
      if (decided) {
        if (reveal) reveal();
      } else {
        pending = true;
      }
    };

    setTimeout(function () {
      pending = true;
      finish();
    }, 3000);

    fetch('standard-template-data.json?t=' + Date.now())
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var customFields = (data && data.homepage && data.homepage.customFields) || (data && data.customFields) || {};
        var landing = customFields.pages && customFields.pages.landing;
        if (!decided && shouldEnterLanding(landing)) {
          decided = true;
          goToLanding(); // 노출하지 않고 이동한다 (이후 들어오는 노출 요청은 무시)
          return;
        }
        finish();
      })
      .catch(finish);
  })();

  global.IndexMapper = IndexMapper;
})(window);
