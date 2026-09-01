/**
 * Image Helpers
 * Utility functions for image handling and placeholder management
 */

var ImageHelpers = {
  // Empty image SVG placeholder
  EMPTY_IMAGE_SVG:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E',

  /**
   * 커스텀 라벨 텍스트를 가진 placeholder SVG 생성 (이미지 없을 때 매핑 위치 안내용)
   * @param {string} text - 표시할 라벨 텍스트
   * @returns {string} data URI
   */
  buildPlaceholderSvg: function (text) {
    var label = text || 'No Image';
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
      '<rect width="800" height="600" fill="#f0f0f0"/>' +
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
      'font-family="sans-serif" font-size="24" fill="#999">' +
      label +
      '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  },

  /**
   * Apply placeholder to an image element
   * @param {HTMLImageElement} imgElement - The image element to apply placeholder to
   * @param {string} [text] - 표시할 라벨 텍스트 (없으면 기본 "No Image")
   */
  applyPlaceholder: function (imgElement, text) {
    if (!imgElement) return;
    imgElement.src = text ? ImageHelpers.buildPlaceholderSvg(text) : ImageHelpers.EMPTY_IMAGE_SVG;
    imgElement.alt = text || 'No Image Available';
    imgElement.classList.add('empty-image-placeholder');
  },

  /**
   * Apply placeholder to a background-image element (배경 이미지 요소용)
   * @param {HTMLElement} element - The element to apply the background placeholder to
   * @param {string} [text] - 표시할 라벨 텍스트 (없으면 기본 "No Image")
   */
  applyBackgroundPlaceholder: function (element, text) {
    if (!element) return;
    // EMPTY_IMAGE_SVG는 공백/큰따옴표를 포함하므로 url()에 작은따옴표로 감싸야 CSS 파싱됨
    var svg = text ? ImageHelpers.buildPlaceholderSvg(text) : ImageHelpers.EMPTY_IMAGE_SVG;
    element.style.backgroundImage = "url('" + svg + "')";
    element.style.backgroundColor = '#f0f0f0';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundPosition = 'center';
    element.style.backgroundSize = 'cover';
    element.classList.add('empty-image-placeholder');
  },

  // ── 이미지 색상 분석 ────────────────────────────────────
  // 분석 결과 캐시 (url → Promise). 재매핑(프리뷰) 시 중복 분석 방지
  _analyzeCache: {},

  /**
   * 브라우저가 CSS mask를 지원하는지
   * @returns {boolean}
   */
  supportsMask: function () {
    if (!window.CSS || !CSS.supports) return false;
    return CSS.supports('mask-image', 'url(#a)') || CSS.supports('-webkit-mask-image', 'url(#a)');
  },

  /**
   * 이미지 픽셀 분석 — 투명 배경 여부와 대표 색(잉크색)을 구한다.
   * 이미지 호스트가 CORS를 허용하지 않으면 canvas가 오염되어 읽을 수 없으므로 null 반환.
   * @param {string} url
   * @returns {Promise<{transparentRatio:number, ink:{r:number,g:number,b:number}, luminance:number}|null>}
   */
  analyzeImage: function (url) {
    if (!url) return Promise.resolve(null);
    if (ImageHelpers._analyzeCache[url]) return ImageHelpers._analyzeCache[url];

    var promise = new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = function () {
        resolve(null);
      };
      img.onload = function () {
        try {
          // 분석은 축소본으로 충분 (최대 가로 120px)
          var scale = Math.min(1, 120 / (img.naturalWidth || 1));
          var w = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
          var h = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var data = ctx.getImageData(0, 0, w, h).data; // CORS 미허용 시 SecurityError
          var total = w * h;
          var transparent = 0;
          var opaque = 0;
          var r = 0;
          var g = 0;
          var b = 0;
          for (var i = 0; i < data.length; i += 4) {
            var a = data[i + 3];
            if (a < 16) {
              transparent++;
            } else if (a > 200) {
              opaque++;
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }
          }
          if (!opaque) return resolve(null);
          var ink = {
            r: Math.round(r / opaque),
            g: Math.round(g / opaque),
            b: Math.round(b / opaque)
          };
          resolve({
            transparentRatio: transparent / total,
            ink: ink,
            luminance: ImageHelpers.relativeLuminance(ink)
          });
        } catch (e) {
          // CORS 미허용 등 — 색상 자동 적용 없이 원본 로고 그대로 사용
          resolve(null);
        }
      };
      img.src = url;
    });

    ImageHelpers._analyzeCache[url] = promise;
    return promise;
  },

  /**
   * 상대 휘도 (0=검정, 1=흰색)
   * @param {{r:number,g:number,b:number}} c
   * @returns {number}
   */
  relativeLuminance: function (c) {
    return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
  }
};

// Ensure ImageHelpers is available globally
window.ImageHelpers = ImageHelpers;
