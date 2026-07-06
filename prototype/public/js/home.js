/* ════════════════════════════════════════
   ديمى — Home page JS
   Floating geometric particles + Slide deck
   ════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Grid pattern is rendered via CSS (.hero::after) ── */

  /* ── Subtle grid parallax on mouse move ── */
  var heroEl = document.querySelector('.hero');
  if (heroEl && window.matchMedia('(pointer: fine)').matches) {
    heroEl.addEventListener('mousemove', function (e) {
      var x = ((e.clientX / window.innerWidth) - 0.5) * 10;
      var y = ((e.clientY / window.innerHeight) - 0.5) * 10;
      heroEl.style.setProperty('--grid-x', x + 'px');
      heroEl.style.setProperty('--grid-y', y + 'px');
    });
  }

  /* ── Slide deck ── */
  var track = document.getElementById('deck-track');
  var dotsContainer = document.getElementById('deck-dots');
  if (!track) return;

  var currentSlide = 0;
  var slides = [];
  var dotEls = [];

  function goTo(index) {
    for (var s = 0; s < slides.length; s++) slides[s].classList.remove('active');
    for (var d = 0; d < dotEls.length; d++) dotEls[d].classList.remove('active');
    if (slides.length === 0) return;
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dotEls[currentSlide].classList.add('active');
  }

  function buildSlide(product, idx) {
    var specsHtml = '';
    var keys = Object.keys(product.specs);
    for (var k = 0; k < keys.length; k++) {
      specsHtml += '<li>' + keys[k] + ': ' + product.specs[keys[k]] + '</li>';
    }

    var slide = document.createElement('div');
    slide.className = 'deck__slide' + (idx === 0 ? ' active' : '');

    var inner = document.createElement('div');
    inner.className = 'deck__slide-inner';

    var img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.className = 'deck__slide-img';
    img.loading = 'lazy';
    img.onerror = function() {
      var parent = this.parentElement;
      if (parent) {
        var fallback = document.createElement('div');
        fallback.style.cssText = 'display:flex;align-items:center;justify-content:center;background:var(--color-bg-alt);min-height:280px;color:var(--color-text-muted);font-size:0.9rem;';
        fallback.textContent = product.name;
        parent.replaceChild(fallback, this);
      }
    };

    var body = document.createElement('div');
    body.className = 'deck__slide-body';
    body.innerHTML =
      '<span class="badge">' + (idx === 0 ? 'الأكثر طلباً' : 'منتج مختار') + '</span>' +
      '<h3>' + product.name + '</h3>' +
      '<ul class="specs">' + specsHtml + '</ul>' +
      '<a href="https://wa.me/201016892956?text=' + encodeURIComponent('أهلاً، أستفسر عن سعر ' + product.name) + '" target="_blank" class="btn btn--primary btn--sm" style="margin-top:0.5rem;align-self:flex-start;">' +
        '<i class="fab fa-whatsapp"></i> استعلم عن السعر' +
      '</a>';

    inner.appendChild(img);
    inner.appendChild(body);
    slide.appendChild(inner);
    track.appendChild(slide);
    slides.push(slide);

    var dot = document.createElement('button');
    dot.className = 'deck__dot' + (idx === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'المنتج ' + (idx + 1));
    dot.dataset.index = idx;
    dotsContainer.appendChild(dot);
    dotEls.push(dot);

    dot.addEventListener('click', function() { goTo(parseInt(this.dataset.index)); });
  }

  /* Fetch featured from API */
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/products?featured=1', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      var featured = JSON.parse(xhr.responseText);
      if (featured.length > 0) {
        for (var i = 0; i < featured.length; i++) buildSlide(featured[i], i);
      }
    }
  };
  xhr.send();

  var prevBtn = document.querySelector('.deck__btn--prev');
  var nextBtn = document.querySelector('.deck__btn--next');
  if (prevBtn) prevBtn.addEventListener('click', function() { goTo(currentSlide - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goTo(currentSlide + 1); });

  /* No auto-advance — user controls the deck */

  /* ═══ Product Quiz ═══ */
  (function() {
    var quizProducts = [];
    var quizStep = 1;
    var quizAnswers = {};

    var questionEl = document.getElementById('quiz-question');
    var optionsEl = document.getElementById('quiz-options');
    var resultEl = document.getElementById('quiz-result');

    if (!questionEl) return;

    fetch('/api/products').then(function(r) { return r.json(); }).then(function(data) {
      quizProducts = data;
      renderQuiz();
    }).catch(function() {});

    // ⚠️ KEEP IN SYNC with the OTHER quiz profile in dashboard/src/pages/Quiz.jsx
    var PROFILES = {
      'ماتور ديمى 9000 واحد حصان':     { usage: 'home', type: 'surface', power: 'medium' },
      'ماتور ديمى 300':                { usage: 'home', type: 'surface', power: 'small' },
      'ماتور نصف حصان':                { usage: 'home', type: 'surface', power: 'small' },
      'ماتور شمامة ٢ حصان':            { usage: 'both', type: 'surface', power: 'large' },
      'ماتور مدفع ١.٥ حصان':          { usage: 'farm', type: 'surface', power: 'medium' },
      'ماتور مدفع ٣ حصان ٢ ريشة':      { usage: 'farm', type: 'surface', power: 'large' },
      'موتور زراعى ٢ حصان':            { usage: 'farm', type: 'surface', power: 'large' },
      'ماتور ١ حصان فارغة استانلس':    { usage: 'home', type: 'surface', power: 'medium' },
      'غاطس ديمى ١ حصان':             { usage: 'home', type: 'submersible', power: 'medium' },
      'غاطس ١.٥ حصان شارب':           { usage: 'both', type: 'submersible', power: 'medium' },
      'غاطس شارب ٢ حصان بمفرمة':       { usage: 'farm', type: 'submersible', power: 'large' },
      'فلوماك ديمى ٩٠٠٠':             { usage: 'both', type: 'flomax', power: 'medium' },
      'فلوماك ديمى ٩٥٠٠ ديجيتال':     { usage: 'both', type: 'flomax', power: 'medium' },
      'بالونة مدورة ٢٤ لتر':           { usage: 'both', type: 'spare', power: 'small' },
      'ماتور حركة ٥.٥ حصان سريع':     { usage: 'both', type: 'surface', power: 'large' },
      'ماتور حركة سريع + بطئ':         { usage: 'both', type: 'surface', power: 'medium' },
    };

    /* Deduce power from building type */
    function deducePower(building) {
      var map = {
        'apartment': 'small',
        'villa': 'medium',
        'building-3': 'medium',
        'building-5': 'large',
        'farm-building': 'large',
      };
      return map[building] || 'medium';
    }

    var QUESTIONS = [
      {
        q: 'الماتور هتستخدمه في إيه؟',
        key: 'usage',
        options: [
          { value: 'home', label: '🏠 منزلي (شقة / فيلا / عمارة)' },
          { value: 'farm', label: '🌾 زراعي (أرض / مزرعة / بئر)' },
          { value: 'both', label: '🏭 الاتنين مع بعض' },
        ]
      },
      {
        q: 'الماتور هيركب فين؟',
        key: 'type',
        options: [
          { value: 'surface', label: '🔧 فوق الأرض — يركب جنب الخزان أو على السطح' },
          { value: 'submersible', label: '💧 جوه البئر — غاطس للآبار العميقة' },
          { value: 'notsure', label: '❓ مش متأكد — أنا لسه ببحث' },
        ]
      },
      {
        q: 'المبنى اللي هيركب فيه كده إيه؟',
        key: 'building',
        options: [
          { value: 'apartment', label: '🏢 شقة — دور واحد أو فيلا صغيرة' },
          { value: 'villa', label: '🏡 فيلا — دورين أو ثلاثة' },
          { value: 'building-3', label: '🏗️ عمارة — ٣ أو ٤ أدوار' },
          { value: 'building-5', label: '🏘️ عمارة كبيرة — ٥ أدوار أو أكثر' },
          { value: 'farm-building', label: '🌿 أرض زراعية — ري ورش' },
        ]
      },
      {
        q: 'المياه جاية منين؟',
        key: 'source',
        options: [
          { value: 'ground', label: '🫧 خزان أرضى — الموتور بيشفط من تحت' },
          { value: 'roof', label: '💧 خزان علوى — الموتور بيرفع من فوق' },
          { value: 'well', label: '🌊 بئر — مياه جوفية عميقة' },
          { value: 'city', label: '🚰 مياه مدينة — توصيلة مباشرة' },
        ]
      },
    ];

    function renderQuiz() {
      if (quizStep <= 4) {
        var q = QUESTIONS[quizStep - 1];
        questionEl.textContent = q.q;
        optionsEl.innerHTML = '';
        for (var i = 0; i < q.options.length; i++) {
          var btn = document.createElement('button');
          btn.className = 'quiz__option';
          btn.textContent = q.options[i].label;
          btn.onclick = (function(val) { return function() { handleQuizAnswer(val); }; })(q.options[i].value);
          optionsEl.appendChild(btn);
        }
        resultEl.style.display = 'none';
        questionEl.style.display = '';
        optionsEl.style.display = '';
      } else {
        showQuizResult();
      }
    }

    function handleQuizAnswer(value) {
      var key = QUESTIONS[quizStep - 1].key;
      quizAnswers[key] = value;
      quizStep++;
      if (quizStep <= 4) {
        renderQuiz();
      } else {
        showQuizResult();
      }
    }

    function showQuizResult() {
      questionEl.style.display = 'none';
      optionsEl.style.display = 'none';

      var deducedPower = deducePower(quizAnswers.building || '');
      var scored = [];
      for (var i = 0; i < quizProducts.length; i++) {
        var p = quizProducts[i];
        var profile = PROFILES[p.name];
        if (!profile) { scored.push({ product: p, score: 0 }); continue; }
        var score = 0;
        // Usage match (most important)
        if (profile.usage === quizAnswers.usage || profile.usage === 'both') score += 4;
        // Type match
        if (profile.type === quizAnswers.type) score += 3;
        if (quizAnswers.type === 'notsure') score += 1; // neutral
        // Power deduced from building
        if (profile.power === deducedPower) score += 3;
        // Source bonus
        if (profile.type === 'submersible' && quizAnswers.source === 'well') score += 2;
        if (profile.type === 'surface' && (quizAnswers.source === 'ground' || quizAnswers.source === 'roof')) score += 1;
        // Farm products score higher for farm use
        if (quizAnswers.usage === 'farm' && (profile.power === 'large')) score += 1;
        scored.push({ product: p, score: score });
      }
      scored.sort(function(a, b) { return b.score - a.score; });
      var best = scored[0];

      var html = '';
      if (best && best.score > 0) {
        var specsHtml = '';
        if (best.product.specs) {
          var keys = Object.keys(best.product.specs);
          for (var s = 0; s < keys.length; s++) {
            specsHtml += '<div class="quiz__result-spec"><span>' + keys[s] + '</span><span>' + best.product.specs[keys[s]] + '</span></div>';
          }
        }
        html += '<p style="font-weight:700;margin-bottom:1rem;">✅ بناءاً على إجاباتك، نرشح لك:</p>';
        html += '<div class="quiz__result-card">';
        html += '  <div class="quiz__result-name">' + best.product.name + '</div>';
        html += '  <span style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:0.5rem;">' + best.product.category + '</span>';
        html += specsHtml;
        html += '</div>';
        html += '<a href="https://wa.me/201016892956?text=' + encodeURIComponent('أهلاً، أستفسر عن سعر ' + best.product.name) + '" target="_blank" class="btn btn--primary" style="padding:0.75rem 1.5rem;font-size:0.95rem;">💬 استفسر عن السعر عبر واتساب</a>';

        // Alternatives
        var alts = [];
        for (var a = 0; a < scored.length && alts.length < 3; a++) {
          if (scored[a].score > 0 && scored[a].product.name !== best.product.name) alts.push(scored[a].product);
        }
        if (alts.length > 0) {
          html += '<div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border);text-align:right;">';
          html += '<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;">بدائل أخرى:</p>';
          for (var al = 0; al < alts.length; al++) {
            html += '<div class="quiz__alt">' + alts[al].name + ' <span style="float:left;color:var(--text-muted);">' + alts[al].category + '</span></div>';
          }
          html += '</div>';
        }
      } else {
        html += '<p>عذراً، لم نتمكن من إيجاد منتج مناسب. جرب إجابات مختلفة.</p>';
      }

      html += '<button class="quiz__reset" onclick="resetQuiz()">🔄 ابدأ من جديد</button>';
      resultEl.innerHTML = html;
      resultEl.style.display = '';
    }

    window.resetQuiz = function() {
      quizStep = 1;
      quizAnswers = {};
      resultEl.innerHTML = '';
      resultEl.style.display = 'none';
      renderQuiz();
    };
  })();

})();
