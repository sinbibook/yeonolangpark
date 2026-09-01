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

  function ReservationMapper() {
    BaseDataMapper.call(this);
  }
  ReservationMapper.prototype = Object.create(BaseDataMapper.prototype);
  ReservationMapper.prototype.constructor = ReservationMapper;

  ReservationMapper.prototype.mapPage = function () {
    this.mapHeroSlides();
    this.mapTitle();
    this.mapCheckinInfo();
    this.mapUsageGuide();
    this.mapReservationGuide();
    this.mapRefundPolicies();
    this.refreshSwipers();
  };

  // customFields.pages.reservation.sections[0]
  ReservationMapper.prototype.getSection = function () {
    var pages = this.getPages();
    return (pages.reservation && pages.reservation.sections && pages.reservation.sections[0]) || {};
  };

  ReservationMapper.prototype.refreshSwipers = function () {
    if (typeof window.initSwipers === 'function') window.initSwipers();
    if (window.locoScroll && typeof window.locoScroll.update === 'function') {
      window.setTimeout(function () {
        window.locoScroll.update();
      }, 200);
    }
  };

  // MAPPER: hero.title → [data-reservation-title] (없으면 HTML 기본 문구 fallback 유지)
  ReservationMapper.prototype.mapTitle = function () {
    var el = document.querySelector('[data-reservation-title]');
    if (!el) return;
    var title = (this.getSection().hero || {}).title;
    if (title && title.trim()) el.textContent = title;
  };

  // MAPPER: hero.images[isSelected] → [data-reservation-hero-slides] (배경 슬라이드 동적 생성)
  ReservationMapper.prototype.mapHeroSlides = function () {
    var wrapper = document.querySelector('[data-reservation-hero-slides]');
    if (!wrapper) return;
    var images = this.getSelectedImages((this.getSection().hero || {}).images || []);

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

  // MAPPER: property.checkin/checkout/checkInOutInfo → [data-reservation-checkin-info] ([입퇴실안내] 라벨 + 내용)
  ReservationMapper.prototype.mapCheckinInfo = function () {
    var el = document.querySelector('[data-reservation-checkin-info]');
    if (!el) return;
    var p = this.getProperty();
    var lines = ['[입퇴실안내]'];
    if (p.checkin) lines.push('- 입실: ' + p.checkin);
    if (p.checkout) lines.push('- 퇴실: ' + p.checkout);
    var html = lines.join('\n');
    if (p.checkInOutInfo) html += '\n' + p.checkInOutInfo;
    el.innerHTML = nl2br(html);
  };

  // MAPPER: property.usageGuide → [data-reservation-usage-guide]
  ReservationMapper.prototype.mapUsageGuide = function () {
    var el = document.querySelector('[data-reservation-usage-guide]');
    if (!el) return;
    var guide = this.getProperty().usageGuide || '';
    el.innerHTML = guide ? nl2br(guide) : '';
  };

  // MAPPER: property.reservationGuide → [data-reservation-reservation-guide]
  ReservationMapper.prototype.mapReservationGuide = function () {
    var el = document.querySelector('[data-reservation-reservation-guide]');
    if (!el) return;
    var guide = this.getProperty().reservationGuide || '';
    el.innerHTML = guide ? nl2br(guide) : '';
  };

  // MAPPER: property.refundPolicies → [data-reservation-refund-policies] (동적 생성)
  // 형식: "* 이용일 {days}일 이전 취소시 {rate}% 환불" (당일은 "* 당일 취소시 {rate}% 환불")
  ReservationMapper.prototype.mapRefundPolicies = function () {
    var el = document.querySelector('[data-reservation-refund-policies]');
    if (!el) return;
    var policies = this.getProperty().refundPolicies || [];
    if (!policies.length) {
      el.innerHTML = '';
      return;
    }
    var lines = policies.map(function (p) {
      var days = p.refundProcessingDays;
      var rate = p.refundRate;
      var when = days > 0 ? '이용일 ' + days + '일 이전 취소시' : '당일 취소시';
      return '* ' + when + ' ' + rate + '% 환불';
    });
    el.innerHTML = lines.join('<br />');
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.previewHandler) return;
    var mapper = new ReservationMapper();
    mapper.initialize();
    global.reservationMapperInstance = mapper;
  });

  global.ReservationMapper = ReservationMapper;
})(window);
