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

  function IndexMapper() {
    BaseDataMapper.call(this);
  }
  IndexMapper.prototype = Object.create(BaseDataMapper.prototype);
  IndexMapper.prototype.constructor = IndexMapper;

  IndexMapper.prototype.mapPage = function () {
    this.mapHeroSlides();
    this.mapAbout();
    this.mapSpecial();
    this.mapRoomSlides();
    this.mapClosing();
    this.refreshSwipers();
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
    var roomtypes = this.getRoomtypes().filter(function (rt) {
      return rt && rt.name && rt.name.trim();
    });
    var rooms = (this.data && this.data.rooms) || [];

    wrapper.innerHTML = '';
    if (!roomtypes.length) return;

    roomtypes.forEach(function (rt) {
      var thumbs = (rt.images || []).filter(function (img) {
        return img.category === 'roomtype_thumbnail';
      });
      var thumbUrl = (function () {
        var sel = thumbs.filter(function (t) {
          return t.isSelected;
        });
        return (sel[0] && sel[0].url) || (thumbs[0] && thumbs[0].url) || '';
      })();

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

  // MAPPER: index.sections[0].closing.description → main_reserve (배경은 디자인 기본 이미지 유지, 매핑 안 함)
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

  global.IndexMapper = IndexMapper;
})(window);
