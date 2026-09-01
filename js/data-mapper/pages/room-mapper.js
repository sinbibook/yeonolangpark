(function (global) {
  'use strict';

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

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value == null ? '' : value;
    });
  }

  function RoomMapper() {
    BaseDataMapper.call(this);
  }
  RoomMapper.prototype = Object.create(BaseDataMapper.prototype);
  RoomMapper.prototype.constructor = RoomMapper;

  RoomMapper.prototype.mapPage = function () {
    this.mapHeroSlides();
    this.mapNav();
    this.mapInfo();
    this.mapIntro();
    this.mapTable();
    this.mapGallery();
    this.mapRoomSlides();
    this.refreshSwipers();
  };

  RoomMapper.prototype.getRoomtypes = function () {
    var cf = this.getCustomFields();
    if (cf.roomtypes && cf.roomtypes.length) return cf.roomtypes;
    if (this.data && this.data.customFields && this.data.customFields.roomtypes) {
      return this.data.customFields.roomtypes;
    }
    return cf.roomtypes || [];
  };

  // URL ?room_id= 로 현재 roomtype 결정 (없으면 첫 번째)
  RoomMapper.prototype.getCurrentRoomtype = function () {
    var roomtypes = this.getRoomtypes();
    if (!roomtypes.length) return null;
    var id = new URLSearchParams(window.location.search).get('room_id');
    if (id) {
      var found = roomtypes.filter(function (rt) {
        return String(rt.id) === String(id);
      })[0];
      if (found) return found;
    }
    return roomtypes[0];
  };

  RoomMapper.prototype.getMatchedRoom = function (rt) {
    if (!rt) return null;
    var rooms = (this.data && this.data.rooms) || [];
    return (
      rooms.filter(function (r) {
        return r.id === rt.id;
      })[0] || null
    );
  };

  // roomtypes[current] interior 이미지[isSelected]
  RoomMapper.prototype.getImagesByCategory = function (rt, category) {
    if (!rt) return [];
    return (rt.images || [])
      .filter(function (im) {
        return im.category === category && im.isSelected;
      })
      .sort(function (a, b) {
        return a.sortOrder - b.sortOrder;
      });
  };

  RoomMapper.prototype.getInteriorImages = function (rt) {
    return this.getImagesByCategory(rt, 'roomtype_interior');
  };

  // 컨셉 및 외경 이미지 (갤러리용)
  RoomMapper.prototype.getExteriorImages = function (rt) {
    return this.getImagesByCategory(rt, 'roomtype_exterior');
  };

  RoomMapper.prototype.refreshSwipers = function () {
    if (typeof window.initSwipers === 'function') window.initSwipers();
    if (window.locoScroll && typeof window.locoScroll.update === 'function') {
      window.setTimeout(function () {
        window.locoScroll.update();
      }, 200);
    }
  };

  // MAPPER: roomtypes[current] interior → [data-room-hero-slides] (배경 슬라이드)
  RoomMapper.prototype.mapHeroSlides = function () {
    var wrapper = document.querySelector('[data-room-hero-slides]');
    if (!wrapper) return;
    var images = this.getInteriorImages(this.getCurrentRoomtype());

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

  // MAPPER: roomtypes[] → [data-room-list-nav] (미리보기 li 뒤 동적 생성, 현재 active)
  RoomMapper.prototype.mapNav = function () {
    var nav = document.querySelector('[data-room-list-nav]');
    if (!nav) return;
    var current = this.getCurrentRoomtype();
    var currentId = current && current.id;
    nav.querySelectorAll('[data-generated="nav"]').forEach(function (li) {
      li.remove();
    });
    this.getRoomtypes().forEach(function (rt) {
      if (!rt.name || !rt.name.trim()) return;
      var isCurrent = String(rt.id) === String(currentId);
      var li = document.createElement('li');
      li.setAttribute('data-generated', 'nav');
      if (isCurrent) li.className = 'active';
      var a = document.createElement('a');
      a.href = 'room.html?room_id=' + rt.id;
      if (isCurrent) a.className = 'on';
      a.textContent = rt.name;
      li.appendChild(a);
      nav.appendChild(li);
    });
  };

  // MAPPER: 이름/구조 + 대표이미지/썸네일 (info)
  RoomMapper.prototype.mapInfo = function () {
    var rt = this.getCurrentRoomtype();
    var room = this.getMatchedRoom(rt);
    setText('[data-room-name]', rt && rt.name);
    setText('[data-room-structure]', buildRoomStructure(room));

    var interior = this.getInteriorImages(rt);

    // 대표 이미지 (fl): interior[0]
    var mainEl = document.querySelector('[data-room-image-main]');
    if (mainEl) {
      if (interior[0] && interior[0].url) {
        mainEl.style.background = 'url(' + interior[0].url + ') no-repeat center center';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(mainEl);
      }
    }

    // 썸네일 (fr): li 배경 (interior[3], interior[4])
    var thumbs = document.querySelector('[data-room-thumbs]');
    if (thumbs) {
      thumbs.querySelectorAll('li').forEach(function (li, i) {
        var img = interior[i + 3];
        if (img && img.url) {
          li.style.background = 'url(' + img.url + ') no-repeat center center';
        } else {
          ImageHelpers.applyBackgroundPlaceholder(li);
        }
      });
    }

    // 썸네일 (mobile): li > img
    var thumbsM = document.querySelector('[data-room-thumbs-m]');
    if (thumbsM) {
      thumbsM.querySelectorAll('li img').forEach(function (img, i) {
        var src = interior[i];
        if (src && src.url) {
          img.src = src.url;
          img.alt = '';
        } else {
          ImageHelpers.applyPlaceholder(img);
        }
      });
    }
  };

  // MAPPER: pages.room[matched].sections[0].hero.title → [data-room-intro]
  RoomMapper.prototype.mapIntro = function () {
    var rt = this.getCurrentRoomtype();
    var roomPages = this.getPages().room || [];
    var matched =
      rt &&
      roomPages.filter(function (r) {
        return String(r.id) === String(rt.id);
      })[0];
    var title =
      matched &&
      matched.sections &&
      matched.sections[0] &&
      matched.sections[0].hero &&
      matched.sections[0].hero.title;
    setText('[data-room-intro]', title || '');
  };

  // MAPPER: 표 (객실명/기준/최대/유형/평형 + 집기품목)
  RoomMapper.prototype.mapTable = function () {
    var rt = this.getCurrentRoomtype();
    var room = this.getMatchedRoom(rt);
    setText('[data-room-base-occupancy]', room && room.baseOccupancy);
    setText('[data-room-max-occupancy]', room && room.maxOccupancy);
    // 평형: rooms[j].size(㎡)를 평으로 환산 (1평=3.305785㎡, 소수 1자리) — sizePyeong 미전송 대비
    var sqm = room && room.size != null ? Number(room.size) : null;
    if (sqm != null && !isNaN(sqm)) {
      setText('[data-room-size]', Math.round((sqm / 3.305785) * 10) / 10 + '평');
    }
    if (room && room.amenities && room.amenities.length) {
      setText('[data-room-amenities]', room.amenities.join(', '));
    }
  };

  // MAPPER: roomtypes[current] 컨셉 및 외경(exterior) → [data-room-gallery] (.list li p배경+img, 레이아웃 유지)
  RoomMapper.prototype.mapGallery = function () {
    var gallery = document.querySelector('[data-room-gallery]');
    if (!gallery) return;
    var exterior = this.getExteriorImages(this.getCurrentRoomtype());
    var lis = gallery.querySelectorAll('li');
    lis.forEach(function (li, i) {
      var p = li.querySelector('p');
      var img = li.querySelector('img');
      var src = exterior[i];
      if (p) {
        if (src && src.url) {
          p.style.backgroundImage = 'url(' + src.url + ')';
        } else {
          ImageHelpers.applyBackgroundPlaceholder(p);
        }
      }
      if (img) {
        if (src && src.url) {
          img.src = src.url;
          img.alt = '';
        } else {
          ImageHelpers.applyPlaceholder(img);
        }
      }
    });
  };

  // MAPPER: roomtypes[] (+ rooms[] id매칭) → [data-room-list-slides] (미리보기 슬라이더)
  RoomMapper.prototype.mapRoomSlides = function () {
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
    var mapper = new RoomMapper();
    mapper.initialize();
    global.roomMapperInstance = mapper;
  });

  global.RoomMapper = RoomMapper;
})(window);
