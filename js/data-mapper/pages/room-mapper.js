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
    this.mapFloorplan();
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
    nav.querySelectorAll('[data-generated="nav"]').forEach(function (li) { li.remove(); });
    var self = this;
    var roomItems = this.getRoomMenuItems(this.getRoomtypes(), function (rt) { return (rt && rt.name) || ''; });
    // 그룹 안이면 그 그룹의 객실만 펼친다.
    // 헤더/미리보기 메뉴는 그룹명 하나로 접히고 클릭 시 그룹의 첫 객실로 들어가는데,
    // 이 탭까지 접혀 있으면 2번째 객실부터는 UI 로 도달할 방법이 없다.
    // 멤버가 1실인 그룹은 펼치지 않는다(항목이 하나뿐이라 의미가 없다).
    var activeGroup = null;
    roomItems.forEach(function (it) {
      var members = (it && it.roomtypes) || [];
      if (members.length > 1 && self.isRoomMenuItemActive(it, currentId)) activeGroup = it;
    });
    if (activeGroup) {
      roomItems = activeGroup.roomtypes.map(function (rt) {
        return { label: (rt && rt.name) || '', roomtype: rt, roomtypes: [rt] };
      });
    }
    roomItems.forEach(function (item) {
      var name = self.getRoomMenuLabel(item);
      if (!String(name).trim()) return;
      var li = document.createElement('li');
      li.setAttribute('data-generated', 'nav');
      if (self.isRoomMenuItemActive(item, currentId)) li.className = 'active';
      var a = document.createElement('a');
      a.href = self.getRoomMenuLink(item);
      if (self.isRoomMenuItemActive(item, currentId)) a.className = 'on';
      a.textContent = name;
      li.appendChild(a);
      nav.appendChild(li);
    });
  };

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

  /* MAPPER: roomtypes[current] 평면도 이미지 → [data-room-floorplan-image]
     ⚠️ 제목·설명 자리가 없다. 도면 이미지 한 장이 전부다.
     ⚠️ 이미지가 없으면 [data-room-floorplan-section] 을 통째로 숨긴다 —
        원본에 없던 빈 구간을 남기지 않는다.
        (layout-map 의 배치도는 반대로 없어도 placeholder 를 세운다 — 규칙이 정반대다.)
     ⚠️ URL 이 있는데 로드가 죽어도 구간째 숨긴다 — 깨진 아이콘만 남는 것보다 낫다. */
  RoomMapper.prototype.mapFloorplan = function () {
    var sections = document.querySelectorAll('[data-room-floorplan-section]');
    if (!sections.length) return;

    var image = this.getRoomFloorplanImage(this.getCurrentRoomtype());
    var url = (image && image.url) || '';

    sections.forEach(function (el) {
      el.style.display = url ? '' : 'none';
    });
    if (!url) return;

    document.querySelectorAll('[data-room-floorplan-image]').forEach(function (img) {
      img.alt = '객실 평면도';
      img.onerror = function () {
        sections.forEach(function (el) {
          el.style.display = 'none';
        });
      };
      img.src = url;
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
