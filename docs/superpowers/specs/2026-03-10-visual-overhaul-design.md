# Nutrava Visual Overhaul & Feature Polish

## Problem

The site looks bland: zero real images (all gradient placeholders with Lucide icons), flat muted colour palette with little contrast between sections, thin product pages, and weak social proof. It doesn't feel like a real brand you'd trust with your money.

## Goal

Transform Nutrava from a functional prototype into a premium, trustworthy supplement storefront with real imagery, a richer colour palette, deeper product pages (Persona Nutrition-style), and stronger trust signals.

## Approach

Page-by-page polish. Each area gets colours + images + features in one pass. No rework.

---

## Phase 1: Colour Palette Refresh

Update CSS custom properties in `assets/base.css` (and mirror in `preview.html`).

| Variable | Current | New | Reason |
|----------|---------|-----|--------|
| `--color-primary` | `#5a7a5e` | `#3d6b4f` | Deeper, richer forest green |
| `--color-bg` | `#faf8f2` | `#fdf9f3` | Slightly warmer cream |
| `--color-text` | `#3d3229` | `#2c241d` | Darker espresso, stronger contrast |
| `--color-mint-mist` | `#eef3eb` | `#eef4e8` | Warmer mint, less grey |
| NEW: `--color-accent` | — | `#c8965d` | Warm amber for highlights/badges |
| NEW: `--color-dark-section` | — | `#2c3a2e` | Deep forest for alternating dark sections |
| NEW: `--color-dark-text` | — | `#f5f2ec` | Light text on dark sections |

Also update: button hover states, link colours, and badge colours to use the new accent where appropriate.

**Files:** `assets/base.css`, `preview.html` (CSS variables block)

---

## Phase 2: Stock Image Integration

Use Unsplash CDN URLs (`https://images.unsplash.com/photo-xxx?w=800&q=80`) for all imagery. These are free, no attribution required in the UI, and load fast via their CDN.

**Image slots to fill:**

| Location | Image Type | Approx Size |
|----------|-----------|-------------|
| Homepage hero | Lifestyle/wellness (person with supplements) | 600x700 |
| Product cards (12) | Clean supplement bottles on neutral bg | 400x400 |
| Product page hero | Single bottle, angled, on light bg | 600x600 |
| Why Nutrava section | Lifestyle wellness photo | 500x600 |
| About page hero | Lab/clean ingredients | 1200x400 |
| About page sections | Team/brand photos | 600x400 |
| Stacks cards (5) | Category mood photos (studying, gym, sleep, energy, nature) | 400x300 |
| Testimonial avatars (3) | Headshot portraits | 48x48 |
| Press bar logos (4-5) | Generic publication silhouettes | SVG |

All images set via `<img>` tags with `loading="lazy"`, proper `alt` text, and `object-fit: cover`. Easy to swap for real product photography later.

**Files:** `preview.html`, `snippets/product-card.liquid`, `sections/hero.liquid`, `sections/why-nutrava.liquid`, `templates/product.liquid`

---

## Phase 3: Homepage Overhaul

### Hero Redesign
- Split layout: text left (60%), lifestyle photo right (40%)
- Amber accent on a key word in the heading
- Stock photo with subtle gradient overlay for depth
- Add animated trust stats below: "10,000+ stacks built", "100% science-backed"

### Section Alternation
Alternate light/dark backgrounds to create visual rhythm:
- Hero: light gradient
- Stats bar: **dark section** (`--color-dark-section`) with amber numbers
- Featured stacks: light
- How it works: light
- Goals: light
- Why Nutrava: light (with photo)
- Trust bar: light
- Science bar: light with subtle texture
- Testimonials: **dark section** with white text
- Quiz CTA: light

### Trust Bar Upgrade
- Add Lucide icons to each badge (not just text)
- Add "As Seen In" press bar below with 4-5 greyed-out publication logo silhouettes (Men's Health, Vogue, GQ, The Telegraph style — placeholder SVGs)

### Testimonials Upgrade
- Add 5-star rating display to each card
- Add circular avatar photos (Unsplash headshots)
- Add left/right navigation arrows for carousel browsing (3 visible, scroll for more)

**Files:** `preview.html` (home page section), `sections/hero.liquid`, `sections/testimonials.liquid`, `sections/trust-bar.liquid`, `sections/stats-bar.liquid`

---

## Phase 4: Product Pages — Persona-Style Depth

### Hero Enhancement
- Replace gradient placeholder with stock product photo
- Add star rating below title: "4.8 (127 reviews)" with gold stars
- Keep existing subscribe toggle + ATC + trust row

### New: Supplement Facts Panel
- Clinical-style bordered table below hero
- Columns: Ingredient, Amount Per Serving, % Daily Value
- Header: "Supplement Facts — Serving Size: 2 capsules"
- Clean design matching existing card styles
- Collapsible on mobile

### New: Clinical References
- 2-3 cited studies per product
- Each study: title (linkable), key finding summary, journal name + year
- Card layout with flask-conical icon
- Heading: "Backed by Science"

### New: FAQ Accordion
- 3-5 questions per product
- Click to expand/collapse with smooth animation (max-height transition)
- Questions: "When will I see results?", "Can I take this with other supplements?", "Any side effects?", "How should I store this?", "Is this vegan/gluten-free?"
- Chevron icon rotates on expand

### New: Reviews Section
- Overall rating display: large "4.8" + 5 stars + "Based on 127 reviews"
- Rating breakdown: horizontal bar chart (5-star: 80%, 4-star: 15%, 3-star: 3%, 2-star: 1%, 1-star: 1%)
- 3-4 individual review cards: name, star rating, date, "Verified Purchase" badge, review text
- "Write a Review" button (UI-only in preview)

### New: "Pairs Well With" Cross-Sell
- Heading: "Customers Also Take"
- Horizontal row of 3-4 product cards
- Uses existing product-card pattern with stock images
- Scrollable on mobile

**Files:** `preview.html` (product page section), `templates/product.liquid`, `assets/product.css`, `assets/quiz.css` (results product cards)

---

## Phase 5: Catalog, Stacks & About Polish

### Shop/Catalog Page
- Replace gradient placeholders with stock product photos
- Add star rating (small, below price) to each card
- Add "Best Seller" amber badge to top 2 products
- Add "New" badge capability

### Stacks Browse Page
- Add mood/lifestyle photo to each stack card (image top, info bottom)
- Focus: person studying at desk
- Gym: person training
- Sleep: peaceful bedroom scene
- Energy: person outdoors/active
- Wellness: nature/greenery

### About Page
- Add hero image (clean lab/ingredients)
- Add brand story photos between text sections
- Make it feel like a real company with real people

**Files:** `preview.html` (shop, stacks, about pages), `templates/collection.liquid`, `templates/page.stacks.liquid`

---

## Phase 6: Newsletter + Final Polish

### Email Newsletter Section
- New section above footer on homepage
- "Join 10,000+ people optimising their wellness"
- Email input + "Subscribe" button
- Subtle background (mint mist or dark section)
- UI-only for preview; Shopify Liquid form for production

### Final Micro-Polish
- Ensure all hover states use new accent colour where appropriate
- Verify dark sections have proper contrast
- Check mobile responsiveness on all new elements
- Verify all stock images load and display correctly

**Files:** `preview.html`, `sections/newsletter.liquid` (new), `templates/index.json`, `layout/theme.liquid`

---

## Implementation Priority

1. Colour palette (global impact, fast)
2. Stock images (biggest visual change)
3. Homepage overhaul (first thing visitors see)
4. Product page depth (conversion-critical)
5. Catalog/stacks/about polish
6. Newsletter + final touches

## Verification

After each phase, open `preview.html` via `start.bat` and verify:
- Colours feel warmer and richer with more contrast
- Stock images display correctly with proper sizing
- Dark sections create visual rhythm without feeling disjointed
- Product pages feel deep and science-forward
- Star ratings, reviews, FAQ all function correctly
- Mobile responsive on all new elements
- Cross-sell row scrolls on mobile
- Newsletter input is styled and functional (UI-only)
