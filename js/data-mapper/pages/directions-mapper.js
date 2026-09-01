(function (global) {
  'use strict';

  // 줄바꿈(\n) → <br>, HTML 이스케이프
  function nl2br(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />');
  }

  function DirectionsMapper() {
    BaseDataMapper.call(this);
  }
  DirectionsMapper.prototype = Object.create(BaseDataMapper.prototype);
  DirectionsMapper.prototype.constructor = DirectionsMapper;

  // Kakao Map 상수 (trip-c/d와 동일)
  DirectionsMapper.KAKAO_MAP_ZOOM_LEVEL = 5;
  DirectionsMapper.SDK_WAIT_INTERVAL = 100; // ms

  DirectionsMapper.prototype.mapPage = function () {
    this.mapHeroSlides();
    this.mapTitle();
    this.mapKakaoMap();
    this.mapNotice();
    this.mapAddress();
    this.mapPhone();
    this.refreshSwipers();
  };

  // customFields.pages.directions.sections[0]
  DirectionsMapper.prototype.getDirectionsSection = function () {
    var pages = this.getPages();
    return (pages.directions && pages.directions.sections && pages.directions.sections[0]) || {};
  };

  DirectionsMapper.prototype.refreshSwipers = function () {
    if (typeof window.initSwipers === 'function') window.initSwipers();
    if (window.locoScroll && typeof window.locoScroll.update === 'function') {
      window.setTimeout(function () {
        window.locoScroll.update();
      }, 200);
    }
  };

  // MAPPER: directions.sections[0].hero.images[isSelected] → [data-directions-hero-slides]
  DirectionsMapper.prototype.mapHeroSlides = function () {
    var wrapper = document.querySelector('[data-directions-hero-slides]');
    if (!wrapper) return;
    var hero = this.getDirectionsSection().hero || {};
    var images = this.getSelectedImages(hero.images || []);

    wrapper.innerHTML = '';
    var list = images.length ? images : [null];
    list.forEach(function (img) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      var box = document.createElement('div');
      box.className = 'img';
      if (img && img.url) {
        box.style.background = 'url(' + img.url + ') no-repeat 50%';
        box.style.backgroundSize = 'cover';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(box);
      }
      slide.appendChild(box);
      wrapper.appendChild(slide);
    });
  };

  // MAPPER: directions.sections[0].hero.title → [data-directions-title] (없으면 {숙소명} fallback)
  DirectionsMapper.prototype.mapTitle = function () {
    var el = document.querySelector('[data-directions-title]');
    if (!el) return;
    var title = this.getDirectionsSection().hero && this.getDirectionsSection().hero.title;
    if (title) {
      el.textContent = title;
    } else {
      el.textContent = this.getPropertyName() + '에 찾아 오시는 길을 안내해 드립니다.';
    }
  };

  // MAPPER: property.latitude / property.longitude → #kakao-map (kakao-maps-sdk, trip-c/d 방식)
  DirectionsMapper.prototype.mapKakaoMap = function () {
    var property = this.getProperty();
    if (!property.latitude || !property.longitude) return;

    var container = document.getElementById('kakao-map');
    if (!container) return;

    var createMap = function () {
      try {
        var options = {
          center: new kakao.maps.LatLng(property.latitude, property.longitude),
          level: DirectionsMapper.KAKAO_MAP_ZOOM_LEVEL,
          scrollwheel: false,
          draggable: false
        };
        var map = new kakao.maps.Map(container, options);
        var markerPosition = new kakao.maps.LatLng(property.latitude, property.longitude);
        var marker = new kakao.maps.Marker({ position: markerPosition });
        marker.setMap(map);
      } catch (error) {
        console.error('Failed to create Kakao Map:', error);
      }
    };

    var checkSdkAndLoad = function (retryCount) {
      retryCount = retryCount || 0;
      var MAX_RETRIES = 20; // 20 * 100ms = 2초
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(createMap);
      } else if (retryCount < MAX_RETRIES) {
        setTimeout(function () {
          checkSdkAndLoad(retryCount + 1);
        }, DirectionsMapper.SDK_WAIT_INTERVAL);
      } else {
        console.error('Failed to load Kakao Map SDK after multiple retries.');
      }
    };

    checkSdkAndLoad();
  };

  // 값 없으면 해당 행(요소 + 바로 앞 <dt>) 숨김 (빈 안내 노출 방지)
  function toggleRow(el, hasValue) {
    if (!el) return;
    el.style.display = hasValue ? '' : 'none';
    var prev = el.previousElementSibling;
    if (prev && prev.tagName === 'DT') prev.style.display = hasValue ? '' : 'none';
  }

  // MAPPER: directions.sections[0].notice.title / description → [data-directions-notice-*]
  // notice 데이터 없으면 dt(이용안내)/dd 숨김
  DirectionsMapper.prototype.mapNotice = function () {
    var notice = this.getDirectionsSection().notice || {};
    var titleEl = document.querySelector('[data-directions-notice-title]');
    var descEl = document.querySelector('[data-directions-notice-description]');
    if (titleEl) {
      if (notice.title) titleEl.textContent = notice.title;
      titleEl.style.display = notice.title ? '' : 'none';
    }
    if (descEl) {
      if (notice.description) descEl.innerHTML = nl2br(notice.description);
      descEl.style.display = notice.description ? '' : 'none';
    }
  };

  // MAPPER: property.address → [data-property-address] (없으면 행 숨김)
  DirectionsMapper.prototype.mapAddress = function () {
    var address = this.getProperty().address || '';
    document.querySelectorAll('[data-property-address]').forEach(function (el) {
      el.textContent = address;
      toggleRow(el, !!address);
    });
  };

  // MAPPER: property.contactPhone → [data-property-phone] (+ tel: 링크)
  DirectionsMapper.prototype.mapPhone = function () {
    var phone = this.toPhoneList(this.getProperty().contactPhone)[0];
    document.querySelectorAll('[data-property-phone]').forEach(function (el) {
      el.textContent = phone;
    });
    var tel = String(phone).replace(/[^0-9+]/g, '');
    document.querySelectorAll('[data-property-phone-link]').forEach(function (el) {
      el.setAttribute('href', 'tel:' + tel);
      var dd = el.closest('dd');
      toggleRow(dd, true);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.previewHandler) return;
    var mapper = new DirectionsMapper();
    mapper.initialize();
    global.directionsMapperInstance = mapper;
  });

  global.DirectionsMapper = DirectionsMapper;
})(window);
