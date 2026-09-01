(function (global) {
  'use strict';

  // totalRoomCount 한글 변환 테이블
  var ROOM_COUNT_LABELS = {
    bedroom: '침대룸',
    bathroom: '화장실',
    livingRoom: '거실',
    ondol: '온돌룸',
    kitchen: '주방'
  };

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

  function LayoutMapMapper() {
    BaseDataMapper.call(this);
  }
  LayoutMapMapper.prototype = Object.create(BaseDataMapper.prototype);
  LayoutMapMapper.prototype.constructor = LayoutMapMapper;

  LayoutMapMapper.prototype.mapPage = function () {
    // enabled=false(또는 섹션 없음)면 404로 리다이렉트 (c/l/e 동일)
    var pages = this.getPages();
    var sec = pages.layoutMap && pages.layoutMap.sections && pages.layoutMap.sections[0];
    if (!sec || sec.enabled === false) {
      window.location.href = '404.html';
      return;
    }
    this.mapHeroSlides();
    this.mapLayoutImage();
    this.mapNav();
    this.mapRoomSlides();
    this.refreshSwipers();
  };

  // customFields.pages.layoutMap.sections[0]
  LayoutMapMapper.prototype.getLayoutMapSection = function () {
    var pages = this.getPages();
    return (pages.layoutMap && pages.layoutMap.sections && pages.layoutMap.sections[0]) || {};
  };

  // customFields.roomtypes
  LayoutMapMapper.prototype.getRoomtypes = function () {
    var cf = this.getCustomFields();
    if (cf.roomtypes && cf.roomtypes.length) return cf.roomtypes;
    if (this.data && this.data.customFields && this.data.customFields.roomtypes) {
      return this.data.customFields.roomtypes;
    }
    return cf.roomtypes || [];
  };

  LayoutMapMapper.prototype.refreshSwipers = function () {
    if (typeof window.initSwipers === 'function') window.initSwipers();
    if (window.locoScroll && typeof window.locoScroll.update === 'function') {
      window.setTimeout(function () {
        window.locoScroll.update();
      }, 200);
    }
  };

  // MAPPER: layoutMap.hero.images[isSelected] → [data-layout-map-hero-slides] (배경 슬라이드)
  LayoutMapMapper.prototype.mapHeroSlides = function () {
    var wrapper = document.querySelector('[data-layout-map-hero-slides]');
    if (!wrapper) return;
    var hero = this.getLayoutMapSection().hero || {};
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

  // MAPPER: layoutMap.about.images[isSelected][0] → [data-layout-map-image] (배치도 이미지)
  LayoutMapMapper.prototype.mapLayoutImage = function () {
    var img = document.querySelector('[data-layout-map-image]');
    if (!img) return;
    var about = this.getLayoutMapSection().about || {};
    var url = this.getFirstSelectedImage(about.images || []);
    if (url) {
      // 배치도 전체폭 이미지는 늦게 로드되며 높이가 생기므로, 로드 완료 후
      // locomotive-scroll 높이를 재계산해야 끝까지 스크롤된다.
      img.onload = function () {
        if (window.locoScroll && typeof window.locoScroll.update === 'function') {
          window.locoScroll.update();
        }
      };
      img.src = url;
      img.alt = about.title || '숙소 배치도';
    } else {
      ImageHelpers.applyPlaceholder(img, '배치도 이미지');
    }
  };

  // MAPPER: customFields.roomtypes[] → [data-room-list-nav] (룸 미리보기 li 뒤에 동적 생성)
  LayoutMapMapper.prototype.mapNav = function () {
    var nav = document.querySelector('[data-room-list-nav]');
    if (!nav) return;
    // 이전 생성분 제거 (preview 재렌더 대비)
    nav.querySelectorAll('[data-generated="nav"]').forEach(function (li) {
      li.remove();
    });
    this.getRoomtypes().forEach(function (rt) {
      if (!rt.name || !rt.name.trim()) return;
      var li = document.createElement('li');
      li.setAttribute('data-generated', 'nav');
      var a = document.createElement('a');
      a.href = 'room.html?room_id=' + rt.id;
      a.textContent = rt.name;
      li.appendChild(a);
      nav.appendChild(li);
    });
  };

  // MAPPER: customFields.roomtypes[] (+ rooms[] id매칭) → [data-room-list-slides] (미리보기 슬라이더)
  LayoutMapMapper.prototype.mapRoomSlides = function () {
    var wrapper = document.querySelector('[data-room-list-slides]');
    if (!wrapper) return;
    var roomtypes = this.getRoomtypes().filter(function (rt) {
      return rt && rt.name && rt.name.trim();
    });
    var rooms = (this.data && this.data.rooms) || [];

    wrapper.innerHTML = '';
    if (!roomtypes.length) return;

    roomtypes.forEach(function (rt) {
      var thumbs = (rt.images || []).filter(function (im) {
        return im.category === 'roomtype_thumbnail';
      });
      var sel = thumbs.filter(function (t) {
        return t.isSelected;
      });
      var thumbUrl = (sel[0] && sel[0].url) || (thumbs[0] && thumbs[0].url) || '';

      var matched = rooms.filter(function (r) {
        return r.id === rt.id;
      })[0];
      var structureText = buildRoomStructure(matched);

      var slide = document.createElement('div');
      slide.className = 'swiper-slide item';

      var a = document.createElement('a');
      a.href = 'room.html?room_id=' + rt.id;
      a.className = 'custom_mousemove';
      a.setAttribute('data-hover', 'Click');

      var img = document.createElement('div');
      img.className = 'img';
      if (thumbUrl) {
        img.style.background = 'url(' + thumbUrl + ') no-repeat 50%';
        img.style.backgroundSize = 'cover';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(img);
      }

      var txt = document.createElement('div');
      txt.className = 'txt';
      txt.innerHTML = '<p class="btxt"></p><p class="stxt"></p>';
      txt.querySelector('.btxt').textContent = rt.name || '';
      txt.querySelector('.stxt').textContent = structureText;

      a.appendChild(img);
      a.appendChild(txt);
      slide.appendChild(a);
      wrapper.appendChild(slide);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.previewHandler) return;
    var mapper = new LayoutMapMapper();
    mapper.initialize();
    global.layoutMapMapperInstance = mapper;
  });

  global.LayoutMapMapper = LayoutMapMapper;
})(window);
