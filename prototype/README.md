# 🏪 ديمى — Store Prototype v2

Lightweight multi-page storefront for WaterPumper. Built with HTML/CSS/JS + Express.js.

## Improvements over v1

| Before (WordPress/Vite SPA) | After (Express multi-page) |
|---|---|
| Single long page | 4 pages: Home, Products, About, Contact |
| Dark theme | Light theme with warm orange + teal |
| Solid colors | Subtle wallpaper texture + gradient overlays |
| Static hero | Animated hero with floating geometric particles |
| No slide deck | Interactive product slide deck (manual navigation) |
| No page transitions | CSS View Transitions API (experimental) |
| No icons | Font Awesome 6 throughout |
| Hardcoded search | Numeral-normalized search (Arabic/English digits) |
| No design system | Design tokens (CSS custom properties) |
| Boring hero | Animated floating SVG pump particles |
| Green footer | Warm dark footer |

## Run

```bash
cd prototype
npm start       # http://localhost:3003
```

## Pages

- `/` — Home (hero, features, categories, slide deck, reviews)
- `/products` — All products with filter, search, compare
- `/about` — Company story, values, location
- `/contact` — Contact cards, inquiry form, FAQ, map

## Design System

All tokens in `public/css/style.css` under `:root`:
- Warm `--color-primary: #f59e0b` (amber)
- Teal `--color-accent: #0d9488`
- Subtle wallpaper SVG texture overlay
- Smooth spring/smooth easing curves
- Responsive breakpoints
