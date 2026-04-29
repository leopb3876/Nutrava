  // ============================================================
  // Quiz flow controller
  // ============================================================
  (function () {

    // ============================================================
    // INGREDIENT MATCH SCORING
    // Real scoring: each quiz answer adds points to specific
    // ingredients. After all 9 answers, totals are sorted, top 5
    // are kept, normalized so the top match displays at 92%.
    // ============================================================

    const INGREDIENTS = {
      niacinamide: {
        abbr: "B3",
        name: "Niacinamide",
        role: "Pore-refining oil-balancer",
        why: "Hits multiple concerns at once — pore congestion, post-acne tone and barrier support — without triggering sensitivity.",
        base: 25,
        howItWorks: "A form of vitamin B3 that signals skin cells to slow sebum production, strengthen the lipid barrier, and reduce the appearance of pores. Also inhibits melanin transfer — which is why it fades post-acne marks over time.",
        bestUsed: "AM and PM, applied before moisturiser. Plays nicely with vitamin C, retinol, and exfoliating acids — despite the old internet myth that you can't layer it.",
        clinical: "Studied in 100+ peer-reviewed papers. Effective at 2–10% concentration. Our formula sits in the clinically meaningful range — not the symbolic 'trace amount' found on most product labels.",
        products: ["Niacinamide Gel Moisturiser"]
      },
      teaTree: {
        abbr: "TT",
        name: "Tea Tree",
        role: "Clarifying",
        why: "A gentle clarifier for active blemishes — works on visible blemishes without stripping the rest of your face.",
        base: 5,
        howItWorks: "An essential oil with terpinen-4-ol that targets P. acnes bacteria — the same bacteria prescription antibiotics treat — but at a much gentler dose. Reduces inflammation around active blemishes.",
        bestUsed: "As a spot treatment on active blemishes, or diluted in a daily wash. Skip on the same night as retinol to avoid layered irritation.",
        clinical: "5% tea tree oil shown comparable to 5% benzoyl peroxide for mild-to-moderate acne, with significantly less irritation.<cite>— Med J Aust, 1990</cite>",
        products: ["Blemish Purifying Face Wash"]
      },
      ceramides: {
        abbr: "Cer",
        name: "Ceramides",
        role: "Barrier support",
        why: "Strengthens your moisture barrier so the actives in your routine can do their work without irritation.",
        base: 20,
        howItWorks: "Lipid molecules that already exist in your skin barrier, gluing skin cells together to keep moisture in and irritants out. Topical ceramides replenish what's lost from cleansing, weather, and aging.",
        bestUsed: "AM and PM in moisturiser. Especially helpful when starting a new active — they pre-empt the irritation that often makes people quit after a week.",
        clinical: "Skin with damaged barrier function has up to 50% lower ceramide levels. Topical replacement restores barrier integrity within 4 weeks of consistent use.",
        products: ["Niacinamide Gel Moisturiser", "Sensitive Skin Moisturiser"]
      },
      hyaluronicAcid: {
        abbr: "HA",
        name: "Hyaluronic Acid",
        role: "Hydration",
        why: "Hydrates without adding oil — the unlock for combination skin that needs moisture without feeding congestion.",
        base: 22,
        howItWorks: "A naturally-occurring molecule that holds up to 1,000× its weight in water. Different molecular sizes hydrate different layers — the smaller weights penetrate deeper, the larger weights cushion the surface.",
        bestUsed: "AM and PM on damp skin — it pulls moisture from the air, so works best in humid environments. In dry climates, apply to wet skin then seal with cream.",
        clinical: "Topical HA increases skin hydration by 30–55% within 8 hours of application. Effect compounds with regular use.",
        products: ["Niacinamide Gel Moisturiser", "Moisturising Day Cream"]
      },
      kojicAcid: {
        abbr: "KA",
        name: "Kojic Acid",
        role: "Tone correction",
        why: "Targets the post-acne marks left behind from past breakouts — fades stubborn pigmentation over consistent use.",
        base: 3,
        howItWorks: "A fungal-derived compound that inhibits tyrosinase — the enzyme responsible for melanin production. Slows new pigmentation while existing pigment fades through normal cell turnover.",
        bestUsed: "PM only, applied directly to dark spots. SPF non-negotiable in the morning — without it, kojic acid is wasted effort because new UV creates new pigment faster than you can fade old.",
        clinical: "1–2% kojic acid as effective as 4% hydroquinone for melasma and post-inflammatory hyperpigmentation, with significantly fewer side effects.<cite>— J Clin Aesthet Dermatol, 2017</cite>",
        products: ["Targeted Dark Spot Care", "Brightening Exfoliator"]
      },
      vitaminC: {
        abbr: "C",
        name: "Vitamin C",
        role: "Brightening antioxidant",
        why: "Fades existing dark spots, evens tone, and shields skin from new daily damage that creates new marks.",
        base: 12,
        howItWorks: "L-ascorbic acid neutralises free radicals from UV and pollution before they damage skin cells. Inhibits melanin production at the source, slowing new pigmentation while existing fades.",
        bestUsed: "AM under sunscreen for maximum antioxidant protection. Pairs especially well with SPF — they reinforce each other against UV damage.",
        clinical: "10–20% L-ascorbic acid clinically shown to reduce hyperpigmentation by ~35% over 12 weeks of consistent use.",
        products: ["Vitamin C Serum"]
      },
      retinolAlt: {
        abbr: "RA",
        name: "Retinol Alternative",
        role: "Gentle anti-aging",
        why: "All the smoothing benefits of retinol — without the redness, peeling or downtime. Safe for sensitive and pregnancy-conscious users.",
        base: 8,
        howItWorks: "Plant-derived bakuchiol triggers similar cell-turnover and collagen pathways as traditional retinol, but without binding the same skin receptors that cause irritation.",
        bestUsed: "PM nightly. Build up gradually — start 2–3 nights/week. Pairs cleanly with peptides for a full anti-aging stack.",
        clinical: "Bakuchiol shown comparable to 0.5% retinol for fine lines and elasticity, with significantly less irritation.<cite>— Br J Dermatol, 2019</cite>",
        products: ["Retinol Alternative Serum", "Retinol Alternative Moisturiser"]
      },
      peptides: {
        abbr: "Pep",
        name: "Peptides",
        role: "Firmness support",
        why: "Signal molecules that target firmness, fine lines and the look of skin elasticity — the premium addition to any anti-aging routine.",
        base: 5,
        howItWorks: "Short chains of amino acids that mimic skin's own signaling molecules. Tell your skin to produce more collagen, elastin, and barrier lipids over consistent use.",
        bestUsed: "AM and PM. Layers cleanly under any moisturiser. Pairs especially well with retinol-alternatives for compound anti-aging effect.",
        clinical: "Multi-peptide complexes shown to reduce wrinkle depth by ~18% and increase skin firmness by ~22% over 12 weeks.",
        products: ["Peptide Anti-Aging Serum", "Anti-Aging Collection Box"]
      }
    };

    // Per-answer impact: each entry is the ingredient score delta for that
    // option index. Indices match the DOM order of .answer buttons in each screen.
    const IMPACTS = {
      // Q1 skin type — oily / dry / combination / sensitive / normal
      q1: [
        { niacinamide: 15, teaTree: 5,  hyaluronicAcid: 3 },
        { ceramides: 20, hyaluronicAcid: 25, niacinamide: 3 },
        { niacinamide: 12, hyaluronicAcid: 10, ceramides: 5 },
        { ceramides: 25, hyaluronicAcid: 15, retinolAlt: 8, teaTree: -10, kojicAcid: -8 },
        { niacinamide: 5, hyaluronicAcid: 5 }
      ],
      // Q2 top concern — breakouts / fine lines / dehydration / dark spots / redness
      q2: [
        { niacinamide: 25, teaTree: 25, kojicAcid: 5 },
        { peptides: 30, retinolAlt: 28, vitaminC: 12, ceramides: 8 },
        { hyaluronicAcid: 30, ceramides: 18, niacinamide: 5 },
        { vitaminC: 30, kojicAcid: 30, niacinamide: 12 },
        { ceramides: 25, hyaluronicAcid: 12, niacinamide: 8, teaTree: -8, kojicAcid: -5 }
      ],
      // Q3 acne_freq — daily / weekly / hormonal / rarely
      q3: [
        { teaTree: 22, niacinamide: 12, kojicAcid: 5 },
        { teaTree: 16, niacinamide: 10, kojicAcid: 3 },
        { niacinamide: 15, teaTree: 6 },
        { niacinamide: 5, vitaminC: 3 }
      ],
      // Q4 post-acne marks — top focus / leftover / textured / none
      q4: [
        { kojicAcid: 35, vitaminC: 22, niacinamide: 10 },
        { kojicAcid: 20, vitaminC: 12, niacinamide: 6 },
        { retinolAlt: 18, vitaminC: 12, niacinamide: 10, peptides: 8 },
        {}
      ],
      // Q5 age — under 25 / 25-34 / 35-44 / 45+
      q5: [
        { niacinamide: 5 },
        { peptides: 10, retinolAlt: 8, niacinamide: 5, vitaminC: 5 },
        { peptides: 22, retinolAlt: 22, ceramides: 5, hyaluronicAcid: 5 },
        { peptides: 30, retinolAlt: 25, ceramides: 12, hyaluronicAcid: 8 }
      ],
      // Q6 climate — cold-dry / hot-humid / mild / four seasons
      q6: [
        { ceramides: 18, hyaluronicAcid: 18 },
        { niacinamide: 10, hyaluronicAcid: 5 },
        {},
        { ceramides: 12, hyaluronicAcid: 10 }
      ],
      // Q7 routine — nothing / basic / serums / detailed
      q7: [
        { niacinamide: 5, hyaluronicAcid: 5, ceramides: 5, teaTree: -5, kojicAcid: -3, retinolAlt: -3 },
        { niacinamide: 3, hyaluronicAcid: 3 },
        {},
        { peptides: 5, retinolAlt: 5, vitaminC: 5 }
      ],
      // Q8 sun care — daily / outside-only / rarely / never
      q8: [
        {},
        { vitaminC: 5, kojicAcid: 3 },
        { vitaminC: 18, kojicAcid: 8, niacinamide: 3 },
        { vitaminC: 25, kojicAcid: 12, niacinamide: 5 }
      ],
      // Q9 bad reaction — never / once / often / dont know
      q9: [
        {},
        { ceramides: 5 },
        { ceramides: 22, hyaluronicAcid: 12, retinolAlt: 5, teaTree: -15, kojicAcid: -12, vitaminC: -5 },
        { ceramides: 12, hyaluronicAcid: 5, teaTree: -5 }
      ]
    };

    // Per-screen tracking of which answer index the user picked
    const answers = {};

    function scoreIngredients() {
      const scores = {};
      Object.keys(INGREDIENTS).forEach(id => {
        scores[id] = INGREDIENTS[id].base;
      });
      Object.keys(answers).forEach(qid => {
        const idx = answers[qid];
        const impacts = (IMPACTS[qid] || [])[idx] || {};
        Object.keys(impacts).forEach(ingId => {
          scores[ingId] = (scores[ingId] || 0) + impacts[ingId];
        });
      });
      // Floor at 0 (don't show negative percentages)
      Object.keys(scores).forEach(id => { scores[id] = Math.max(0, scores[id]); });
      // Sort descending, take top 5
      const sorted = Object.keys(scores)
        .map(id => ({ id, score: scores[id] }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      const topRaw = sorted[0].score || 1;
      return sorted.map(item => ({
        id: item.id,
        ingredient: INGREDIENTS[item.id],
        rawScore: item.score,
        // top match displays at 92% (humble — never claim 100); others scale proportionally
        pct: Math.round((item.score / topRaw) * 92)
      }));
    }

    function renderIngredientRow(match, index) {
      const isTop = index === 0;
      const ing = match.ingredient;
      const num = String(index + 1).padStart(2, '0');
      const productLinks = ing.products.map(p =>
        '<a href="#" class="exp-product"><span class="exp-product__bottle"></span>' + p + '</a>'
      ).join('');

      return (
        '<div class="ingredient ' + (isTop ? 'ingredient--top' : '') + '" tabindex="0" role="button" aria-expanded="false" data-toggle>' +
          '<div class="ingredient__row">' +
            '<div class="ingredient__symbol">' +
              '<span class="ingredient__abbr">' + ing.abbr + '</span>' +
              '<span class="ingredient__num">' + num + '</span>' +
            '</div>' +
            '<div class="ingredient__body">' +
              (isTop
                ? '<div class="ingredient__top-row"><span class="ingredient__role">Key active</span></div>' +
                  '<h4 class="ingredient__name"><em>' + ing.name + '</em></h4>'
                : '<span class="ingredient__role">' + ing.role + '</span>' +
                  '<h4 class="ingredient__name">' + ing.name + '</h4>') +
              '<p class="ingredient__why">' + ing.why + '</p>' +
            '</div>' +
            '<div class="ingredient__right">' +
              (isTop ? '<span class="ingredient__badge">Top match</span>' : '') +
              '<span class="ingredient__match">' +
                '<span class="ingredient__match-pct">' + match.pct + '%</span>' +
                '<span class="ingredient__match-bar" style="--pct: ' + match.pct + '%"></span>' +
                '<span class="ingredient__match-label">match</span>' +
              '</span>' +
              '<span class="ingredient__chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>' +
            '</div>' +
          '</div>' +
          '<div class="ingredient__expanded">' +
            '<div class="ingredient__expanded-inner">' +
              '<div class="ingredient__expanded-content">' +
                '<div class="exp-grid">' +
                  '<div class="exp-section">' +
                    '<span class="exp-label">How it works</span>' +
                    '<p class="exp-body">' + ing.howItWorks + '</p>' +
                  '</div>' +
                  '<div class="exp-section">' +
                    '<span class="exp-label">Best used</span>' +
                    '<p class="exp-body">' + ing.bestUsed + '</p>' +
                  '</div>' +
                  '<div class="exp-section">' +
                    '<span class="exp-label">Clinical evidence</span>' +
                    '<p class="exp-body">' + ing.clinical + '</p>' +
                  '</div>' +
                  '<div class="exp-section">' +
                    '<span class="exp-label">Found in your routine</span>' +
                    '<div class="exp-product-list">' + productLinks + '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function renderIngredientsPanel() {
      const list = document.getElementById('ingredients-list');
      if (!list) return;
      const top5 = scoreIngredients();
      list.innerHTML = top5.map(renderIngredientRow).join('');
    }

    // ============================================================
    // Original quiz controller
    // ============================================================
    const screens = ['intro','q1','q2','q3','q4','q5','q6','q7','q8','q9','email','loading','results'];
    const counters = {
      intro: 'Welcome',
      q1: 'Question 1 of 9',
      q2: 'Question 2 of 9',
      q3: 'Question 3 of 9',
      q4: 'Question 4 of 9',
      q5: 'Question 5 of 9',
      q6: 'Question 6 of 9',
      q7: 'Question 7 of 9',
      q8: 'Question 8 of 9',
      q9: 'Question 9 of 9',
      email: 'Almost there',
      loading: 'Building your routine',
      results: 'Your routine'
    };
    const history = ['intro'];

    const stage = document.querySelector('.quiz-stage');
    const fill  = document.getElementById('progress-fill');
    const counter = document.getElementById('counter');
    const back  = document.getElementById('back-btn');

    function go(name) {
      const current = document.querySelector('.quiz-screen.is-active');
      const target  = document.querySelector('.quiz-screen[data-screen="' + name + '"]');
      if (!target) return;
      if (current) current.classList.remove('is-active');
      target.classList.add('is-active');

      // Re-trigger entrance animation
      target.style.animation = 'none';
      void target.offsetWidth;
      target.style.animation = '';

      // Update progress bar (0% on intro, 100% on results)
      const idx = screens.indexOf(name);
      const pct = idx <= 0 ? 0 : Math.round((idx / (screens.length - 1)) * 100);
      fill.style.width = pct + '%';

      // Update counter + back button
      counter.textContent = counters[name] || '';
      back.disabled = history.length <= 1;

      // Reset selection states on every entry
      target.querySelectorAll('.answer.is-selected').forEach(a => a.classList.remove('is-selected'));

      // Special-case the loading screen — sequence the steps then advance
      if (name === 'loading') runLoadingSequence();

      // When entering results: compute scoring + render ingredient panel
      if (name === 'results') renderIngredientsPanel();

      // Scroll stage to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function advance(toName) {
      history.push(toName);
      go(toName);
    }

    function goBack() {
      if (history.length <= 1) return;
      history.pop();
      go(history[history.length - 1]);
    }

    // Wire up answer cards: record answer index → select state → advance
    document.querySelectorAll('[data-advance]').forEach(el => {
      el.addEventListener('click', (e) => {
        const next = el.getAttribute('data-advance');
        if (el.classList.contains('answer')) {
          // Record which answer index the user picked for this screen
          const screenEl = el.closest('.quiz-screen');
          const screenId = screenEl && screenEl.dataset.screen;
          const screenAnswers = screenEl ? screenEl.querySelectorAll('.answer') : [];
          const idx = Array.prototype.indexOf.call(screenAnswers, el);
          if (screenId && idx >= 0) answers[screenId] = idx;
          // Mark as selected for satisfying click feedback
          el.classList.add('is-selected');
          setTimeout(() => advance(next || 'q1'), 240);
        } else {
          // For the intro CTA — no select state, just advance
          advance(next || 'q1');
        }
      });
    });

    // Email form: prevent submit, advance to loading
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
      emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        advance('loading');
      });
    }

    // Back button
    back.addEventListener('click', goBack);

    // Restart from results
    document.querySelectorAll('[data-restart]').forEach(el => {
      el.addEventListener('click', () => {
        history.length = 0;
        history.push('intro');
        go('intro');
      });
    });

    // Loading screen sequence
    function runLoadingSequence() {
      const steps = document.querySelectorAll('#loading-steps .loading__step');
      // Reset
      steps.forEach((s, i) => {
        s.classList.remove('is-done');
        s.classList.toggle('is-active', i === 0);
      });
      // Step 1 done → 2 active
      setTimeout(() => {
        steps[0].classList.remove('is-active');
        steps[0].classList.add('is-done');
        steps[1].classList.add('is-active');
      }, 900);
      // Step 2 done → 3 active
      setTimeout(() => {
        steps[1].classList.remove('is-active');
        steps[1].classList.add('is-done');
        steps[2].classList.add('is-active');
      }, 1800);
      // Step 3 done → results
      setTimeout(() => {
        steps[2].classList.remove('is-active');
        steps[2].classList.add('is-done');
      }, 2700);
      setTimeout(() => advance('results'), 3100);
    }

    // Initial state
    go('intro');

    // ============================================================
    // Ingredient cards: event delegation (rows are rendered dynamically)
    // ============================================================
    const ingList = document.getElementById('ingredients-list');
    if (ingList) {
      const toggleCard = (card) => {
        const open = card.classList.toggle('is-open');
        card.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      ingList.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // let inner links behave normally
        const card = e.target.closest('[data-toggle]');
        if (card) toggleCard(card);
      });
      ingList.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('[data-toggle]');
        if (!card) return;
        e.preventDefault();
        toggleCard(card);
      });
    }
  })();
