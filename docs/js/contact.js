/* ════════════════════════════════════════
   ديمى — Contact page JS
   Form handler + FAQ accordion
   ════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Inquiry form → WhatsApp ── */
  const form = document.getElementById('inquiry-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      const name = document.getElementById('form-name').value.trim();
      const product = document.getElementById('form-product').value;
      const message = document.getElementById('form-msg').value.trim();

      let text = `أهلاً ديمى، أنا ${name}`;
      if (product) text += `، عندي استفسار عن ${product}`;
      if (message) text += `: ${message}`;

      const waUrl = `https://wa.me/201016892956?text=${encodeURIComponent(text)}`;
      // Set the form action dynamically
      form.action = waUrl;
      // Let the form submit normally (opens WhatsApp in new tab)
    });
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq__item');
      const isActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq__item').forEach(el => el.classList.remove('active'));

      // Open clicked if it wasn't open
      if (!isActive) item.classList.add('active');
    });
  });

})();
