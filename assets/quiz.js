/* ==========================================================================
   Nutrava — Adaptive Quiz Engine
   Dynamic branching quiz with confidence-based termination
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Quiz Decision Tree ---------- */
  var CONFIDENCE_THRESHOLD = 10;
  var MAX_QUESTIONS = 10;

  /* ---------- Product Database Lookup ---------- */
  var productDB = {};
  var productDBLoaded = false;
  // Load products.json to get real images/prices
  // Returns a promise so loadQuizConfig can wait for it
  var productDBPromise = (function loadProducts() {
    var script = document.querySelector('script[src*="quiz.js"]');
    var base = script ? script.src.replace(/assets\/quiz\.js.*/, '') : '';
    var prodController = new AbortController();
    setTimeout(function() { prodController.abort(); }, 15000);
    return fetch(base + 'assets/products.json', { signal: prodController.signal })
      .then(function(r) { if (!r.ok) throw new Error('Products fetch failed'); return r.json(); })
      .then(function(data) {
        var list = data.products || data;
        list.forEach(function(p) { productDB[p.handle] = p; });
        productDBLoaded = true;
      })
      .catch(function() { productDBLoaded = true; /* products.json not available, use fallback data */ });
  })();

  var quizCurrencySymbol = '$';

  function getProductImage(handle) {
    var p = productDB[handle];
    return p ? p.image : null;
  }

  function getProductPrice(handle, fallback) {
    var p = productDB[handle];
    if (p) return quizCurrencySymbol + (p.price / 100).toFixed(2);
    return fallback;
  }

  function getProductPricePence(handle) {
    var p = productDB[handle];
    return p ? p.price : 0;
  }

  /* ---------- Category Insights ---------- */
  var categoryInsights = {
    acne: { label: 'Acne & Blemishes', icon: 'droplet' },
    'anti-aging': { label: 'Anti-Aging', icon: 'sparkles' },
    hydration: { label: 'Hydration', icon: 'glass-water' },
    brightening: { label: 'Brightening', icon: 'sun' },
    sensitive: { label: 'Sensitive Skin', icon: 'feather' }
  };

  var goalEncouragements = {
    acne: "Let\u2019s build you a clear-skin routine",
    'anti-aging': "Let\u2019s build your age-defying routine",
    hydration: "Let\u2019s quench that dehydrated skin",
    brightening: "Let\u2019s brighten things up",
    sensitive: "Let\u2019s find formulas your skin actually loves"
  };

  var crossCategoryInsights = {
    'acne+hydration': 'oily or blemish-prone skin is often dehydrated underneath. Your routine balances both.',
    'acne+sensitive': 'breakouts on reactive skin need gentle-but-effective actives. This routine skips the sting.',
    'acne+brightening': 'blemishes now, dark spots after. This routine clears and evens tone at the same time.',
    'acne+anti-aging': 'adult breakouts plus early aging is common. This routine handles both without harsh actives.',
    'anti-aging+hydration': 'dehydration makes fine lines look worse than they are. Hydrate first, then anti-age.',
    'anti-aging+brightening': 'smoother skin and even tone go together. This routine targets both.',
    'anti-aging+sensitive': 'anti-aging for reactive skin means gentle retinol and peptides. This routine is built for that.',
    'hydration+brightening': 'hydrated skin reflects light better \u2014 that\u2019s half of brightness. This routine delivers both.',
    'hydration+sensitive': 'sensitive skin is often a compromised moisture barrier. Hydrate to heal.',
    'brightening+sensitive': 'brightening on reactive skin needs mushroom actives, not kojic acid. Your routine is tailored for that.'
  };

  function getCrossInsight(cat1, cat2) {
    var key1 = cat1 + '+' + cat2;
    var key2 = cat2 + '+' + cat1;
    return crossCategoryInsights[key1] || crossCategoryInsights[key2] ||
      categoryInsights[cat1].label.toLowerCase() + ' is your top priority. This routine is tailored to get you there.';
  }

  /* ---------- Social Proof Testimonials (empty until real reviews collected) ---------- */
  var testimonials = {
    acne: [],
    'anti-aging': [],
    hydration: [],
    brightening: [],
    sensitive: []
  };

  /* ---------- Quiz Tree ---------- */
  var quizTree = {
    /* ===== Q1: Skin Type ===== */
    start: {
      question: "What\u2019s your skin type?",
      subtitle: "This is the biggest signal for what your skin actually needs",
      options: [
        { text: "Oily \u2014 shine, large pores, breakouts", icon: "droplet", scores: { acne: 2, hydration: 1 }, next: "concern" },
        { text: "Dry \u2014 tight, flaky, rough patches", icon: "wind", scores: { hydration: 3 }, next: "concern" },
        { text: "Combination \u2014 oily T-zone, dry cheeks", icon: "split", scores: { hydration: 1, acne: 1 }, next: "concern" },
        { text: "Sensitive \u2014 redness, easily irritated", icon: "feather", scores: { sensitive: 4 }, next: "concern" },
        { text: "Normal / I\u2019m not sure", icon: "help-circle", scores: {}, next: "concern" }
      ]
    },

    /* ===== Q2: Top Concern (goal selector) ===== */
    concern: {
      question: "What\u2019s your top skin concern right now?",
      subtitle: "Pick the one that bothers you most \u2014 your routine will focus here",
      isGoalQuestion: true,
      options: [
        { text: "Breakouts & blemishes", icon: "circle-dot", scores: { acne: 5 }, next: "acne_freq", goalKey: "acne" },
        { text: "Fine lines & loss of firmness", icon: "activity", scores: { 'anti-aging': 5 }, next: "aging_focus", goalKey: "anti-aging" },
        { text: "Dehydration & dullness", icon: "glass-water", scores: { hydration: 5 }, next: "hydration_feel", goalKey: "hydration" },
        { text: "Dark spots & uneven tone", icon: "sun", scores: { brightening: 5 }, next: "brightening_focus", goalKey: "brightening" },
        { text: "Redness & reactivity", icon: "feather", scores: { sensitive: 5 }, next: "sensitive_trigger", goalKey: "sensitive" }
      ]
    },

    /* ===== Q3 branches ===== */
    acne_freq: {
      question: "How often do you break out?",
      subtitle: "Frequency helps us match the right strength of treatment",
      options: [
        { text: "Daily \u2014 constant active breakouts", icon: "zap", scores: { acne: 3 }, productBoosts: { "blemish-care-moisturiser": 3, "blemish-purifying-face-wash": 2 }, next: "routine" },
        { text: "Weekly \u2014 regular flare-ups", icon: "calendar", scores: { acne: 2 }, productBoosts: { "blemish-purifying-face-wash": 2 }, next: "routine" },
        { text: "Hormonal \u2014 monthly cycle", icon: "moon", scores: { acne: 1, sensitive: 1 }, productBoosts: { "niacinamide-gel-moisturiser": 2 }, next: "routine" },
        { text: "Rarely \u2014 but I want clearer skin", icon: "sparkles", scores: { acne: 1 }, next: "routine" }
      ]
    },
    aging_focus: {
      question: "What\u2019s your top aging concern?",
      subtitle: "We\u2019ll bias your routine toward the biggest issue",
      options: [
        { text: "Fine lines around eyes & mouth", icon: "minus", scores: { 'anti-aging': 2 }, productBoosts: { "smoothing-eye-cream": 3, "retinol-alternative-moisturiser": 2 }, next: "routine" },
        { text: "Loss of firmness & bounce", icon: "activity", scores: { 'anti-aging': 3 }, productBoosts: { "peptide-anti-aging-serum": 3, "smoothing-eye-cream": 2 }, next: "routine" },
        { text: "Dullness & tired-looking skin", icon: "sun", scores: { 'anti-aging': 1, brightening: 2 }, productBoosts: { "vitamin-c-serum": 2 }, next: "routine" },
        { text: "All of the above", icon: "layers", scores: { 'anti-aging': 3 }, productBoosts: { "retinol-alternative-moisturiser": 2, "peptide-anti-aging-serum": 2 }, next: "routine" }
      ]
    },
    hydration_feel: {
      question: "How does your skin feel most of the time?",
      subtitle: "Different dryness signals point to different fixes",
      options: [
        { text: "Tight right after cleansing", icon: "alert-triangle", scores: { hydration: 2 }, productBoosts: { "moisturising-day-cream": 3, "micellar-cleansing-water": 1 }, next: "routine" },
        { text: "Dry & flaky by midday", icon: "wind", scores: { hydration: 3 }, productBoosts: { "moisturising-day-cream": 3 }, next: "routine" },
        { text: "Dehydrated \u2014 dull and parched", icon: "droplet", scores: { hydration: 2, brightening: 1 }, productBoosts: { "moisturising-day-cream": 2, "vitamin-c-serum": 1 }, next: "routine" },
        { text: "Fine lines appear when dehydrated", icon: "minus", scores: { hydration: 2, 'anti-aging': 1 }, productBoosts: { "moisturising-day-cream": 2, "smoothing-eye-cream": 1 }, next: "routine" }
      ]
    },
    brightening_focus: {
      question: "What\u2019s your main tone concern?",
      subtitle: "Different causes of uneven tone respond to different actives",
      options: [
        { text: "Post-acne marks & scarring", icon: "circle-dot", scores: { brightening: 2, acne: 1 }, productBoosts: { "vitamin-c-serum": 2, "targeted-dark-spot-care": 2 }, next: "routine" },
        { text: "Sun damage & age spots", icon: "sun", scores: { brightening: 3 }, productBoosts: { "vitamin-c-serum": 3, "targeted-dark-spot-care": 3 }, next: "routine" },
        { text: "Overall dullness", icon: "sparkles", scores: { brightening: 2 }, productBoosts: { "brightening-exfoliator": 3, "vitamin-c-serum": 2 }, next: "routine" },
        { text: "Uneven tone + sensitivity", icon: "feather", scores: { brightening: 2, sensitive: 2 }, productBoosts: { "sensitive-skin-moisturiser": 3, "vitamin-c-serum": 1 }, next: "routine" }
      ]
    },
    sensitive_trigger: {
      question: "What tends to trigger your skin?",
      subtitle: "Identifying the trigger helps us avoid it in your routine",
      options: [
        { text: "New products & ingredients", icon: "package", scores: { sensitive: 2 }, productBoosts: { "sensitive-skin-moisturiser": 2, "micellar-cleansing-water": 1 }, next: "routine" },
        { text: "Hot water, sun, weather", icon: "thermometer", scores: { sensitive: 2 }, productBoosts: { "sensitive-skin-moisturiser": 2 }, next: "routine" },
        { text: "Stress", icon: "zap", scores: { sensitive: 1, hydration: 1 }, productBoosts: { "moisturising-day-cream": 1, "sensitive-skin-moisturiser": 1 }, next: "routine" },
        { text: "Not sure \u2014 feels like everything", icon: "help-circle", scores: { sensitive: 3 }, productBoosts: { "sensitive-skin-moisturiser": 3, "micellar-cleansing-water": 2 }, next: "routine" }
      ]
    },

    /* ===== Q4: Current routine ===== */
    routine: {
      question: "What does your current routine look like?",
      subtitle: "We\u2019ll meet you where you are",
      options: [
        { text: "Nothing special \u2014 soap and water", icon: "droplet", scores: {}, next: "sun_care" },
        { text: "Basic \u2014 cleanser + moisturiser", icon: "layers", scores: {}, next: "sun_care" },
        { text: "I use serums and treatments", icon: "flask-conical", scores: { 'anti-aging': 1 }, next: "sun_care" },
        { text: "Full detailed routine \u2014 ready to upgrade", icon: "sparkles", scores: { 'anti-aging': 1, brightening: 1 }, next: "sun_care" }
      ]
    },

    /* ===== Q5: SPF ===== */
    sun_care: {
      question: "How often do you wear SPF?",
      subtitle: "This is the #1 factor in aging and uneven tone",
      options: [
        { text: "Every single day", icon: "shield-check", scores: {}, next: "bad_reaction" },
        { text: "When I\u2019m going outside", icon: "sun", scores: { brightening: 1 }, next: "bad_reaction" },
        { text: "Rarely", icon: "cloud-sun", scores: { brightening: 2, 'anti-aging': 1 }, productBoosts: { "vitamin-c-serum": 1 }, next: "bad_reaction" },
        { text: "Never", icon: "x", scores: { brightening: 2, 'anti-aging': 1 }, productBoosts: { "vitamin-c-serum": 2 }, next: "bad_reaction" }
      ]
    },

    /* ===== Q6: Sensitivity history ===== */
    bad_reaction: {
      question: "Have you ever had a bad reaction to skincare?",
      subtitle: "This tells us what to avoid for your routine",
      options: [
        { text: "Never \u2014 my skin is pretty easygoing", icon: "check", scores: {}, next: null },
        { text: "Once or twice", icon: "alert-circle", scores: { sensitive: 1 }, next: null },
        { text: "Often \u2014 I avoid strong actives", icon: "shield", scores: { sensitive: 3 }, productBoosts: { "sensitive-skin-moisturiser": 2, "retinol-alternative-serum": 1 }, next: null },
        { text: "I don\u2019t know what\u2019s safe to try", icon: "help-circle", scores: { sensitive: 2 }, next: null }
      ]
    }
  };


  /* ---------- Personalised Product Reasons ---------- */
  var productReasons = {};
  var quizConfigLoaded = false;

  /* ---------- Stack Recommendations (loaded from quiz-config.json) ---------- */
  var stackRecommendations = {};

  // Load quiz config (stacks + reasons) from external JSON
  // Wait for productDB to load first, then merge in matching products
  (function loadQuizConfig() {
    var script = document.querySelector('script[src*="quiz.js"]');
    var base = script ? script.src.replace(/assets\/quiz\.js.*/, '') : '';
    // Wait for both products.json AND quiz-config.json before processing
    var configController = new AbortController();
    setTimeout(function() { configController.abort(); }, 15000);
    Promise.all([
      productDBPromise,
      fetch(base + 'assets/quiz-config.json', { signal: configController.signal }).then(function(r) { if (!r.ok) throw new Error('Config fetch failed'); return r.json(); })
    ])
      .then(function(results) {
        var config = results[1];
        // Populate productReasons
        productReasons = config.productReasons || {};
        // Populate stackRecommendations, enriching products with name/fallbackPrice from productDB
        var stacks = config.stacks || {};
        Object.keys(stacks).forEach(function(key) {
          var stack = stacks[key];

          // Enrich curated products with data from productDB
          stack.products.forEach(function(prod) {
            var dbEntry = productDB[prod.handle];
            if (dbEntry) {
              prod.name = dbEntry.title;
              prod.fallbackPrice = '$' + (dbEntry.price / 100).toFixed(2);
            } else {
              prod.name = prod.handle;
              prod.fallbackPrice = '';
            }
          });

          // Dynamic merge: find products in productDB matching this category
          // that aren't already in the curated stack
          var curatedHandles = {};
          stack.products.forEach(function(p) { curatedHandles[p.handle] = true; });

          Object.keys(productDB).forEach(function(handle) {
            if (curatedHandles[handle]) return; // already in stack
            var dbProduct = productDB[handle];
            // Check if product's category contains this stack's key
            // e.g. category "focus energy" matches both "focus" and "energy" stacks
            var cats = (dbProduct.category || '').split(' ');
            if (cats.indexOf(key) === -1) return; // doesn't match this stack
            // Append to stack products
            stack.products.push({
              handle: handle,
              name: dbProduct.title,
              benefit: dbProduct.description || 'Supports your ' + key + ' goals',
              fallbackPrice: '\u00A3' + (dbProduct.price / 100).toFixed(2)
            });
          });

          // Rebuild tiers dynamically based on total product count
          // Cap products so stacks feel curated, not overwhelming
          var MAX_COMPLETE = 4;
          var total = Math.min(stack.products.length, MAX_COMPLETE);
          stack.products = stack.products.slice(0, MAX_COMPLETE);
          var essentialCount = Math.min(2, total);
          var recommendedCount = Math.min(3, total);

          var essentialIndices = [];
          var recommendedIndices = [];
          var completeIndices = [];
          var i;
          for (i = 0; i < essentialCount; i++) essentialIndices.push(i);
          for (i = 0; i < recommendedCount; i++) recommendedIndices.push(i);
          for (i = 0; i < total; i++) completeIndices.push(i);

          stack.tiers = {
            essential:   { label: 'Essential',   tag: null,           productIndices: essentialIndices },
            recommended: { label: 'Recommended', tag: 'Most Popular', productIndices: recommendedIndices },
            complete:    { label: 'Complete',    tag: 'Best Value',   productIndices: completeIndices }
          };

          stackRecommendations[key] = stack;
        });
        quizConfigLoaded = true;
      })
      .catch(function() { quizConfigLoaded = true; /* proceed with empty config */ });
  })();

  /* ---------- Quiz Engine ---------- */
  function QuizEngine(container) {
    this.container = container;
    this.scores = { acne: 0, 'anti-aging': 0, hydration: 0, brightening: 0, sensitive: 0 };
    this.productBoosts = {};
    this.visitedNodes = {};
    this.history = [];
    this.currentNodeId = 'start';
    this.questionsAnswered = 0;

    this.selectedGoalKey = null;
    this.activityLevel = null; // 0=very active, 1=moderate, 2=light, 3=sedentary
    this.showWelcome();
  }

  QuizEngine.prototype.getTopCategory = function() {
    var entries = Object.entries(this.scores).sort(function(a, b) { return b[1] - a[1]; });
    return entries[0];
  };

  QuizEngine.prototype.getTopTwo = function() {
    var entries = Object.entries(this.scores).sort(function(a, b) { return b[1] - a[1]; });
    return [entries[0], entries[1]];
  };

  QuizEngine.prototype.getPersonalisedReason = function(handle) {
    var reasons = productReasons[handle];
    if (reasons) {
      var history = this.history;
      for (var i = 0; i < reasons.length; i++) {
        var r = reasons[i];
        if (r.nodeId === null) return r.reason; // fallback
        var match = history.find(function(h) { return h.nodeId === r.nodeId && h.optionIndex === r.optionIndex; });
        if (match) return r.reason;
      }
    }
    // Fallback: use product description from productDB for new/uncurated products
    var dbEntry = productDB[handle];
    if (dbEntry && dbEntry.description) return dbEntry.description;
    return null;
  };

  QuizEngine.prototype.shouldTerminate = function() {
    var topScore = this.getTopCategory()[1];
    var currentNode = quizTree[this.currentNodeId];
    var noMoreQuestions = !currentNode;
    return topScore >= CONFIDENCE_THRESHOLD || this.questionsAnswered >= MAX_QUESTIONS || noMoreQuestions;
  };

  QuizEngine.prototype.getEstimatedProgress = function() {
    var topScore = this.getTopCategory()[1];
    var progressByConfidence = Math.min(topScore / CONFIDENCE_THRESHOLD, 1);
    var progressByQuestions = this.questionsAnswered / MAX_QUESTIONS;
    return Math.max(progressByConfidence, progressByQuestions);
  };

  // Resolve the next node ID from an option's next field
  // Supports: string ("focus_3"), object map ({0: "focus_3", 1: "focus_2b"}), or null
  QuizEngine.prototype.resolveNext = function(nextVal, optionIndex) {
    if (nextVal === null || nextVal === undefined) return null;
    if (typeof nextVal === 'string') return nextVal;
    if (typeof nextVal === 'object') {
      return nextVal[optionIndex] !== undefined ? nextVal[optionIndex] : nextVal['default'] || null;
    }
    return null;
  };

  QuizEngine.prototype.selectAnswer = function(optionIndex) {
    var node = quizTree[this.currentNodeId];
    var option = node.options[optionIndex];
    var self = this;

    this.history.push({
      nodeId: this.currentNodeId,
      optionIndex: optionIndex,
      scores: Object.assign({}, this.scores),
      productBoosts: Object.assign({}, this.productBoosts)
    });

    // Track visited nodes for smart skip logic
    this.visitedNodes[this.currentNodeId] = optionIndex;

    Object.entries(option.scores).forEach(function(entry) {
      self.scores[entry[0]] = (self.scores[entry[0]] || 0) + entry[1];
    });

    // Accumulate product boosts
    if (option.productBoosts) {
      Object.entries(option.productBoosts).forEach(function(entry) {
        self.productBoosts[entry[0]] = (self.productBoosts[entry[0]] || 0) + entry[1];
      });
    }

    this.questionsAnswered++;

    // Track activity level from intro_3
    if (this.currentNodeId === 'intro_3') {
      this.activityLevel = optionIndex;
    }

    // If this was the goal question, show encouragement
    if (node.isGoalQuestion && option.goalKey) {
      this.selectedGoalKey = option.goalKey;
      var nextNode = this.resolveNext(option.next, optionIndex);
      this.currentNodeId = nextNode;
      this.showEncouragement(option.goalKey);
      return;
    }

    var resolvedNext = this.resolveNext(option.next, optionIndex);

    // Smart skip: if resolved node has a skipIf condition, check it
    if (resolvedNext && quizTree[resolvedNext] && quizTree[resolvedNext].skipIf) {
      var skipCheck = quizTree[resolvedNext].skipIf;
      if (skipCheck.visitedNode && this.visitedNodes[skipCheck.visitedNode] !== undefined) {
        resolvedNext = skipCheck.skipTo;
      }
    }

    this.currentNodeId = resolvedNext;

    if (this.shouldTerminate()) {
      this.showAnalysing();
    } else {
      this.render();
    }
  };

  QuizEngine.prototype.goBack = function() {
    if (this.history.length === 0) return;
    var previous = this.history.pop();
    this.currentNodeId = previous.nodeId;
    this.scores = previous.scores;
    this.productBoosts = previous.productBoosts || {};
    // Remove from visitedNodes
    delete this.visitedNodes[previous.nodeId];
    this.questionsAnswered--;
    this.render();
  };

  /* ---------- Welcome Screen ---------- */
  QuizEngine.prototype.showWelcome = function() {
    var self = this;
    this.container.innerHTML =
      '<div class="quiz-screen">' +
        '<div class="quiz-welcome">' +
          '<div class="quiz-welcome__icon"><i data-lucide="sparkles"></i></div>' +
          '<h1 class="quiz-welcome__title">Let\u2019s find your perfect routine</h1>' +
          '<p class="quiz-welcome__text">Answer a few quick questions and we\u2019ll match you with a skincare routine built for your skin.</p>' +
          '<p class="quiz-welcome__time"><i data-lucide="clock"></i> Under 60 seconds</p>' +
          '<button class="btn btn--primary btn--lg quiz-welcome__cta" data-quiz-start>Start the Quiz</button>' +
          '<p class="quiz-welcome__social">Free US shipping on orders over $50 \u00B7 30-day money-back guarantee</p>' +
        '</div>' +
      '</div>';

    if (typeof lucide !== 'undefined') lucide.createIcons();

    var startBtn = this.container.querySelector('[data-quiz-start]');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        self.render();
      });
    }
  };

  /* ---------- Goal Encouragement Transition ---------- */
  QuizEngine.prototype.showEncouragement = function(goalKey) {
    var self = this;
    var message = goalEncouragements[goalKey] || "Let\u2019s personalise your routine";
    var icon = categoryInsights[goalKey] ? categoryInsights[goalKey].icon : 'sparkles';

    this.container.innerHTML =
      '<div class="quiz-screen">' +
        '<div class="quiz-progress"><div class="quiz-progress__bar" style="width: ' + (this.getEstimatedProgress() * 100) + '%"></div></div>' +
        '<div class="quiz-encouragement">' +
          '<div class="quiz-encouragement__icon"><i data-lucide="' + icon + '"></i></div>' +
          '<h2 class="quiz-encouragement__text">Great choice!</h2>' +
          '<p class="quiz-encouragement__sub">' + message + '</p>' +
        '</div>' +
      '</div>';

    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(function() {
      if (self.shouldTerminate()) {
        self.showAnalysing();
      } else {
        self.render();
      }
    }, 1500);
  };

  /* ---------- Analysing Screen (3 steps) ---------- */
  QuizEngine.prototype.showAnalysing = function() {
    var self = this;
    var steps = [
      { icon: 'user', text: 'Analysing your skin profile...' },
      { icon: 'search', text: 'Matching products to your skin...' },
      { icon: 'package', text: 'Building your personalised routine...' }
    ];

    this.container.innerHTML =
      '<div class="quiz-screen">' +
        '<div class="quiz-progress"><div class="quiz-progress__bar" style="width: 100%"></div></div>' +
        '<div class="quiz-analysing">' +
          '<div class="quiz-analysing__icon"><i data-lucide="' + steps[0].icon + '"></i></div>' +
          '<h2 class="quiz-analysing__title">' + steps[0].text + '</h2>' +
          '<div class="quiz-analysing__steps">' +
            '<div class="quiz-analysing__step is-active" data-step="0"><span class="quiz-analysing__dot"></span><span>' + steps[0].text + '</span></div>' +
            '<div class="quiz-analysing__step" data-step="1"><span class="quiz-analysing__dot"></span><span>' + steps[1].text + '</span></div>' +
            '<div class="quiz-analysing__step" data-step="2"><span class="quiz-analysing__dot"></span><span>' + steps[2].text + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Animate through steps
    setTimeout(function() {
      var step1 = self.container.querySelector('[data-step="0"]');
      var step2 = self.container.querySelector('[data-step="1"]');
      var title = self.container.querySelector('.quiz-analysing__title');
      var icon = self.container.querySelector('.quiz-analysing__icon');
      if (step1) step1.classList.add('is-done');
      if (step2) step2.classList.add('is-active');
      if (title) title.textContent = steps[1].text;
      if (icon) { icon.innerHTML = '<i data-lucide="' + steps[1].icon + '"></i>'; }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 1000);

    setTimeout(function() {
      var step2 = self.container.querySelector('[data-step="1"]');
      var step3 = self.container.querySelector('[data-step="2"]');
      var title = self.container.querySelector('.quiz-analysing__title');
      var icon = self.container.querySelector('.quiz-analysing__icon');
      if (step2) step2.classList.add('is-done');
      if (step3) step3.classList.add('is-active');
      if (title) title.textContent = steps[2].text;
      if (icon) { icon.innerHTML = '<i data-lucide="' + steps[2].icon + '"></i>'; }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 2000);

    setTimeout(function() {
      self.showEmailGate();
    }, 3200);
  };

  /* ---------- Email Gate (blocks results until email captured) ---------- */
  QuizEngine.prototype.showEmailGate = function() {
    var self = this;
    // If email already captured this session, skip the gate
    if (sessionStorage.getItem('nutrava_quiz_email')) {
      this.showResults();
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'quiz-email-overlay';
    overlay.innerHTML =
      '<div class="quiz-email-modal">' +
        '<div class="quiz-email-modal__icon"><i data-lucide="lock"></i></div>' +
        '<h2 class="quiz-email-modal__title">Your routine is ready!</h2>' +
        '<p class="quiz-email-modal__text">Enter your email to unlock your personalised skincare routine.</p>' +
        '<form class="quiz-email-modal__form" data-email-form>' +
          '<input type="email" class="quiz-email-modal__input" placeholder="your@email.com" required autocomplete="email" data-email-input />' +
          '<button type="submit" class="btn btn--primary btn--lg quiz-email-modal__btn">See My Routine</button>' +
        '</form>' +
        '<p class="quiz-email-modal__disclaimer">We\u2019ll send you a copy of your results. No spam, unsubscribe anytime.</p>' +
      '</div>';
    document.body.appendChild(overlay);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    var input = overlay.querySelector('[data-email-input]');
    setTimeout(function() { if (input) input.focus(); }, 200);

    var form = overlay.querySelector('[data-email-form]');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = input ? input.value.trim() : '';
        if (!email) return;

        sessionStorage.setItem('nutrava_quiz_email', email);

        // Analytics
        if (typeof gtag === 'function') gtag('event', 'quiz_email_submit', { method: 'email_gate' });
        if (typeof fbq === 'function') fbq('track', 'Lead');
        // Klaviyo identify if available
        if (typeof klaviyo !== 'undefined' && klaviyo.push) {
          try { klaviyo.push(['identify', { '$email': email }]); } catch (err) {}
        }

        // Optional: POST to Shopify customer form if NutravaCart-style integration exists
        try { self.submitQuizEmail(email); } catch (err) {}

        overlay.classList.add('quiz-email-overlay--closing');
        setTimeout(function() {
          overlay.remove();
          self.showResults();
        }, 400);
      });
    }
  };

  /* ---------- Submit email to Shopify customer endpoint (best-effort) ---------- */
  QuizEngine.prototype.submitQuizEmail = function(email) {
    // Use the standard Shopify customer create-from-form endpoint where available.
    // Fails silently in preview where /contact is not a real endpoint.
    try {
      fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'form_type=customer&utf8=\u2713&customer[email]=' + encodeURIComponent(email) +
              '&customer[tags]=quiz-lead&customer[accepts_marketing]=true'
      }).catch(function() { /* ignore */ });
    } catch (e) { /* ignore */ }
  };

  /* ---------- Question Renderer ---------- */
  QuizEngine.prototype.render = function() {
    var self = this;
    var node = quizTree[this.currentNodeId];
    if (!node) {
      this.showAnalysing();
      return;
    }

    // Smart skip: if this node should be skipped based on previously visited nodes
    if (node.skipIf && node.skipIf.visitedNode && this.visitedNodes[node.skipIf.visitedNode] !== undefined) {
      this.currentNodeId = node.skipIf.skipTo;
      this.render();
      return;
    }

    var progress = this.getEstimatedProgress();
    // +1 for name question which isn't in questionsAnswered
    var stepNum = this.questionsAnswered + 2;

    this.container.innerHTML =
      '<div class="quiz-screen">' +
        '<div class="quiz-progress"><div class="quiz-progress__bar" style="width: ' + (progress * 100) + '%"></div></div>' +
        '<div class="quiz-screen__inner">' +
          '<div class="quiz-screen__header">' +
            (this.history.length > 0
              ? '<button class="quiz-back" data-quiz-back>&larr; Back</button>'
              : '<span></span>') +
            '<span class="quiz-step">' + stepNum + '</span>' +
          '</div>' +
          '<h2 class="quiz-question">' + node.question + '</h2>' +
          (node.subtitle ? '<p class="quiz-subtitle">' + node.subtitle + '</p>' : '') +
          '<div class="quiz-options">' +
            node.options.map(function(opt, i) {
              return '<button class="quiz-option" data-quiz-option="' + i + '">' +
                '<span class="quiz-option__icon"><i data-lucide="' + opt.icon + '"></i></span>' +
                '<span class="quiz-option__text">' + opt.text + '</span>' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    if (typeof lucide !== 'undefined') lucide.createIcons();

    this.container.querySelectorAll('[data-quiz-option]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        btn.classList.add('quiz-option--selected');
        setTimeout(function() {
          self.selectAnswer(parseInt(btn.dataset.quizOption, 10));
        }, 300);
      });
    });

    var backBtn = this.container.querySelector('[data-quiz-back]');
    if (backBtn) {
      backBtn.addEventListener('click', function() { self.goBack(); });
    }
  };

  /* ---------- Tier Helpers ---------- */
  QuizEngine.prototype.getProductPrice = function(product) {
    return getProductPrice(product.handle, product.fallbackPrice);
  };

  QuizEngine.prototype.getProductPricePence = function(product) {
    var pence = getProductPricePence(product.handle);
    if (pence > 0) return pence;
    // Parse fallback price
    var num = parseFloat(product.fallbackPrice.replace(/[^0-9.]/g, ''));
    return Math.round(num * 100);
  };

  QuizEngine.prototype.getTierPricePence = function(stack, tierKey) {
    var self = this;
    var tier = stack.tiers[tierKey];
    return tier.productIndices.reduce(function(sum, i) {
      return sum + self.getProductPricePence(stack.products[i]);
    }, 0);
  };

  QuizEngine.prototype.formatPrice = function(pence) {
    return quizCurrencySymbol + (pence / 100).toFixed(2);
  };

  QuizEngine.prototype.renderProductImage = function(product) {
    var img = getProductImage(product.handle);
    if (img) {
      return '<img src="' + img + '" alt="' + product.name + '" class="quiz-individual__img" loading="lazy">';
    }
    return '<svg width="32" height="44" viewBox="0 0 32 44" fill="none"><rect width="32" height="44" rx="6" fill="rgba(194,212,181,0.3)"/></svg>';
  };

  QuizEngine.prototype.renderTierCard = function(stack, tierKey, isRecommended) {
    var tier = stack.tiers[tierKey];
    var self = this;
    var products = tier.productIndices.map(function(i) { return stack.products[i]; });
    var pricePence = this.getTierPricePence(stack, tierKey);

    return '<div class="quiz-tier ' + (isRecommended ? 'quiz-tier--recommended' : '') + '">' +
      (tier.tag ? '<span class="quiz-tier__badge">' + tier.tag + '</span>' : '') +
      '<h3 class="quiz-tier__name">' + tier.label + '</h3>' +
      '<div class="quiz-tier__price">' +
        '<span class="quiz-tier__amount">' + this.formatPrice(pricePence) + '</span>' +
        '<span class="quiz-tier__count">' + products.length + ' products</span>' +
      '</div>' +
      '<ul class="quiz-tier__products">' +
        products.map(function(p) {
          var reason = self.getPersonalisedReason(p.handle);
          return '<li class="quiz-tier__product">' +
            '<div class="quiz-tier__product-main">' +
              '<i data-lucide="check" class="quiz-tier__check"></i>' +
              '<span>' + p.name + '</span>' +
            '</div>' +
            '<div class="quiz-tier__product-benefit">' + p.benefit + '</div>' +
            (reason ? '<div class="quiz-tier__product-reason">\u21B3 ' + reason + '</div>' : '') +
          '</li>';
        }).join('') +
      '</ul>' +
      '<button class="btn ' + (isRecommended ? 'btn--primary' : 'btn--outline') + ' quiz-tier__cta" data-tier-add="' + tierKey + '">Add to Cart</button>' +
    '</div>';
  };

  /* ---------- Stats & Reasoning ---------- */
  /* ---------- Radar Chart Helpers ---------- */
  var RADAR_CATEGORIES = [
    { key: 'acne', label: 'Acne', icon: 'droplet' },
    { key: 'anti-aging', label: 'Anti-Aging', icon: 'sparkles' },
    { key: 'hydration', label: 'Hydration', icon: 'glass-water' },
    { key: 'brightening', label: 'Brightening', icon: 'sun' },
    { key: 'sensitive', label: 'Sensitive', icon: 'feather' }
  ];

  function radarPoint(cx, cy, radius, angleDeg) {
    var rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function radarPolygonPoints(cx, cy, radius, scores, maxScore) {
    return RADAR_CATEGORIES.map(function(cat, i) {
      var angle = i * 72;
      var pct = Math.max((scores[cat.key] || 0) / maxScore, 0.12); // min 12% so all points visible
      var pt = radarPoint(cx, cy, radius * pct, angle);
      return pt.x.toFixed(1) + ',' + pt.y.toFixed(1);
    }).join(' ');
  }

  function radarOutlinePoints(cx, cy, radius) {
    return RADAR_CATEGORIES.map(function(cat, i) {
      var pt = radarPoint(cx, cy, radius, i * 72);
      return pt.x.toFixed(1) + ',' + pt.y.toFixed(1);
    }).join(' ');
  }

  QuizEngine.prototype.renderRadarChart = function() {
    var cx = 150, cy = 150, radius = 110;
    var maxScore = CONFIDENCE_THRESHOLD || 24;
    var scores = this.scores;

    // Grid rings at 25%, 50%, 75%, 100%
    var rings = [0.25, 0.5, 0.75, 1.0];
    var ringsSVG = rings.map(function(pct) {
      var pts = RADAR_CATEGORIES.map(function(cat, i) {
        var pt = radarPoint(cx, cy, radius * pct, i * 72);
        return pt.x.toFixed(1) + ',' + pt.y.toFixed(1);
      }).join(' ');
      return '<polygon points="' + pts + '" fill="none" stroke="var(--color-border)" stroke-width="0.5" opacity="0.5"/>';
    }).join('');

    // Axis lines from centre to each vertex
    var axesSVG = RADAR_CATEGORIES.map(function(cat, i) {
      var pt = radarPoint(cx, cy, radius, i * 72);
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + pt.x.toFixed(1) + '" y2="' + pt.y.toFixed(1) + '" stroke="var(--color-border)" stroke-width="0.5" opacity="0.4"/>';
    }).join('');

    // Outer pentagon (dashed)
    var outerPts = radarOutlinePoints(cx, cy, radius);
    var outerSVG = '<polygon points="' + outerPts + '" fill="none" stroke="var(--color-border)" stroke-width="1.5" stroke-dasharray="4 3"/>';

    // Score polygon (filled)
    var scorePts = radarPolygonPoints(cx, cy, radius, scores, maxScore);
    var scoreSVG = '<polygon class="quiz-radar__polygon" points="' + scorePts + '" fill="rgba(45,90,39,0.2)" stroke="var(--color-primary)" stroke-width="2"/>';

    // Score dots
    var dotsSVG = RADAR_CATEGORIES.map(function(cat, i) {
      var pct = Math.max((scores[cat.key] || 0) / maxScore, 0.12);
      var pt = radarPoint(cx, cy, radius * pct, i * 72);
      return '<circle cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '" r="4" fill="var(--color-primary)" stroke="var(--color-card-bg)" stroke-width="2" class="quiz-radar__dot"/>';
    }).join('');

    // Labels outside each vertex
    var labelsSVG = RADAR_CATEGORIES.map(function(cat, i) {
      var pt = radarPoint(cx, cy, radius + 28, i * 72);
      var anchor = 'middle';
      if (pt.x < cx - 10) anchor = 'end';
      else if (pt.x > cx + 10) anchor = 'start';
      var scorePct = Math.round(Math.max((scores[cat.key] || 0) / maxScore, 0) * 100);
      return '<text x="' + pt.x.toFixed(1) + '" y="' + pt.y.toFixed(1) + '" text-anchor="' + anchor + '" dominant-baseline="central" class="quiz-radar__label">' +
        cat.label +
        '<tspan class="quiz-radar__label-pct"> ' + scorePct + '%</tspan>' +
      '</text>';
    }).join('');

    return '<div class="quiz-stats__chart">' +
      '<svg viewBox="0 0 300 300" class="quiz-radar" aria-label="Wellness profile radar chart">' +
        ringsSVG + axesSVG + outerSVG + scoreSVG + dotsSVG + labelsSVG +
      '</svg>' +
    '</div>';
  };

  QuizEngine.prototype.renderCategoryBreakdown = function(topCategory) {
    var scores = this.scores;
    var maxScore = CONFIDENCE_THRESHOLD || 24;
    var questionsAnswered = this.questionsAnswered;

    // Sort categories by score descending
    var sorted = RADAR_CATEGORIES.slice().sort(function(a, b) {
      return (scores[b.key] || 0) - (scores[a.key] || 0);
    });

    var categoryNotes = {
      acne: { high: 'Clearing breakouts is your top priority', mid: 'Congestion and blemishes to keep an eye on', low: 'Skin clarity is in good shape' },
      'anti-aging': { high: 'Anti-aging support is your top priority', mid: 'A few early signs worth getting ahead of', low: 'Skin is firm and youthful' },
      hydration: { high: 'Your skin is thirsty \u2014 hydration comes first', mid: 'Could use more moisture through the day', low: 'Hydration levels look balanced' },
      brightening: { high: 'Even tone and radiance is a priority', mid: 'Some uneven tone to address gradually', low: 'Tone is even and bright' },
      sensitive: { high: 'Your skin is reactive \u2014 gentle formulas only', mid: 'Some sensitivity to manage', low: 'Skin tolerates most products well' }
    };

    var rows = sorted.map(function(cat) {
      var score = scores[cat.key] || 0;
      var pct = Math.round((score / maxScore) * 100);
      var isTop = cat.key === topCategory;
      var notes = categoryNotes[cat.key];
      var note = pct >= 60 ? notes.high : (pct >= 30 ? notes.mid : notes.low);

      return '<div class="quiz-stats__category' + (isTop ? ' quiz-stats__category--top' : '') + '">' +
        '<div class="quiz-stats__cat-header">' +
          '<i data-lucide="' + cat.icon + '"></i>' +
          '<span class="quiz-stats__cat-name">' + cat.label + '</span>' +
          (isTop ? '<span class="quiz-stats__cat-badge">Top Priority</span>' : '') +
          '<span class="quiz-stats__cat-pct">' + pct + '%</span>' +
        '</div>' +
        '<p class="quiz-stats__cat-note">' + note + '</p>' +
      '</div>';
    }).join('');

    return '<div class="quiz-stats__breakdown">' +
      rows +
      '<div class="quiz-stats__footer">' +
        '<i data-lucide="flask-conical"></i>' +
        '<span>Based on ' + questionsAnswered + ' responses</span>' +
      '</div>' +
    '</div>';
  };

  QuizEngine.prototype.renderStats = function(topCategory, secondCategory) {
    return '<div class="quiz-stats">' +
      '<h3 class="quiz-stats__heading">Your Skin Profile</h3>' +
      '<div class="quiz-stats__grid">' +
        this.renderRadarChart() +
        this.renderCategoryBreakdown(topCategory) +
      '</div>' +
    '</div>';
  };

  /* ---------- Results ---------- */
  QuizEngine.prototype.showResults = function() {
    var self = this;

    // Loading gate: wait for quiz config to load
    if (!quizConfigLoaded) {
      this.container.innerHTML =
        '<div style="text-align:center;padding:60px 20px;">' +
          '<div class="quiz-loading-spinner"></div>' +
          '<p style="margin-top:16px;color:var(--color-text-muted);">Preparing your results\u2026</p>' +
        '</div>';
      var attempts = 0;
      var waitInterval = setInterval(function() {
        attempts++;
        if (quizConfigLoaded || attempts > 25) {
          clearInterval(waitInterval);
          self.showResults();
        }
      }, 200);
      return;
    }

    var topTwo = this.getTopTwo();
    var topCategory = topTwo[0][0];
    var secondCategory = topTwo[1][0];
    var stack = stackRecommendations[topCategory];

    if (!stack) {
      this.container.innerHTML =
        '<div style="text-align:center;padding:60px 20px;">' +
          '<h2 style="margin-bottom:12px;">We couldn\u2019t load your results</h2>' +
          '<p style="color:var(--color-text-muted);margin-bottom:24px;">Please try refreshing the page or retaking the quiz.</p>' +
          '<a href="/pages/quiz" class="btn btn--primary">Retake Quiz</a>' +
        '</div>';
      return;
    }

    // Analytics: quiz completion event
    if (typeof gtag === 'function') gtag('event', 'quiz_complete', { category: topCategory, questions_answered: this.questionsAnswered });
    if (typeof fbq === 'function') fbq('trackCustom', 'QuizComplete', { category: topCategory });

    // Sort products within the stack by productBoosts (highest first), preserving original for tiers
    if (Object.keys(this.productBoosts).length > 0) {
      var boosts = this.productBoosts;
      // Create a boost-sorted copy of products for individual display
      this.sortedProducts = stack.products.slice().sort(function(a, b) {
        return (boosts[b.handle] || 0) - (boosts[a.handle] || 0);
      });
    } else {
      this.sortedProducts = stack.products;
    }

    var namePrefix = 'Your ';
    var insight = getCrossInsight(topCategory, secondCategory);

    var catTestimonials = testimonials[topCategory] || [];

    this.container.innerHTML =
      '<div class="quiz-results-page">' +
        '<div class="quiz-progress"><div class="quiz-progress__bar" style="width: 100%"></div></div>' +

        '<!-- Header -->' +
        '<div class="quiz-results__header">' +
          '<div class="quiz-results__icon"><i data-lucide="sparkles"></i></div>' +
          '<h2 class="quiz-results__title">' + namePrefix + stack.name + '</h2>' +
          '<p class="quiz-results__subtitle">' + stack.description + '</p>' +
          '<p class="quiz-results__insight">Based on your answers, ' + insight + '</p>' +
          '<div class="quiz-results__trust">' +
            '<span class="quiz-results__trust-item"><i data-lucide="shield-check"></i> 30-day money-back guarantee</span>' +
            '<span class="quiz-results__trust-item"><i data-lucide="leaf"></i> Clean, dermatologist-friendly</span>' +
            '<span class="quiz-results__trust-item"><i data-lucide="truck"></i> Free US shipping over $50</span>' +
          '</div>' +
        '</div>' +

        '<!-- Stats & Reasoning -->' +
        this.renderStats(topCategory, secondCategory) +

        '<!-- Tier Cards -->' +
        '<div class="quiz-tiers">' +
          this.renderTierCard(stack, 'essential', false) +
          this.renderTierCard(stack, 'recommended', true) +
          this.renderTierCard(stack, 'complete', false) +
        '</div>' +

        '<!-- Individual Products -->' +
        '<div class="quiz-individuals">' +
          '<h3 class="quiz-individuals__heading">Or buy individually</h3>' +
          '<div class="quiz-individuals__grid">' +
            self.sortedProducts.map(function(product) {
              var boost = self.productBoosts[product.handle] || 0;
              return '<div class="quiz-individual">' +
                '<div class="quiz-individual__image">' + self.renderProductImage(product) + '</div>' +
                (boost >= 3 ? '<span class="quiz-individual__match">Top match for you</span>' : '') +
                '<strong class="quiz-individual__name">' + product.name + '</strong>' +
                '<span class="quiz-individual__benefit">' + product.benefit + '</span>' +
                '<span class="quiz-individual__price">' + self.getProductPrice(product) + '</span>' +
                '<button class="btn btn--sm btn--outline quiz-individual__cta" data-product-add="' + product.handle + '">Add to Cart</button>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<!-- Retake -->' +
        '<div class="quiz-results__footer">' +
          '<button class="quiz-retake-btn" data-quiz-retake>Retake Quiz</button>' +
        '</div>' +
      '</div>';

    if (typeof lucide !== 'undefined') lucide.createIcons();

    /* Wire up tier Add to Cart */
    this.container.querySelectorAll('[data-tier-add]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tierKey = btn.dataset.tierAdd;
        var tier = stack.tiers[tierKey];
        var products = tier.productIndices.map(function(i) { return stack.products[i]; });
        if (typeof NutravaCart !== 'undefined') {
          NutravaCart.addItems(products.map(function(p) {
            return {
              handle: p.handle,
              title: p.name,
              price: self.getProductPrice(p),
              quantity: 1
            };
          }));
        }
      });
    });

    /* Wire up individual product Add to Cart */
    this.container.querySelectorAll('[data-product-add]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var handle = btn.dataset.productAdd;
        var product = stack.products.find(function(p) { return p.handle === handle; });
        if (product && typeof NutravaCart !== 'undefined') {
          NutravaCart.addItem({
            handle: product.handle,
            title: product.name,
            price: self.getProductPrice(product),
            quantity: 1
          });
        }
      });
    });

    /* Retake quiz */
    var retakeBtn = this.container.querySelector('[data-quiz-retake]');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', function() {
        self.scores = { acne: 0, 'anti-aging': 0, hydration: 0, brightening: 0, sensitive: 0 };
        self.productBoosts = {};
        self.visitedNodes = {};
        self.history = [];
        self.currentNodeId = 'start';
        self.questionsAnswered = 0;
        self.selectedGoalKey = null;
        self.showWelcome();
      });
    }
  };

  /* ---------- Initialize ---------- */
  function initializeQuizEngine(container) {
    new QuizEngine(container);
  }

  var quizContainer = document.querySelector('[data-quiz-container]');
  if (quizContainer) {
    initializeQuizEngine(quizContainer);
  }
})();
