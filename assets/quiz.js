/* ==========================================================================
   Nutrava — Adaptive Quiz Engine
   Dynamic branching quiz with confidence-based termination
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Quiz Decision Tree ---------- */
  var CONFIDENCE_THRESHOLD = 24;
  var MAX_QUESTIONS = 22;

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

  function getProductImage(handle) {
    var p = productDB[handle];
    return p ? p.image : null;
  }

  function getProductPrice(handle, fallback) {
    var p = productDB[handle];
    if (p) return '\u00A3' + (p.price / 100).toFixed(2);
    return fallback;
  }

  function getProductPricePence(handle) {
    var p = productDB[handle];
    return p ? p.price : 0;
  }

  /* ---------- Category Insights ---------- */
  var categoryInsights = {
    focus: { label: 'Focus & Mental Clarity', icon: 'brain' },
    gym: { label: 'Gym & Performance', icon: 'dumbbell' },
    sleep: { label: 'Sleep & Recovery', icon: 'moon' },
    energy: { label: 'Energy & Stress', icon: 'zap' },
    wellness: { label: 'Daily Wellness', icon: 'leaf' }
  };

  var goalEncouragements = {
    focus: "Great choice \u2014 let's dial in your cognitive support",
    gym: "Let's build your performance stack",
    sleep: "Let's fix your sleep",
    energy: "Let's get your energy back on track",
    wellness: "Smart \u2014 let's optimise your daily health"
  };

  var crossCategoryInsights = {
    'focus+sleep': 'focus and sleep are your biggest opportunities. We\u2019ve built a stack to sharpen your mind during the day and help you recover at night.',
    'focus+energy': 'focus and energy are closely connected for you. This stack supports sustained mental clarity and all-day drive.',
    'focus+gym': 'cognitive performance and physical training go hand in hand. This stack fuels both your brain and body.',
    'focus+wellness': 'mental clarity and overall health are your priorities. This stack sharpens focus while supporting your daily wellness.',
    'gym+sleep': 'training performance and recovery are your focus areas. This stack helps you push harder and recover faster.',
    'gym+energy': 'physical performance and energy are your top needs. This stack powers your workouts and fights fatigue.',
    'gym+wellness': 'training and overall health matter most to you. This stack supports performance while keeping your foundations strong.',
    'sleep+energy': 'sleep and energy are deeply connected for you. Better sleep means more energy \u2014 this stack tackles both.',
    'sleep+wellness': 'sleep quality and daily wellness are your priorities. This stack helps you rest deeply and feel your best.',
    'energy+wellness': 'energy and overall health are what you need most. This stack addresses fatigue at the root while boosting vitality.'
  };

  function getCrossInsight(cat1, cat2) {
    var key1 = cat1 + '+' + cat2;
    var key2 = cat2 + '+' + cat1;
    return crossCategoryInsights[key1] || crossCategoryInsights[key2] ||
      categoryInsights[cat1].label.toLowerCase() + ' is your top priority. This stack is designed to help you reach your goals.';
  }

  /* ---------- Social Proof Testimonials ---------- */
  var testimonials = {
    focus: [
      { text: "After 3 weeks I noticed I could work for hours without losing focus. Game changer for deep work.", author: "James K.", stars: 5 },
      { text: "Brain fog is finally gone. I feel sharper in meetings and my memory has noticeably improved.", author: "Priya M.", stars: 5 },
      { text: "Better than any nootropic I\u2019ve tried. The combination actually works together.", author: "Tom W.", stars: 5 }
    ],
    gym: [
      { text: "Recovery between sessions is night and day. I\u2019m hitting PRs I didn\u2019t think were possible.", author: "Ryan S.", stars: 5 },
      { text: "Finally a stack that\u2019s backed by real research, not just marketing hype.", author: "Emma L.", stars: 5 },
      { text: "The performance boost was noticeable within the first week. Highly recommend.", author: "Marcus D.", stars: 5 }
    ],
    sleep: [
      { text: "I fall asleep in minutes now instead of lying awake for an hour. Life changing.", author: "Sarah T.", stars: 5 },
      { text: "Waking up actually feeling rested is something I forgot was possible.", author: "David R.", stars: 5 },
      { text: "No grogginess, no dependency. Just natural, deep sleep. Exactly what I needed.", author: "Lucy H.", stars: 5 }
    ],
    energy: [
      { text: "No more 2pm crash. I have consistent energy from morning to evening now.", author: "Alex P.", stars: 5 },
      { text: "Replaced my 4-coffee habit with this stack. Feel calmer but more energised.", author: "Natasha B.", stars: 5 },
      { text: "The stress resilience is real. I handle pressure so much better now.", author: "Chris M.", stars: 5 }
    ],
    wellness: [
      { text: "Haven\u2019t had a cold in 6 months. My immune system feels bulletproof.", author: "Hannah J.", stars: 5 },
      { text: "The difference in how I feel day-to-day is remarkable. More energy, better mood.", author: "Oliver K.", stars: 5 },
      { text: "Simple, effective, no fillers. These are the supplements I\u2019ll keep taking.", author: "Kate F.", stars: 5 }
    ]
  };

  /* ---------- Quiz Tree ---------- */
  var quizTree = {
    /* ===== Universal Intro Questions ===== */
    start: {
      question: "First, what\u2019s your age range?",
      subtitle: "Nutritional needs change with age \u2014 this helps us get it right",
      options: [
        { text: "18\u201324", icon: "user", scores: {}, next: "intro_2" },
        { text: "25\u201334", icon: "user", scores: { wellness: 1 }, next: "intro_2" },
        { text: "35\u201344", icon: "user", scores: { wellness: 2 }, next: "intro_2" },
        { text: "45+", icon: "user", scores: { wellness: 3 }, next: "intro_2" }
      ]
    },
    intro_2: {
      question: "How would you describe your current diet?",
      subtitle: "Food is your foundation \u2014 supplements fill the gaps",
      options: [
        { text: "Balanced \u2014 I eat a good variety", icon: "apple", scores: {}, next: "intro_3" },
        { text: "Mostly healthy but could improve", icon: "salad", scores: { wellness: 1 }, next: "intro_3" },
        { text: "Quite restricted (vegan, keto, IF)", icon: "leaf", scores: { wellness: 2 }, next: "intro_3" },
        { text: "Inconsistent \u2014 depends on the week", icon: "shuffle", scores: { energy: 1, wellness: 1 }, next: "intro_3" }
      ]
    },
    intro_3: {
      question: "How physically active are you?",
      subtitle: "Exercise levels affect which supplements benefit you most",
      options: [
        { text: "Very active \u2014 4+ sessions per week", icon: "dumbbell", scores: { gym: 2 }, next: "intro_4" },
        { text: "Moderately active \u2014 2\u20133 sessions", icon: "footprints", scores: { gym: 1 }, next: "intro_4" },
        { text: "Lightly active \u2014 walks and casual", icon: "trees", scores: {}, next: "intro_4" },
        { text: "Sedentary \u2014 desk job, minimal exercise", icon: "laptop", scores: { energy: 1 }, next: "intro_4" }
      ]
    },
    intro_4: {
      question: "Are you currently taking any supplements?",
      subtitle: "We want to complement what you already take, not duplicate",
      options: [
        { text: "No \u2014 this is my first time", icon: "plus", scores: {}, next: "intro_diet" },
        { text: "Just a basic multivitamin", icon: "pill", scores: {}, next: "intro_diet" },
        { text: "Yes \u2014 a few different ones", icon: "package", scores: {}, next: "intro_diet" },
        { text: "Yes but not sure they\u2019re working", icon: "help-circle", scores: { wellness: 1 }, next: "intro_diet" }
      ]
    },
    intro_diet: {
      question: "Any dietary restrictions or sensitivities?",
      subtitle: "We\u2019ll make sure your stack is compatible",
      options: [
        { text: "None", icon: "check", scores: {}, next: "goal" },
        { text: "Vegan / vegetarian", icon: "sprout", scores: { wellness: 1 }, next: "goal" },
        { text: "Gluten or dairy intolerant", icon: "wheat-off", scores: { wellness: 1 }, next: "goal" },
        { text: "Multiple sensitivities", icon: "shield-alert", scores: { wellness: 2 }, next: "goal" }
      ]
    },

    /* ===== Goal Selection ===== */
    goal: {
      question: "What\u2019s your main wellness goal?",
      subtitle: "Choose the one that matters most right now",
      isGoalQuestion: true,
      options: [
        { text: "Focus & Mental Clarity", icon: "brain", scores: { focus: 5 }, next: "focus_1", goalKey: "focus" },
        { text: "Gym & Performance", icon: "dumbbell", scores: { gym: 5 }, next: "gym_1", goalKey: "gym" },
        { text: "Sleep & Recovery", icon: "moon", scores: { sleep: 5 }, next: "sleep_1", goalKey: "sleep" },
        { text: "Energy & Stress", icon: "zap", scores: { energy: 5 }, next: "energy_1", goalKey: "energy" },
        { text: "Daily Wellness", icon: "leaf", scores: { wellness: 5 }, next: "wellness_1", goalKey: "wellness" }
      ]
    },

    /* ----- Focus Path (adaptive branching) ----- */
    focus_1: {
      question: "What do you need focus for?",
      subtitle: "This helps us tailor the right nootropic support",
      options: [
        { text: "Work \u2014 deep tasks & meetings", icon: "briefcase", scores: { focus: 3, energy: 1 }, next: "focus_2" },
        { text: "Studying & exams", icon: "book-open", scores: { focus: 3 }, next: "focus_2" },
        { text: "Creative work & flow states", icon: "palette", scores: { focus: 2, energy: 1 }, next: "focus_2" },
        { text: "Gaming & reaction time", icon: "gamepad-2", scores: { focus: 2, energy: 2 }, next: "focus_1b_gaming" }
      ]
    },
    focus_1b_gaming: {
      question: "What type of gaming?",
      subtitle: "Different gaming styles need different cognitive support",
      options: [
        { text: "Competitive \u2014 FPS / MOBA / ranked", icon: "swords", scores: { energy: 2, focus: 1 }, productBoosts: { "energy-strips": 2 }, next: "focus_2" },
        { text: "Long sessions \u2014 MMO / RPG / strategy", icon: "gamepad-2", scores: { focus: 2 }, productBoosts: { "lions-mane-mushroom": 2 }, next: "focus_2" }
      ]
    },
    focus_2: {
      question: "How would you describe your current concentration?",
      subtitle: "Be honest \u2014 there\u2019s no wrong answer",
      options: [
        { text: "I can focus but it fades quickly", icon: "timer", scores: { focus: 2 }, next: "focus_3" },
        { text: "I get distracted easily", icon: "radar", scores: { focus: 3 }, next: "focus_2b_distraction" },
        { text: "Brain fog \u2014 hard to think clearly", icon: "cloud", scores: { focus: 3, wellness: 1 }, next: "focus_2b_fog" },
        { text: "It\u2019s okay, I just want an edge", icon: "trending-up", scores: { focus: 1 }, next: "focus_4" }
      ]
    },
    focus_2b_distraction: {
      question: "What distracts you most?",
      subtitle: "Understanding the source helps us target the right support",
      options: [
        { text: "Phone & notifications", icon: "smartphone", scores: { focus: 1 }, next: "focus_3" },
        { text: "Internal thoughts & worries", icon: "brain", scores: { energy: 1, focus: 1 }, productBoosts: { "ashwagandha": 2 }, next: "focus_3" },
        { text: "Environment \u2014 noise, people", icon: "volume-2", scores: { focus: 1 }, next: "focus_3" }
      ]
    },
    focus_2b_fog: {
      question: "When did the brain fog start?",
      subtitle: "Timing can reveal the underlying cause",
      options: [
        { text: "Recently \u2014 past few weeks", icon: "calendar", scores: { focus: 1 }, next: "focus_2b_fog2" },
        { text: "Months ago", icon: "calendar-check", scores: { focus: 2 }, productBoosts: { "lions-mane-mushroom": 3 }, next: "focus_3" },
        { text: "Always had it \u2014 as long as I remember", icon: "infinity", scores: { focus: 2, wellness: 2 }, productBoosts: { "lions-mane-mushroom": 3, "brain-focus-formula": 2 }, next: "focus_3" }
      ]
    },
    focus_2b_fog2: {
      question: "Did anything change around that time?",
      subtitle: "Life changes often trigger cognitive shifts",
      options: [
        { text: "New job or more stress", icon: "briefcase", scores: { energy: 2 }, productBoosts: { "ashwagandha": 3 }, next: "focus_5" },
        { text: "Poor sleep started", icon: "moon", scores: { sleep: 2 }, productBoosts: { "magnesium-glycinate": 2 }, next: "focus_5" },
        { text: "Diet change", icon: "utensils", scores: { wellness: 2 }, productBoosts: { "complete-multivitamin": 2 }, next: "focus_3" },
        { text: "Not sure", icon: "help-circle", scores: { focus: 1 }, next: "focus_3" }
      ]
    },
    focus_3: {
      question: "How much caffeine do you consume daily?",
      subtitle: "This affects which ingredients work best for you",
      options: [
        { text: "None", icon: "ban", scores: { focus: 1, energy: 1 }, next: "focus_4" },
        { text: "1\u20132 cups of coffee/tea", icon: "coffee", scores: { focus: 1 }, next: "focus_4" },
        { text: "3\u20134 cups", icon: "cup-soda", scores: { energy: 2 }, productBoosts: { "mushroom-focus-strips": 2 }, next: "focus_4" },
        { text: "5+ cups \u2014 I need it to function", icon: "zap", scores: { energy: 3, sleep: 1 }, next: "focus_3b_caffeine" }
      ]
    },
    focus_3b_caffeine: {
      question: "How do you feel without caffeine?",
      subtitle: "Dependency level affects which supplements help most",
      options: [
        { text: "Headaches & withdrawal symptoms", icon: "alert-triangle", scores: { energy: 1, wellness: 1 }, productBoosts: { "energy-powder": 2 }, next: "focus_4" },
        { text: "Just tired \u2014 nothing severe", icon: "battery-low", scores: { energy: 1 }, next: "focus_4" }
      ]
    },
    focus_4: {
      question: "How many hours do you spend on screens daily?",
      subtitle: "Screen time affects cognitive fatigue and eye health",
      options: [
        { text: "Less than 4 hours", icon: "monitor", scores: { focus: 1 }, next: "focus_5" },
        { text: "4\u20138 hours", icon: "monitor", scores: { focus: 1, wellness: 1 }, next: "focus_5" },
        { text: "8\u201312 hours", icon: "monitor", scores: { focus: 2, sleep: 1 }, next: "focus_5" },
        { text: "12+ hours \u2014 nearly all day", icon: "monitor", scores: { focus: 2, sleep: 2 }, next: "focus_5" }
      ]
    },
    focus_5: {
      question: "How\u2019s your sleep been lately?",
      subtitle: "Sleep quality directly impacts cognitive performance",
      options: [
        { text: "Great \u2014 7\u20139 hours, feel rested", icon: "smile", scores: { focus: 1 }, next: "focus_7" },
        { text: "Okay \u2014 could be better", icon: "meh", scores: { sleep: 1 }, next: "focus_6" },
        { text: "Poor \u2014 I struggle to sleep well", icon: "frown", scores: { sleep: 3 }, next: "focus_5b_sleep" },
        { text: "Inconsistent \u2014 varies a lot", icon: "shuffle", scores: { sleep: 2 }, next: "focus_6" }
      ]
    },
    focus_5b_sleep: {
      question: "What happens at night?",
      subtitle: "Different sleep issues need different solutions",
      options: [
        { text: "Can\u2019t fall asleep", icon: "bed", scores: { sleep: 2 }, productBoosts: { "magnesium-glycinate": 3, "sleep-formula": 2 }, next: "focus_6" },
        { text: "Wake up repeatedly", icon: "alarm-clock", scores: { sleep: 2 }, productBoosts: { "magnesium-glycinate": 3 }, next: "focus_6" },
        { text: "Sleep but don\u2019t feel rested", icon: "battery-low", scores: { sleep: 1, wellness: 1 }, productBoosts: { "ashwagandha-plus": 2 }, next: "focus_6" }
      ]
    },
    focus_6: {
      question: "Do you experience stress or anxiety regularly?",
      subtitle: "Stress can significantly impact focus and memory",
      options: [
        { text: "Rarely \u2014 I manage stress well", icon: "heart", scores: { focus: 1 }, next: "focus_8" },
        { text: "Sometimes \u2014 during busy periods", icon: "bar-chart", scores: { energy: 1 }, next: "focus_7" },
        { text: "Often \u2014 it affects my daily life", icon: "alert-triangle", scores: { energy: 3 }, next: "focus_6b_stress" },
        { text: "Yes \u2014 it\u2019s a major issue for me", icon: "alert-circle", scores: { energy: 4 }, next: "focus_6b_stress" }
      ]
    },
    focus_6b_stress: {
      question: "How does stress show up for you?",
      subtitle: "The way stress manifests tells us which support you need",
      options: [
        { text: "Racing thoughts", icon: "zap", scores: { sleep: 1 }, productBoosts: { "ashwagandha": 3, "cognitive-relax-strips": 2 }, next: "focus_7" },
        { text: "Physical tension \u2014 tight muscles, headaches", icon: "activity", scores: { wellness: 1 }, productBoosts: { "magnesium-glycinate": 2 }, next: "focus_7" },
        { text: "Emotional overwhelm", icon: "heart-crack", scores: { energy: 1 }, productBoosts: { "ashwagandha": 3 }, next: "focus_7" }
      ]
    },
    focus_7: {
      question: "Have you tried nootropics or brain supplements before?",
      subtitle: "This helps us calibrate the right starting point",
      options: [
        { text: "No \u2014 completely new to this", icon: "plus", scores: { focus: 1 }, next: "focus_8" },
        { text: "Just caffeine + L-theanine", icon: "coffee", scores: { focus: 1 }, next: "focus_8" },
        { text: "Yes \u2014 some worked, some didn\u2019t", icon: "flask-conical", scores: { focus: 2 }, next: "focus_8" },
        { text: "Yes \u2014 nothing has really worked", icon: "x-circle", scores: { focus: 2, wellness: 1 }, next: "focus_8" }
      ]
    },
    focus_8: {
      question: "How would you rate your memory lately?",
      subtitle: "Memory and focus are closely linked \u2014 both can be supported",
      options: [
        { text: "Sharp \u2014 no complaints", icon: "check", scores: { focus: 1 }, next: "focus_9" },
        { text: "Decent but occasional lapses", icon: "minus", scores: { focus: 2 }, next: "focus_9" },
        { text: "Noticeably worse than before", icon: "trending-down", scores: { focus: 3, wellness: 1 }, next: "focus_8b_memory" },
        { text: "Frequently forgetting things", icon: "alert-circle", scores: { focus: 3, wellness: 1 }, next: "focus_8b_memory" }
      ]
    },
    focus_8b_memory: {
      question: "What kind of things do you forget?",
      subtitle: "Different memory issues point to different supplements",
      options: [
        { text: "Names & words \u2014 tip of tongue", icon: "message-circle", scores: { focus: 1 }, productBoosts: { "ginkgo-biloba-ginseng": 3 }, next: "focus_9" },
        { text: "Tasks & appointments", icon: "calendar-x", scores: { focus: 1 }, productBoosts: { "brain-focus-formula": 2 }, next: "focus_9" },
        { text: "Recent conversations", icon: "message-square", scores: { focus: 2 }, productBoosts: { "lions-mane-mushroom": 3 }, next: "focus_9" }
      ]
    },
    focus_9: {
      question: "How often do you multitask during your day?",
      subtitle: "Constant context-switching drains cognitive resources",
      options: [
        { text: "Rarely \u2014 I single-task and focus", icon: "target", scores: { focus: 1 }, next: null },
        { text: "Sometimes \u2014 when things get busy", icon: "layers", scores: { focus: 2 }, next: null },
        { text: "Frequently \u2014 it\u2019s hard to avoid", icon: "split", scores: { focus: 3 }, next: null },
        { text: "Constantly \u2014 always juggling things", icon: "shuffle", scores: { focus: 3, energy: 1 }, next: null }
      ]
    },

    /* ----- Gym Path (adaptive branching) ----- */
    gym_1: {
      question: "What type of training do you do?",
      subtitle: "Different training styles need different nutritional support",
      options: [
        { text: "Strength / Hypertrophy", icon: "dumbbell", scores: { gym: 3 }, productBoosts: { "creatine-monohydrate": 2 }, next: "gym_2" },
        { text: "Cardio / Endurance", icon: "heart-pulse", scores: { gym: 2, energy: 1 }, next: "gym_1b_cardio" },
        { text: "Mixed / CrossFit", icon: "repeat", scores: { gym: 2, energy: 1 }, productBoosts: { "nitric-shock-pre-workout": 2 }, next: "gym_2" },
        { text: "Sports-specific training", icon: "trophy", scores: { gym: 2 }, next: "gym_2" }
      ]
    },
    gym_1b_cardio: {
      question: "What\u2019s your cardio goal?",
      subtitle: "This helps us pick the right performance support",
      options: [
        { text: "Endurance \u2014 running / cycling / swimming", icon: "bike", scores: { gym: 1, energy: 1 }, productBoosts: { "beetroot": 3, "beetroot-powder": 2 }, next: "gym_2" },
        { text: "Heart health & general fitness", icon: "heart-pulse", scores: { wellness: 1 }, productBoosts: { "beetroot": 2 }, next: "gym_2" },
        { text: "Weight loss", icon: "flame", scores: { energy: 1 }, productBoosts: { "energy-powder": 2 }, next: "gym_2" }
      ]
    },
    gym_2: {
      question: "How long have you been training consistently?",
      subtitle: "Experience level affects which supplements will benefit you most",
      options: [
        { text: "Less than 3 months", icon: "calendar", scores: { gym: 1 }, next: "gym_3" },
        { text: "3\u201312 months", icon: "calendar-check", scores: { gym: 2 }, next: "gym_3" },
        { text: "1\u20133 years", icon: "award", scores: { gym: 2 }, next: "gym_3" },
        { text: "3+ years", icon: "trophy", scores: { gym: 3 }, next: "gym_2b_experienced" }
      ]
    },
    gym_2b_experienced: {
      question: "Hit any plateaus lately?",
      subtitle: "Stalls are normal \u2014 the right support can break through them",
      options: [
        { text: "Yes \u2014 strength has stalled", icon: "trending-down", scores: { gym: 2 }, productBoosts: { "creatine-monohydrate": 3, "nitric-shock-pre-workout": 2 }, next: "gym_3" },
        { text: "Yes \u2014 muscle growth has slowed", icon: "minus", scores: { gym: 2 }, productBoosts: { "whey-protein-isolate": 3 }, next: "gym_3" },
        { text: "No \u2014 still progressing", icon: "trending-up", scores: { gym: 1 }, next: "gym_3" }
      ]
    },
    gym_3: {
      question: "How\u2019s your recovery between sessions?",
      subtitle: "Recovery is where progress actually happens",
      options: [
        { text: "Great \u2014 I feel ready each session", icon: "thumbs-up", scores: { gym: 1 }, next: "gym_5" },
        { text: "Often sore for days", icon: "activity", scores: { gym: 2, sleep: 1 }, next: "gym_3b_soreness" },
        { text: "Joint pain or stiffness", icon: "bone", scores: { gym: 2, wellness: 1 }, next: "gym_3b_joints" },
        { text: "I feel run down / overtrained", icon: "battery-low", scores: { gym: 2, sleep: 2, energy: 1 }, productBoosts: { "ashwagandha": 3 }, next: "gym_4" }
      ]
    },
    gym_3b_soreness: {
      question: "Where do you feel the soreness most?",
      subtitle: "Location helps us recommend targeted recovery support",
      options: [
        { text: "Legs & lower body", icon: "footprints", scores: { gym: 1 }, productBoosts: { "l-glutamine-powder": 3 }, next: "gym_4" },
        { text: "Upper body \u2014 chest, back, arms", icon: "dumbbell", scores: { gym: 1 }, productBoosts: { "l-glutamine-powder": 2, "colostrum-powder": 2 }, next: "gym_4" },
        { text: "Full body aches", icon: "alert-triangle", scores: { gym: 1, wellness: 1 }, productBoosts: { "l-glutamine-powder": 3, "magnesium-glycinate": 2 }, next: "gym_4" }
      ]
    },
    gym_3b_joints: {
      question: "Which joints bother you?",
      subtitle: "Targeted support can make a real difference",
      options: [
        { text: "Knees", icon: "bone", scores: { wellness: 1 }, productBoosts: { "joint-support": 3, "collagen-peptides": 2 }, next: "gym_4" },
        { text: "Shoulders or elbows", icon: "activity", scores: { wellness: 1 }, productBoosts: { "joint-support": 3 }, next: "gym_4" },
        { text: "Multiple joints", icon: "alert-circle", scores: { wellness: 2 }, productBoosts: { "joint-support": 3, "platinum-turmeric": 3, "collagen-peptides": 2 }, next: "gym_4" }
      ]
    },
    gym_4: {
      question: "How much protein do you consume daily?",
      subtitle: "Protein requirements depend on your training intensity",
      options: [
        { text: "High \u2014 I hit my targets consistently", icon: "beef", scores: { gym: 1 }, next: "gym_5" },
        { text: "Moderate \u2014 I try but often miss", icon: "egg", scores: { gym: 1 }, next: "gym_5" },
        { text: "Low \u2014 I know I don\u2019t get enough", icon: "alert-triangle", scores: { gym: 2 }, next: "gym_4b_protein" },
        { text: "Not sure \u2014 I don\u2019t track it", icon: "help-circle", scores: { gym: 1, wellness: 1 }, next: "gym_5" }
      ]
    },
    gym_4b_protein: {
      question: "Any dietary restrictions?",
      subtitle: "This determines which protein source suits you best",
      options: [
        { text: "No restrictions", icon: "check", scores: { gym: 1 }, productBoosts: { "whey-protein-isolate": 3 }, next: "gym_5" },
        { text: "Vegan / vegetarian", icon: "sprout", scores: { gym: 1 }, productBoosts: { "plant-protein-vanilla": 3 }, next: "gym_5" },
        { text: "Lactose intolerant", icon: "wheat-off", scores: { gym: 1 }, productBoosts: { "plant-protein-vanilla": 3 }, next: "gym_5" }
      ]
    },
    gym_5: {
      question: "How\u2019s your sleep and energy?",
      subtitle: "Recovery happens while you sleep \u2014 this affects your results",
      options: [
        { text: "I sleep well and have good energy", icon: "smile", scores: { gym: 1 }, next: "gym_6" },
        { text: "Sleep is okay but energy dips", icon: "meh", scores: { energy: 1 }, next: "gym_6" },
        { text: "Poor sleep \u2014 it\u2019s hurting my gains", icon: "frown", scores: { sleep: 2 }, next: "gym_6" },
        { text: "Both need serious improvement", icon: "alert-circle", scores: { sleep: 2, energy: 2 }, next: "gym_6" }
      ]
    },
    gym_6: {
      question: "What\u2019s your primary gym goal right now?",
      subtitle: "This determines the exact supplements we recommend",
      options: [
        { text: "Build muscle / Get bigger", icon: "trending-up", scores: { gym: 2 }, next: "gym_7" },
        { text: "Lose fat / Get lean", icon: "flame", scores: { gym: 1, energy: 1 }, next: "gym_7" },
        { text: "Improve performance / PRs", icon: "trophy", scores: { gym: 2 }, next: "gym_7" },
        { text: "General fitness / Stay active", icon: "heart-pulse", scores: { gym: 1, wellness: 1 }, next: "gym_7" }
      ]
    },
    gym_7: {
      question: "Do you experience any joint or mobility issues?",
      subtitle: "Joint health is crucial for long-term training",
      skipIf: { visitedNode: "gym_3b_joints", skipTo: "gym_8" },
      options: [
        { text: "No issues at all", icon: "check", scores: { gym: 1 }, next: "gym_8" },
        { text: "Minor stiffness after training", icon: "minus", scores: { gym: 1, wellness: 1 }, next: "gym_8" },
        { text: "Recurring joint pain", icon: "alert-triangle", scores: { gym: 2, wellness: 2 }, next: "gym_8" },
        { text: "Yes \u2014 it limits my training", icon: "alert-circle", scores: { gym: 2, wellness: 3 }, next: "gym_8" }
      ]
    },
    gym_8: {
      question: "What does your post-workout nutrition look like?",
      subtitle: "Recovery nutrition is as important as the workout itself",
      options: [
        { text: "Protein shake within 30 min", icon: "cup-soda", scores: { gym: 1 }, next: "gym_9" },
        { text: "A full meal after training", icon: "utensils", scores: { gym: 1 }, next: "gym_9" },
        { text: "I don\u2019t eat after training", icon: "x-circle", scores: { gym: 3 }, next: "gym_8b_postworkout" },
        { text: "Inconsistent \u2014 depends on the day", icon: "shuffle", scores: { gym: 2 }, next: "gym_9" }
      ]
    },
    gym_8b_postworkout: {
      question: "Why don\u2019t you eat after training?",
      subtitle: "Understanding the reason helps us find the right solution",
      options: [
        { text: "Not hungry / nauseous after", icon: "x-circle", scores: { gym: 1 }, productBoosts: { "hydration-powder-lemonade": 2 }, next: "gym_9" },
        { text: "No time \u2014 straight to work/life", icon: "clock", scores: { gym: 1 }, productBoosts: { "whey-protein-isolate": 2 }, next: "gym_9" },
        { text: "Don\u2019t know what to eat", icon: "help-circle", scores: { gym: 1 }, next: "gym_9" }
      ]
    },
    gym_9: {
      question: "What\u2019s been your biggest barrier to progress?",
      subtitle: "Identifying blockers helps us target the right support",
      options: [
        { text: "Inconsistent training schedule", icon: "calendar-x", scores: { gym: 1 }, next: null },
        { text: "Nutrition \u2014 I can\u2019t dial it in", icon: "utensils-crossed", scores: { gym: 2 }, next: null },
        { text: "Recovery & soreness", icon: "thermometer", scores: { gym: 3, sleep: 1 }, next: null },
        { text: "Motivation & energy", icon: "battery-low", scores: { gym: 1, energy: 2 }, next: null }
      ]
    },
    /* ----- Sleep Path (adaptive branching) ----- */
    sleep_1: {
      question: "What\u2019s your biggest sleep struggle?",
      subtitle: "Understanding the problem helps us find the right solution",
      options: [
        { text: "Trouble falling asleep", icon: "bed", scores: { sleep: 3 }, next: "sleep_1b_onset" },
        { text: "Waking up during the night", icon: "moon", scores: { sleep: 3 }, next: "sleep_1b_maintenance" },
        { text: "Not feeling rested in the morning", icon: "alarm-clock", scores: { sleep: 2, energy: 1 }, next: "sleep_2" },
        { text: "Racing mind at bedtime", icon: "brain", scores: { sleep: 2, energy: 1 }, next: "sleep_1b_racing" }
      ]
    },
    sleep_1b_onset: {
      question: "How long does it take you to fall asleep?",
      subtitle: "Sleep onset time tells us a lot about what\u2019s happening",
      options: [
        { text: "30\u201360 minutes", icon: "clock", scores: { sleep: 1 }, productBoosts: { "magnesium-glycinate": 2, "sleep-formula": 2 }, next: "sleep_2" },
        { text: "1\u20132 hours", icon: "timer", scores: { sleep: 2 }, productBoosts: { "magnesium-glycinate": 3, "sleep-formula": 3 }, next: "sleep_2" },
        { text: "2+ hours \u2014 it\u2019s a real struggle", icon: "alert-circle", scores: { sleep: 3 }, productBoosts: { "sleep-formula": 3, "magnesium-glycinate": 3 }, next: "sleep_2" }
      ]
    },
    sleep_1b_maintenance: {
      question: "How often do you wake up at night?",
      subtitle: "Wake frequency helps us identify the right support",
      options: [
        { text: "Once \u2014 I fall back fairly easily", icon: "minus", scores: { sleep: 1 }, next: "sleep_2" },
        { text: "2\u20133 times per night", icon: "alert-triangle", scores: { sleep: 2 }, productBoosts: { "magnesium-glycinate": 3 }, next: "sleep_2" },
        { text: "Multiple times \u2014 hard to get back to sleep", icon: "alert-circle", scores: { sleep: 3 }, productBoosts: { "magnesium-glycinate": 3, "ashwagandha-plus": 2 }, next: "sleep_2" }
      ]
    },
    sleep_1b_racing: {
      question: "What\u2019s your mind racing about?",
      subtitle: "The content of racing thoughts guides our recommendation",
      options: [
        { text: "Work & responsibilities", icon: "briefcase", scores: { energy: 2 }, productBoosts: { "ashwagandha-plus": 3 }, next: "sleep_2" },
        { text: "Anxiety & worries", icon: "alert-triangle", scores: { energy: 2 }, productBoosts: { "ashwagandha-plus": 3, "cognitive-relax-strips": 2 }, next: "sleep_2" },
        { text: "Random thoughts \u2014 can\u2019t switch off", icon: "shuffle", scores: { energy: 1, focus: 1 }, productBoosts: { "magnesium-glycinate": 2 }, next: "sleep_2" }
      ]
    },
    sleep_2: {
      question: "How many hours of sleep do you typically get?",
      subtitle: "Most adults need 7\u20139 hours for optimal health",
      options: [
        { text: "Less than 5 hours", icon: "alert-circle", scores: { sleep: 4, energy: 2 }, next: "sleep_3" },
        { text: "5\u20136 hours", icon: "clock", scores: { sleep: 3 }, next: "sleep_3" },
        { text: "6\u20137 hours", icon: "timer", scores: { sleep: 2 }, next: "sleep_4" },
        { text: "7+ hours but still tired", icon: "help-circle", scores: { sleep: 2, wellness: 1 }, next: "sleep_2b_quality" }
      ]
    },
    sleep_2b_quality: {
      question: "Do you snore or wake up with a dry mouth?",
      subtitle: "These can indicate something your supplements alone can\u2019t fix",
      options: [
        { text: "Yes \u2014 frequently", icon: "alert-triangle", scores: { wellness: 1 }, next: "sleep_3" },
        { text: "Occasionally", icon: "minus", scores: { sleep: 1 }, next: "sleep_3" },
        { text: "No", icon: "check", scores: { sleep: 1 }, productBoosts: { "ashwagandha-plus": 2 }, next: "sleep_3" }
      ]
    },
    sleep_3: {
      question: "What time do you typically go to bed?",
      subtitle: "Your circadian rhythm affects which sleep supplements work best",
      options: [
        { text: "Before 10pm", icon: "sunset", scores: { sleep: 1 }, next: "sleep_4" },
        { text: "10pm \u2013 11pm", icon: "clock", scores: { sleep: 1 }, next: "sleep_4" },
        { text: "11pm \u2013 midnight", icon: "moon", scores: { sleep: 2 }, next: "sleep_4" },
        { text: "After midnight \u2014 I\u2019m a night owl", icon: "star", scores: { sleep: 2, energy: 1 }, next: "sleep_4" }
      ]
    },
    sleep_4: {
      question: "Do you use screens within an hour of bedtime?",
      subtitle: "Blue light affects melatonin production",
      options: [
        { text: "Yes \u2014 phone, laptop, or TV", icon: "smartphone", scores: { sleep: 2 }, next: "sleep_4b_screens" },
        { text: "Sometimes", icon: "monitor", scores: { sleep: 1 }, next: "sleep_5" },
        { text: "No \u2014 I have a wind-down routine", icon: "book-open", scores: { sleep: 1 }, next: "sleep_6" }
      ]
    },
    sleep_4b_screens: {
      question: "What do you use screens for before bed?",
      subtitle: "The type of screen activity matters",
      options: [
        { text: "Social media / doom scrolling", icon: "smartphone", scores: { sleep: 1, focus: 1 }, productBoosts: { "cognitive-relax-strips": 2 }, next: "sleep_5" },
        { text: "Work emails & tasks", icon: "mail", scores: { energy: 1 }, productBoosts: { "ashwagandha-plus": 2 }, next: "sleep_5" },
        { text: "TV / streaming (passive)", icon: "tv", scores: { sleep: 1 }, next: "sleep_5" }
      ]
    },
    sleep_5: {
      question: "How\u2019s your stress level?",
      subtitle: "Cortisol can significantly disrupt sleep patterns",
      options: [
        { text: "Low \u2014 I\u2019m pretty relaxed", icon: "heart", scores: { sleep: 1 }, next: "sleep_7" },
        { text: "Moderate \u2014 manageable", icon: "scale", scores: { energy: 1 }, next: "sleep_6" },
        { text: "High \u2014 it keeps me up at night", icon: "alert-triangle", scores: { energy: 3, sleep: 1 }, next: "sleep_5b_stress" },
        { text: "Very high \u2014 I\u2019m overwhelmed", icon: "alert-circle", scores: { energy: 4, sleep: 1 }, next: "sleep_5b_stress" }
      ]
    },
    sleep_5b_stress: {
      question: "Is the stress mostly work or personal?",
      subtitle: "The source helps us recommend the right calming support",
      options: [
        { text: "Work / career", icon: "briefcase", scores: { energy: 1 }, productBoosts: { "ashwagandha": 3 }, next: "sleep_6" },
        { text: "Personal / family", icon: "heart", scores: { energy: 1 }, productBoosts: { "ashwagandha-plus": 2 }, next: "sleep_6" },
        { text: "Both equally", icon: "scale", scores: { energy: 2 }, productBoosts: { "ashwagandha": 3, "mushroom-complex-10x": 2 }, next: "sleep_6" }
      ]
    },
    sleep_6: {
      question: "Do you experience any of these at night?",
      subtitle: "These symptoms can point to specific nutritional gaps",
      options: [
        { text: "Night sweats", icon: "thermometer", scores: { sleep: 2, wellness: 1 }, next: "sleep_7" },
        { text: "Restless legs", icon: "footprints", scores: { sleep: 3, wellness: 1 }, next: "sleep_7" },
        { text: "Teeth grinding / jaw clenching", icon: "alert-triangle", scores: { sleep: 2, wellness: 2 }, next: "sleep_7" },
        { text: "None of these", icon: "check", scores: { sleep: 1 }, next: "sleep_7" }
      ]
    },
    sleep_7: {
      question: "Have you tried any sleep supplements before?",
      subtitle: "This helps us avoid recommending what hasn\u2019t worked",
      options: [
        { text: "No \u2014 this would be my first", icon: "plus", scores: { sleep: 1 }, next: "sleep_8" },
        { text: "Melatonin \u2014 it helped a bit", icon: "pill", scores: { sleep: 1 }, next: "sleep_8" },
        { text: "Melatonin \u2014 didn\u2019t help", icon: "x-circle", scores: { sleep: 2 }, next: "sleep_8" },
        { text: "Yes \u2014 various things", icon: "package", scores: { sleep: 2 }, next: "sleep_8" }
      ]
    },
    sleep_8: {
      question: "How consistent is your sleep schedule on weekends?",
      subtitle: "Irregular schedules can disrupt your circadian rhythm",
      options: [
        { text: "Same as weekdays", icon: "check", scores: { sleep: 1 }, next: "sleep_9" },
        { text: "1\u20132 hours later", icon: "clock", scores: { sleep: 1 }, next: "sleep_9" },
        { text: "Completely different", icon: "shuffle", scores: { sleep: 3 }, next: "sleep_9" },
        { text: "No routine at all", icon: "x-circle", scores: { sleep: 3, energy: 1 }, next: "sleep_9" }
      ]
    },
    sleep_9: {
      question: "How does poor sleep affect your day?",
      subtitle: "Understanding the ripple effects helps us prioritise",
      options: [
        { text: "Mild \u2014 I push through", icon: "trending-up", scores: { sleep: 1 }, next: null },
        { text: "Moderate \u2014 productivity drops", icon: "minus", scores: { sleep: 2, focus: 1 }, next: null },
        { text: "Significant \u2014 mood & focus suffer", icon: "alert-triangle", scores: { sleep: 3, focus: 2 }, next: null },
        { text: "Severe \u2014 struggle to function", icon: "alert-circle", scores: { sleep: 3, energy: 2 }, next: null }
      ]
    },

    /* ----- Energy Path (adaptive branching) ----- */
    energy_1: {
      question: "When do you feel most drained?",
      subtitle: "Energy patterns reveal what your body needs",
      options: [
        { text: "Morning \u2014 hard to get going", icon: "sunrise", scores: { energy: 3, sleep: 1 }, next: "energy_1b_morning" },
        { text: "Afternoon \u2014 the 2pm crash", icon: "clock", scores: { energy: 3 }, productBoosts: { "energy-strips": 2 }, next: "energy_2" },
        { text: "Evening \u2014 exhausted after work", icon: "sunset", scores: { energy: 2, sleep: 1 }, next: "energy_2" },
        { text: "All day \u2014 constantly low", icon: "battery-low", scores: { energy: 4, wellness: 1 }, next: "energy_1b_allday" }
      ]
    },
    energy_1b_morning: {
      question: "What does your morning look like?",
      subtitle: "Morning patterns reveal the root cause",
      options: [
        { text: "Snooze the alarm 3+ times", icon: "alarm-clock", scores: { sleep: 1 }, productBoosts: { "sleep-formula": 2 }, next: "energy_2" },
        { text: "Up but groggy for hours", icon: "cloud", scores: { sleep: 1, wellness: 1 }, productBoosts: { "complete-multivitamin": 2 }, next: "energy_2" },
        { text: "Need caffeine to function", icon: "coffee", scores: { energy: 1 }, productBoosts: { "energy-powder": 2 }, next: "energy_2" }
      ]
    },
    energy_1b_allday: {
      question: "How long has this been going on?",
      subtitle: "Duration helps us understand the severity",
      options: [
        { text: "Weeks \u2014 it\u2019s recent", icon: "calendar", scores: { energy: 1 }, next: "energy_2" },
        { text: "Months", icon: "calendar-check", scores: { energy: 2 }, productBoosts: { "mushroom-complex-10x": 2 }, next: "energy_2" },
        { text: "Years \u2014 as long as I can remember", icon: "infinity", scores: { energy: 2, wellness: 1 }, productBoosts: { "complete-multivitamin": 3, "moringa-pure": 2 }, next: "energy_2" }
      ]
    },
    energy_2: {
      question: "How would you rate your stress level?",
      subtitle: "Chronic stress drains energy reserves",
      options: [
        { text: "Low \u2014 I\u2019m fairly relaxed", icon: "heart", scores: { energy: 1 }, next: "energy_4" },
        { text: "Moderate \u2014 work/life pressure", icon: "scale", scores: { energy: 2 }, next: "energy_3" },
        { text: "High \u2014 I feel wired but tired", icon: "zap", scores: { energy: 3 }, next: "energy_2b_wired" },
        { text: "Burnout level", icon: "flame", scores: { energy: 4, sleep: 1 }, next: "energy_2b_burnout" }
      ]
    },
    energy_2b_wired: {
      question: "Do you feel tired but can\u2019t relax?",
      subtitle: "This \u2018wired but tired\u2019 pattern has specific solutions",
      options: [
        { text: "Yes \u2014 I can\u2019t switch off even when exhausted", icon: "zap", scores: { sleep: 1 }, productBoosts: { "ashwagandha": 3, "magnesium-glycinate": 2 }, next: "energy_3" },
        { text: "Just constant low-grade tension", icon: "minus", scores: { energy: 1 }, productBoosts: { "ashwagandha": 3 }, next: "energy_3" }
      ]
    },
    energy_2b_burnout: {
      question: "What\u2019s your work situation?",
      subtitle: "Burnout has different faces \u2014 this helps us target support",
      options: [
        { text: "Overworked \u2014 long hours, no breaks", icon: "briefcase", scores: { energy: 2 }, productBoosts: { "ashwagandha": 3, "mushroom-complex-10x": 2 }, next: "energy_3" },
        { text: "Emotionally draining role", icon: "heart-crack", scores: { energy: 1, wellness: 1 }, productBoosts: { "ashwagandha": 3 }, next: "energy_3" },
        { text: "Multiple commitments pulling me apart", icon: "split", scores: { energy: 1 }, productBoosts: { "energy-strips": 2, "ashwagandha": 2 }, next: "energy_3" }
      ]
    },
    energy_3: {
      question: "How much water do you drink daily?",
      subtitle: "Dehydration is the #1 hidden cause of fatigue",
      options: [
        { text: "Plenty \u2014 2+ litres", icon: "droplets", scores: { energy: 1 }, next: "energy_4" },
        { text: "Some \u2014 about 1 litre", icon: "droplet", scores: { energy: 1, wellness: 1 }, next: "energy_4" },
        { text: "Not enough \u2014 I forget to drink", icon: "cloud-off", scores: { wellness: 2 }, next: "energy_4" }
      ]
    },
    energy_4: {
      question: "How much caffeine do you rely on?",
      subtitle: "Caffeine dependency can mask underlying issues",
      options: [
        { text: "None \u2014 I avoid it", icon: "ban", scores: { energy: 1 }, next: "energy_5" },
        { text: "1\u20132 cups \u2014 keeps me going", icon: "coffee", scores: { energy: 1 }, next: "energy_5" },
        { text: "3\u20134 cups \u2014 can\u2019t function without it", icon: "cup-soda", scores: { energy: 2 }, next: "energy_5" },
        { text: "5+ cups and still crashing", icon: "zap", scores: { energy: 3, sleep: 1 }, next: "energy_4b_caffeine" }
      ]
    },
    energy_4b_caffeine: {
      question: "Would you like to reduce your caffeine intake?",
      subtitle: "We can recommend cleaner alternatives",
      options: [
        { text: "Yes \u2014 I want to cut back", icon: "trending-down", scores: { energy: 1 }, productBoosts: { "energy-powder": 3, "mushroom-complex-10x": 2 }, next: "energy_5" },
        { text: "No \u2014 I just want more energy on top", icon: "trending-up", scores: { energy: 1 }, next: "energy_5" }
      ]
    },
    energy_5: {
      question: "How\u2019s your sleep quality?",
      subtitle: "Poor sleep is the most common cause of low energy",
      options: [
        { text: "Great \u2014 I wake up refreshed", icon: "smile", scores: { energy: 1 }, next: "energy_7" },
        { text: "Average \u2014 could be better", icon: "meh", scores: { sleep: 1 }, next: "energy_6" },
        { text: "Poor \u2014 I rarely feel rested", icon: "frown", scores: { sleep: 3 }, productBoosts: { "magnesium-glycinate": 2, "sleep-formula": 2 }, next: "energy_6" },
        { text: "Terrible \u2014 barely sleeping", icon: "alert-circle", scores: { sleep: 4 }, next: "energy_5b_sleep" }
      ]
    },
    energy_5b_sleep: {
      question: "What\u2019s the main sleep issue?",
      subtitle: "Different sleep problems need different solutions",
      options: [
        { text: "Can\u2019t fall asleep", icon: "bed", scores: { sleep: 2 }, productBoosts: { "sleep-formula": 3 }, next: "energy_6" },
        { text: "Wake up at night", icon: "alarm-clock", scores: { sleep: 2 }, productBoosts: { "magnesium-glycinate": 3 }, next: "energy_6" },
        { text: "Sleep but still exhausted", icon: "battery-low", scores: { sleep: 1, wellness: 1 }, productBoosts: { "complete-multivitamin": 2 }, next: "energy_6" }
      ]
    },
    energy_6: {
      question: "How does low energy affect your daily life?",
      subtitle: "Understanding the impact helps us prioritise",
      options: [
        { text: "Mild \u2014 I push through it", icon: "trending-up", scores: { energy: 1 }, next: "energy_7" },
        { text: "Moderate \u2014 it slows me down", icon: "minus", scores: { energy: 2 }, next: "energy_7" },
        { text: "Significant \u2014 affects work/relationships", icon: "alert-triangle", scores: { energy: 3 }, next: "energy_7" },
        { text: "Severe \u2014 I\u2019ve had to change my lifestyle", icon: "alert-circle", scores: { energy: 4 }, next: "energy_7" }
      ]
    },
    energy_7: {
      question: "Do you experience brain fog along with low energy?",
      subtitle: "Brain fog and fatigue often share the same root causes",
      options: [
        { text: "No \u2014 just tired, thinking is fine", icon: "check", scores: { energy: 1 }, next: "energy_9" },
        { text: "Occasionally \u2014 some foggy days", icon: "cloud", scores: { energy: 1, focus: 1 }, next: "energy_8" },
        { text: "Frequently \u2014 hard to think clearly", icon: "cloud-fog", scores: { energy: 2, focus: 2 }, productBoosts: { "lions-mane-mushroom": 2 }, next: "energy_8" },
        { text: "Yes \u2014 constantly foggy and drained", icon: "alert-circle", scores: { energy: 2, focus: 3 }, next: "energy_7b_fog" }
      ]
    },
    energy_7b_fog: {
      question: "Is the fog worse at a specific time?",
      subtitle: "Timing patterns reveal the underlying cause",
      options: [
        { text: "Morning \u2014 takes hours to clear", icon: "sunrise", scores: { sleep: 1 }, productBoosts: { "lions-mane-mushroom": 3, "brain-focus-formula": 2 }, next: "energy_8" },
        { text: "After meals", icon: "utensils", scores: { wellness: 1 }, productBoosts: { "berberine": 2, "gut-health": 2 }, next: "energy_8" },
        { text: "All the time \u2014 constant haze", icon: "cloud", scores: { focus: 1, wellness: 1 }, productBoosts: { "lions-mane-mushroom": 3, "complete-multivitamin": 2 }, next: "energy_8" }
      ]
    },
    energy_8: {
      question: "How does your energy compare to a year ago?",
      subtitle: "Trends matter \u2014 declining energy can signal deeper needs",
      options: [
        { text: "Better \u2014 it\u2019s improved", icon: "trending-up", scores: { energy: 1 }, next: "energy_9" },
        { text: "About the same", icon: "minus", scores: { energy: 1 }, next: "energy_9" },
        { text: "Worse \u2014 noticeably declining", icon: "trending-down", scores: { energy: 3, wellness: 1 }, next: "energy_9" },
        { text: "Much worse \u2014 I\u2019m worried", icon: "alert-circle", scores: { energy: 3, wellness: 2 }, next: "energy_9" }
      ]
    },
    energy_9: {
      question: "What have you tried to improve your energy?",
      subtitle: "This helps us recommend things you haven\u2019t tried yet",
      options: [
        { text: "Nothing yet \u2014 I\u2019m just starting", icon: "plus", scores: { energy: 1 }, next: null },
        { text: "More sleep \u2014 helped a bit", icon: "moon", scores: { energy: 1, sleep: 1 }, next: null },
        { text: "Caffeine & energy drinks", icon: "coffee", scores: { energy: 3 }, next: null },
        { text: "Diet & lifestyle changes", icon: "salad", scores: { energy: 2 }, next: null }
      ]
    },
    /* ----- Wellness Path (adaptive branching) ----- */
    wellness_1: {
      question: "What\u2019s your main wellness concern?",
      subtitle: "Let\u2019s narrow down what matters most to you",
      options: [
        { text: "Immune support \u2014 I get sick easily", icon: "shield", scores: { wellness: 3 }, next: "wellness_1b_immune" },
        { text: "Gut health \u2014 digestion issues", icon: "heart-pulse", scores: { wellness: 3 }, next: "wellness_1b_gut" },
        { text: "General vitality \u2014 just feel better", icon: "sparkles", scores: { wellness: 2 }, next: "wellness_2" },
        { text: "Healthy aging \u2014 long-term health", icon: "trees", scores: { wellness: 2 }, next: "wellness_1b_aging" }
      ]
    },
    wellness_1b_immune: {
      question: "When do you tend to get sick?",
      subtitle: "Timing helps us pinpoint the right immune support",
      options: [
        { text: "Winter / seasonal changes", icon: "snowflake", scores: { wellness: 1 }, productBoosts: { "vitamin-d3": 3 }, next: "wellness_2" },
        { text: "After travel", icon: "plane", scores: { wellness: 1 }, productBoosts: { "probiotic-40-billion": 2 }, next: "wellness_2" },
        { text: "Random \u2014 any time of year", icon: "shuffle", scores: { wellness: 2 }, productBoosts: { "vitamin-d3": 2, "mushroom-complex-10x": 2 }, next: "wellness_2" }
      ]
    },
    wellness_1b_gut: {
      question: "What\u2019s your main digestive issue?",
      subtitle: "Different gut problems need different approaches",
      options: [
        { text: "Bloating after meals", icon: "alert-triangle", scores: { wellness: 1 }, productBoosts: { "digestive-gut-health-strips": 3, "gut-health": 2 }, next: "wellness_2" },
        { text: "Irregular bowel habits", icon: "shuffle", scores: { wellness: 1 }, productBoosts: { "probiotic-40-billion": 3, "gut-health": 2 }, next: "wellness_2" },
        { text: "Acid reflux / discomfort", icon: "flame", scores: { wellness: 1 }, productBoosts: { "gut-health": 3 }, next: "wellness_2" }
      ]
    },
    wellness_1b_aging: {
      question: "What aging concern matters most?",
      subtitle: "Targeted support can make a real difference",
      options: [
        { text: "Joint stiffness & mobility", icon: "bone", scores: { wellness: 1 }, productBoosts: { "joint-support": 3, "collagen-peptides": 2, "platinum-turmeric": 2 }, next: "wellness_2" },
        { text: "Skin, hair & nails", icon: "sparkles", scores: { wellness: 1 }, productBoosts: { "collagen-peptides": 3, "hair-skin-nails-essentials": 2 }, next: "wellness_2" },
        { text: "Cognitive decline & sharpness", icon: "brain", scores: { focus: 1 }, productBoosts: { "lions-mane-mushroom": 3, "ginkgo-biloba-ginseng": 2 }, next: "wellness_2" },
        { text: "Cellular health & longevity", icon: "dna", scores: { wellness: 1 }, productBoosts: { "resveratrol-600": 3 }, next: "wellness_2" }
      ]
    },
    wellness_2: {
      question: "How often do you get sick?",
      subtitle: "Illness frequency tells us about immune function",
      options: [
        { text: "Rarely \u2014 maybe once a year", icon: "shield-check", scores: { wellness: 1 }, next: "wellness_3" },
        { text: "Occasionally \u2014 a few colds per year", icon: "thermometer", scores: { wellness: 2 }, next: "wellness_3" },
        { text: "Often \u2014 I catch everything going around", icon: "alert-triangle", scores: { wellness: 3 }, next: "wellness_3" },
        { text: "Frequently \u2014 it\u2019s frustrating", icon: "alert-circle", scores: { wellness: 4 }, next: "wellness_3" }
      ]
    },
    wellness_3: {
      question: "Do you spend much time outdoors?",
      subtitle: "Sunlight exposure affects vitamin D and mood",
      options: [
        { text: "Yes \u2014 I\u2019m outside daily", icon: "sun", scores: { wellness: 1 }, next: "wellness_4" },
        { text: "Some \u2014 a few times a week", icon: "cloud-sun", scores: { wellness: 1 }, next: "wellness_4" },
        { text: "Not much \u2014 mostly indoors", icon: "home", scores: { wellness: 2 }, productBoosts: { "vitamin-d3": 3 }, next: "wellness_4" },
        { text: "Rarely \u2014 I work from home", icon: "laptop", scores: { wellness: 3 }, next: "wellness_3b_indoors" }
      ]
    },
    wellness_3b_indoors: {
      question: "Do you take vitamin D already?",
      subtitle: "With minimal sunlight, this is important to know",
      options: [
        { text: "Yes", icon: "check", scores: { wellness: 1 }, next: "wellness_4" },
        { text: "No", icon: "x-circle", scores: { wellness: 1 }, productBoosts: { "vitamin-d3": 3 }, next: "wellness_4" },
        { text: "Not sure", icon: "help-circle", scores: { wellness: 1 }, productBoosts: { "vitamin-d3": 3 }, next: "wellness_4" }
      ]
    },
    wellness_4: {
      question: "How would you describe your energy levels?",
      subtitle: "Low energy often signals nutritional deficiencies",
      options: [
        { text: "Good \u2014 consistent throughout the day", icon: "battery-full", scores: { wellness: 1 }, next: "wellness_5" },
        { text: "Okay \u2014 occasional dips", icon: "battery-medium", scores: { energy: 1 }, next: "wellness_5" },
        { text: "Low \u2014 I feel tired most days", icon: "battery-low", scores: { energy: 2 }, next: "wellness_5" },
        { text: "Very low \u2014 it\u2019s a real problem", icon: "battery-warning", scores: { energy: 3 }, next: "wellness_5" }
      ]
    },
    wellness_5: {
      question: "How\u2019s your sleep quality?",
      subtitle: "Sleep is when your body does most of its repair work",
      options: [
        { text: "Great \u2014 I sleep deeply", icon: "smile", scores: { wellness: 1 }, next: "wellness_6" },
        { text: "Average \u2014 room for improvement", icon: "meh", scores: { sleep: 1 }, next: "wellness_6" },
        { text: "Poor \u2014 I struggle with sleep", icon: "frown", scores: { sleep: 2 }, next: "wellness_6" },
        { text: "I have specific sleep issues", icon: "moon", scores: { sleep: 3 }, next: "wellness_6" }
      ]
    },
    wellness_6: {
      question: "Do you experience digestive issues?",
      subtitle: "Gut health affects nutrient absorption and immunity",
      options: [
        { text: "No \u2014 digestion is fine", icon: "check", scores: { wellness: 1 }, next: "wellness_8" },
        { text: "Occasional bloating or discomfort", icon: "minus", scores: { wellness: 2 }, next: "wellness_7" },
        { text: "Regular issues \u2014 IBS or sensitivity", icon: "alert-triangle", scores: { wellness: 3 }, next: "wellness_6b_gut" },
        { text: "Significant \u2014 it affects my life", icon: "alert-circle", scores: { wellness: 4 }, next: "wellness_6b_gut" }
      ]
    },
    wellness_6b_gut: {
      question: "Have you tried probiotics before?",
      subtitle: "This helps us recommend the right gut support",
      options: [
        { text: "No \u2014 never tried them", icon: "plus", scores: { wellness: 1 }, productBoosts: { "probiotic-40-billion": 3, "gut-health": 2 }, next: "wellness_7" },
        { text: "Yes \u2014 they helped", icon: "thumbs-up", scores: { wellness: 1 }, productBoosts: { "probiotic-40-billion": 2 }, next: "wellness_7" },
        { text: "Yes \u2014 no difference", icon: "minus", scores: { wellness: 1 }, productBoosts: { "gut-health": 3, "digestive-gut-health-strips": 2 }, next: "wellness_7" }
      ]
    },
    wellness_7: {
      question: "What\u2019s your stress level like?",
      subtitle: "Chronic stress depletes key vitamins and minerals",
      options: [
        { text: "Low \u2014 I manage it well", icon: "heart", scores: { wellness: 1 }, next: "wellness_8" },
        { text: "Moderate \u2014 normal life pressures", icon: "scale", scores: { energy: 1 }, next: "wellness_8" },
        { text: "High \u2014 it\u2019s taking a toll", icon: "alert-triangle", scores: { energy: 2 }, next: "wellness_8" },
        { text: "Very high \u2014 burnout territory", icon: "alert-circle", scores: { energy: 3 }, next: "wellness_8" }
      ]
    },
    wellness_8: {
      question: "How would you rate your overall mood day-to-day?",
      subtitle: "Mood and nutrition are more connected than most people realise",
      options: [
        { text: "Great \u2014 generally positive", icon: "smile", scores: { wellness: 1 }, next: "wellness_9" },
        { text: "Good most days", icon: "meh", scores: { wellness: 1 }, next: "wellness_9" },
        { text: "Up and down \u2014 unpredictable", icon: "trending-down", scores: { wellness: 2, energy: 1 }, next: "wellness_9" },
        { text: "Persistently low", icon: "frown", scores: { wellness: 3, energy: 2 }, next: "wellness_8b_mood" }
      ]
    },
    wellness_8b_mood: {
      question: "How long have you felt this way?",
      subtitle: "Duration helps us understand the right approach",
      options: [
        { text: "Weeks \u2014 it\u2019s recent", icon: "calendar", scores: { wellness: 1 }, next: "wellness_9" },
        { text: "Months", icon: "calendar-check", scores: { wellness: 1 }, productBoosts: { "vitamin-d3": 3, "ashwagandha": 2 }, next: "wellness_9" },
        { text: "A long time", icon: "infinity", scores: { wellness: 2 }, productBoosts: { "vitamin-d3": 3, "complete-multivitamin": 2 }, next: "wellness_9" }
      ]
    },
    wellness_9: {
      question: "Are you concerned about any specific health risks?",
      subtitle: "Targeted support can make a real difference long-term",
      options: [
        { text: "Heart health", icon: "heart-pulse", scores: { wellness: 3 }, next: null },
        { text: "Bone density & joints", icon: "bone", scores: { wellness: 3 }, next: null },
        { text: "Gut health & immunity", icon: "shield", scores: { wellness: 2 }, next: null },
        { text: "No specific concerns", icon: "check", scores: { wellness: 1 }, next: null }
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
              prod.fallbackPrice = '\u00A3' + (dbEntry.price / 100).toFixed(2);
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
          var MAX_COMPLETE = 6;
          var total = Math.min(stack.products.length, MAX_COMPLETE);
          stack.products = stack.products.slice(0, MAX_COMPLETE);
          var essentialCount = Math.min(2, total);
          var recommendedCount = Math.min(4, total);

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
    this.scores = { focus: 0, gym: 0, sleep: 0, energy: 0, wellness: 0 };
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
      // Skip gym training-type questions for sedentary/light users
      if (option.goalKey === 'gym' && this.activityLevel >= 2) {
        nextNode = 'gym_2';
      }
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
          '<h1 class="quiz-welcome__title">Let\u2019s find your perfect stack</h1>' +
          '<p class="quiz-welcome__text">Answer a few quick questions and we\u2019ll build a science-backed supplement plan just for you.</p>' +
          '<p class="quiz-welcome__time"><i data-lucide="clock"></i> Takes 3\u20134 minutes</p>' +
          '<button class="btn btn--primary btn--lg quiz-welcome__cta" data-quiz-start>Start the Quiz</button>' +
          '<p class="quiz-welcome__social">10,000+ personalised stacks built</p>' +
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
    var message = goalEncouragements[goalKey] || "Let\u2019s personalise your stack";
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
      { icon: 'user', text: 'Analysing your wellness profile...' },
      { icon: 'search', text: 'Matching supplements to your goals...' },
      { icon: 'package', text: 'Building your personalised stack...' }
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

  /* ---------- Email Gate (before results) ---------- */
  QuizEngine.prototype.showEmailGate = function() {
    var self = this;

    // Skip if already submitted this session
    if (sessionStorage.getItem('nutrava_quiz_email')) {
      this.showResults();
      return;
    }

    // Blur the quiz container background
    this.container.classList.add('quiz--blurred');

    // Create overlay
    var overlay = document.createElement('div');
    overlay.className = 'quiz-email-overlay';
    overlay.innerHTML =
      '<div class="quiz-email-modal">' +
        '<div class="quiz-email-modal__icon"><i data-lucide="lock"></i></div>' +
        '<h2 class="quiz-email-modal__title">Your results are ready!</h2>' +
        '<p class="quiz-email-modal__text">Enter your email to unlock your personalised supplement plan.</p>' +
        '<form class="quiz-email-modal__form" data-email-form>' +
          '<input type="email" class="quiz-email-modal__input" placeholder="your@email.com" required autocomplete="email" data-email-input />' +
          '<button type="submit" class="btn btn--primary btn--lg quiz-email-modal__btn">See My Results</button>' +
        '</form>' +
        '<p class="quiz-email-modal__disclaimer">We\u2019ll send you a copy of your results. No spam, unsubscribe anytime.</p>' +
      '</div>';

    document.body.appendChild(overlay);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Focus the input
    var input = overlay.querySelector('[data-email-input]');
    if (input) setTimeout(function() { input.focus(); }, 100);

    // Handle form submit
    var form = overlay.querySelector('[data-email-form]');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = input ? input.value.trim() : '';
        if (!email) return;

        // Store email
        sessionStorage.setItem('nutrava_quiz_email', email);

        // Send to Shopify customer API (creates or tags customer)
        self.submitQuizEmail(email);

        // Analytics
        if (typeof gtag === 'function') gtag('event', 'quiz_email_submit', { method: 'email_gate' });
        if (typeof fbq === 'function') fbq('trackCustom', 'QuizEmailCapture');

        // Remove overlay and show results
        self.container.classList.remove('quiz--blurred');
        overlay.classList.add('quiz-email-overlay--closing');
        setTimeout(function() {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          self.showResults();
        }, 300);
      });
    }
  };

  /* ---------- Submit email to Shopify ---------- */
  QuizEngine.prototype.submitQuizEmail = function(email) {
    var topTwo = this.getTopTwo();
    var topCategory = topTwo[0][0];

    // Post to Shopify newsletter / customer creation endpoint
    fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'form_type=customer&utf8=\u2713&customer[email]=' + encodeURIComponent(email) +
            '&customer[tags]=quiz,' + encodeURIComponent(topCategory) +
            '&customer[note]=' + encodeURIComponent('Quiz result: ' + topCategory + ' | Scores: ' + JSON.stringify(this.scores))
    }).catch(function() { /* silent fail */ });
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
    return '\u00A3' + (pence / 100).toFixed(2);
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
        '<span class="quiz-tier__count">' + products.length + ' supplements</span>' +
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
    { key: 'focus', label: 'Focus', icon: 'brain' },
    { key: 'gym', label: 'Performance', icon: 'dumbbell' },
    { key: 'sleep', label: 'Sleep', icon: 'moon' },
    { key: 'energy', label: 'Energy', icon: 'zap' },
    { key: 'wellness', label: 'Wellness', icon: 'leaf' }
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
      focus: { high: 'Cognitive support is your top priority', mid: 'Mental clarity would benefit from support', low: 'Foundational brain health coverage' },
      gym: { high: 'Performance nutrition is key for your goals', mid: 'Targeted training support recommended', low: 'Basic performance foundations' },
      sleep: { high: 'Sleep quality is a primary area to address', mid: 'Recovery and rest need attention', low: 'Sleep foundations in good shape' },
      energy: { high: 'Sustained energy is essential for you', mid: 'Energy patterns could use a boost', low: 'Energy levels well managed' },
      wellness: { high: 'Daily wellness is your core focus', mid: 'Overall health deserves attention', low: 'General wellness foundation' }
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
      '<h3 class="quiz-stats__heading">Your Wellness Profile</h3>' +
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

    var catTestimonials = testimonials[topCategory] || testimonials.wellness;

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
            '<span class="quiz-results__trust-item"><i data-lucide="leaf"></i> No fillers or additives</span>' +
            '<span class="quiz-results__trust-item"><i data-lucide="truck"></i> Free UK shipping</span>' +
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

        '<!-- Social Proof -->' +
        '<div class="quiz-social-proof">' +
          '<p class="quiz-social-proof__heading">Join 10,000+ people optimising their wellness</p>' +
          '<div class="quiz-social-proof__grid">' +
            catTestimonials.map(function(t) {
              return '<div class="quiz-testimonial">' +
                '<div class="quiz-testimonial__stars">' + '\u2605'.repeat(t.stars) + '</div>' +
                '<p class="quiz-testimonial__text">\u201C' + t.text + '\u201D</p>' +
                '<span class="quiz-testimonial__author">' + t.author + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
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
        self.scores = { focus: 0, gym: 0, sleep: 0, energy: 0, wellness: 0 };
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
