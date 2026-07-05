/* ════════════════════════════════════════
   ديمى — Products page JS (static, GitHub Pages)
   ════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Numeral normalization (Arabic ↔ English) ── */
  var ARABIC_NUMS = '٠١٢٣٤٥٦٧٨٩';
  var ENGLISH_NUMS = '0123456789';

  function normalizeNumerals(text) {
    return text.replace(/[٠-٩]/g, function(c) { return ENGLISH_NUMS[ARABIC_NUMS.indexOf(c)]; })
               .replace(/[0-9]/g, function(c) { return ARABIC_NUMS[ENGLISH_NUMS.indexOf(c)]; });
  }

  /* ── State ── */
  var grid = document.getElementById('products-grid');
  var empty = document.getElementById('products-empty');
  var searchInput = document.getElementById('product-search');
  var comparePanel = document.getElementById('compare-panel');
  var compareList = document.getElementById('compare-list');
  var compareClear = document.getElementById('compare-clear');

  var allProducts = [];
  var currentFilter = 'all';
  var compareItems = [];

  /* ── Fetch products from API ── */
  function loadProducts() {
    allProducts = typeof STATIC_PRODUCTS !== 'undefined' ? STATIC_PRODUCTS : [];
    var urlParams = new URLSearchParams(window.location.search);
    var catParam = urlParams.get('cat');
    if (catParam) {
      var targetBtn = document.querySelector('.filter__btn[data-filter="' + catParam + '"]');
      if (targetBtn) {
        document.querySelectorAll('.filter__btn').forEach(function(b) { b.classList.remove('active'); });
        targetBtn.classList.add('active');
        currentFilter = catParam;
      }
    }
    renderProducts(allProducts);
  }

  /* ── Render cards ── */
  function renderProducts(list) {
    grid.innerHTML = '';
    if (list.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    for (var i = 0; i < list.length; i++) {
      var product = list[i];
      var card = document.createElement('div');
      card.className = 'product__card';
      card.dataset.category = product.category;
      card.dataset.productName = product.name;
      card.style.animation = 'keyframe-fade-up 0.4s var(--ease-smooth) both';
      card.style.animationDelay = (i * 0.05) + 's';

      var specsHtml = '';
      var specKeys = Object.keys(product.specs);
      for (var s = 0; s < specKeys.length; s++) {
        specsHtml += '<li>' + specKeys[s] + ': ' + product.specs[specKeys[s]] + '</li>';
      }

      var featuresHtml = '';
      if (product.features && product.features.length > 0) {
        var featItems = '';
        for (var f = 0; f < product.features.length; f++) {
          featItems += '<li>' + product.features[f] + '</li>';
        }
        featuresHtml = '<details class="product__features"><summary>المواصفات الكاملة</summary><ul>' + featItems + '</ul></details>';
      }

      var allImages = [product.image];
      if (product.extras) {
        allImages = [product.image].concat(product.extras);
      }
      var galleryHtml = '';
      if (allImages.length > 1) {
        galleryHtml = '<div class="product__gallery">';
        for (var g = 0; g < allImages.length; g++) {
          galleryHtml += '<img src="' + allImages[g] + '" alt="' + product.name + '" class="product__thumb' + (g === 0 ? ' active' : '') + '" data-index="' + g + '" loading="lazy">';
        }
        galleryHtml += '</div>';
      }

      var detailUrl = 'product.html?slug=' + product.slug;

      var isCompared = compareItems.indexOf(product.name) > -1;

      card.dataset.slug = product.slug;

      card.innerHTML =
        '<div class="product__image-wrap">' +
          (product.featured ? '<span class="badge product__badge">الأكثر مبيعاً</span>' : '') +
          '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" class="product__main-img">' +
          galleryHtml +
        '</div>' +
        '<div class="product__body">' +
          '<h3>' + product.name + '</h3>' +
          '<ul class="product__specs">' + specsHtml + '</ul>' +
          featuresHtml +
          '<div class="product__card-actions">' +
            '<a href="' + detailUrl + '" class="btn btn--outline btn--sm"><i class="fas fa-info-circle"></i> التفاصيل</a>' +
            '<button class="compare__toggle ' + (isCompared ? 'active' : '') + '" data-name="' + product.name + '">' +
              (isCompared ? '✅' : '📊') + ' مقارنة' +
            '</button>' +
            '<a href="' + detailUrl + '" class="btn btn--primary btn--sm">' +
              '<i class="fas fa-arrow-left"></i> المزيد' +
            '</a>' +
          '</div>' +
        '</div>';

      grid.appendChild(card);
    }

    updateCounts();
  }

  /* ── Count badges ── */
  function updateCounts() {
    document.getElementById('count-all').textContent = allProducts.length;
    var cats = ['motor', 'submersible', 'flomax', 'spare'];
    for (var c = 0; c < cats.length; c++) {
      var count = 0;
      for (var p = 0; p < allProducts.length; p++) {
        if (allProducts[p].category === cats[c]) count++;
      }
      document.getElementById('count-' + cats[c]).textContent = count;
    }
  }

  /* ── Filter + Search ── */
  function getSearchableText(product) {
    var text = product.name + ' ';
    var specKeys = Object.keys(product.specs);
    for (var s = 0; s < specKeys.length; s++) {
      text += product.specs[specKeys[s]] + ' ';
    }
    if (product.features) {
      for (var f = 0; f < product.features.length; f++) {
        text += product.features[f] + ' ';
      }
    }
    return text;
  }

  function filterProducts() {
    var query = searchInput ? searchInput.value.trim() : '';
    var queryNorm = query ? normalizeNumerals(query) : '';

    var filtered = [];
    for (var p = 0; p < allProducts.length; p++) {
      var prod = allProducts[p];
      if (currentFilter !== 'all' && prod.category !== currentFilter) continue;
      if (!queryNorm) {
        filtered.push(prod);
        continue;
      }
      var text = getSearchableText(prod);
      if (normalizeNumerals(text).indexOf(queryNorm) > -1) {
        filtered.push(prod);
      }
    }

    renderProducts(filtered);
  }

  /* ── Compare ── */
  function updateCompareUI() {
    var toggles = document.querySelectorAll('.compare__toggle');
    for (var t = 0; t < toggles.length; t++) {
      var name = toggles[t].dataset.name;
      var active = compareItems.indexOf(name) > -1;
      toggles[t].classList.toggle('active', active);
      toggles[t].textContent = active ? '✅ مقارنة' : '📊 مقارنة';
    }

    if (compareItems.length >= 2) {
      comparePanel.classList.add('visible');
      renderCompareTable();
    } else {
      comparePanel.classList.remove('visible');
    }
  }

  function renderCompareTable() {
    var selected = [];
    for (var p = 0; p < allProducts.length; p++) {
      if (compareItems.indexOf(allProducts[p].name) > -1) {
        selected.push(allProducts[p]);
      }
    }
    if (selected.length < 2) return;

    var allKeys = [];
    for (var s = 0; s < selected.length; s++) {
      var keys = Object.keys(selected[s].specs);
      for (var k = 0; k < keys.length; k++) {
        if (allKeys.indexOf(keys[k]) === -1) allKeys.push(keys[k]);
      }
    }

    var hasFeatures = false;
    for (var sf = 0; sf < selected.length; sf++) {
      if (selected[sf].features) { hasFeatures = true; break; }
    }

    var html = '<table class="compare__table"><thead><tr><th>المواصفة</th>';
    for (var si = 0; si < selected.length; si++) {
      html += '<th>' + selected[si].name + '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var ak = 0; ak < allKeys.length; ak++) {
      html += '<tr><td>' + allKeys[ak] + '</td>';
      for (var si2 = 0; si2 < selected.length; si2++) {
        html += '<td>' + (selected[si2].specs[allKeys[ak]] || '—') + '</td>';
      }
      html += '</tr>';
    }

    if (hasFeatures) {
      html += '<tr><td>المواصفات الكاملة</td>';
      for (var si3 = 0; si3 < selected.length; si3++) {
        if (selected[si3].features) {
          html += '<td>✓ ' + selected[si3].features.join(' • ') + '</td>';
        } else {
          html += '<td>—</td>';
        }
      }
      html += '</tr>';
    }

    html += '<tr><td>صورة</td>';
    for (var si4 = 0; si4 < selected.length; si4++) {
      html += '<td><img src="' + selected[si4].image + '" alt="' + selected[si4].name + '" class="compare__thumb"></td>';
    }
    html += '</tr>';

    html += '<tr><td>استفسار</td>';
    for (var si5 = 0; si5 < selected.length; si5++) {
      var url = 'https://wa.me/201016892956?text=' + encodeURIComponent('أهلاً، أستفسر عن سعر ' + selected[si5].name);
      html += '<td><a href="' + url + '" target="_blank" class="btn btn--primary btn--sm">💬 استعلم</a></td>';
    }
    html += '</tr>';

    html += '</tbody></table>';
    compareList.innerHTML = html;
  }

  /* ── Event listeners ── */

  /* Filter buttons */
  var filterBtns = document.querySelectorAll('.filter__btn');
  for (var fb = 0; fb < filterBtns.length; fb++) {
    filterBtns[fb].addEventListener('click', function() {
      document.querySelectorAll('.filter__btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      filterProducts();
    });
  }

  /* Search with debounce */
  if (searchInput) {
    var debounceTimer;
    searchInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterProducts, 200);
    });
  }

  /* Card click → navigate to detail (unless clicking an interactive element) */
  document.addEventListener('click', function(e) {
    var card = e.target.closest('.product__card[data-slug]');
    if (!card) return;
    // Let interactive elements handle themselves
    if (e.target.closest('.product__gallery')) return;
    if (e.target.closest('.compare__toggle')) return;
    if (e.target.closest('.btn')) return;
    if (e.target.closest('a')) return;
    if (e.target.closest('details')) return;
    e.preventDefault();
    window.location.href = 'product.html?slug=' + card.dataset.slug;
  });

  /* Gallery thumbnail click (delegated) */
  document.addEventListener('click', function(e) {
    var thumb = e.target.closest('.product__thumb');
    if (!thumb) return;
    var gallery = thumb.closest('.product__gallery');
    if (!gallery) return;
    var wrap = gallery.closest('.product__image-wrap');
    var mainImg = wrap.querySelector('.product__main-img');
    mainImg.src = thumb.src;
    gallery.querySelectorAll('.product__thumb').forEach(function(t) { t.classList.remove('active'); });
    thumb.classList.add('active');
  });

  /* Compare toggle (delegated) */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.compare__toggle');
    if (!btn) return;
    var name = btn.dataset.name;
    var idx = compareItems.indexOf(name);
    if (idx > -1) {
      compareItems.splice(idx, 1);
    } else {
      if (compareItems.length >= 3) compareItems.shift();
      compareItems.push(name);
    }
    updateCompareUI();
    filterProducts();
  });

  if (compareClear) {
    compareClear.addEventListener('click', function() {
      compareItems = [];
      updateCompareUI();
      filterProducts();
    });
  }

  /* ── Init ── */
  loadProducts();

})();
