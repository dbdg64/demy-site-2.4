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
    motor: 'fa-solid fa-water',
    submersible: 'fa-solid fa-ship',
    flomax: 'fa-solid fa-gauge-high',
    spare: 'fa-solid fa-toolbox',
  };

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
    var catIcon = CATEGORY_ICONS[product.category] || 'fa-solid fa-tag';
    detailCategory.innerHTML = '<i class="' + catIcon + '"></i> ' + catLabel;

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
        featHtml += '<li><i class="fas fa-check-circle"></i> ' + product.features[f] + '</li>';
      }
      featuresList.innerHTML = featHtml;
    }

    // WhatsApp CTA
    var waText = 'أهلاً، أستفسر عن سعر ' + product.name;
    whatsappBtn.href = 'https://wa.me/201016892956?text=' + encodeURIComponent(waText);

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

  /* ── Init ── */
  function init() {
    var slug = getSlug();
    if (!slug) {
      showError('لم يتم تحديد المنتج. يرجى اختيار منتج من قائمة المنتجات.');
      return;
    }

    var product = findProduct(slug);
    if (!product) {
      showError('عذراً، المنتج المطلوب غير موجود أو تمت إزالته.');
      return;
    }

    renderProduct(product);
  }

  // Wait for data to be ready
  if (typeof STATIC_PRODUCTS !== 'undefined') {
    init();
  } else {
    // Data not loaded yet — wait a tick
    var checkInterval = setInterval(function () {
      if (typeof STATIC_PRODUCTS !== 'undefined') {
        clearInterval(checkInterval);
        init();
      }
    }, 50);
    // Timeout after 5s
    setTimeout(function () {
      clearInterval(checkInterval);
      if (!detailEl.style.display || detailEl.style.display === 'none') {
        showError('تعذر تحميل بيانات المنتج. يرجى المحاولة مرة أخرى.');
      }
    }, 5000);
  }

})();
