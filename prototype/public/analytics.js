/* ════════════════════════════════════════
   ديمى — Privacy-Focused Analytics
   Lightweight page-view & event tracking.
   Configurable via window.ANALYTICS_CONFIG.
   ════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Configuration ── */
  var config = window.ANALYTICS_CONFIG || {};
  var ENDPOINT = config.endpoint || '';
  var DOMAIN   = config.domain   || window.location.hostname;
  var SITE_ID  = config.siteId   || 'demy';

  /* If no endpoint configured, stub out tracking entirely */
  var enabled = ENDPOINT.length > 0;

  /**
   * Send an analytics event to the configured endpoint.
   * Uses navigator.sendBeacon when available (fallback to fetch).
   */
  function track(name, props) {
    if (!enabled) return;

    var payload = JSON.stringify({
      site_id: SITE_ID,
      event:   name,
      url:     window.location.href,
      path:    window.location.pathname,
      domain:  DOMAIN,
      props:   props || {},
      ts:      new Date().toISOString()
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(ENDPOINT, {
        method:  'POST',
        body:    payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(function () { /* silently ignore */ });
    }
  }

  /* ── Track page view on load ── */
  track('pageview');

  /* ── Clicks: WhatsApp ── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"]');
    if (el) {
      track('WhatsApp Click', { href: el.getAttribute('href') });
    }
  });

  /* ── Clicks: Phone ── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a[href^="tel:"]');
    if (el) {
      track('Phone Click', { number: el.getAttribute('href').replace('tel:', '') });
    }
  });

  /* ── Clicks: Email ── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a[href^="mailto:"]');
    if (el) {
      track('Email Click', { to: el.getAttribute('href').replace('mailto:', '') });
    }
  });

  /* ── Expose public API so other scripts can fire custom events ── */
  window.trackEvent = track;
})();
