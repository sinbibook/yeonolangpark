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

  function NearbyAttractionsMapper() {
    BaseDataMapper.call(this);
  }
  NearbyAttractionsMapper.prototype = Object.create(BaseDataMapper.prototype);
  NearbyAttractionsMapper.prototype.constructor = NearbyAttractionsMapper;

  NearbyAttractionsMapper.prototype.mapPage = function () {
    var section = this.getSection();
    // enabled=false(또는 섹션 없음)면 404로 리다이렉트 (c/l/e 동일)
    if (!section || section.enabled === false) {
      window.location.href = '404.html';
      return;
    }
    this.mapHeroSlides(section);
    this.mapAboutBlocks(section);
    this.mapClosing();
    this.refreshSwipers();
  };

  // customFields.pages.index.sections[0].closing (main_reserve 공용, index/main 동일)
  NearbyAttractionsMapper.prototype.mapClosing = function () {
    var pages = this.getPages();
    var sec = pages.index && pages.index.sections && pages.index.sections[0];
    var closing = (sec && sec.closing) || {};
    var descEl = document.querySelector('[data-nearby-closing-description]');
    if (descEl && closing.description) descEl.innerHTML = nl2br(closing.description);
  };

  // customFields.pages.nearbyAttractions.sections[0]
  NearbyAttractionsMapper.prototype.getSection = function () {
    var pages = this.getPages();
    return (
      (pages.nearbyAttractions &&
        pages.nearbyAttractions.sections &&
        pages.nearbyAttractions.sections[0]) ||
      null
    );
  };

  NearbyAttractionsMapper.prototype.refreshSwipers = function () {
    if (typeof window.initSwipers === 'function') window.initSwipers();
    if (window.locoScroll && typeof window.locoScroll.update === 'function') {
      window.setTimeout(function () {
        window.locoScroll.update();
      }, 200);
    }
  };

  // MAPPER: hero.images[isSelected] → [data-nearby-hero-slides] (배경 슬라이드 동적 생성)
  NearbyAttractionsMapper.prototype.mapHeroSlides = function (section) {
    var wrapper = document.querySelector('[data-nearby-hero-slides]');
    if (!wrapper) return;
    var images = this.getSelectedImages((section.hero || {}).images || []);

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

  // MAPPER: about[] → [data-nearby-about-blocks] (블록마다 .main_about 행 동적 생성)
  // 블록 = 이미지(images[0]) + 타이틀(title) + 설명(description) + 이미지설명(images[0].description)
  NearbyAttractionsMapper.prototype.mapAboutBlocks = function (section) {
    var container = document.querySelector('[data-nearby-about-blocks]');
    if (!container) return;
    var about = section.about || [];
    var self = this;

    container.innerHTML = '';
    about.forEach(function (block) {
      var images = self.getSelectedImages(block.images || []);
      var img0 = images[0];

      var wrap = document.createElement('div');
      wrap.className = 'main_about';

      var cont = document.createElement('div');
      cont.className = 'cont';

      // 좌측 이미지
      var fl = document.createElement('div');
      fl.className = 'fl';
      var img = document.createElement('div');
      img.className = 'img fadeRight';
      img.setAttribute('data-scroll', '');
      if (img0 && img0.url) {
        img.style.backgroundImage = 'url(' + img0.url + ')';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(img);
      }
      fl.appendChild(img);

      // 우측 텍스트
      var fr = document.createElement('div');
      fr.className = 'fr';
      var txt = document.createElement('div');
      txt.className = 'txt';

      var title = document.createElement('p');
      title.className = 'btxt fadeUp';
      title.setAttribute('data-scroll', '');
      title.textContent = block.title || '';
      txt.appendChild(title);

      if (block.description) {
        var desc = document.createElement('p');
        desc.className = 'stxt mg60t fadeUp';
        desc.setAttribute('data-scroll', '');
        desc.innerHTML = nl2br(block.description);
        txt.appendChild(desc);
      }

      if (img0 && img0.description) {
        var cap = document.createElement('p');
        cap.className = 'stxt cap mg40t fadeUp';
        cap.setAttribute('data-scroll', '');
        cap.textContent = img0.description;
        txt.appendChild(cap);
      }

      fr.appendChild(txt);
      cont.appendChild(fl);
      cont.appendChild(fr);
      wrap.appendChild(cont);
      container.appendChild(wrap);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.previewHandler) return;
    var mapper = new NearbyAttractionsMapper();
    mapper.initialize();
    global.nearbyAttractionsMapperInstance = mapper;
  });

  global.NearbyAttractionsMapper = NearbyAttractionsMapper;
})(window);
