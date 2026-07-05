/**
 * ديمى — Product detail page
 * Loads product data from STATIC_PRODUCTS by ?slug= URL param
 */
(function () {
  'use strict';

  var CATEGORY_LABELS = {
    motor: 'مواتير مياه',
    submersible: 'غواطس',
    flomax: 'فلوماك',
    spare: 'قطع غيار',
  };

  var CATEGORY_ICONS = {
    motor: 'svg-pump',
    submersible: 'svg-waves',
    flomax: 'svg-gauge',
    spare: 'svg-wrench',
  };
  var CATEGORY_ICON_SVGS = {
    'svg-pump': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align:middle;margin-left:4px"><path fill="currentColor" d="M2 21v-6h1.5a9.3 9.3 0 0 1-.5-3a9 9 0 0 1 9-9h10v6h-1.5c.32.94.5 1.95.5 3a9 9 0 0 1-9 9zm3-9c0 1.28.34 2.47.94 3.5l3.46-2c-.25-.44-.4-.95-.4-1.5c0-.65.21-1.25.56-1.74L6.3 7.93C5.5 9.08 5 10.5 5 12m7 7c2.59 0 4.85-1.41 6.06-3.5l-3.46-2c-.52.9-1.49 1.5-2.6 1.5h-.29l-.38 3.97zm0-10c1.21 0 2.26.72 2.73 1.76l3.64-1.66A6.99 6.99 0 0 0 12 5zm0 2c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1"/></svg>',
    'svg-waves': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align:middle;margin-left:4px"><path fill="currentColor" d="M20 12h2v2h-2c-1.38 0-2.74-.35-4-1c-2.5 1.3-5.5 1.3-8 0c-1.26.65-2.63 1-4 1H2v-2h2c1.39 0 2.78-.47 4-1.33c2.44 1.71 5.56 1.71 8 0c1.22.86 2.61 1.33 4 1.33m0-6h2v2h-2c-1.38 0-2.74-.35-4-1c-2.5 1.3-5.5 1.3-8 0c-1.26.65-2.63 1-4 1H2V6h2c1.39 0 2.78-.47 4-1.33c2.44 1.71 5.56 1.71 8 0C17.22 5.53 18.61 6 20 6m0 12h2v2h-2c-1.38 0-2.74-.35-4-1c-2.5 1.3-5.5 1.3-8 0c-1.26.65-2.63 1-4 1H2v-2h2c1.39 0 2.78-.47 4-1.33c2.44 1.71 5.56 1.71 8 0c1.22.86 2.61 1.33 4 1.33"/></svg>',
    'svg-gauge': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align:middle;margin-left:4px"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 2a8 8 0 0 1 8 8c0 2.4-1 4.5-2.7 6c-1.4-1.3-3.3-2-5.3-2s-3.8.7-5.3 2C5 16.5 4 14.4 4 12a8 8 0 0 1 8-8m2 1.89c-.38.01-.74.26-.9.65l-1.29 3.23l-.1.23c-.71.13-1.3.6-1.57 1.26c-.41 1.03.09 2.19 1.12 2.6s2.19-.09 2.6-1.12c.26-.66.14-1.42-.29-1.98l.1-.26l1.29-3.21l.01-.03c.2-.51-.05-1.09-.56-1.3c-.13-.05-.26-.07-.41-.07M10 6a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M7 9a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1m10 0a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1"/></svg>',
    'svg-wrench': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align:middle;margin-left:4px"><path fill="currentColor" d="m22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9c-2-2-5-2.4-7.4-1.3L9 6L6 9L1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4"/></svg>',
    'svg-tag': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align:middle;margin-left:4px"><path fill="currentColor" d="M5.5 7A2 2 0 0 1 7.5 5a2 2 0 0 1 1.5 2a2 2 0 0 1-1.5 1.5A2 2 0 0 1 5.5 7m14 6.08l-7.42 7.42a1 1 0 0 1-1.41 0l-6.17-6.17A1 1 0 0 1 4 13.25V5a1 1 0 0 1 1-1h8.25a1 1 0 0 1 .67.26l7.42 7.42a1 1 0 0 1-.34 1.67"/></svg>',
  };
  function getCategoryIcon(key) { return CATEGORY_ICON_SVGS[key] || ''; }

  /* ── DOM refs ── */
  var $ = function (id) { return document.getElementById(id); };
  var loadingEl = $('loading-state');
  var errorEl = $('error-state');
  var errorMsg = $('error-message');
  var detailEl = $('product-detail');

  var breadcrumbName = $('breadcrumb-name');
  var detailTitle = $('detail-title');
  var detailCategory = $('detail-category');
  var detailBadge = $('detail-badge');
  var mainImage = $('main-image');
  var thumbsEl = $('thumbnails');
  var specsTable = $('specs-table');
  var featuresSection = $('features-section');
  var featuresList = $('features-list');
  var whatsappBtn = $('whatsapp-btn');
  var ldJson = $('ld-json');

  /* Video */
  var videoHero = $('product-video-hero');
  var videoEl = $('product-video');
  var videoLabel = $('video-label');

  /* ── Get slug from URL ── */
  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return params.get('slug');
  }

  /* ── Find product by slug ── */
  function findProduct(slug) {
    if (typeof STATIC_PRODUCTS === 'undefined') return null;
    for (var i = 0; i < STATIC_PRODUCTS.length; i++) {
      if (STATIC_PRODUCTS[i].slug === slug) return STATIC_PRODUCTS[i];
    }
    return null;
  }

  /* ── Update page meta for sharing ── */
  function updateMeta(product) {
    document.title = product.name + ' — ديمى لمواتير المياه';

    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = product.name + ' — ديمى لمواتير المياه';

    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = 'مواصفات ومميزات ' + product.name + ' من ديمى لمواتير المياه.';

    var ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.content = 'https://demy-site-2-4.vercel.app/' + product.image;

    var description = document.querySelector('meta[name="description"]');
    if (description) description.content = 'تعرف على ' + product.name + ' — المواصفات والمميزات الكاملة.';

    // Update canonical + og:url
    var slug = product.slug;
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://demy-site-2-4.vercel.app/product?slug=' + slug;
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = 'https://demy-site-2-4.vercel.app/product?slug=' + slug;

    // Update LD+JSON
    if (ldJson) {
      try {
        var ld = JSON.parse(ldJson.textContent);
        ld.name = product.name;
        ld.url = 'https://demy-site-2-4.vercel.app/product?slug=' + slug;
        ld.image = 'https://demy-site-2-4.vercel.app/' + product.image;
        ld.description = 'مواصفات ومميزات ' + product.name;
        ldJson.textContent = JSON.stringify(ld, null, 2);
      } catch (e) { /* ignore */ }
    }
  }

  /* ── Render product ── */
  function renderProduct(product) {
    // Breadcrumb
    breadcrumbName.textContent = product.name;

    // Title
    detailTitle.textContent = product.name;

    // Category badge
    var catLabel = CATEGORY_LABELS[product.category] || product.category;
    var catIcon = CATEGORY_ICONS[product.category] || 'svg-tag';
    detailCategory.innerHTML = getCategoryIcon(catIcon) + ' ' + catLabel;

    // Badge
    if (product.featured) {
      detailBadge.style.display = 'block';
    }

    // Main image
    mainImage.src = product.image;
    mainImage.alt = product.name;

    // Thumbnails gallery
    var allImages = [product.image];
    if (product.extras && product.extras.length > 0) {
      allImages = allImages.concat(product.extras);
    }
    thumbsEl.innerHTML = '';
    for (var t = 0; t < allImages.length; t++) {
      var thumb = document.createElement('img');
      thumb.src = allImages[t];
      thumb.alt = product.name + ' - صورة ' + (t + 1);
      thumb.className = 'thumb__item' + (t === 0 ? ' active' : '');
      thumb.dataset.index = t;
      thumb.addEventListener('click', function () {
        mainImage.src = this.src;
        thumbsEl.querySelectorAll('.thumb__item').forEach(function (el) {
          el.classList.remove('active');
        });
        this.classList.add('active');
      });
      thumbsEl.appendChild(thumb);
    }

    // Specs table
    var specsHtml = '';
    var specKeys = Object.keys(product.specs);
    for (var s = 0; s < specKeys.length; s++) {
      specsHtml +=
        '<tr>' +
          '<td class="specs-table__key">' + specKeys[s] + '</td>' +
          '<td class="specs-table__value">' + product.specs[specKeys[s]] + '</td>' +
        '</tr>';
    }
    specsTable.innerHTML = specsHtml;

    // Features
    if (product.features && product.features.length > 0) {
      featuresSection.style.display = 'block';
      var featHtml = '';
      for (var f = 0; f < product.features.length; f++) {
        featHtml += '<li><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="vertical-align:middle;margin-left:4px"><path fill="#ffa800" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4l8-8z"/></svg> ' + product.features[f] + '</li>';
      }
      featuresList.innerHTML = featHtml;
    }

    // WhatsApp CTA
    var waText = 'أهلاً، أستفسر عن سعر ' + product.name;
    whatsappBtn.href = 'https://wa.me/201016892956?text=' + encodeURIComponent(waText);

    // Video hero (auto-plays, above the fold)
    if (product.video) {
      videoEl.src = product.video;
      videoEl.setAttribute('poster', product.image);
      if (product.videoTitle) {
        videoLabel.textContent = '🎬 ' + product.videoTitle;
      }
      videoHero.style.display = 'block';
      // Attempt playback (browsers may require user gesture)
      videoEl.play().catch(function() { /* autoplay blocked — user can click */ });
    }

    // Update page meta
    updateMeta(product);

    // Show detail, hide loading
    loadingEl.style.display = 'none';
    detailEl.style.display = 'block';
  }

  /* ── Show error ── */
  function showError(message) {
    loadingEl.style.display = 'none';
    errorMsg.textContent = message || 'لم يتم العثور على المنتج المطلوب.';
    errorEl.style.display = 'block';
  }

  /* ── Normalize product (API or static) ── */
  function normalizeProduct(p) {
    // API returns video_url, static data has video
    if (p.video_url && !p.video) p.video = p.video_url;
    if (p.video && !p.video_url) p.video_url = p.video;
    return p;
  }

  /* ── Init ── */
  function init() {
    var slug = getSlug();
    if (!slug) {
      showError('لم يتم تحديد المنتج. يرجى اختيار منتج من قائمة المنتجات.');
      return;
    }

    // Try API first (has live data including video_url from admin)
    fetch('/api/products/' + slug)
      .then(function(r) { return r.ok ? r.json() : null })
      .then(function(product) {
        if (product) {
          renderProduct(normalizeProduct(product));
        } else {
          // API failed — fall back to static data
          var staticProduct = findProduct(slug);
          if (staticProduct) {
            renderProduct(normalizeProduct(staticProduct));
          } else {
            showError('عذراً، المنتج المطلوب غير موجود أو تمت إزالته.');
          }
        }
      })
      .catch(function() {
        // Network error — fall back to static data
        var staticProduct = findProduct(slug);
        if (staticProduct) {
          renderProduct(normalizeProduct(staticProduct));
        } else {
          showError('تعذر تحميل بيانات المنتج.');
        }
      });
  }

  // Wait for static data to be ready, then init (which fetches API)
  function waitForData() {
    if (typeof STATIC_PRODUCTS !== 'undefined') {
      init();
    } else {
      var checkInterval = setInterval(function () {
        if (typeof STATIC_PRODUCTS !== 'undefined') {
          clearInterval(checkInterval);
          init();
        }
      }, 50);
      setTimeout(function () {
        clearInterval(checkInterval);
        if (!detailEl.style.display || detailEl.style.display === 'none') {
          showError('تعذر تحميل بيانات المنتج. يرجى المحاولة مرة أخرى.');
        }
      }, 5000);
    }
  }

  waitForData();

})();
