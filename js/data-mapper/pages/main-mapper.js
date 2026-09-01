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

  function MainMapper() {
    BaseDataMapper.call(this);
  }
  MainMapper.prototype = Object.create(BaseDataMapper.prototype);
  MainMapper.prototype.constructor = MainMapper;

  MainMapper.prototype.mapPage = function () {
    this.mapHeroSlides();
    this.mapAbout();
    this.mapAboutImages();
    this.mapClosing();
    this.refreshSwipers();
  };

  // customFields.pages.main.sections[0]
  MainMapper.prototype.getMainSection = function () {
    var pages = this.getPages();
    return (pages.main && pages.main.sections && pages.main.sections[0]) || {};
  };

  // customFields.pages.index.sections[0].closing (main_reserve 공용)
  MainMapper.prototype.getIndexClosing = function () {
    var pages = this.getPages();
    var sec = pages.index && pages.index.sections && pages.index.sections[0];
    return (sec && sec.closing) || {};
  };

  MainMapper.prototype.refreshSwipers = function () {
    if (typeof window.initSwipers === 'function') window.initSwipers();
    if (window.locoScroll && typeof window.locoScroll.update === 'function') {
      window.setTimeout(function () {
        window.locoScroll.update();
      }, 200);
    }
  };

  // MAPPER: main.sections[0].hero.images[isSelected] → [data-main-hero-slides] (배경 슬라이드)
  MainMapper.prototype.mapHeroSlides = function () {
    var wrapper = document.querySelector('[data-main-hero-slides]');
    if (!wrapper) return;
    var hero = this.getMainSection().hero || {};
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

  // MAPPER: main_about 텍스트 → main.hero.title/description, 좌측 이미지 → about[0].images[0]
  MainMapper.prototype.mapAbout = function () {
    var section = this.getMainSection();
    var hero = section.hero || {};
    var about0 = (section.about && section.about[0]) || {};
    var name = this.getPropertyName();

    // 타이틀: hero.title, 없으면 영문 글귀 fallback
    var titleEl = document.querySelector('[data-main-about-title]');
    if (titleEl) {
      if (hero.title) {
        titleEl.textContent = hero.title;
      } else {
        titleEl.innerHTML = 'A quiet moment,<br> surrounded by nature';
      }
    }

    // 설명: hero.description, 없으면 하드코딩 문구 + 숙소명 fallback
    var descEl = document.querySelector('[data-main-about-description]');
    if (descEl) {
      if (hero.description) {
        descEl.innerHTML = nl2br(hero.description);
      } else {
        descEl.innerHTML = nl2br(
          '창밖으로 이어지는 자연의 풍경 속에서 일상의 흐름을 잠시 내려놓고 ' +
          name +
          '에서 조용히 머무는 시간의 여유를 느껴보세요.'
        );
      }
    }

    // 좌측 이미지: about[0].images[isSelected][0], 없으면 placeholder
    var imgEl = document.querySelector('[data-main-about-image]');
    if (imgEl) {
      var url = this.getFirstSelectedImage(about0.images || []);
      if (url) {
        imgEl.style.backgroundImage = 'url(' + url + ')';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(imgEl);
      }
    }
  };

  // MAPPER: about[0].images[isSelected] → [data-main-about-images]
  // .about_wrap .list 는 nth-child(1~5) 절대위치 고정 5칸 그리드 → 항상 5칸 렌더, 부족분은 empty placeholder
  MainMapper.prototype.GALLERY_SLOTS = 5;
  MainMapper.prototype.mapAboutImages = function () {
    var ul = document.querySelector('[data-main-about-images]');
    if (!ul) return;
    var section = this.getMainSection();
    var about0 = (section.about && section.about[0]) || {};
    var images = this.getSelectedImages(about0.images || []);

    ul.innerHTML = '';
    for (var i = 0; i < this.GALLERY_SLOTS; i++) {
      var img = images[i];
      var li = document.createElement('li');
      var p = document.createElement('p');
      p.className = 'fadeUp';
      p.setAttribute('data-scroll', '');
      var image = document.createElement('img');
      if (img && img.url) {
        p.style.background = 'url(' + img.url + ')';
        p.style.backgroundPosition = '50% 50%';
        image.src = img.url;
        image.alt = '';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(p);
        ImageHelpers.applyPlaceholder(image);
      }
      li.appendChild(p);
      li.appendChild(image);
      ul.appendChild(li);
    }
  };

  // MAPPER: index.sections[0].closing.description → main_reserve (배경은 디자인 기본 이미지 유지, 매핑 안 함)
  MainMapper.prototype.mapClosing = function () {
    var closing = this.getIndexClosing();
    var descEl = document.querySelector('[data-main-closing-description]');
    if (descEl && closing.description) descEl.innerHTML = nl2br(closing.description);
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.previewHandler) return;
    var mapper = new MainMapper();
    mapper.initialize();
    global.mainMapperInstance = mapper;
  });

  global.MainMapper = MainMapper;
})(window);
