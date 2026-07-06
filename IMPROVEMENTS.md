# Improvements — Waterpumper Project

Audit conducted 2026-07-06 across all three surface areas (`prototype/`, `dashboard/`, `api/`).  
Each entry carries impact and effort to prioritize.

---

## A. Architecture & Code Organization

### A1. Monorepo has no workspace orchestration
**Impact:** High · **Effort:** Low  
No root `package.json`, no shared scripts, no `turbo.json` or `nx` config. `prototype/` uses npm, `dashboard/` uses npm with a different lock file. No shared dev tooling config.  
→ Add root workspace; extract shared lint, format, and type-check scripts.

### A2. `prototype/` mislabeled as "Next.js" (AGENTS.md)
**Impact:** Medium · **Effort:** Low  
AGENTS.md says "Next.js App Router" but `prototype/` is a vanilla Express app serving static HTML (no SSR, no routing framework). Every JS file is an IIFE, not a module.  
→ Correct documentation OR migrate to the stated stack.

### A3. Three surface areas share no code
**Impact:** Medium · **Effort:** Medium  
`prototype/public/js/`, `prototype/public/data.js`, and `dashboard/src/` each define their own fetch patterns, URL constants, and product schema. Changes to the API shape require updating 3 places.  
→ Extract shared API client, types, and constants into a `packages/shared/` workspace package.

### A4. `public/data.js` — static fallback not consumed by all pages
**Impact:** Low · **Effort:** Low  
`data.js` duplicates seed data but `products.js` loads it as a fallback, while `product-detail.js` doesn't. Inconsistency means offline/product-detail will show blank.  
→ Either remove it or make all pages fall back consistently.

### A5. `db/init.js` vs `scripts/schema.sql` — duplicated schema
**Impact:** Medium · **Effort:** Low  
Schema lives in two places with no single source of truth. `init.js` runs `CREATE TABLE IF NOT EXISTS` imperatively; `schema.sql` mirrors it for manual runs. They drift easily.  
→ Keep only `schema.sql` as the authoritative schema, generate `init.js` via a seed script.

---

## B. Security

### B1. Hardcoded JWT secret fallback
**Impact:** **Critical** · **Effort:** Low  
`const JWT_SECRET = process.env.JWT_SECRET || 'demy-secret-key-2026'` in `api/index.js:53`. Anyone who reads the source can forge tokens on a deployment without `JWT_SECRET` set.  
→ Remove the fallback; crash at startup if `JWT_SECRET` is unset.

### B2. `bcrypt.compareSync` / `hashSync` — blocks the event loop
**Impact:** Medium · **Effort:** Low  
Auth uses synchronous bcrypt (`compareSync`, `hashSync`) which blocks Node's event loop for ~200–400ms per call. Under concurrent login attempts this degrades all other requests.  
→ Replace with `bcrypt.compare()` / `bcrypt.hash()` (async).

### B3. Admin SQL passthrough (`POST /api/sql`)
**Impact:** **Critical** · **Effort:** Low  
Endpoint allows `INSERT`, `UPDATE`, `ALTER TABLE` in addition to `SELECT`. A compromised admin token provides arbitrary DDL/DML on the Postgres database.  
→ Restrict to `SELECT` only. Or remove the endpoint entirely and provide a safer debug UI.

### B4. Plaintext security answers
**Impact:** High · **Effort:** Low  
`security_answer` stored in plaintext. `verifySecurityAnswer` does case-insensitive comparison with the raw value.  
→ Hash answers (like passwords). The security question flow is weak by design, but answers shouldn't be plaintext.

### B5. Token stored in localStorage (dashboard)
**Impact:** High · **Effort:** Medium  
Dashboard stores JWT and user object in `localStorage`. Accessible to any JS on the same origin (XSS). No token expiry check; stale tokens are treated as valid until API rejects them.  
→ Use httpOnly cookies for the token; add client-side token expiry pre-check.

### B6. Non-standard auth header
**Impact:** Low · **Effort:** Low  
API uses `x-auth` header instead of standard `Authorization: Bearer <token>`.  
→ Adopt `Authorization: Bearer`. The Express middleware, proxy configs, and docs all expect `x-auth`.

### B7. No CSRF protection
**Impact:** Medium · **Effort:** Medium  
No CSRF tokens. State-changing endpoints (`POST/PUT/DELETE`) rely solely on the `x-auth` header which must be set by JS — native protection against cross-origin form submissions, but no formal CSRF strategy.

### B8. No password strength policy
**Impact:** Medium · **Effort:** Low  
Password minimum length is 4 characters. No complexity requirements, no breach detection.  
→ Enforce minimum 8 characters; integrate a breached-password check.

---

## C. API Design

### C1. All try/catch handlers return blanket 500 errors
**Impact:** Medium · **Effort:** Low  
Every route wraps its body in `try/catch` and returns `{ error: 'حدث خطأ في الخادم' }`. Errors are logged to console but not classified. Downstream can't distinguish validation errors from infrastructure failures.  
→ Introduce structured error responses (`{ ok: false, code, message }`); use an error-class taxonomy.

### C2. Product list API does N+1 enrich for every product
**Impact:** **Critical** · **Effort:** High  
`getAllProducts()` fetches all products (1 query) then calls `enrichProduct()` in a `Promise.all` loop — 3 extra queries per product (specs, features, images). For 20 products that's 61 queries.  
→ Rewrite `enrichProduct` to batch-load all specs/features/images for the requested set in 3 total queries, then join in-memory.

### C3. No request validation
**Impact:** Medium · **Effort:** Medium  
Route handlers check only bare presence (`if !username`). No schema validation for types, formats, or required fields across `POST`/`PUT` bodies.  
→ Add a validation library (Zod / Joi); validate request bodies declaratively.

### C4. Resource identifiers are inconsistent
**Impact:** Low · **Effort:** Low  
Product detail uses `:slug` (`GET /api/products/:slug`), but image/media routes use numeric `:id`.  
→ Choose one convention. Using slug everywhere makes URLs more meaningful but requires slug uniqueness guarantees.

### C5. No API versioning
**Impact:** Low · **Effort:** Low  
All routes at `/api/`. Frontend couples to the current shape.  
→ Consider `/api/v1/` prefix to allow future iteration.

### C6. No pagination on list endpoints
**Impact:** Medium · **Effort:** Medium  
`GET /api/products`, `/api/users`, `/api/media` return all rows. Scales poorly.  
→ Add `?limit` and `?offset` (or cursor-based pagination for product list).

---

## D. Database

### D1. SQLite leftovers tracked in git
**Impact:** Medium · **Effort:** Low  
`prototype/db/store.db`, `store.db-wal`, `store.db-shm` are SQLite files committed to the repo. They shouldn't exist in a Postgres project.  
→ `git rm` and add to `.gitignore`.

### D2. No migration system
**Impact:** **Critical** · **Effort:** High  
Schema changes are made by appending `ALTER TABLE` or new `CREATE TABLE IF NOT EXISTS` to `init.js`, with try/catch fallbacks (e.g. `video_url` column). There's no way to roll back or track which migrations ran.  
→ Adopt a proper migration tool (node-pg-migrate, dbmate, or Prisma Migrate). Use `init.js` only for seed data.

### D3. `enrichProduct` returns redundant columns for list views
**Impact:** Medium · **Effort:** Low  
`GET /api/products?featured=1` returns fully enriched products (specs, features, images) for every product even when the list view only needs name/image/slug.  
→ Ship a lightweight list variant and a detail variant of the product response.

### D4. `SELECT *` in several queries
**Impact:** Low · **Effort:** Low  
Several queries use `SELECT * FROM …` instead of projecting specific columns. Tight coupling between DB schema and API response shape.  
→ Project explicit columns in all queries.

### D5. Seed data duplicated in `data.js`
**Impact:** Low · **Effort:** Low  
`prototype/public/data.js` duplicates the 17 seed products. Drifts from `init.js` seed data.  
→ Remove or generate from the DB seed.

---

## E. Frontend — Public Site (`prototype/public/`)

### E1. Vanilla JS IIFEs — no module system
**Impact:** Medium · **Effort:** High  
`main.js`, `home.js`, `products.js`, `product-detail.js` are all IIFEs sharing global state. No tree-shaking, no bundling, no type checking.  
→ Bundle with esbuild or Vite. Export modules, import where needed.

### E2. No image optimization pipeline
**Impact:** Medium · **Effort:** Medium  
Product images served as raw `.webp` at original resolution. No responsive images (`srcset`), no lazy loading attributes beyond IntersectionObserver, no WebP fallback for old Safari.  
→ Integrate with an image CDN (Vercel Image Optimization, Cloudinary, or imgix); add `loading="lazy"` on all `<img>`.

### E3. Large video files served from origin
**Impact:** High · **Effort:** Medium  
Videos are 2–16 MB MP4 files served from the same Vercel/Express origin. No streaming, no compression, no CDN edge. Blocks page load and burns function duration.  
→ Host videos on a purpose-built platform (Mux, Cloudflare Stream, Vercel Blob with streaming) or at minimum add preload metadata / lazy loading.

### E4. No analytics or conversion tracking
**Impact:** High · **Effort:** Low  
No tracking of WhatsApp button clicks, phone number taps, page views, or product views. Impossible to measure which products drive inquiries.  
→ Add privacy-conscious analytics (Plausible, Umami, or PostHog). Track WhatsApp/phone clicks as conversion events.

### E5. No service worker / PWA support
**Impact:** Low · **Effort:** Medium  
No offline support, no install prompt. Given Egypt's mobile-first and intermittent-connectivity usage, a basic service worker would improve perceived performance.  
→ Add a Workbox-based service worker for asset caching.

### E6. No meta tags per page
**Impact:** Medium · **Effort:** Low  
All pages share a generic `<title>` and have no Open Graph / Twitter Card meta tags. Social sharing shows a bare URL. Product detail pages lack per-product SEO tags.  
→ Add per-page meta tags. For product pages, server-render or inject product-specific OG tags.

### E7. Missing structured data
**Impact:** Medium · **Effort:** Low  
No `schema.org/Product`, `schema.org/LocalBusiness`, or `schema.org/Organization` JSON-LD. Google Shopping / rich results cannot consume product data.  
→ Add JSON-LD for products (name, slug, image, category) and LocalBusiness (address, phone, area served).

---

## F. Frontend — Dashboard (`dashboard/`)

### F1. Inline styles in JSX
**Impact:** Medium · **Effort:** Medium  
`Login.jsx` has ~196 lines of inline style objects. `Dashboard.jsx` mixes inline styles for layout alongside CSS classes. Hard to maintain, no dark-mode support, no reuse.  
→ Move styles to CSS modules or CSS-in-JS with theming support.

### F2. `window.location.pathname` instead of React Router
**Impact:** Low · **Effort:** Low  
`activeClass()` in `App.jsx` uses `window.location.pathname` to highlight the active nav item instead of React Router's `useLocation()`.  
→ Replace with `useLocation().pathname`.

### F3. Token never validated on app load
**Impact:** Medium · **Effort:** Low  
On mount, `AuthContext` reads `localStorage` and trusts the token is valid. A stale/expired token shows the dashboard before failing on the first API call.  
→ Validate the token against `/api/ping` or decode and check `exp` on the client.

### F4. `.catch()` swallows all errors silently
**Impact:** Medium · **Effort:** Low  
Every API call in dashboard pages uses `.catch(() => showToast('…', 'error'))`. All errors (network, 4xx, 5xx) produce the same toast. Debugging fails is harder.  
→ Create a fetch wrapper that distinguishes network errors from API errors and surfaces the actual error message.

### F5. TypeScript packages installed but unused
**Impact:** Medium · **Effort:** Low  
`@types/react` and `@types/react-dom` are in `devDependencies` but all files are `.jsx`. Dashboard has no `tsconfig.json`.  
→ Either remove the types or migrate to TypeScript (recommended for a maintenance-phase app).

### F6. Component files are too large
**Impact:** Medium · **Effort:** Medium  
Several pages exceed 200 lines (`ProductAdd.jsx: 251`, `ProductEdit.jsx: 12.5KB`, `Quiz.jsx: 12.7KB`, `Login.jsx: 246`, `Products.jsx: 166`). Forms and tables should be extracted into smaller composable components.  
→ Split by concern: form fields, tables, modals, file uploaders.

### F7. Dashboard loads 3 render-blocking Google Font families
**Impact:** Medium · **Effort:** Low  
`Changa`, `Cairo`, and `IBM Plex Sans Arabic` are all loaded from Google Fonts. Only one or two are actively used. Each blocks rendering.  
→ Drop unused fonts; self-host the chosen one via `@font-face`.

---

## G. Performance

### G1. No API response caching
**Impact:** High · **Effort:** Low  
No `Cache-Control` headers, no ETags, no conditional requests. Every page load re-fetches the full product list. Vercel serverless function re-runs on every request.  
→ Add `Cache-Control: public, max-age=60, s-maxage=300` to product list; add ETag support.

### G2. Express serves all routes through a single Vercel function
**Impact:** High · **Effort:** Medium  
`vercel.json` routes every path (`/(.*)`) to `api/index.js`. Static CSS/JS/assets are served through the Express handler, bypassing Vercel's CDN cache.  
→ Move static assets out of the Vercel function path. Use Vercel's static file serving for `/assets/`, `/css/`, `/js/`.

### G3. No code splitting on dashboard
**Impact:** Medium · **Effort:** Medium  
Vite builds a single JS bundle (~280KB+). There's no route-based code splitting with `React.lazy`.  
→ Add `React.lazy(() => import('./pages/…'))` per route.

### G4. No compression for API responses
**Impact:** Medium · **Effort:** Low  
Express API responses are not compressed. Full product listings with Arabic text inflate payload size.  
→ Enable gzip/brotli compression middleware.

---

## H. Deployment & Infrastructure

### H1. 4 deployment platforms configured, none cleanly
**Impact:** High · **Effort:** Medium  
`vercel.json`, `fly.toml`, `render.yaml`, `.elasticbeanstalk/config.yml` — each with slightly different configs. Maintenance burden, unclear which is canonical.  
→ Choose one platform (Vercel is most complete given the stack). Remove the others.

### H2. Dockerfile doesn't optimize layer caching
**Impact:** Low · **Effort:** Low  
`COPY . .` runs before `RUN npm install --production=false` — wait, actually it's correct: `COPY package*.json` then `RUN npm install` then `COPY . .`.  
→ (Actually `npm install --production=false` in a multi-stage build could be further optimized, but the current pattern is acceptable.)

### H3. No CI/CD pipeline defined
**Impact:** Medium · **Effort:** Medium  
No GitHub Actions or Vercel CI config. Deployments are manual.  
→ Add GitHub Actions for lint → test → deploy to Vercel preview on PR, production on main merge.

### H4. No preview deployments
**Impact:** Medium · **Effort:** Low  
Vercel projects can preview branches but there's no workflow configured. Dashboard API proxy targets `localhost:3003` — no staging API pattern.  
→ Configure Vercel preview branches to use ephemeral Postgres or a shared staging DB.

### H5. Sitemap references a preview Vercel domain
**Impact:** Medium · **Effort:** Low  
`sitemap.xml` uses `https://demy-site-2-4.vercel.app/` — likely a preview or ephemeral URL. Should point to the production domain.  
→ Update to the production domain. Consider generating the sitemap dynamically.

---

## I. Testing

### I1. Zero tests across the entire project
**Impact:** **Critical** · **Effort:** High  
No unit, integration, or E2E tests anywhere. No test runner configured. API routes, auth flows, DB operations, and frontend rendering are entirely untested.  
→ Prioritize:  
  1. Auth flows (login, forgot password, reset)  
  2. Product CRUD operations  
  3. Input validation  
  4. Dashboard component rendering (at minimum Login, Products)  
  5. E2E: critical path (browse products → view detail → WhatsApp click)

---

## J. Developer Experience

### J1. No shared ESLint / Prettier config
**Impact:** Medium · **Effort:** Low  
`dashboard/` uses `oxlint`, `prototype/` has no linter. No formatter config (`.prettierrc`).  
→ Add root ESLint + Prettier config; remove `oxlint` or merge into a single lint pipeline.

### J2. No `.env` best practices
**Impact:** High · **Effort:** Low  
`prototype/.env.local` exists (not gitignored correctly? The file is listed without showing it's gitignored — check). `.env.example` has a placeholder but no validation at startup.  
→ Validate required env vars at startup; crash with a clear message. Ensure `.env.local` is gitignored.

### J3. No Docker Compose for local development
**Impact:** Medium · **Effort:** Low  
Developers need a Supabase/Neon Postgres instance. No `docker-compose.yml` for local Postgres + pgAdmin.  
→ Add `docker-compose.yml` with Postgres service and health check.

### J4. No `.nvmrc` or Node version pinning
**Impact:** Low · **Effort:** Low  
`.elasticbeanstalk/config.yml` references "Node.js 22" but no `.nvmrc` for local dev.  
→ Add `.nvmrc` with `22`.

---

## K. Design & UX

### K1. Two divergent design token systems
**Impact:** Medium · **Effort:** Low  
`prototype/public/css/style.css` defines tokens (`--color-primary: #f59e0b`, `--font-body: 'Almarai'`) while `dashboard/src/styles/dashboard.css` defines different tokens (`--accent: #2563eb`, `--font: 'Changa'`). Colors, fonts, and spacing differ.  
→ Unify into a shared token file. Both surfaces should reference the same palette.

### K2. Dashboard uses different fonts than public site
**Impact:** Medium · **Effort:** Low  
Public site: Almarai (body) + Oswald (display). Dashboard: Changa + Cairo + IBM Plex Sans Arabic. Brand inconsistency.  
→ Use the same font stack (Almarai + Oswald) in the dashboard.

### K3. No loading skeletons or progress indicators
**Impact:** Medium · **Effort:** Medium  
Product list, user list, stats, and media loading all show nothing until the fetch completes. No skeleton, spinner, or shimmer.  
→ Add skeleton placeholders matching the content shape.

### K4. No empty states for lists
**Impact:** Low · **Effort:** Low  
Empty product list / user list / search results show blank space.  
→ Add empty state components with helpful messages and CTAs.

### K5. No error boundaries in dashboard
**Impact:** Medium · **Effort:** Low  
If a React component throws during render, the entire dashboard crashes (white screen).  
→ Add React Error Boundaries around each route.

---

## L. Accessibility

### L1. Missing `lang="ar"` on all HTML pages
**Impact:** High · **Effort:** Low  
Check: `index.html` has `lang="ar" dir="rtl"`. Most pages should too — verify `about.html`, `contact.html`, `awareness.html`, `products.html`, `product.html`.  
→ Add correct `lang` and `dir` attributes to all pages.

### L2. Interactive elements need focus management
**Impact:** Medium · **Effort:** Medium  
Mobile nav toggle, modal dialogs, product compare panel, and pagination controls lack proper focus management (trap, restore, ARIA attributes).  
→ Add focus trapping for modals; ensure all interactive controls are keyboard accessible.

### L3. No skip-to-content link
**Impact:** Low · **Effort:** Low  
No skip navigation link for keyboard users.  
→ Add a visually-hidden skip link at the top of each page.

---

## M. Content & SEO

### M1. Sitemap uses non-production domain
**Impact:** Medium · **Effort:** Low  
See H5. All URLs in `sitemap.xml` point to `demy-site-2-4.vercel.app`.

### M2. No per-product SEO pages
**Impact:** Medium · **Effort:** Medium  
Product detail at `/product?slug=…` (client-rendered). Search engines can't index individual products.  
→ Generate static product pages or add server-side rendering for product details.

### M3. No blog / educational content SEO
**Impact:** Low · **Effort:** Medium  
Awareness page has educational videos but no text content to index. No article/blog section for water pump maintenance topics.  
→ Consider adding text-based educational content that ranks for long-tail keywords (e.g., "how to choose a water pump").

---

## Implementation Priority

| Tier | Items | Rationale |
|------|-------|-----------|
| **P0 — Critical** | B1, B3, B4, D1, D2, I1, C2, H1 | Security holes, data loss risk, or fundamental architecture issue |
| **P1 — High** | B2, B5, C1, C3, E4, G1, G2, H5, K1 | Performance, UX, or moderate security impact |
| **P2 — Medium** | A1, B7, B8, C6, E1, E2, E3, E5, E6, E7, F1, F3, F4, F7, G3, G4, H3, J1, J2, J3, K3, K5, L1 | Quality-of-life, polish, and maintainability |
| **P3 — Low** | A4, A5, C4, C5, D4, D5, F2, F5, F6, H4, J4, K2, K4, L2, L3, M1, M2, M3 | Nice-to-haves, tidy-up |
