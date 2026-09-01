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

  function pad2(n) {
    return ('0' + n).slice(-2);
  }

  function FacilityMapper() {
    BaseDataMapper.call(this);
  }
  FacilityMapper.prototype = Object.create(BaseDataMapper.prototype);
  FacilityMapper.prototype.constructor = FacilityMapper;

  FacilityMapper.prototype.mapPage = function () {
    this.mapHeroSlides();
    this.mapNav();
    this.mapDetail();
    this.mapGallery();
    this.mapSpecial();
    this.mapClosing();
    this.refreshSwipers();
  };

  // 이름 있는 시설만
  FacilityMapper.prototype.getFacilities = function () {
    return (this.getProperty().facilities || []).filter(function (f) {
      return f && f.name && f.name.trim();
    });
  };

  // customFields.pages.facility[] 중 현재 시설(id 일치) 항목
  FacilityMapper.prototype.getCurrentFacilityCustom = function (f) {
    if (!f) return null;
    var list = this.getPages().facility;
    if (!Array.isArray(list)) return null;
    return (
      list.filter(function (c) {
        return c && String(c.id) === String(f.id);
      })[0] || null
    );
  };

  // URL ?id= 로 현재 시설 결정 (없으면 첫 번째)
  FacilityMapper.prototype.getCurrentFacility = function () {
    var facilities = this.getFacilities();
    if (!facilities.length) return null;
    var id = new URLSearchParams(window.location.search).get('id');
    if (id) {
      var found = facilities.filter(function (f) {
        return String(f.id) === String(id);
      })[0];
      if (found) return found;
    }
    return facilities[0];
  };

  // facility.images[isSelected] (sortOrder 순)
  FacilityMapper.prototype.getFacilityImages = function (f) {
    if (!f) return [];
    return this.getSelectedImages(f.images || []);
  };

  FacilityMapper.prototype.refreshSwipers = function () {
    if (typeof window.initSwipers === 'function') window.initSwipers();
    if (window.locoScroll && typeof window.locoScroll.update === 'function') {
      window.setTimeout(function () {
        window.locoScroll.update();
      }, 200);
    }
  };

  // MAPPER: facilities[current].images → [data-facility-hero-slides] (배경 슬라이드)
  FacilityMapper.prototype.mapHeroSlides = function () {
    var wrapper = document.querySelector('[data-facility-hero-slides]');
    if (!wrapper) return;
    var images = this.getFacilityImages(this.getCurrentFacility());

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

  // MAPPER: facilities[] → [data-facility-nav] (현재 active, facility.html?id={id})
  FacilityMapper.prototype.mapNav = function () {
    var nav = document.querySelector('[data-facility-nav]');
    if (!nav) return;
    var currentId = (this.getCurrentFacility() || {}).id;
    nav.innerHTML = '';
    this.getFacilities().forEach(function (f) {
      var li = document.createElement('li');
      if (String(f.id) === String(currentId)) li.className = 'active';
      var a = document.createElement('a');
      a.href = 'facility.html?id=' + f.id;
      a.textContent = f.name;
      li.appendChild(a);
      nav.appendChild(li);
    });
  };

  // MAPPER: 현재 시설 이름/설명/대표이미지
  FacilityMapper.prototype.mapDetail = function () {
    var f = this.getCurrentFacility() || {};
    var images = this.getFacilityImages(f);

    var nameEl = document.querySelector('[data-facility-name]');
    if (nameEl) nameEl.textContent = f.name || '';

    // 설명: customFields.pages.facility[현재].sections[0].about.title 우선,
    //       없으면 property.facilities[현재].description → usageGuide fallback
    var descEl = document.querySelector('[data-facility-description]');
    if (descEl) {
      var cf = this.getCurrentFacilityCustom(f);
      var cfDesc =
        cf && cf.sections && cf.sections[0] && cf.sections[0].about
          ? cf.sections[0].about.title
          : '';
      var desc = cfDesc && cfDesc.trim() ? cfDesc : (f.description || f.usageGuide || '');
      descEl.innerHTML = desc ? nl2br(desc) : '';
    }

    var imgEl = document.querySelector('[data-facility-image]');
    if (imgEl) {
      if (images[0] && images[0].url) {
        imgEl.style.backgroundImage = 'url(' + images[0].url + ')';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(imgEl);
      }
    }
  };

  // MAPPER: facilities[current].images → [data-facility-gallery] (li p배경 순서대로)
  FacilityMapper.prototype.mapGallery = function () {
    var gallery = document.querySelector('[data-facility-gallery]');
    if (!gallery) return;
    var images = this.getFacilityImages(this.getCurrentFacility());
    gallery.querySelectorAll('li .img p').forEach(function (p, i) {
      var img = images[i];
      if (img && img.url) {
        p.style.backgroundImage = 'url(' + img.url + ')';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(p);
      }
    });
  };

  // MAPPER: property.facilities[] → main_special (spec-img / spec-tit / spec-txt 동기, index와 동일)
  FacilityMapper.prototype.mapSpecial = function () {
    var self = this;
    var facilities = this.getFacilities();
    var imgWrap = document.querySelector('[data-index-special-slides]');
    var titWrap = document.querySelector('[data-index-special-titles]');
    var txtWrap = document.querySelector('[data-index-special-texts]');
    if (imgWrap) imgWrap.innerHTML = '';
    if (titWrap) titWrap.innerHTML = '';
    if (txtWrap) txtWrap.innerHTML = '';
    if (!facilities.length) return;

    facilities.forEach(function (f, i) {
      var imgUrl = self.getFirstSelectedImage(f.images || []);

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

      if (titWrap) {
        var con = document.createElement('div');
        con.className = i === 0 ? 'txt-con on' : 'txt-con';
        con.innerHTML = '<p class="btxt">special</p><p class="stxt"></p>';
        con.querySelector('.stxt').textContent = f.name;
        titWrap.appendChild(con);
      }

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

  // MAPPER: index.sections[0].closing.description → main_reserve (공용)
  FacilityMapper.prototype.mapClosing = function () {
    var pages = this.getPages();
    var sec = pages.index && pages.index.sections && pages.index.sections[0];
    var closing = (sec && sec.closing) || {};
    var descEl = document.querySelector('[data-closing-description]');
    if (descEl && closing.description) descEl.innerHTML = nl2br(closing.description);
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.previewHandler) return;
    var mapper = new FacilityMapper();
    mapper.initialize();
    global.facilityMapperInstance = mapper;
  });

  global.FacilityMapper = FacilityMapper;
})(window);
