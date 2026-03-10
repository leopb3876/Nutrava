/* ==========================================================================
   Nutrava — Adaptive Quiz Engine
   Dynamic branching quiz with confidence-based termination
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Quiz Decision Tree ---------- */
  const CONFIDENCE_THRESHOLD = 16;
  const MAX_QUESTIONS = 16;

  const quizTree = {
    /* ===== Universal Intro Questions ===== */
    start: {
      question: "First, what's your age range?",
      subtitle: "Nutritional needs change with age — this helps us get it right",
      options: [
        { text: "18-24", icon: "user", scores: {}, next: "intro_2" },
        { text: "25-34", icon: "user", scores: { wellness: 1 }, next: "intro_2" },
        { text: "35-44", icon: "user", scores: { wellness: 2 }, next: "intro_2" },
        { text: "45+", icon: "user", scores: { wellness: 3 }, next: "intro_2" }
      ]
    },
    intro_2: {
      question: "How would you describe your current diet?",
      subtitle: "Food is your foundation — supplements fill the gaps",
      options: [
        { text: "Balanced — I eat a good variety", icon: "apple", scores: {}, next: "intro_3" },
        { text: "Mostly healthy but could improve", icon: "salad", scores: { wellness: 1 }, next: "intro_3" },
        { text: "Quite restricted (vegan, keto, IF)", icon: "leaf", scores: { wellness: 2 }, next: "intro_3" },
        { text: "Inconsistent — depends on the week", icon: "shuffle", scores: { energy: 1, wellness: 1 }, next: "intro_3" }
      ]
    },
    intro_3: {
      question: "How physically active are you?",
      subtitle: "Exercise levels affect which supplements benefit you most",
      options: [
        { text: "Very active — 4+ sessions per week", icon: "dumbbell", scores: { gym: 2 }, next: "intro_4" },
        { text: "Moderately active — 2-3 sessions", icon: "footprints", scores: { gym: 1 }, next: "intro_4" },
        { text: "Lightly active — walks and casual", icon: "trees", scores: {}, next: "intro_4" },
        { text: "Sedentary — desk job, minimal exercise", icon: "laptop", scores: { energy: 1 }, next: "intro_4" }
      ]
    },
    intro_4: {
      question: "Are you currently taking any supplements?",
      subtitle: "We want to complement what you already take, not duplicate",
      options: [
        { text: "No — this is my first time", icon: "plus", scores: {}, next: "goal" },
        { text: "Just a basic multivitamin", icon: "pill", scores: {}, next: "goal" },
        { text: "Yes — a few different ones", icon: "package", scores: {}, next: "goal" },
        { text: "Yes but not sure they're working", icon: "help-circle", scores: { wellness: 1 }, next: "goal" }
      ]
    },

    /* ===== Goal Selection ===== */
    goal: {
      question: "What's your main wellness goal?",
      subtitle: "Choose the one that matters most right now",
      options: [
        { text: "Focus & Mental Clarity", icon: "brain", scores: { focus: 5 }, next: "focus_1" },
        { text: "Gym & Performance", icon: "dumbbell", scores: { gym: 5 }, next: "gym_1" },
        { text: "Sleep & Recovery", icon: "moon", scores: { sleep: 5 }, next: "sleep_1" },
        { text: "Energy & Stress", icon: "zap", scores: { energy: 5 }, next: "energy_1" },
        { text: "Daily Wellness", icon: "leaf", scores: { wellness: 5 }, next: "wellness_1" }
      ]
    },

    /* ----- Focus Path (8 questions) ----- */
    focus_1: {
      question: "What do you need focus for?",
      subtitle: "This helps us tailor the right nootropic support",
      options: [
        { text: "Work — deep tasks & meetings", icon: "briefcase", scores: { focus: 3, energy: 1 }, next: "focus_2" },
        { text: "Studying & exams", icon: "book-open", scores: { focus: 3 }, next: "focus_2" },
        { text: "Creative work & flow states", icon: "palette", scores: { focus: 2, energy: 1 }, next: "focus_2" },
        { text: "Gaming & reaction time", icon: "gamepad-2", scores: { focus: 2, energy: 2 }, next: "focus_2" }
      ]
    },
    focus_2: {
      question: "How would you describe your current concentration?",
      subtitle: "Be honest — there's no wrong answer",
      options: [
        { text: "I can focus but it fades quickly", icon: "timer", scores: { focus: 2 }, next: "focus_3" },
        { text: "I get distracted easily", icon: "radar", scores: { focus: 3 }, next: "focus_3" },
        { text: "Brain fog — hard to think clearly", icon: "cloud", scores: { focus: 3, wellness: 1 }, next: "focus_3" },
        { text: "It's okay, I just want an edge", icon: "trending-up", scores: { focus: 1 }, next: "focus_3" }
      ]
    },
    focus_3: {
      question: "How much caffeine do you consume daily?",
      subtitle: "This affects which ingredients work best for you",
      options: [
        { text: "None", icon: "ban", scores: { focus: 1, energy: 1 }, next: "focus_4" },
        { text: "1-2 cups of coffee/tea", icon: "coffee", scores: { focus: 1 }, next: "focus_4" },
        { text: "3-4 cups", icon: "cup-soda", scores: { energy: 2 }, next: "focus_4" },
        { text: "5+ cups — I need it to function", icon: "zap", scores: { energy: 3, sleep: 1 }, next: "focus_4" }
      ]
    },
    focus_4: {
      question: "How many hours do you spend on screens daily?",
      subtitle: "Screen time affects cognitive fatigue and eye health",
      options: [
        { text: "Less than 4 hours", icon: "monitor", scores: { focus: 1 }, next: "focus_5" },
        { text: "4-8 hours", icon: "monitor", scores: { focus: 1, wellness: 1 }, next: "focus_5" },
        { text: "8-12 hours", icon: "monitor", scores: { focus: 2, sleep: 1 }, next: "focus_5" },
        { text: "12+ hours — nearly all day", icon: "monitor", scores: { focus: 2, sleep: 2 }, next: "focus_5" }
      ]
    },
    focus_5: {
      question: "How's your sleep been lately?",
      subtitle: "Sleep quality directly impacts cognitive performance",
      options: [
        { text: "Great — 7-9 hours, feel rested", icon: "smile", scores: { focus: 1 }, next: "focus_6" },
        { text: "Okay — could be better", icon: "meh", scores: { sleep: 1 }, next: "focus_6" },
        { text: "Poor — I struggle to sleep well", icon: "frown", scores: { sleep: 3 }, next: "focus_6" },
        { text: "Inconsistent — varies a lot", icon: "shuffle", scores: { sleep: 2 }, next: "focus_6" }
      ]
    },
    focus_6: {
      question: "Do you experience stress or anxiety regularly?",
      subtitle: "Stress can significantly impact focus and memory",
      options: [
        { text: "Rarely — I manage stress well", icon: "heart", scores: { focus: 1 }, next: "focus_7" },
        { text: "Sometimes — during busy periods", icon: "bar-chart", scores: { energy: 1 }, next: "focus_7" },
        { text: "Often — it affects my daily life", icon: "alert-triangle", scores: { energy: 3 }, next: "focus_7" },
        { text: "Yes — it's a major issue for me", icon: "alert-circle", scores: { energy: 4 }, next: "focus_7" }
      ]
    },
    focus_7: {
      question: "Have you tried nootropics or brain supplements before?",
      subtitle: "This helps us calibrate the right starting point",
      options: [
        { text: "No — completely new to this", icon: "plus", scores: { focus: 1 }, next: "focus_8" },
        { text: "Just caffeine + L-theanine", icon: "coffee", scores: { focus: 1 }, next: "focus_8" },
        { text: "Yes — some worked, some didn't", icon: "flask-conical", scores: { focus: 2 }, next: "focus_8" },
        { text: "Yes — nothing has really worked", icon: "x-circle", scores: { focus: 2, wellness: 1 }, next: "focus_8" }
      ]
    },
    focus_8: {
      question: "Any dietary restrictions or sensitivities?",
      subtitle: "We'll make sure your stack is compatible",
      options: [
        { text: "None", icon: "check", scores: {}, next: null },
        { text: "Vegan / vegetarian", icon: "sprout", scores: { wellness: 1 }, next: null },
        { text: "Gluten or dairy intolerant", icon: "wheat-off", scores: { wellness: 1 }, next: null },
        { text: "Multiple sensitivities", icon: "shield-alert", scores: { wellness: 2 }, next: null }
      ]
    },

    /* ----- Gym Path (8 questions) ----- */
    gym_1: {
      question: "What type of training do you do?",
      subtitle: "Different training styles need different nutritional support",
      options: [
        { text: "Strength / Hypertrophy", icon: "dumbbell", scores: { gym: 3 }, next: "gym_2" },
        { text: "Cardio / Endurance", icon: "heart-pulse", scores: { gym: 2, energy: 1 }, next: "gym_2" },
        { text: "Mixed / CrossFit", icon: "repeat", scores: { gym: 2, energy: 1 }, next: "gym_2" },
        { text: "Sports-specific training", icon: "trophy", scores: { gym: 2 }, next: "gym_2" }
      ]
    },
    gym_2: {
      question: "How often do you train?",
      subtitle: "Training frequency determines recovery needs",
      options: [
        { text: "1-2 times per week", icon: "calendar", scores: { gym: 1 }, next: "gym_3" },
        { text: "3-4 times per week", icon: "calendar-check", scores: { gym: 2 }, next: "gym_3" },
        { text: "5-6 times per week", icon: "calendar-days", scores: { gym: 3 }, next: "gym_3" },
        { text: "Daily / Twice daily", icon: "flame", scores: { gym: 4, sleep: 1 }, next: "gym_3" }
      ]
    },
    gym_3: {
      question: "How's your recovery between sessions?",
      subtitle: "Recovery is where progress actually happens",
      options: [
        { text: "Great — I feel ready each session", icon: "thumbs-up", scores: { gym: 1 }, next: "gym_4" },
        { text: "Often sore for days", icon: "activity", scores: { gym: 2, sleep: 1 }, next: "gym_4" },
        { text: "Joint pain or stiffness", icon: "bone", scores: { gym: 2, wellness: 1 }, next: "gym_4" },
        { text: "I feel run down / overtrained", icon: "battery-low", scores: { gym: 2, sleep: 2, energy: 1 }, next: "gym_4" }
      ]
    },
    gym_4: {
      question: "What's your current diet like?",
      subtitle: "Nutrition is the foundation of performance",
      options: [
        { text: "Dialled in — I track macros", icon: "calculator", scores: { gym: 1 }, next: "gym_5" },
        { text: "Pretty good — mostly healthy", icon: "apple", scores: { gym: 1 }, next: "gym_5" },
        { text: "Could be better — inconsistent", icon: "utensils", scores: { wellness: 1 }, next: "gym_5" },
        { text: "Vegan / Vegetarian", icon: "sprout", scores: { wellness: 2 }, next: "gym_5" }
      ]
    },
    gym_5: {
      question: "How much protein do you consume daily?",
      subtitle: "Protein requirements depend on your training intensity",
      options: [
        { text: "High — I hit my targets consistently", icon: "beef", scores: { gym: 1 }, next: "gym_6" },
        { text: "Moderate — I try but often miss", icon: "egg", scores: { gym: 1 }, next: "gym_6" },
        { text: "Low — I know I don't get enough", icon: "alert-triangle", scores: { gym: 2 }, next: "gym_6" },
        { text: "Not sure — I don't track it", icon: "help-circle", scores: { gym: 1, wellness: 1 }, next: "gym_6" }
      ]
    },
    gym_6: {
      question: "How's your sleep and energy?",
      subtitle: "Recovery happens while you sleep — this affects your results",
      options: [
        { text: "I sleep well and have good energy", icon: "smile", scores: { gym: 1 }, next: "gym_7" },
        { text: "Sleep is okay but energy dips", icon: "meh", scores: { energy: 1 }, next: "gym_7" },
        { text: "Poor sleep — it's hurting my gains", icon: "frown", scores: { sleep: 2 }, next: "gym_7" },
        { text: "Both need serious improvement", icon: "alert-circle", scores: { sleep: 2, energy: 2 }, next: "gym_7" }
      ]
    },
    gym_7: {
      question: "What's your primary gym goal right now?",
      subtitle: "This determines the exact supplements we recommend",
      options: [
        { text: "Build muscle / Get bigger", icon: "trending-up", scores: { gym: 2 }, next: "gym_8" },
        { text: "Lose fat / Get lean", icon: "flame", scores: { gym: 1, energy: 1 }, next: "gym_8" },
        { text: "Improve performance / PRs", icon: "trophy", scores: { gym: 2 }, next: "gym_8" },
        { text: "General fitness / Stay active", icon: "heart-pulse", scores: { gym: 1, wellness: 1 }, next: "gym_8" }
      ]
    },
    gym_8: {
      question: "Any dietary restrictions or sensitivities?",
      subtitle: "We'll make sure your stack is compatible",
      options: [
        { text: "None", icon: "check", scores: {}, next: null },
        { text: "Vegan / vegetarian", icon: "sprout", scores: { wellness: 1 }, next: null },
        { text: "Lactose or dairy intolerant", icon: "milk-off", scores: { wellness: 1 }, next: null },
        { text: "Multiple sensitivities", icon: "shield-alert", scores: { wellness: 2 }, next: null }
      ]
    },

    /* ----- Sleep Path (8 questions) ----- */
    sleep_1: {
      question: "What's your biggest sleep struggle?",
      subtitle: "Understanding the problem helps us find the right solution",
      options: [
        { text: "Trouble falling asleep", icon: "bed", scores: { sleep: 3 }, next: "sleep_2" },
        { text: "Waking up during the night", icon: "moon", scores: { sleep: 3 }, next: "sleep_2" },
        { text: "Not feeling rested in the morning", icon: "alarm-clock", scores: { sleep: 2, energy: 1 }, next: "sleep_2" },
        { text: "Racing mind at bedtime", icon: "brain", scores: { sleep: 2, energy: 1 }, next: "sleep_2" }
      ]
    },
    sleep_2: {
      question: "How many hours of sleep do you typically get?",
      subtitle: "Most adults need 7-9 hours for optimal health",
      options: [
        { text: "Less than 5 hours", icon: "alert-circle", scores: { sleep: 4, energy: 2 }, next: "sleep_3" },
        { text: "5-6 hours", icon: "clock", scores: { sleep: 3 }, next: "sleep_3" },
        { text: "6-7 hours", icon: "timer", scores: { sleep: 2 }, next: "sleep_3" },
        { text: "7+ hours but still tired", icon: "help-circle", scores: { sleep: 2, wellness: 1 }, next: "sleep_3" }
      ]
    },
    sleep_3: {
      question: "What time do you typically go to bed?",
      subtitle: "Your circadian rhythm affects which sleep supplements work best",
      options: [
        { text: "Before 10pm", icon: "sunset", scores: { sleep: 1 }, next: "sleep_4" },
        { text: "10pm - 11pm", icon: "clock", scores: { sleep: 1 }, next: "sleep_4" },
        { text: "11pm - midnight", icon: "moon", scores: { sleep: 2 }, next: "sleep_4" },
        { text: "After midnight — I'm a night owl", icon: "star", scores: { sleep: 2, energy: 1 }, next: "sleep_4" }
      ]
    },
    sleep_4: {
      question: "Do you use screens within an hour of bedtime?",
      subtitle: "Blue light affects melatonin production",
      options: [
        { text: "Yes — phone, laptop, or TV", icon: "smartphone", scores: { sleep: 2 }, next: "sleep_5" },
        { text: "Sometimes", icon: "monitor", scores: { sleep: 1 }, next: "sleep_5" },
        { text: "No — I have a wind-down routine", icon: "book-open", scores: { sleep: 1 }, next: "sleep_5" }
      ]
    },
    sleep_5: {
      question: "How's your stress level?",
      subtitle: "Cortisol can significantly disrupt sleep patterns",
      options: [
        { text: "Low — I'm pretty relaxed", icon: "heart", scores: { sleep: 1 }, next: "sleep_6" },
        { text: "Moderate — manageable", icon: "scale", scores: { energy: 1 }, next: "sleep_6" },
        { text: "High — it keeps me up at night", icon: "alert-triangle", scores: { energy: 3, sleep: 1 }, next: "sleep_6" },
        { text: "Very high — I'm overwhelmed", icon: "alert-circle", scores: { energy: 4, sleep: 1 }, next: "sleep_6" }
      ]
    },
    sleep_6: {
      question: "Do you exercise regularly?",
      subtitle: "Physical activity has a big impact on sleep quality",
      options: [
        { text: "Yes — 3+ times per week", icon: "dumbbell", scores: { gym: 1 }, next: "sleep_7" },
        { text: "Sometimes — 1-2 times", icon: "footprints", scores: {}, next: "sleep_7" },
        { text: "Rarely — struggling to start", icon: "clock", scores: { energy: 1 }, next: "sleep_7" },
        { text: "No — too tired to exercise", icon: "battery-low", scores: { energy: 2 }, next: "sleep_7" }
      ]
    },
    sleep_7: {
      question: "Have you tried any sleep supplements before?",
      subtitle: "This helps us avoid recommending what hasn't worked",
      options: [
        { text: "No — this would be my first", icon: "plus", scores: { sleep: 1 }, next: "sleep_8" },
        { text: "Melatonin — it helped a bit", icon: "pill", scores: { sleep: 1 }, next: "sleep_8" },
        { text: "Melatonin — didn't help", icon: "x-circle", scores: { sleep: 2 }, next: "sleep_8" },
        { text: "Yes — various things", icon: "package", scores: { sleep: 2 }, next: "sleep_8" }
      ]
    },
    sleep_8: {
      question: "Any dietary restrictions or sensitivities?",
      subtitle: "We'll make sure your stack is compatible",
      options: [
        { text: "None", icon: "check", scores: {}, next: null },
        { text: "Vegan / vegetarian", icon: "sprout", scores: { wellness: 1 }, next: null },
        { text: "Gluten or dairy intolerant", icon: "wheat-off", scores: { wellness: 1 }, next: null },
        { text: "Multiple sensitivities", icon: "shield-alert", scores: { wellness: 2 }, next: null }
      ]
    },

    /* ----- Energy Path (8 questions) ----- */
    energy_1: {
      question: "When do you feel most drained?",
      subtitle: "Energy patterns reveal what your body needs",
      options: [
        { text: "Morning — hard to get going", icon: "sunrise", scores: { energy: 3, sleep: 1 }, next: "energy_2" },
        { text: "Afternoon — the 2pm crash", icon: "clock", scores: { energy: 3 }, next: "energy_2" },
        { text: "Evening — exhausted after work", icon: "sunset", scores: { energy: 2, sleep: 1 }, next: "energy_2" },
        { text: "All day — constantly low", icon: "battery-low", scores: { energy: 4, wellness: 1 }, next: "energy_2" }
      ]
    },
    energy_2: {
      question: "How would you rate your stress level?",
      subtitle: "Chronic stress drains energy reserves",
      options: [
        { text: "Low — I'm fairly relaxed", icon: "heart", scores: { energy: 1 }, next: "energy_3" },
        { text: "Moderate — work/life pressure", icon: "scale", scores: { energy: 2 }, next: "energy_3" },
        { text: "High — I feel wired but tired", icon: "zap", scores: { energy: 3 }, next: "energy_3" },
        { text: "Burnout level", icon: "flame", scores: { energy: 4, sleep: 1 }, next: "energy_3" }
      ]
    },
    energy_3: {
      question: "How much water do you drink daily?",
      subtitle: "Dehydration is the #1 hidden cause of fatigue",
      options: [
        { text: "Plenty — 2+ litres", icon: "droplets", scores: { energy: 1 }, next: "energy_4" },
        { text: "Some — about 1 litre", icon: "droplet", scores: { energy: 1, wellness: 1 }, next: "energy_4" },
        { text: "Not enough — I forget to drink", icon: "cloud-off", scores: { wellness: 2 }, next: "energy_4" }
      ]
    },
    energy_4: {
      question: "How much caffeine do you rely on?",
      subtitle: "Caffeine dependency can mask underlying issues",
      options: [
        { text: "None — I avoid it", icon: "ban", scores: { energy: 1 }, next: "energy_5" },
        { text: "1-2 cups — keeps me going", icon: "coffee", scores: { energy: 1 }, next: "energy_5" },
        { text: "3-4 cups — can't function without it", icon: "cup-soda", scores: { energy: 2 }, next: "energy_5" },
        { text: "5+ cups and still crashing", icon: "zap", scores: { energy: 3, sleep: 1 }, next: "energy_5" }
      ]
    },
    energy_5: {
      question: "How's your sleep quality?",
      subtitle: "Poor sleep is the most common cause of low energy",
      options: [
        { text: "Great — I wake up refreshed", icon: "smile", scores: { energy: 1 }, next: "energy_6" },
        { text: "Average — could be better", icon: "meh", scores: { sleep: 1 }, next: "energy_6" },
        { text: "Poor — I rarely feel rested", icon: "frown", scores: { sleep: 3 }, next: "energy_6" },
        { text: "Terrible — barely sleeping", icon: "alert-circle", scores: { sleep: 4 }, next: "energy_6" }
      ]
    },
    energy_6: {
      question: "How does low energy affect your daily life?",
      subtitle: "Understanding the impact helps us prioritise",
      options: [
        { text: "Mild — I push through it", icon: "trending-up", scores: { energy: 1 }, next: "energy_7" },
        { text: "Moderate — it slows me down", icon: "minus", scores: { energy: 2 }, next: "energy_7" },
        { text: "Significant — affects work/relationships", icon: "alert-triangle", scores: { energy: 3 }, next: "energy_7" },
        { text: "Severe — I've had to change my lifestyle", icon: "alert-circle", scores: { energy: 4 }, next: "energy_7" }
      ]
    },
    energy_7: {
      question: "Do you exercise regularly?",
      subtitle: "Exercise actually boosts long-term energy levels",
      options: [
        { text: "Yes — 3+ times per week", icon: "dumbbell", scores: { gym: 1 }, next: "energy_8" },
        { text: "Sometimes — 1-2 times per week", icon: "footprints", scores: { energy: 1 }, next: "energy_8" },
        { text: "Rarely — I struggle to find time", icon: "clock", scores: { energy: 1 }, next: "energy_8" },
        { text: "No — I'm too tired to exercise", icon: "battery-low", scores: { energy: 2, sleep: 1 }, next: "energy_8" }
      ]
    },
    energy_8: {
      question: "Any dietary restrictions or sensitivities?",
      subtitle: "We'll make sure your stack is compatible",
      options: [
        { text: "None", icon: "check", scores: {}, next: null },
        { text: "Vegan / vegetarian", icon: "sprout", scores: { wellness: 1 }, next: null },
        { text: "Gluten or dairy intolerant", icon: "wheat-off", scores: { wellness: 1 }, next: null },
        { text: "Multiple sensitivities", icon: "shield-alert", scores: { wellness: 2 }, next: null }
      ]
    },

    /* ----- Wellness Path (8 questions) ----- */
    wellness_1: {
      question: "What's your main wellness concern?",
      subtitle: "Let's narrow down what matters most to you",
      options: [
        { text: "Immune support — I get sick easily", icon: "shield", scores: { wellness: 3 }, next: "wellness_2" },
        { text: "Gut health — digestion issues", icon: "heart-pulse", scores: { wellness: 3 }, next: "wellness_2" },
        { text: "General vitality — just feel better", icon: "sparkles", scores: { wellness: 2 }, next: "wellness_2" },
        { text: "Healthy aging — long-term health", icon: "trees", scores: { wellness: 2 }, next: "wellness_2" }
      ]
    },
    wellness_2: {
      question: "How often do you get sick?",
      subtitle: "Illness frequency tells us about immune function",
      options: [
        { text: "Rarely — maybe once a year", icon: "shield-check", scores: { wellness: 1 }, next: "wellness_3" },
        { text: "Occasionally — a few colds per year", icon: "thermometer", scores: { wellness: 2 }, next: "wellness_3" },
        { text: "Often — I catch everything going around", icon: "alert-triangle", scores: { wellness: 3 }, next: "wellness_3" },
        { text: "Frequently — it's frustrating", icon: "alert-circle", scores: { wellness: 4 }, next: "wellness_3" }
      ]
    },
    wellness_3: {
      question: "Do you spend much time outdoors?",
      subtitle: "Sunlight exposure affects vitamin D and mood",
      options: [
        { text: "Yes — I'm outside daily", icon: "sun", scores: { wellness: 1 }, next: "wellness_4" },
        { text: "Some — a few times a week", icon: "cloud-sun", scores: { wellness: 1 }, next: "wellness_4" },
        { text: "Not much — mostly indoors", icon: "home", scores: { wellness: 2 }, next: "wellness_4" },
        { text: "Rarely — I work from home", icon: "laptop", scores: { wellness: 3 }, next: "wellness_4" }
      ]
    },
    wellness_4: {
      question: "How would you describe your energy levels?",
      subtitle: "Low energy often signals nutritional deficiencies",
      options: [
        { text: "Good — consistent throughout the day", icon: "battery-full", scores: { wellness: 1 }, next: "wellness_5" },
        { text: "Okay — occasional dips", icon: "battery-medium", scores: { energy: 1 }, next: "wellness_5" },
        { text: "Low — I feel tired most days", icon: "battery-low", scores: { energy: 2 }, next: "wellness_5" },
        { text: "Very low — it's a real problem", icon: "battery-warning", scores: { energy: 3 }, next: "wellness_5" }
      ]
    },
    wellness_5: {
      question: "How's your sleep quality?",
      subtitle: "Sleep is when your body does most of its repair work",
      options: [
        { text: "Great — I sleep deeply", icon: "smile", scores: { wellness: 1 }, next: "wellness_6" },
        { text: "Average — room for improvement", icon: "meh", scores: { sleep: 1 }, next: "wellness_6" },
        { text: "Poor — I struggle with sleep", icon: "frown", scores: { sleep: 2 }, next: "wellness_6" },
        { text: "I have specific sleep issues", icon: "moon", scores: { sleep: 3 }, next: "wellness_6" }
      ]
    },
    wellness_6: {
      question: "Do you experience digestive issues?",
      subtitle: "Gut health affects nutrient absorption and immunity",
      options: [
        { text: "No — digestion is fine", icon: "check", scores: { wellness: 1 }, next: "wellness_7" },
        { text: "Occasional bloating or discomfort", icon: "minus", scores: { wellness: 2 }, next: "wellness_7" },
        { text: "Regular issues — IBS or sensitivity", icon: "alert-triangle", scores: { wellness: 3 }, next: "wellness_7" },
        { text: "Significant — it affects my life", icon: "alert-circle", scores: { wellness: 4 }, next: "wellness_7" }
      ]
    },
    wellness_7: {
      question: "What's your stress level like?",
      subtitle: "Chronic stress depletes key vitamins and minerals",
      options: [
        { text: "Low — I manage it well", icon: "heart", scores: { wellness: 1 }, next: "wellness_8" },
        { text: "Moderate — normal life pressures", icon: "scale", scores: { energy: 1 }, next: "wellness_8" },
        { text: "High — it's taking a toll", icon: "alert-triangle", scores: { energy: 2 }, next: "wellness_8" },
        { text: "Very high — burnout territory", icon: "alert-circle", scores: { energy: 3 }, next: "wellness_8" }
      ]
    },
    wellness_8: {
      question: "Any dietary restrictions or sensitivities?",
      subtitle: "We'll make sure your stack is compatible",
      options: [
        { text: "None", icon: "check", scores: {}, next: null },
        { text: "Vegan / vegetarian", icon: "sprout", scores: { wellness: 1 }, next: null },
        { text: "Gluten or dairy intolerant", icon: "wheat-off", scores: { wellness: 1 }, next: null },
        { text: "Multiple sensitivities", icon: "shield-alert", scores: { wellness: 2 }, next: null }
      ]
    }
  };

  /* ---------- Stack Recommendations ---------- */
  const stackRecommendations = {
    focus: {
      name: "Your Focus & Clarity Stack",
      handle: "focus-stack",
      description: "Personalised for your cognitive goals — sharpen your mind with science-backed nootropics",
      products: [
        { name: "Lion's Mane Complex", handle: "placeholder-supplement-1", benefit: "Cognitive function & memory", price: "£14.99" },
        { name: "L-Theanine + Caffeine", handle: "placeholder-supplement-2", benefit: "Calm focus without jitters", price: "£12.99" },
        { name: "Omega-3 DHA", handle: "placeholder-supplement-3", benefit: "Brain health & clarity", price: "£16.99" },
        { name: "Bacopa Monnieri", handle: "placeholder-supplement-4", benefit: "Memory consolidation", price: "£13.99" },
        { name: "Phosphatidylserine", handle: "placeholder-supplement-5", benefit: "Cognitive support & recall", price: "£15.99" }
      ],
      tiers: {
        essential:   { label: "Essential",   tag: null,           productIndices: [0, 1] },
        recommended: { label: "Recommended", tag: "Most Popular", productIndices: [0, 1, 2] },
        complete:    { label: "Complete",    tag: "Best Value",   productIndices: [0, 1, 2, 3, 4] }
      }
    },
    gym: {
      name: "Your Performance Stack",
      handle: "gym-performance-stack",
      description: "Personalised for your training — train harder, recover faster, build more muscle",
      products: [
        { name: "Creatine Monohydrate", handle: "placeholder-supplement-1", benefit: "Strength & power output", price: "£12.99" },
        { name: "Whey Protein Isolate", handle: "placeholder-supplement-2", benefit: "Muscle recovery & growth", price: "£24.99" },
        { name: "BCAA Complex", handle: "placeholder-supplement-3", benefit: "Reduce soreness & fatigue", price: "£18.99" },
        { name: "Beta-Alanine", handle: "placeholder-supplement-4", benefit: "Endurance & muscular stamina", price: "£11.99" },
        { name: "Vitamin D3", handle: "placeholder-supplement-5", benefit: "Muscle function & recovery", price: "£9.99" }
      ],
      tiers: {
        essential:   { label: "Essential",   tag: null,           productIndices: [0, 1] },
        recommended: { label: "Recommended", tag: "Most Popular", productIndices: [0, 1, 2] },
        complete:    { label: "Complete",    tag: "Best Value",   productIndices: [0, 1, 2, 3, 4] }
      }
    },
    sleep: {
      name: "Your Sleep & Recovery Stack",
      handle: "sleep-recovery-stack",
      description: "Personalised for your sleep patterns — fall asleep faster, wake up feeling rested",
      products: [
        { name: "Magnesium Glycinate", handle: "placeholder-supplement-1", benefit: "Muscle relaxation & calm", price: "£11.99" },
        { name: "Ashwagandha KSM-66", handle: "placeholder-supplement-2", benefit: "Reduce cortisol & stress", price: "£15.99" },
        { name: "L-Theanine", handle: "placeholder-supplement-3", benefit: "Promote relaxation", price: "£10.99" },
        { name: "Valerian Root", handle: "placeholder-supplement-4", benefit: "Natural sleep aid", price: "£9.99" },
        { name: "Tart Cherry Extract", handle: "placeholder-supplement-5", benefit: "Melatonin & recovery", price: "£12.99" }
      ],
      tiers: {
        essential:   { label: "Essential",   tag: null,           productIndices: [0, 1] },
        recommended: { label: "Recommended", tag: "Most Popular", productIndices: [0, 1, 2] },
        complete:    { label: "Complete",    tag: "Best Value",   productIndices: [0, 1, 2, 3, 4] }
      }
    },
    energy: {
      name: "Your Energy & Resilience Stack",
      handle: "stress-energy-stack",
      description: "Personalised for your energy needs — sustained energy and stress resilience all day",
      products: [
        { name: "Rhodiola Rosea", handle: "placeholder-supplement-1", benefit: "Adaptogenic stress support", price: "£13.99" },
        { name: "B-Complex", handle: "placeholder-supplement-2", benefit: "Energy metabolism", price: "£9.99" },
        { name: "CoQ10", handle: "placeholder-supplement-3", benefit: "Cellular energy production", price: "£17.99" },
        { name: "Iron Bisglycinate", handle: "placeholder-supplement-4", benefit: "Oxygen transport & energy", price: "£8.99" },
        { name: "Ashwagandha KSM-66", handle: "placeholder-supplement-5", benefit: "Adaptogenic resilience", price: "£15.99" }
      ],
      tiers: {
        essential:   { label: "Essential",   tag: null,           productIndices: [0, 1] },
        recommended: { label: "Recommended", tag: "Most Popular", productIndices: [0, 1, 2] },
        complete:    { label: "Complete",    tag: "Best Value",   productIndices: [0, 1, 2, 3, 4] }
      }
    },
    wellness: {
      name: "Your Daily Wellness Stack",
      handle: "daily-wellness-stack",
      description: "Personalised for your lifestyle — your daily foundation for optimal health",
      products: [
        { name: "Vitamin D3 + K2", handle: "placeholder-supplement-1", benefit: "Immune & bone health", price: "£11.99" },
        { name: "Probiotic Complex", handle: "placeholder-supplement-2", benefit: "Gut health & immunity", price: "£16.99" },
        { name: "Zinc + Vitamin C", handle: "placeholder-supplement-3", benefit: "Immune defence", price: "£9.99" },
        { name: "Omega-3 Fish Oil", handle: "placeholder-supplement-4", benefit: "Inflammation & heart health", price: "£14.99" },
        { name: "Magnesium Glycinate", handle: "placeholder-supplement-5", benefit: "Muscle & nerve function", price: "£11.99" }
      ],
      tiers: {
        essential:   { label: "Essential",   tag: null,           productIndices: [0, 1] },
        recommended: { label: "Recommended", tag: "Most Popular", productIndices: [0, 1, 2] },
        complete:    { label: "Complete",    tag: "Best Value",   productIndices: [0, 1, 2, 3, 4] }
      }
    }
  };

  /* ---------- Quiz Engine ---------- */
  class QuizEngine {
    constructor(container) {
      this.container = container;
      this.scores = { focus: 0, gym: 0, sleep: 0, energy: 0, wellness: 0 };
      this.history = [];
      this.currentNodeId = 'start';
      this.questionsAnswered = 0;
      this.render();
    }

    getTopCategory() {
      return Object.entries(this.scores).sort((a, b) => b[1] - a[1])[0];
    }

    shouldTerminate() {
      const [, topScore] = this.getTopCategory();
      const currentNode = quizTree[this.currentNodeId];
      const noMoreQuestions = !currentNode;
      return topScore >= CONFIDENCE_THRESHOLD || this.questionsAnswered >= MAX_QUESTIONS || noMoreQuestions;
    }

    getEstimatedProgress() {
      const [, topScore] = this.getTopCategory();
      const progressByConfidence = Math.min(topScore / CONFIDENCE_THRESHOLD, 1);
      const progressByQuestions = this.questionsAnswered / MAX_QUESTIONS;
      return Math.max(progressByConfidence, progressByQuestions);
    }

    selectAnswer(optionIndex) {
      const node = quizTree[this.currentNodeId];
      const option = node.options[optionIndex];

      this.history.push({
        nodeId: this.currentNodeId,
        optionIndex,
        scores: { ...this.scores }
      });

      Object.entries(option.scores).forEach(([key, value]) => {
        this.scores[key] = (this.scores[key] || 0) + value;
      });

      this.questionsAnswered++;
      this.currentNodeId = option.next;

      if (this.shouldTerminate()) {
        this.showAnalysing();
      } else {
        this.render();
      }
    }

    goBack() {
      if (this.history.length === 0) return;
      const previous = this.history.pop();
      this.currentNodeId = previous.nodeId;
      this.scores = previous.scores;
      this.questionsAnswered--;
      this.render();
    }

    showAnalysing() {
      this.container.innerHTML = `
        <div class="quiz-screen">
          <div class="quiz-progress">
            <div class="quiz-progress__bar" style="width: 100%"></div>
          </div>
          <div class="quiz-analysing">
            <div class="quiz-analysing__icon">
              <i data-lucide="scan-search"></i>
            </div>
            <h2 class="quiz-analysing__title">Analysing your answers</h2>
            <p class="quiz-analysing__text">Building your personalised supplement stack...</p>
            <div class="quiz-analysing__dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      setTimeout(() => this.showResults(), 2500);
    }

    render() {
      const node = quizTree[this.currentNodeId];
      if (!node) {
        this.showAnalysing();
        return;
      }

      const progress = this.getEstimatedProgress();

      this.container.innerHTML = `
        <div class="quiz-screen">
          <div class="quiz-progress">
            <div class="quiz-progress__bar" style="width: ${progress * 100}%"></div>
          </div>
          <div class="quiz-screen__inner">
            <div class="quiz-screen__header">
              ${this.history.length > 0
                ? `<button class="quiz-back" data-quiz-back>&larr; Back</button>`
                : '<span></span>'
              }
              <span class="quiz-step">${this.questionsAnswered + 1}</span>
            </div>
            <h2 class="quiz-question">${node.question}</h2>
            ${node.subtitle ? `<p class="quiz-subtitle">${node.subtitle}</p>` : ''}
            <div class="quiz-options">
              ${node.options.map((opt, i) => `
                <button class="quiz-option" data-quiz-option="${i}">
                  <span class="quiz-option__icon"><i data-lucide="${opt.icon}"></i></span>
                  <span class="quiz-option__text">${opt.text}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      /* Render Lucide icons */
      if (typeof lucide !== 'undefined') lucide.createIcons();

      this.container.querySelectorAll('[data-quiz-option]').forEach((btn) => {
        btn.addEventListener('click', () => {
          btn.classList.add('quiz-option--selected');
          setTimeout(() => {
            this.selectAnswer(parseInt(btn.dataset.quizOption, 10));
          }, 300);
        });
      });

      const backBtn = this.container.querySelector('[data-quiz-back]');
      if (backBtn) {
        backBtn.addEventListener('click', () => this.goBack());
      }
    }

    getTierPrice(stack, tierKey) {
      const tier = stack.tiers[tierKey];
      return tier.productIndices.reduce((sum, i) => {
        return sum + parseFloat(stack.products[i].price.replace('£', ''));
      }, 0);
    }

    renderTierCard(stack, tierKey, isRecommended) {
      const tier = stack.tiers[tierKey];
      const products = tier.productIndices.map(i => stack.products[i]);
      const price = this.getTierPrice(stack, tierKey);

      return `
        <div class="quiz-tier ${isRecommended ? 'quiz-tier--recommended' : ''}">
          ${tier.tag ? `<span class="quiz-tier__badge">${tier.tag}</span>` : ''}
          <h3 class="quiz-tier__name">${tier.label}</h3>
          <div class="quiz-tier__price">
            <span class="quiz-tier__amount">&pound;${price.toFixed(2)}</span>
            <span class="quiz-tier__count">${products.length} supplements</span>
          </div>
          <ul class="quiz-tier__products">
            ${products.map(p => `
              <li class="quiz-tier__product">
                <i data-lucide="check" class="quiz-tier__check"></i>
                <span>${p.name}</span>
              </li>
            `).join('')}
          </ul>
          <button class="btn ${isRecommended ? 'btn--primary' : 'btn--outline'} quiz-tier__cta" data-tier-add="${tierKey}">
            Add to Cart
          </button>
        </div>
      `;
    }

    showResults() {
      const [topCategory] = this.getTopCategory();
      const stack = stackRecommendations[topCategory];

      this.container.innerHTML = `
        <div class="quiz-results-page">
          <div class="quiz-progress">
            <div class="quiz-progress__bar" style="width: 100%"></div>
          </div>

          <!-- Header -->
          <div class="quiz-results__header">
            <div class="quiz-results__icon"><i data-lucide="sparkles"></i></div>
            <h2 class="quiz-results__title">${stack.name}</h2>
            <p class="quiz-results__subtitle">${stack.description}</p>
            <div class="quiz-results__trust">
              <span class="quiz-results__trust-item"><i data-lucide="shield-check"></i> Third-party tested</span>
              <span class="quiz-results__trust-item"><i data-lucide="leaf"></i> No fillers</span>
              <span class="quiz-results__trust-item"><i data-lucide="truck"></i> Free UK shipping</span>
            </div>
          </div>

          <!-- Tier Cards -->
          <div class="quiz-tiers">
            ${this.renderTierCard(stack, 'essential', false)}
            ${this.renderTierCard(stack, 'recommended', true)}
            ${this.renderTierCard(stack, 'complete', false)}
          </div>

          <!-- Individual Products -->
          <div class="quiz-individuals">
            <h3 class="quiz-individuals__heading">Or buy individually</h3>
            <div class="quiz-individuals__grid">
              ${stack.products.map((product) => `
                <div class="quiz-individual">
                  <div class="quiz-individual__image">
                    <svg width="32" height="44" viewBox="0 0 32 44" fill="none">
                      <rect width="32" height="44" rx="6" fill="rgba(194,212,181,0.3)"/>
                    </svg>
                  </div>
                  <strong class="quiz-individual__name">${product.name}</strong>
                  <span class="quiz-individual__benefit">${product.benefit}</span>
                  <span class="quiz-individual__price">${product.price}</span>
                  <button class="btn btn--sm btn--outline quiz-individual__cta" data-product-add="${product.handle}">
                    Add to Cart
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Retake -->
          <div class="quiz-results__footer">
            <button class="quiz-retake-btn" data-quiz-retake>Retake Quiz</button>
          </div>
        </div>
      `;

      /* Render Lucide icons */
      if (typeof lucide !== 'undefined') lucide.createIcons();

      /* --- Wire up Add to Cart: Tier buttons --- */
      this.container.querySelectorAll('[data-tier-add]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tierKey = btn.dataset.tierAdd;
          const tier = stack.tiers[tierKey];
          const products = tier.productIndices.map(i => stack.products[i]);
          if (typeof NutravaCart !== 'undefined') {
            NutravaCart.addItems(products.map(p => ({
              handle: p.handle,
              title: p.name,
              price: p.price,
              quantity: 1
            })));
          }
        });
      });

      /* --- Wire up Add to Cart: Individual product buttons --- */
      this.container.querySelectorAll('[data-product-add]').forEach(btn => {
        btn.addEventListener('click', () => {
          const handle = btn.dataset.productAdd;
          const product = stack.products.find(p => p.handle === handle);
          if (product && typeof NutravaCart !== 'undefined') {
            NutravaCart.addItem({
              handle: product.handle,
              title: product.name,
              price: product.price,
              quantity: 1
            });
          }
        });
      });

      /* --- Retake quiz --- */
      const retakeBtn = this.container.querySelector('[data-quiz-retake]');
      if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
          this.scores = { focus: 0, gym: 0, sleep: 0, energy: 0, wellness: 0 };
          this.history = [];
          this.currentNodeId = 'start';
          this.questionsAnswered = 0;
          this.render();
        });
      }
    }
  }

  /* ---------- Initialize ---------- */
  const quizContainer = document.querySelector('[data-quiz-container]');
  if (quizContainer) {
    new QuizEngine(quizContainer);
  }
})();
