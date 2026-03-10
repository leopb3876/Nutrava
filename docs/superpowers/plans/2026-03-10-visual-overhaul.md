# Visual Overhaul & Feature Polish — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Nutrava from gradient placeholders into a premium-feeling storefront with real stock images, a richer/warmer colour palette, deeper product pages, and stronger trust signals.

**Architecture:** This is a visual/HTML/CSS overhaul — no new JS modules or backend changes. All work happens in `preview.html` (primary), `assets/base.css` (global styles), and Shopify Liquid templates (production mirrors). Stock images from Unsplash CDN. New product page sections (supplement facts, FAQ, reviews) are HTML+CSS with minimal JS for interactivity.

**Tech Stack:** HTML, CSS custom properties, Shopify Liquid, Lucide icons, Unsplash CDN images, vanilla JS (accordion/carousel)

**Spec:** `docs/superpowers/specs/2026-03-10-visual-overhaul-design.md`

---

## Chunk 1: Colour Palette + Stock Images

### Task 1: Update Colour Palette in base.css

**Files:**
- Modify: `assets/base.css:7-27` (CSS custom properties)

- [ ] **Step 1: Update palette values and add new variables**

In `:root`, update these existing values:
```css
--color-oat: #fdf9f3;           /* was #faf8f2 — warmer cream */
--color-mint-mist: #eef4e8;     /* was #eef3eb — warmer, less grey */
--color-forest: #3d6b4f;        /* was #5a7a5e — deeper forest green */
--color-espresso: #2c241d;      /* was #3d3229 — darker, more contrast */
```

Add these new variables after `--color-white`:
```css
--color-accent: #c8965d;        /* warm amber for highlights */
--color-dark-section: #2c3a2e;  /* deep forest for alternating sections */
--color-dark-text: #f5f2ec;     /* light text on dark backgrounds */
```

- [ ] **Step 2: Add accent utility classes**

After the existing `.bg-sand` utility class in `base.css`, add:
```css
.bg-dark { background-color: var(--color-dark-section); color: var(--color-dark-text); }
.bg-dark a { color: var(--color-dark-text); }
.bg-dark .label, .bg-dark .section-label { color: var(--color-accent); }
.text-accent { color: var(--color-accent); }
```

- [ ] **Step 3: Commit**
```
git add assets/base.css && git commit -m "feat: update colour palette — warmer, richer tones + amber accent"
```

### Task 2: Mirror Colour Changes in preview.html

**Files:**
- Modify: `preview.html` (CSS variables block near top, lines ~5-16)

- [ ] **Step 1: Update the CSS variables in preview.html's `<style>` block**

The preview uses its own variable definitions. Find the `:root` block and update to match:
```css
:root {
  --color-oat: #fdf9f3;
  --color-mint-mist: #eef4e8;
  --color-fern: #c2d4b5;
  --color-forest: #3d6b4f;
  --color-espresso: #2c241d;
  --color-bark: #5c4f3d;
  --color-walnut: #8b7355;
  --color-sand: #e8dcc8;
  --color-white: #ffffff;
  --color-accent: #c8965d;
  --color-dark-section: #2c3a2e;
  --color-dark-text: #f5f2ec;
  /* keep all semantic variables and other vars as-is */
}
```

- [ ] **Step 2: Verify** — Open preview in browser. Overall tones should look slightly warmer/deeper. Green buttons darker. Background creamier.

- [ ] **Step 3: Commit**
```
git add preview.html && git commit -m "feat: mirror colour palette updates in preview"
```

### Task 3: Add Stock Images to Homepage Hero

**Files:**
- Modify: `preview.html` (hero section, around line ~247)

- [ ] **Step 1: Redesign hero to split layout with stock photo**

Replace the current centered hero section in preview.html with a split layout. The hero currently uses class `hero-v2` with centered text and gradient background.

New structure:
- Left side (55%): label, heading (with amber accent on "Personalised"), subheading, CTA buttons
- Right side (45%): Unsplash lifestyle image (wellness/supplement themed)
- Background: subtle gradient (light, not the solid mint)

Use an Unsplash image URL like:
`https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80` (supplements/wellness)

Update the hero CSS to:
```css
.hero-v2 { padding: 80px 0 60px; background: linear-gradient(180deg, var(--color-mint-mist) 0%, var(--color-bg) 100%); }
.hero-v2__grid { display: grid; grid-template-columns: 55% 45%; gap: 48px; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.hero-v2__image { border-radius: 16px; overflow: hidden; }
.hero-v2__image img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; display: block; }
```

Add `.text-accent` span around "Personalised" in the heading.

Mobile: stack vertically (single column), image below text.

- [ ] **Step 2: Verify** — Hero shows split layout with real photo on right, text on left. Amber accent on keyword. Responsive on mobile.

- [ ] **Step 3: Commit**
```
git add preview.html && git commit -m "feat: redesign hero with split layout + stock photo"
```

### Task 4: Add Stock Images to Product Cards (Shop Page)

**Files:**
- Modify: `preview.html` (shop page product cards, around lines ~597-772)

- [ ] **Step 1: Replace gradient placeholders with Unsplash product images**

Each product card on the shop page has a gradient div with a Lucide icon as a placeholder. Replace each with an `<img>` tag. Use supplement/vitamin-related Unsplash photos with neutral backgrounds.

Example Unsplash URLs for supplement products (use different photos per product):
- `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80` (pills/capsules)
- `https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&q=80` (supplement bottle)
- `https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80` (natural ingredients)

Replace each gradient placeholder div with:
```html
<img src="[unsplash-url]" alt="[Product Name]" loading="lazy" style="width:100%; height:200px; object-fit:cover; border-radius: var(--radius-md) var(--radius-md) 0 0;">
```

Do this for all 12 products. Use varied images so cards look different.

- [ ] **Step 2: Add star ratings to each card**

Below the price in each card, add:
```html
<div style="display:flex; align-items:center; gap:4px; margin-top:4px;">
  <span style="color:#c8965d; font-size:13px;">★★★★★</span>
  <span style="font-size:12px; color:var(--color-text-muted);">(XX)</span>
</div>
```

Vary review counts (89, 127, 64, 156, 43, 92, 78, 31, 112, 55, 203, 47).

- [ ] **Step 3: Add "Best Seller" badge to top 2 products**

On Lion's Mane Complex and Ashwagandha KSM-66, add a badge:
```html
<span style="position:absolute; top:12px; left:12px; background:var(--color-accent); color:#fff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:var(--radius-pill); letter-spacing:0.5px; text-transform:uppercase;">Best Seller</span>
```

Ensure the card image container has `position: relative`.

- [ ] **Step 4: Verify** — Shop page shows real product images, star ratings below each price, and "Best Seller" badges on top 2 products.

- [ ] **Step 5: Commit**
```
git add preview.html && git commit -m "feat: add stock product images, star ratings, and bestseller badges to shop"
```

### Task 5: Add Stock Images to Stack Cards

**Files:**
- Modify: `preview.html` (stacks page, around lines ~775-835)

- [ ] **Step 1: Add mood/lifestyle photos to each stack card**

Replace the icon-only cards with image-top cards. Each card gets a relevant Unsplash photo:
- Focus & Study: `https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80` (person studying)
- Gym & Performance: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80` (gym/training)
- Sleep & Recovery: `https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=80` (peaceful bedroom)
- Energy & Stress: `https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80` (active/outdoor)
- Daily Wellness: `https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80` (nature/wellness)

Card layout: image (200px height, `object-fit: cover`, rounded top corners) above the existing icon + title + description + CTA.

- [ ] **Step 2: Verify** — Stacks page shows mood photos on each card.

- [ ] **Step 3: Commit**
```
git add preview.html && git commit -m "feat: add lifestyle photos to stack browse cards"
```

---

## Chunk 2: Homepage Overhaul

### Task 6: Dark Section Treatment — Stats Bar & Testimonials

**Files:**
- Modify: `preview.html` (stats bar section + testimonials section)

- [ ] **Step 1: Convert stats bar to dark section**

Find the stats bar section on the homepage. Change its background to `--color-dark-section` and text to `--color-dark-text`. Make the stat numbers use `--color-accent` (amber) for visual pop.

```css
/* Update stats section inline styles */
background: var(--color-dark-section);
color: var(--color-dark-text);
```

Stat numbers: `color: var(--color-accent)` and labels: `color: var(--color-dark-text)`.

- [ ] **Step 2: Convert testimonials to dark section**

Change the testimonials section background to `var(--color-dark-section)`. Update:
- Heading and subheading: `--color-dark-text`
- Quote text: `--color-dark-text)` with `opacity: 0.9`
- Author name: `--color-dark-text`
- Author meta: `--color-accent`
- Card backgrounds: `rgba(255,255,255,0.05)` with `border: 1px solid rgba(255,255,255,0.1)`

- [ ] **Step 3: Verify** — Stats bar and testimonials have dark forest backgrounds with amber accents. Text is readable. Creates visual rhythm with surrounding light sections.

- [ ] **Step 4: Commit**
```
git add preview.html && git commit -m "feat: add dark section treatment to stats bar and testimonials"
```

### Task 7: Testimonials Upgrade — Stars, Avatars, Carousel

**Files:**
- Modify: `preview.html` (testimonials section)

- [ ] **Step 1: Add star ratings and avatar photos**

Add 5 amber stars (`★★★★★` in `--color-accent`) above each quote. Add circular avatar images (48x48, `border-radius: 50%`) next to each author name. Use Unsplash headshots:
- James T.: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&q=80`
- Sophie M.: `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&q=80`
- Daniel K.: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&q=80`

- [ ] **Step 2: Add carousel navigation arrows**

Add left/right arrow buttons outside the testimonial cards. Use Lucide `chevron-left` and `chevron-right` icons. Carousel scrolls horizontally showing 1 card at a time on mobile, 3 on desktop. Add `overflow-x: auto; scroll-snap-type: x mandatory;` on the cards container with `scroll-snap-align: start` on each card. Arrows scroll by one card width.

Small JS snippet at the bottom for arrow clicks:
```javascript
document.querySelectorAll('[data-testimonial-prev]').forEach(btn => {
  btn.addEventListener('click', () => {
    const container = btn.closest('.testimonials-section').querySelector('.testimonials-grid');
    container.scrollBy({ left: -container.offsetWidth / 3, behavior: 'smooth' });
  });
});
// Similar for next
```

- [ ] **Step 3: Verify** — Testimonials show stars, real avatars, and carousel arrows work.

- [ ] **Step 4: Commit**
```
git add preview.html && git commit -m "feat: upgrade testimonials with stars, avatars, and carousel"
```

### Task 8: Trust Bar + Press Bar

**Files:**
- Modify: `preview.html` (trust bar section)

- [ ] **Step 1: Add icons to trust badges**

Each trust badge gets a small Lucide icon before the text:
- Science-backed: `flask-conical`
- Clean ingredients: `leaf`
- Free UK shipping: `truck`
- 30-day guarantee: `shield-check`

- [ ] **Step 2: Add "As Seen In" press bar below trust bar**

Add a new section below the trust bar:
```html
<div style="text-align:center; padding:32px 0; opacity:0.5;">
  <p style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:16px;">As Seen In</p>
  <div style="display:flex; justify-content:center; gap:48px; align-items:center; flex-wrap:wrap;">
    <!-- SVG text logos styled as greyed silhouettes -->
    <span style="font-family:Georgia,serif; font-size:18px; font-weight:700; color:var(--color-text-muted);">Men's Health</span>
    <span style="font-family:Georgia,serif; font-size:18px; font-style:italic; color:var(--color-text-muted);">Vogue</span>
    <span style="font-family:var(--font-body); font-size:16px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--color-text-muted);">GQ</span>
    <span style="font-family:Georgia,serif; font-size:16px; color:var(--color-text-muted);">The Telegraph</span>
    <span style="font-family:var(--font-body); font-size:16px; font-weight:600; color:var(--color-text-muted);">Healthline</span>
  </div>
</div>
```

- [ ] **Step 3: Verify** — Trust badges have icons. Press bar shows below with greyed publication names.

- [ ] **Step 4: Commit**
```
git add preview.html && git commit -m "feat: add icons to trust badges + As Seen In press bar"
```

### Task 9: Why Nutrava — Add Photo

**Files:**
- Modify: `preview.html` (Why Nutrava section)

- [ ] **Step 1: Replace gradient placeholder with stock photo**

The Why Nutrava section has a gradient circle with a heart-pulse icon on the right column. Replace it with a real lifestyle photo:
`https://images.unsplash.com/photo-1505576399279-0d754687a2d8?w=500&q=80` (wellness/health lifestyle)

Use an `<img>` with `border-radius: 16px; object-fit: cover; width: 100%; height: 100%;`

- [ ] **Step 2: Verify** — Why Nutrava section shows a real photo on the right instead of gradient placeholder.

- [ ] **Step 3: Commit**
```
git add preview.html && git commit -m "feat: add lifestyle photo to Why Nutrava section"
```

---

## Chunk 3: Product Page Depth

### Task 10: Product Page — Stock Image + Star Rating

**Files:**
- Modify: `preview.html` (product page section — search for "page-product" or the product detail area rendered by quiz results)
- Modify: `templates/product.liquid`
- Modify: `assets/product.css`

- [ ] **Step 1: Add star rating display to product template**

In `templates/product.liquid`, below the product title and above the price, add:
```html
<div class="product-hero__rating">
  <span class="product-hero__stars">★★★★★</span>
  <span class="product-hero__reviews-count">4.8 (127 reviews)</span>
</div>
```

CSS in `assets/product.css`:
```css
.product-hero__rating {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}
.product-hero__stars {
  color: var(--color-accent, #c8965d);
  font-size: 16px;
  letter-spacing: 2px;
}
.product-hero__reviews-count {
  font-size: 14px;
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Commit**
```
git add templates/product.liquid assets/product.css && git commit -m "feat: add star rating to product page hero"
```

### Task 11: Supplement Facts Panel

**Files:**
- Modify: `preview.html` (add section to product detail view in quiz results)
- Modify: `templates/product.liquid`
- Modify: `assets/product.css`

- [ ] **Step 1: Add supplement facts CSS**

In `assets/product.css`, add:
```css
/* Supplement Facts */
.product-facts { margin-bottom: var(--space-xl); }
.product-facts__table { width: 100%; border-collapse: collapse; }
.product-facts__table th { text-align: left; padding: 10px 12px; font-size: 13px; font-weight: 600; color: var(--color-text); background: var(--color-mint-mist); border-bottom: 2px solid var(--color-primary); }
.product-facts__table td { padding: 10px 12px; font-size: 14px; color: var(--color-text-body); border-bottom: 1px solid var(--color-border); }
.product-facts__table tr:last-child td { border-bottom: none; }
.product-facts__header { font-size: 13px; color: var(--color-text-muted); padding: 8px 12px; background: var(--color-card-bg); border: 1px solid var(--color-border); border-bottom: none; border-radius: var(--radius-md) var(--radius-md) 0 0; }
.product-facts__table { border: 1px solid var(--color-border); border-radius: 0 0 var(--radius-md) var(--radius-md); overflow: hidden; }
```

- [ ] **Step 2: Add supplement facts HTML to product.liquid**

Below the ingredients section in `templates/product.liquid`, add:
```html
<section class="product-facts section-padding">
  <div class="container container--narrow">
    <h2 class="product-section__heading">Supplement Facts</h2>
    <div class="product-facts__header">Serving Size: 2 capsules &middot; Servings Per Container: 30</div>
    <table class="product-facts__table">
      <thead>
        <tr><th>Ingredient</th><th>Amount Per Serving</th><th>% Daily Value</th></tr>
      </thead>
      <tbody>
        <!-- Populated by product metafields or hardcoded per product -->
      </tbody>
    </table>
  </div>
</section>
```

- [ ] **Step 3: Add hardcoded supplement facts to preview.html product detail**

In the preview product page/quiz results area, add a supplement facts table for the Focus Stack's Lion's Mane product with real-looking data:
```
Lion's Mane Extract (Hericium erinaceus) | 1000 mg | *
L-Theanine | 200 mg | *
Caffeine (Natural) | 100 mg | *
Bacopa Monnieri (50% bacosides) | 300 mg | *
Phosphatidylserine | 100 mg | *
(* Daily Value not established)
```

- [ ] **Step 4: Commit**
```
git add assets/product.css templates/product.liquid preview.html && git commit -m "feat: add supplement facts panel to product pages"
```

### Task 12: Clinical References Section

**Files:**
- Modify: `preview.html`
- Modify: `templates/product.liquid`
- Modify: `assets/product.css`

- [ ] **Step 1: Add clinical references CSS**

```css
/* Clinical References */
.product-studies__list { display: flex; flex-direction: column; gap: var(--space-sm); }
.product-study { padding: var(--space-lg); background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.product-study__title { font-size: 14px; font-weight: 600; color: var(--color-primary); margin-bottom: 4px; }
.product-study__finding { font-size: 14px; color: var(--color-text-body); line-height: 1.6; margin-bottom: 4px; }
.product-study__source { font-size: 12px; color: var(--color-text-muted); font-style: italic; }
```

- [ ] **Step 2: Add 2-3 studies to preview.html for Focus Stack**

Heading: "Backed by Science" with flask-conical icon.

Example studies:
1. **Lion's Mane & Cognitive Function** — "Oral supplementation of H. erinaceus significantly improved cognitive function scores in adults with mild impairment over 16 weeks." — *Journal of Biomedical Research, 2020*
2. **L-Theanine + Caffeine Synergy** — "The combination improved attention and task switching more effectively than either compound alone." — *Nutritional Neuroscience, 2019*
3. **Bacopa & Memory** — "300mg daily of Bacopa monnieri improved memory acquisition and retention in healthy adults after 12 weeks." — *Psychopharmacology, 2014*

- [ ] **Step 3: Commit**
```
git add assets/product.css templates/product.liquid preview.html && git commit -m "feat: add clinical references section to product pages"
```

### Task 13: FAQ Accordion

**Files:**
- Modify: `preview.html`
- Modify: `templates/product.liquid`
- Modify: `assets/product.css`

- [ ] **Step 1: Add FAQ CSS**

```css
/* FAQ Accordion */
.product-faq__list { display: flex; flex-direction: column; gap: 0; }
.product-faq__item { border-bottom: 1px solid var(--color-border); }
.product-faq__item:first-child { border-top: 1px solid var(--color-border); }
.product-faq__question { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 16px 0; font-size: 15px; font-weight: 600; color: var(--color-text); background: none; border: none; cursor: pointer; text-align: left; }
.product-faq__question svg { width: 18px; height: 18px; color: var(--color-text-muted); transition: transform 0.3s ease; flex-shrink: 0; }
.product-faq__question.is-open svg { transform: rotate(180deg); }
.product-faq__answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.product-faq__answer-inner { padding: 0 0 16px; font-size: 14px; color: var(--color-text-body); line-height: 1.7; }
```

- [ ] **Step 2: Add FAQ HTML to preview product page**

5 questions for Focus Stack:
1. When will I see results?
2. Can I take this with other supplements?
3. Are there any side effects?
4. How should I store this?
5. Is this vegan and gluten-free?

Each item uses a button with chevron-down icon that toggles `.is-open` class and expands the answer div.

- [ ] **Step 3: Add FAQ toggle JS**

At the bottom of preview.html (or in product.liquid script):
```javascript
document.querySelectorAll('.product-faq__question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const isOpen = btn.classList.contains('is-open');
    // Close all others in same FAQ
    btn.closest('.product-faq__list').querySelectorAll('.product-faq__question').forEach(q => {
      q.classList.remove('is-open');
      q.nextElementSibling.style.maxHeight = null;
    });
    if (!isOpen) {
      btn.classList.add('is-open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});
```

- [ ] **Step 4: Verify** — Click FAQ questions, they expand/collapse smoothly. Only one open at a time. Chevron rotates.

- [ ] **Step 5: Commit**
```
git add assets/product.css templates/product.liquid preview.html && git commit -m "feat: add FAQ accordion to product pages"
```

### Task 14: Reviews Section

**Files:**
- Modify: `preview.html`
- Modify: `templates/product.liquid`
- Modify: `assets/product.css`

- [ ] **Step 1: Add reviews CSS**

```css
/* Reviews */
.product-reviews__summary { display: flex; align-items: flex-start; gap: var(--space-2xl); margin-bottom: var(--space-xl); padding: var(--space-xl); background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.product-reviews__score { text-align: center; min-width: 120px; }
.product-reviews__number { font-family: var(--font-heading); font-size: 3rem; color: var(--color-text); line-height: 1; }
.product-reviews__stars-big { color: var(--color-accent); font-size: 20px; letter-spacing: 2px; margin: 4px 0; display: block; }
.product-reviews__total { font-size: 13px; color: var(--color-text-muted); }
.product-reviews__bars { flex: 1; }
.product-reviews__bar-row { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: 6px; }
.product-reviews__bar-label { font-size: 13px; color: var(--color-text-muted); min-width: 40px; }
.product-reviews__bar { flex: 1; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.product-reviews__bar-fill { height: 100%; background: var(--color-accent); border-radius: 4px; }
.product-reviews__bar-pct { font-size: 12px; color: var(--color-text-muted); min-width: 32px; text-align: right; }

.product-review { padding: var(--space-lg); background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: var(--space-sm); }
.product-review__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-sm); }
.product-review__author { font-size: 15px; font-weight: 600; color: var(--color-text); }
.product-review__date { font-size: 12px; color: var(--color-text-muted); }
.product-review__stars { color: var(--color-accent); font-size: 14px; letter-spacing: 1px; margin-bottom: 4px; display: block; }
.product-review__verified { font-size: 11px; font-weight: 600; color: var(--color-primary); background: var(--color-mint-mist); padding: 2px 8px; border-radius: var(--radius-pill); display: inline-block; margin-bottom: var(--space-sm); }
.product-review__text { font-size: 14px; color: var(--color-text-body); line-height: 1.7; }

@media (max-width: 768px) {
  .product-reviews__summary { flex-direction: column; align-items: center; text-align: center; }
}
```

- [ ] **Step 2: Add reviews HTML to preview with dummy data**

Rating summary: 4.8 out of 5, 127 reviews. Bar chart: 5★ 80%, 4★ 15%, 3★ 3%, 2★ 1%, 1★ 1%.

4 review cards:
1. Sarah L. — 5 stars — Jan 28, 2026 — "Noticed a real difference in focus after about 2 weeks..."
2. Mark T. — 5 stars — Feb 3, 2026 — "Clean ingredients and I can actually feel it working..."
3. Emma R. — 4 stars — Dec 15, 2025 — "Good quality supplement, takes a few weeks to kick in..."
4. David P. — 5 stars — Feb 18, 2026 — "Best nootropic stack I've tried. The combination works better than..."

Add "Write a Review" button below: `class="btn btn--outline"` with `onclick="alert('Review form (preview mode)')"`.

- [ ] **Step 3: Verify** — Reviews section shows large score, bar chart breakdown, and individual review cards with verified badges.

- [ ] **Step 4: Commit**
```
git add assets/product.css templates/product.liquid preview.html && git commit -m "feat: add reviews section with ratings and review cards"
```

### Task 15: "Pairs Well With" Cross-Sell Row

**Files:**
- Modify: `preview.html`
- Modify: `assets/product.css`

- [ ] **Step 1: Add cross-sell CSS**

```css
/* Cross-sell */
.product-crosssell__row { display: flex; gap: var(--space-lg); overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: var(--space-sm); }
.product-crosssell__row::-webkit-scrollbar { display: none; }
.product-crosssell__item { min-width: 220px; scroll-snap-align: start; flex-shrink: 0; }
```

- [ ] **Step 2: Add cross-sell HTML to preview product page**

Heading: "Customers Also Take". Show 4 product cards in a horizontal scrollable row. Use existing card styling pattern but smaller (mini product cards with image, name, price, small ATC button). Use Unsplash product images.

- [ ] **Step 3: Commit**
```
git add assets/product.css preview.html && git commit -m "feat: add Pairs Well With cross-sell row"
```

---

## Chunk 4: About Page + Newsletter + Final Polish

### Task 16: About Page — Add Images

**Files:**
- Modify: `preview.html` (about page section)

- [ ] **Step 1: Add hero image to about page**

Add a full-width hero image at the top of the about page:
`https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80` (lab/science)

Style: `width: 100%; height: 300px; object-fit: cover; border-radius: 0 0 16px 16px;`

- [ ] **Step 2: Add lifestyle photos between text sections**

Add 2-3 images between text sections:
- After "Our Story": wellness lifestyle photo
- After "Our Process": clean ingredients/lab photo
- Team section: 3 placeholder headshots in a grid

- [ ] **Step 3: Commit**
```
git add preview.html && git commit -m "feat: add images to about page"
```

### Task 17: Newsletter Section

**Files:**
- Modify: `preview.html` (add above footer)
- Create: `sections/newsletter.liquid`
- Modify: `templates/index.json` (add section reference)

- [ ] **Step 1: Add newsletter section to preview.html**

Insert above the footer:
```html
<section style="padding:80px 0; background:var(--color-dark-section); text-align:center;">
  <div style="max-width:600px; margin:0 auto; padding:0 24px;">
    <h2 style="font-family:var(--font-heading); font-size:1.75rem; color:var(--color-dark-text); margin-bottom:8px;">Stay in the loop</h2>
    <p style="font-size:15px; color:var(--color-dark-text); opacity:0.8; margin-bottom:24px;">Join 10,000+ people optimising their wellness. Get tips, new stacks, and exclusive offers.</p>
    <form style="display:flex; gap:8px; max-width:440px; margin:0 auto;" onsubmit="event.preventDefault(); alert('Subscribed! (preview mode)')">
      <input type="email" placeholder="Your email address" required style="flex:1; padding:12px 16px; border:1.5px solid rgba(255,255,255,0.2); border-radius:var(--radius-pill); background:rgba(255,255,255,0.1); color:var(--color-dark-text); font-size:14px; font-family:var(--font-body);">
      <button type="submit" class="btn btn--primary" style="background:var(--color-accent); border-color:var(--color-accent); white-space:nowrap;">Subscribe</button>
    </form>
  </div>
</section>
```

- [ ] **Step 2: Create Shopify newsletter section**

Create `sections/newsletter.liquid` with a Shopify form using `{% form 'customer' %}` for email capture. Mirror the same styling.

- [ ] **Step 3: Add to index.json**

Add newsletter section reference to `templates/index.json` in the order array, before quiz-cta.

- [ ] **Step 4: Commit**
```
git add preview.html sections/newsletter.liquid templates/index.json && git commit -m "feat: add newsletter email capture section"
```

### Task 18: Final Accent Colour Polish

**Files:**
- Modify: `preview.html`
- Modify: `assets/base.css`

- [ ] **Step 1: Update hover states to use amber accent**

In `base.css`, update:
- `.btn--primary:hover` background to a darker shade of accent: `#b8864d`
- Add `.btn--accent` class: amber background with white text
- Announcement bar: keep primary green

In `preview.html`:
- Hero CTA "Take the Quiz" button: use amber accent (`--color-accent`) for stronger contrast
- Quiz CTA section button: amber accent
- Any "Explore" or secondary action links: amber on hover

- [ ] **Step 2: Verify full site**

Open preview.html and scroll through every page:
- Colours feel warmer and richer throughout
- Dark sections create visual rhythm on homepage
- Stock images load correctly everywhere
- Product page has supplement facts, studies, FAQ, reviews, cross-sell
- Star ratings visible on shop cards and product page
- Newsletter section appears above footer
- All buttons have proper hover states
- Mobile responsive on all new elements

- [ ] **Step 3: Commit**
```
git add assets/base.css preview.html && git commit -m "feat: final accent colour polish and hover state updates"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1-2 | Colour palette refresh | `base.css`, `preview.html` |
| 3 | Hero redesign with photo | `preview.html` |
| 4 | Product card images + ratings + badges | `preview.html` |
| 5 | Stack card lifestyle photos | `preview.html` |
| 6 | Dark sections (stats + testimonials) | `preview.html` |
| 7 | Testimonial stars + avatars + carousel | `preview.html` |
| 8 | Trust bar icons + press bar | `preview.html` |
| 9 | Why Nutrava photo | `preview.html` |
| 10 | Product page star rating | `product.liquid`, `product.css` |
| 11 | Supplement facts panel | `product.liquid`, `product.css`, `preview.html` |
| 12 | Clinical references | `product.liquid`, `product.css`, `preview.html` |
| 13 | FAQ accordion | `product.liquid`, `product.css`, `preview.html` |
| 14 | Reviews section | `product.liquid`, `product.css`, `preview.html` |
| 15 | Cross-sell row | `product.css`, `preview.html` |
| 16 | About page images | `preview.html` |
| 17 | Newsletter section | `preview.html`, `newsletter.liquid`, `index.json` |
| 18 | Final accent polish | `base.css`, `preview.html` |
