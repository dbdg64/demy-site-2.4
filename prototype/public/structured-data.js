/* ════════════════════════════════════════
   ديمى — JSON-LD Structured Data Injector
   ════════════════════════════════════════ */
(function () {
  'use strict';

  var BASE_URL = 'https://demy-site-2-4.vercel.app';
  var path = window.location.pathname.replace(/\/$/, '') || '/';

  function addJsonLd(data) {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(script);
  }

  /* ── 1. LocalBusiness (every page) ── */
  addJsonLd({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': BASE_URL + '/#business',
    name: 'ديمى لمواتير المياه',
    alternateName: 'Demy Water Pumps',
    description: 'مواتير مياه مستوردة — نحاس ١٠٠٪، عمود استانلس، حماية حرارية. ٣٠ سنة خبرة في السوق المصري.',
    url: BASE_URL + '/',
    telephone: '+201016892956',
    email: 'info@michelledemy.com',
    areaServed: 'EG',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'القاهرة',
      addressRegion: 'الأزبكية',
      addressCountry: 'EG'
    },
    sameAs: [
      'https://www.facebook.com/micheledemy/',
      'https://www.youtube.com/@mechelledemy'
    ]
  });

  /* ── 2. Products listing page ── */
  if (path === '/products' || path === '/products.html') {
    if (typeof STATIC_PRODUCTS !== 'undefined') {
      var i, product;
      for (i = 0; i < STATIC_PRODUCTS.length; i++) {
        product = STATIC_PRODUCTS[i];
        addJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: product.image ? BASE_URL + product.image : undefined,
          description: product.name + ' — من منتجات ديمى لمواتير المياه.',
          brand: { '@type': 'Brand', name: 'ديمى' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'EGP',
            availability: 'https://schema.org/InStock',
            url: BASE_URL + '/product?id=' + product.id,
            itemCondition: 'https://schema.org/NewCondition'
          }
        });
      }
    }
  }

  /* ── 3. Product detail page ── */
  if (path === '/product' || path === '/product.html') {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    if (id && typeof STATIC_PRODUCTS !== 'undefined') {
      var prod = null;
      for (var j = 0; j < STATIC_PRODUCTS.length; j++) {
        if (STATIC_PRODUCTS[j].id == id) {
          prod = STATIC_PRODUCTS[j];
          break;
        }
      }
      if (prod) {
        addJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: prod.name,
          image: prod.image ? BASE_URL + prod.image : undefined,
          description: prod.name + ' — من منتجات ديمى لمواتير المياه.',
          brand: { '@type': 'Brand', name: 'ديمى' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'EGP',
            availability: 'https://schema.org/InStock',
            url: BASE_URL + '/product?id=' + prod.id,
            itemCondition: 'https://schema.org/NewCondition'
          }
        });
      }
    }
  }
})();
