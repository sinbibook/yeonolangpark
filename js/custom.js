/**
 * custom.js — 페이지 인터랙션 (vanilla, jQuery 미사용)
 *  - Locomotive Scroll (부드러운 스크롤) + 스크롤 시 헤더 on
 *  - Swiper 슬라이더 (메인/서브 비주얼, 스페셜, 객실 미리보기)
 *  - GSAP 커스텀 커서
 * Locomotive 컨테이너(.scroll-wrap) 내부에 푸터가 async 주입되므로
 * 헤더/푸터 주입(loaderReady) + window load 이후 init 한다.
 */
(function () {
  'use strict';

  function windowLoad() {
    return new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve);
    });
  }

  function pad2(n) {
    return ('0' + n).slice(-2);
  }

  // 슬라이더 컨트롤(페이지네이션/화살표) 표시 토글 — 셀렉터는 슬라이더 주변으로 한정해서 탐색
  function toggleControl(el, selector, show) {
    if (!selector || typeof selector !== 'string') return;
    var scopes = [el, el.parentNode, el.parentNode && el.parentNode.parentNode];
    for (var i = 0; i < scopes.length; i++) {
      if (!scopes[i] || !scopes[i].querySelectorAll) continue;
      var found = scopes[i].querySelectorAll(selector);
      if (found.length) {
        Array.prototype.forEach.call(found, function (node) {
          node.style.display = show ? '' : 'none';
        });
        return;
      }
    }
  }

  // 실제 슬라이드 개수에 맞춰 옵션 보정 (템플릿: 시설마다 객실/이미지 개수가 다름)
  //  - slidesPerView(breakpoints 포함)를 슬라이드 수 이하로 클램프 → 빈 칸 없이 꽉 차게 노출
  //  - loop는 슬라이드가 충분할 때만 (데이터 주입 전 0개·슬라이드 부족 시 Swiper 경고/오작동 방지)
  //  - hideControlsWhenSingle 옵션 + 슬라이드 1개 → 페이지네이션/화살표 비활성 + 숨김
  function withSlideCount(el, options) {
    if (!options) return options;
    var count = el.querySelectorAll('.swiper-slide').length;
    var maxPerView = typeof options.slidesPerView === 'number' ? options.slidesPerView : 1;
    var single = options.hideControlsWhenSingle;
    delete options.hideControlsWhenSingle;

    function clamp(o) {
      if (typeof o.slidesPerView === 'number' && count > 0) {
        o.slidesPerView = Math.min(o.slidesPerView, count);
      }
    }
    clamp(options);
    if (options.breakpoints) {
      Object.keys(options.breakpoints).forEach(function (bp) {
        var v = options.breakpoints[bp].slidesPerView;
        if (typeof v === 'number' && v > maxPerView) maxPerView = v;
        clamp(options.breakpoints[bp]);
      });
    }

    if (options.loop && count <= maxPerView) options.loop = false;

    if (single) {
      var hide = count <= 1;
      toggleControl(el, options.pagination && options.pagination.el, !hide);
      toggleControl(el, options.navigation && options.navigation.nextEl, !hide);
      toggleControl(el, options.navigation && options.navigation.prevEl, !hide);
      if (hide) {
        delete options.pagination;
        delete options.navigation;
      }
    }
    return options;
  }

  // ── Swiper 슬라이더 (동적 슬라이드 주입 후 재호출 가능: destroy 후 재생성) ──
  function makeSwiper(selector, options) {
    var el = document.querySelector(selector);
    if (!el || typeof Swiper === 'undefined') return null;
    if (el.swiper) el.swiper.destroy(true, true);
    return new Swiper(selector, withSlideCount(el, options));
  }

  function specOnChange() {
    var idx = this.realIndex;
    var tits = document.querySelectorAll('.spec-tit .txt-con');
    tits.forEach(function (t) {
      t.classList.remove('on');
    });
    if (tits[idx]) tits[idx].classList.add('on');
  }

  function initSpecSwiper() {
    var imgEl = document.querySelector('.spec-img');
    if (!imgEl || typeof Swiper === 'undefined') return;
    var txtEl = document.querySelector('.spec-txt');
    if (txtEl && txtEl.swiper) txtEl.swiper.destroy(true, true);
    if (imgEl.swiper) imgEl.swiper.destroy(true, true);

    var specTxt = txtEl
      ? new Swiper(
          '.spec-txt',
          withSlideCount(txtEl, {
            loop: true,
            spaceBetween: 10,
            effect: 'fade',
            speed: 500,
            autoplay: { delay: 3000, disableOnInteraction: false },
            navigation: { nextEl: '.spec-next', prevEl: '.spec-prev' },
            pagination: { el: '.swiper-pagination', clickable: true },
            on: { slideChangeTransitionStart: specOnChange }
          })
        )
      : null;

    var imgOpts = withSlideCount(imgEl, {
      loop: true,
      effect: 'fade',
      speed: 500,
      autoplay: { delay: 3000, disableOnInteraction: false },
      spaceBetween: 10,
      navigation: { nextEl: '.spec-next', prevEl: '.spec-prev' },
      on: { slideChangeTransitionStart: specOnChange }
    });
    if (specTxt) imgOpts.thumbs = { swiper: specTxt };
    new Swiper('.spec-img', imgOpts);
  }

  // 페이지에 따라 일부 셀렉터만 존재 → makeSwiper가 null-safe 처리
  window.initSwipers = function () {
    // 메인 비주얼
    makeSwiper('.mvisual', {
      loop: true,
      effect: 'fade',
      speed: 500,
      autoplay: { delay: 2500, disableOnInteraction: false },
      pagination: {
        el: '.main_visual .swiper-pagination',
        type: 'fraction',
        formatFractionCurrent: pad2,
        formatFractionTotal: pad2
      },
      navigation: {
        nextEl: '.main_visual .swiper-button-next',
        prevEl: '.main_visual .swiper-button-prev'
      }
    });

    // 서브 비주얼
    makeSwiper('.svisual', {
      loop: true,
      effect: 'fade',
      speed: 500,
      autoplay: { delay: 2500, disableOnInteraction: false },
      pagination: {
        el: '.sub_visual .swiper-pagination',
        type: 'fraction',
        formatFractionCurrent: pad2,
        formatFractionTotal: pad2
      },
      navigation: {
        nextEl: '.sub_visual .swiper-button-next',
        prevEl: '.sub_visual .swiper-button-prev'
      }
    });

    // 스페셜 (텍스트+이미지 thumbs 연동)
    initSpecSwiper();

    // 객실 미리보기 (객실 수에 따라 1개=100% / 2개=2그리드 / 3개 이상=3그리드로 자동 보정)
    makeSwiper('.preivew .swiper-container', {
      hideControlsWhenSingle: true,
      slidesPerView: 1,
      spaceBetween: 20,
      speed: 500,
      loop: true,
      navigation: { nextEl: '.room-next', prevEl: '.room-prev' },
      pagination: { el: '.swiper-pagination', type: 'progressbar' },
      breakpoints: {
        1: { slidesPerView: 1, spaceBetween: 15 },
        580: { slidesPerView: 2, spaceBetween: 20 },
        860: { slidesPerView: 3, spaceBetween: 20 },
        1000: { slidesPerView: 3, spaceBetween: 30 },
        1280: { slidesPerView: 3, spaceBetween: 42 }
      }
    });
  };

  // ── GSAP 커스텀 커서 ──────────────────────────────────────────────────
  function initCustomCursor() {
    var primary = document.getElementById('custom_cursor');
    var secondary = document.getElementById('custom_cursor_text');
    if (!primary || !secondary || typeof gsap === 'undefined') return;
    var circle = primary.querySelector('.custom_cursor_circle');
    var cursorTxt = secondary.querySelector('.custom_cursor_txt');

    document.body.addEventListener('mousemove', function (e) {
      gsap.to(primary, { duration: 0.3, x: e.clientX, y: e.clientY, ease: 'power3.out' });
      gsap.to(secondary, { duration: 0.5, x: e.clientX, y: e.clientY, ease: 'power3.out' });
    });

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('.custom_mousemove') : null;
      if (!t) return;
      var words = t.dataset.hover || '';
      var size = t.dataset.size || '100%';
      if (t.classList.contains('drag')) {
        primary.classList.add('drag');
        secondary.classList.add('drag');
      }
      var span = cursorTxt && cursorTxt.querySelector('span');
      if (span) span.textContent = words;
      if (circle) gsap.to(circle, { duration: 0.3, width: size, height: size, autoAlpha: 1 });
      if (cursorTxt) gsap.to(cursorTxt, { duration: 0.3, width: size, height: size, autoAlpha: 1 });
    });

    document.addEventListener('mouseout', function (e) {
      var t = e.target.closest ? e.target.closest('.custom_mousemove') : null;
      if (!t) return;
      if (t.classList.contains('drag')) {
        primary.classList.remove('drag');
        secondary.classList.remove('drag');
      }
      if (circle) gsap.to(circle, { duration: 0.2, width: '0%', height: '0%', autoAlpha: 0 });
      if (cursorTxt) gsap.to(cursorTxt, { duration: 0.2, width: '0%', height: '0%', autoAlpha: 0 });
    });
  }

  // ── Locomotive Scroll + 스크롤 시 헤더 on ──────────────────────────────
  function initLocomotive() {
    var el = document.querySelector('.scroll-wrap');
    if (!el || typeof LocomotiveScroll === 'undefined') return;

    var loco = new LocomotiveScroll({
      el: el,
      smooth: true,
      smoothMobile: true,
      multiplier: 1.3,
      smartphone: { smooth: true },
      tablet: { smooth: true },
      useKeyboard: true,
      onUpdate: function () {
        window.dispatchEvent(new Event('resize'));
      }
    });
    window.locoScroll = loco;

    var header = document.getElementById('header');
    loco.on('scroll', function (pos) {
      if (!header) return;
      if (pos.scroll.y > 80) header.classList.add('on');
      else header.classList.remove('on');
    });

    // 상단 이동 버튼
    document.querySelectorAll('.top-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var target = document.querySelector(btn.getAttribute('href'));
        if (target) loco.scrollTo(target);
      });
    });

    // ScrollTrigger ↔ Locomotive 동기화 (보조: 실패해도 스크롤/애니메이션엔 영향 없음)
    if (typeof ScrollTrigger !== 'undefined') {
      try {
        loco.on('scroll', ScrollTrigger.update);
        ScrollTrigger.scrollerProxy(el, {
          scrollTop: function (value) {
            return arguments.length
              ? loco.scrollTo(value, 0, 0)
              : loco.scroll.instance.scroll.y;
          },
          getBoundingClientRect: function () {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
          },
          pinType: el.style.transform ? 'transform' : 'fixed'
        });
        ScrollTrigger.addEventListener('refresh', function () {
          loco.update();
        });
        ScrollTrigger.refresh();
      } catch (e) {
        /* ScrollTrigger 동기화 실패 무시 */
      }
    }

    // 헤더/푸터 주입 반영 (높이 재계산)
    window.setTimeout(function () {
      loco.update();
    }, 300);
  }

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  document.addEventListener('DOMContentLoaded', function () {
    window.initSwipers();
    // 커서/Locomotive는 헤더(커서 포함) 동적 주입 후 실행 (loaderReady)
    (window.loaderReady || Promise.resolve()).then(function () {
      initCustomCursor();
      windowLoad().then(initLocomotive);
    });
  });
})();
