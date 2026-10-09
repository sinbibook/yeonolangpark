/**
 * common.js — 헤더/푸터·메뉴 상호작용 (vanilla, jQuery 미사용)
 * 헤더/푸터는 header-footer-loader.js가 async 주입하므로 loaderReady 이후 실행한다.
 * 클릭류는 이벤트 위임(document)으로, hover/사이즈류는 주입 후 직접 바인딩한다.
 */
(function () {
  'use strict';

  // ── vanilla slide 애니메이션 (jQuery slideUp/Down/Toggle 대체) ──────────
  function slideUp(el, duration) {
    duration = duration || 300;
    el.style.transitionProperty = 'height, margin, padding';
    el.style.transitionDuration = duration + 'ms';
    el.style.boxSizing = 'border-box';
    el.style.height = el.offsetHeight + 'px';
    el.offsetHeight; // reflow
    el.style.overflow = 'hidden';
    el.style.height = 0;
    el.style.paddingTop = 0;
    el.style.paddingBottom = 0;
    el.style.marginTop = 0;
    el.style.marginBottom = 0;
    window.setTimeout(function () {
      el.style.display = 'none';
      [
        'height',
        'padding-top',
        'padding-bottom',
        'margin-top',
        'margin-bottom',
        'overflow',
        'transition-duration',
        'transition-property',
        'box-sizing'
      ].forEach(function (p) {
        el.style.removeProperty(p);
      });
    }, duration);
  }

  function slideDown(el, duration) {
    duration = duration || 300;
    el.style.removeProperty('display');
    var display = window.getComputedStyle(el).display;
    if (display === 'none') display = 'block';
    el.style.display = display;
    var height = el.offsetHeight;
    el.style.overflow = 'hidden';
    el.style.boxSizing = 'border-box';
    el.style.height = 0;
    el.style.paddingTop = 0;
    el.style.paddingBottom = 0;
    el.style.marginTop = 0;
    el.style.marginBottom = 0;
    el.offsetHeight; // reflow
    el.style.transitionProperty = 'height, margin, padding';
    el.style.transitionDuration = duration + 'ms';
    el.style.height = height + 'px';
    ['padding-top', 'padding-bottom', 'margin-top', 'margin-bottom'].forEach(function (p) {
      el.style.removeProperty(p);
    });
    window.setTimeout(function () {
      ['height', 'overflow', 'transition-duration', 'transition-property', 'box-sizing'].forEach(
        function (p) {
          el.style.removeProperty(p);
        }
      );
    }, duration);
  }

  function slideToggle(el, duration) {
    if (window.getComputedStyle(el).display === 'none') slideDown(el, duration);
    else slideUp(el, duration);
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait || 100);
    };
  }

  // ── 사이드(모바일) on/off ─────────────────────────────────────────────
  function setAside(open) {
    var aside = document.querySelector('.aside');
    var bg = document.querySelector('.aside_bg');
    if (!aside) return;
    aside.classList.toggle('on', open);
    if (bg) bg.classList.toggle('on', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    document.body.style.overflow = open ? 'hidden' : '';
  }

  function toggleAside() {
    var aside = document.querySelector('.aside');
    setAside(!(aside && aside.classList.contains('on')));
  }

  // ── 전체메뉴(allmenu) on/off ──────────────────────────────────────────
  function setAllmenu(open) {
    var wrap = document.getElementById('allmenu-wrap');
    document.querySelectorAll('.bt-allmenu').forEach(function (b) {
      b.classList.toggle('active', open);
    });
    if (wrap) wrap.classList.toggle('open', open);
  }

  // ── 클릭 이벤트 위임 (헤더가 동적 주입돼도 동작) ──────────────────────────
  function bindClicks() {
    document.addEventListener('click', function (e) {
      // 전체메뉴 토글
      var allmenuBtn = e.target.closest('.bt-allmenu');
      if (allmenuBtn) {
        e.preventDefault();
        setAllmenu(!allmenuBtn.classList.contains('active'));
        return;
      }
      // 전체메뉴 닫기
      if (e.target.closest('#allmenu-wrap .close')) {
        e.preventDefault();
        setAllmenu(false);
        return;
      }
      // 사이드 토글 (햄버거 / 닫기)
      if (e.target.closest('.btn_menu') || e.target.closest('.aside .btn_close')) {
        e.preventDefault();
        toggleAside();
        return;
      }
      // 사이드 배경 클릭 → 닫기
      if (e.target.closest('.aside_bg')) {
        setAside(false);
        return;
      }
      // 사이드 아코디언
      var depth = e.target.closest('.aside .depth1');
      if (depth) {
        var next = depth.nextElementSibling;
        document.querySelectorAll('.aside .depth_list').forEach(function (dl) {
          if (dl !== next && window.getComputedStyle(dl).display !== 'none') slideUp(dl);
        });
        if (next) slideToggle(next);
      }
    });
  }

  // ── PC 헤더 lnb hover (주입 후 직접 바인딩) ─────────────────────────────
  function bindLnbHover() {
    var lnb = document.getElementById('hd_lnb');
    var bg = document.querySelector('.hd_lnb_bg');
    if (!lnb) return;
    var boxes = function () {
      return lnb.querySelectorAll('.depth_box');
    };
    // .hd_lnb_bg 높이를 서브메뉴 실제 높이에 맞춘다.
    // 객실/시설 메뉴는 매퍼가 동적 생성하므로 hover 시점에 매번 계산한다.
    var on = function () {
      var header = document.getElementById('header');
      // 서브메뉴가 뷰포트 아래로 넘치지 않도록 상한을 잡는다 (헤더 높이 + 하단 여유)
      var headerH = header ? header.offsetHeight : 0;
      var cap = Math.max(160, window.innerHeight - headerH - 110);
      var contentH = 0;
      var offset = 0;
      boxes().forEach(function (d) {
        // 측정 전에 상한을 풀어 실제 내용 높이를 잰다
        d.style.maxHeight = '';
        var natural = d.scrollHeight;
        if (contentH < natural) contentH = natural;
        // 객실/시설이 많아 상한을 넘으면 그 박스만 스크롤시킨다
        if (natural > cap) {
          d.classList.add('is-scroll');
          d.style.maxHeight = cap + 'px';
        } else {
          d.classList.remove('is-scroll');
        }
        d.classList.add('on');
      });
      if (!bg) return;
      // 배경 상단 ~ 서브메뉴 상단 거리 (헤더 레이아웃이 바뀌어도 맞도록 실제 위치로 잰다)
      var first = boxes()[0];
      if (first) offset = Math.max(0, first.getBoundingClientRect().top - bg.getBoundingClientRect().top);
      bg.classList.add('on');
      bg.style.height = offset + Math.min(contentH, cap) + 40 + 'px';
    };
    var off = function () {
      boxes().forEach(function (d) {
        d.classList.remove('on');
        // max-height 인라인 값을 지워 CSS 의 닫힘 트랜지션(max-height:0)이 살아나게 한다
        d.style.maxHeight = '';
      });
      if (bg) {
        bg.classList.remove('on');
        bg.style.height = '';
      }
    };
    window.addEventListener('resize', function () {
      if (bg && bg.classList.contains('on')) on();
    });
    lnb.addEventListener('mouseover', on);
    lnb.addEventListener('mouseleave', off);
    if (bg) {
      bg.addEventListener('mouseover', on);
      bg.addEventListener('mouseleave', off);
    }
  }

  // ── 사이드 높이 = 뷰포트 높이 ─────────────────────────────────────────
  function sizeAside() {
    var aside = document.querySelector('.aside');
    if (aside) aside.style.height = document.documentElement.clientHeight + 'px';
  }

  bindClicks();

  document.addEventListener('DOMContentLoaded', function () {
    // 헤더/푸터 주입 완료 후 실행 (standalone 등 loaderReady 없으면 즉시)
    (window.loaderReady || Promise.resolve()).then(function () {
      bindLnbHover();
      sizeAside();
    });
    window.addEventListener('resize', debounce(sizeAside, 100));
  });
})();
