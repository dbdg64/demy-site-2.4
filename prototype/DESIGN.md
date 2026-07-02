# 🎨 ديمى — Design System v2

Light, warm, accessible design system for WaterPumper storefront (Cairo, Egypt).

---

## Table of Contents

1. [Principles](#principles)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Sizing](#spacing--sizing)
5. [Shadows](#shadows)
6. [Border Radius](#border-radius)
7. [Easing Curves](#easing-curves)
8. [Components](#components)
9. [Wallpaper Texture](#wallpaper-texture)
10. [Responsive Breakpoints](#responsive-breakpoints)
11. [Accessibility](#accessibility)
12. [Usage](#usage)

---

## Principles

- **Warm & approachable** — amber/orange primary evokes reliability, energy, Egyptian sun
- **Light & airy** — off-white background with subtle texture, not flat white
- **Teal accent** — contrasting cool accent for balance and trust
- **Motion with purpose** — animations guide attention, don't distract
- **Mobile-first RTL** — built for Arabic from the ground up

## Color Palette

All tokens in `:root` inside `public/css/style.css`.

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#f59e0b` | CTAs, links, active states, badges |
| `--color-primary-hover` | `#d97706` | Hover states for primary elements |
| `--color-primary-light` | `#fef3c7` | Feature icon backgrounds, tag backgrounds |
| `--color-primary-subtle` | `#fffbeb` | Subtle hover fills, section accents |
| `--color-accent` | `#0d9488` | Secondary accent, success indicators |
| `--color-accent-hover` | `#0f766e` | Hover for accent elements |
| `--color-accent-light` | `#ccfbf1` | Accent icon backgrounds |
| `--color-bg` | `#fafaf9` | Page background (warm off-white) |
| `--color-bg-alt` | `#f5f5f4` | Alternative section background |
| `--color-surface` | `#ffffff` | Cards, modals, dropdowns |
| `--color-border` | `#e7e5e4` | Borders, dividers |
| `--color-border-light` | `#f0efed` | Subtle borders (navbar) |
| `--color-text` | `#292524` | Body text, headings |
| `--color-text-secondary` | `#78716c` | Secondary text, descriptions |
| `--color-text-muted` | `#a8a29e` | Placeholder, disabled, meta |
| `--color-text-inverse` | `#fafaf9` | Text on dark backgrounds |

### Gradient presets

- `--gradient-hero`: `linear-gradient(135deg, #fef3c7 0%, #fff7ed 50%, #f0fdf4 100%)` — warm amber → cream → mint
- CTA banners: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)` — amber → teal

## Typography

| Token | Value |
|---|---|
| `--font-body` | `'Almarai', system-ui, sans-serif` |
| `--font-display` | `'Oswald', system-ui, sans-serif` |

### Scale

| Level | Size | Weight | Usage |
|---|---|---|---|
| Hero title | `clamp(2.2rem, 6vw, 4rem)` | 800 | Home hero heading |
| Section title | `clamp(1.75rem, 3.5vw, 2.5rem)` | 800 | Section headers |
| Card title | `1.05rem – 1.25rem` | 700 | Product/category/feature titles |
| Body | `0.95rem – 1rem` | 400 | Paragraphs, descriptions |
| Small | `0.85rem – 0.9rem` | 400–600 | Specs, meta, nav links |
| Badge | `0.75rem` | 800 | Badges, counts |

### Line heights

- Headings: `1.15 – 1.3`
- Body: `1.6 – 1.8`

## Spacing & Sizing

Based on a 4px grid, applied as `rem` values.

| Rem | Px (16px base) | Usage |
|---|---|---|
| `0.25rem` | 4px | Gap between icon and text |
| `0.5rem` | 8px | Compact gaps |
| `0.75rem` | 12px | Standard inner gaps (cards) |
| `1rem` | 16px | Paragraphs, button padding |
| `1.25rem` | 20px | Card padding, gap between sections |
| `1.5rem` | 24px | Container padding, grid gaps |
| `2rem` | 32px | Section padding, card spacing |
| `3rem` | 48px | Large section padding |
| `4rem` | 64px | Hero/CTA section padding |
| `5rem` | 80px | Section top/bottom padding |

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(41,37,36,0.06)` | Cards resting |
| `--shadow-md` | `0 4px 16px rgba(41,37,36,0.08)` | Cards hovered |
| `--shadow-lg` | `0 8px 32px rgba(41,37,36,0.10)` | Modals, dropdowns |
| `--shadow-xl` | `0 16px 48px rgba(41,37,36,0.12)` | Hero stats panel |

Color uses `#292524` (the text color) not pure black — warmer, more natural.

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Buttons, inputs, badges |
| `--radius-md` | 12px | Cards, feature icons |
| `--radius-lg` | 20px | Categories, deck slides |
| `--radius-xl` | 28px | Hero stats panel |

Full round (`100px` / `50%`) used for pills (filter buttons, deck dots).

## Easing Curves

| Token | Cubic Bézier | Usage |
|---|---|---|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy entrance animations |
| `--ease-smooth` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default for transitions |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit animations |

## Components

### Navbar
- Sticky top, `backdrop-filter: blur(12px)` frosted glass effect
- Border-bottom `1px solid var(--color-border-light)`
- Logo with icon box in primary color
- Nav links with `aria-current="page"` for active state (primary color + light bg)
- Mobile: hamburger toggle, slide-down menu

### Hero
- Full viewport height with `--gradient-hero` background
- Floating SVG pump particles animated with `pump-float` keyframe
- Stats bar: frosted glass (`rgba(255,255,255,0.75)` + blur) positioned at bottom
- Scroll hint chevron bounces at very bottom
- Tag badge (pill shape, `--color-primary-light` bg)

### Cards
- `--color-surface` white background
- `1px solid var(--color-border)` border
- Hover: `border-color` → primary, `--shadow-lg`, `translateY(-4px)`
- Icon containers: 56px square, primary-subtle bg, transition to solid primary on hover

### Slide Deck
- Two-column layout: image left, content right
- On mobile: single column (image on top)
- Auto-advances every 5s, pauses on hover
- Pill-shaped dot navigation
- Chevron buttons for prev/next

### Buttons (`.btn`)
- `display: inline-flex` with gap for icon support
- `.btn--primary`: solid primary bg, shadow, hover lifts 2px
- `.btn--outline`: transparent, border, hover gets primary-subtle bg
- `.btn--accent`: teal solid bg
- `.btn--sm`: compact variant
- `outline-offset: 3px` for focus-visible

### Product Cards
- Image with hover scale transform
- Optional badge overlay (`.badge`)
- Gallery thumbnails below image (scrollable, LTR direction)
- Specs list with primary-color bullets
- Details dropdown for full feature list (checkmark prefix)
- Compare toggle + WhatsApp CTA

### Filter Pills
- Pill-shaped (`border-radius: 100px`)
- Active state: solid primary bg, white text
- Count badge inside pill
- Wrap on small screens

### Footer
- Dark background (`#292524`)
- 3-column grid: brand, info, actions
- On mobile: single column, centered
- Thin top-border copyright line

## Wallpaper Texture

Applied via `body::before` pseudo-element:

```css
body::before {
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.04) ...),
    radial-gradient(ellipse at 80% 20%, rgba(13,148,136,0.03) ...),
    url("data:image/svg+xml,...");  /* subtle dot-grid pattern */
  pointer-events: none;
}
```

Three layers:
1. Warm amber glow at left
2. Teal glow at top-right
3. SVG dot-grid pattern at 40% opacity for texture

## Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| `≤ 768px` | Mobile — single column, condensed padding |
| `769px – 1024px` | Tablet — 2-column grids |
| `≥ 1025px` | Desktop — full layout |

Mobile specific changes:
- Nav height reduces to 60px
- Nav links become vertical slide-down
- Hero stats become a grid (2×2) positioned in flow
- 4-column grids → 2 columns → 1 column
- Section padding reduces from 5rem → 3rem

## Accessibility

- Focus-visible outlines on all interactive elements (`outline-offset` set)
- `aria-current="page"` on active nav links
- `aria-label` on icon-only buttons (nav toggle, deck arrows, back-to-top)
- `aria-expanded` on mobile nav toggle
- `prefers-reduced-motion` media query disables all animations
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<footer>`
- Heading hierarchy respected (h1 → h2 → h3)
- Alt text on all images
- Skip link recommended for addition

## Usage

All tokens are CSS custom properties in `:root`. Reference them in any component:

```css
.my-component {
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: all 0.3s var(--ease-smooth);
}
```

Add new components by composing these tokens — no hardcoded values.
