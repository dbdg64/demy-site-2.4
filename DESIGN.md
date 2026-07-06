# Design — ديمى لمواتير المياه

## Design System

**Version:** v2 (Light theme · Wallpaper textures · Animations)
**Framework:** Vanilla HTML/CSS/JS — no framework
**Layout:** RTL throughout (Arabic)

---

## Design Tokens

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#f59e0b` | Primary CTA, accent highlights (warm orange) |
| `--color-primary-hover` | `#d97706` | Primary button hover state |
| `--color-primary-light` | `#fef3c7` | Subtle highlights, badges |
| `--color-primary-subtle` | `#fffbeb` | Very light backgrounds |
| `--color-accent` | `#0d9488` | Secondary accent (teal) |
| `--color-accent-hover` | `#0f766e` | Accent hover state |
| `--color-accent-light` | `#ccfbf1` | Accent subtle backgrounds |
| `--color-bg` | `#fafaf9` | Page background (warm off-white) |
| `--color-bg-alt` | `#f5f5f4` | Alternate section background |
| `--color-surface` | `#ffffff` | Card/component background |
| `--color-border` | `#e7e5e4` | Borders |
| `--color-border-light` | `#f0efed` | Subtle borders |
| `--color-text` | `#292524` | Primary text (warm charcoal) |
| `--color-text-secondary` | `#78716c` | Secondary text |
| `--color-text-muted` | `#a8a29e` | Muted/placeholder text |
| `--color-text-inverse` | `#fafaf9` | Text on dark backgrounds |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-body` | `'Almarai', system-ui, sans-serif` | Body text, UI elements |
| `--font-display` | `'Oswald', system-ui, sans-serif` | Headings, display text |

**Fonts:** Google Fonts — Almarai (Arabic), Oswald (English headings)

### Spacing & Layout

| Token | Value |
|-------|-------|
| `--max-width` | `1200px` |
| `--nav-height` | `68px` |
| `--radius-sm` | `6px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `20px` |
| `--radius-xl` | `28px` |

### Motion

| Token | Value |
|-------|-------|
| `--ease-spring` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-smooth` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(41,37,36,0.06)` |
| `--shadow-md` | `0 4px 16px rgba(41,37,36,0.08)` |
| `--shadow-lg` | `0 8px 32px rgba(41,37,36,0.10)` |
| `--shadow-xl` | `0 16px 48px rgba(41,37,36,0.12)` |

---

## Component Patterns

### Buttons (`.btn`)

- Base: `padding: 0.75rem 1.5rem`, `border-radius: var(--radius-md)`
- Variants: `.btn--primary` (orange), `.btn--outline` (ghost), `.btn--accent` (teal), `.btn--sm` (small)
- Hover: Darken background, subtle lift with shadow
- Focus: `outline: 2px solid var(--color-primary)`

### Cards (`.card`)

- Background: `var(--color-surface)`
- Border: `1px solid var(--color-border)`
- Border-radius: `var(--radius-lg)`
- Hover: Lift with `var(--shadow-md)`

### Grid System

- `.grid--2` — 2 columns
- `.grid--3` — 3 columns
- `.grid--4` — 4 columns
- `.grid--auto` — `repeat(auto-fill, minmax(280px, 1fr))`

### Section Layout

- `.section` — `padding: 5rem 1.5rem`
- `.section--alt` — alternate background
- `.container` — `max-width: var(--max-width)` centered

---

## Visual Effects

### Wallpaper Texture

Subtle dot-grid overlay on all pages:
```css
background-image:
  radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.04) 0%, transparent 60%),
  radial-gradient(ellipse at 80% 20%, rgba(13,148,136,0.03) 0%, transparent 60%),
  radial-gradient(ellipse at 50% 80%, rgba(245,158,11,0.03) 0%, transparent 60%),
  url("data:image/svg+xml,...dot-pattern...");
```

### Page Transitions

View Transitions API for smooth navigation:
- Exit: `0.35s fadeOut`
- Enter: `0.5s fadeInUp` (0.08s delay)

### Scroll Reveal

`.reveal` elements animate in when scrolling into view:
- Trigger: `IntersectionObserver` with threshold 0.1
- Animation: Fade up with `--ease-smooth`

### Reduced Motion

All animations disabled via `@media (prefers-reduced-motion: reduce)`

---

## Responsive Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Desktop | > 768px | Full layout |
| Mobile | ≤ 768px | Single column, hamburger nav, reduced padding |

---

## Icons

Using inline SVG icons (Iconify-compatible paths) instead of FontAwesome for:
- Feature cards — distinct icons per feature (fan, gear, thermometer, shield, energy)
- CTAs — WhatsApp SVG in buttons
- Contact — phone, location, envelope SVG icons
- Reviews — star SVGs

All icons use `fill="currentColor"` or `fill="#ffa800"` (gold accent).

---

## File Structure

```
prototype/public/
├── css/
│   └── style.css          # Main design system
├── js/
│   ├── main.js            # Navbar, animations, scroll reveal
│   ├── products.js        # Product grid + filtering
│   └── product-detail.js  # Product detail page
├── index.html             # Homepage
├── products.html          # Products catalog
├── product.html           # Product detail (SPA-style)
├── about.html             # About page
├── contact.html           # Contact page
├── awareness.html        # Educational content
└── assets/
    └── products/          # Product images
```

---

## Design Principles (from PRODUCT.md)

1. **Industrial clarity, not decoration.** Every element earns its place.
2. **Specs as hero.** Product specifications are primary content.
3. **Trust through transparency.** Real business info front and center.
4. **Arabic-first, not Arabic-translated.** Native Egyptian Arabic.
5. **Confidence without hype.** No pressure tactics.

## Anti-Patterns to Avoid (per PRODUCT.md)

- No lifestyle photography
- No SaaS patterns (cookie banners, chat widgets)
- No dark/gaming aesthetic
- No emotional copy
- No AI-generated slop (gradient text, glassmorphism, numbered eyebrows)

---

*Last updated: Generated from current codebase after DESIGN.md recovery*