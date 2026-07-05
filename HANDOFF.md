# Waterpumper Project — Agent Handoff

## Overview
E-commerce site for **ديمى لمواتير المياه** (Demy Water Pumps) — a Cairo-based water pump store. Egyptian Arabic, RTL layout, specs-first industrial branding.

## Architecture

```
waterpumper-project/
├── docs/                    # Static site (GitHub Pages — NOT deployed)
│   ├── index.html, products.html, product.html, about.html, ...
│   ├── css/ (style.css, products.css, product-detail.css)
│   ├── js/ (main.js, products.js, product-detail.js)
│   ├── data.js              # Static product data (STATIC_PRODUCTS)
│   └── assets/ (products/, videos/, logo.png)
│
├── prototype/               # Vercel deployment root
│   ├── api/index.js         # Express server (serverless on Vercel)
│   ├── db/ (pool.js, crud.js, queries.js, auth.js, media.js, init.js)
│   ├── scripts/ (schema.sql, seed.sql, migration-video.sql)
│   ├── public/              # Static files served by Express
│   │   ├── index.html, products.html, product.html, ...
│   │   ├── css/, js/, assets/, data.js
│   │   ├── admin/           # Built React dashboard SPA
│   │   └── uploads/         # Local dev file uploads
│   ├── package.json
│   └── vercel.json          # Vercel routing config
│
├── dashboard/               # React admin dashboard source (Vite)
│   └── src/
│       ├── pages/ (Login, Dashboard, Products, ProductAdd, ProductEdit,
│       │          ProductDetail, Users, Quiz)
│       ├── components/ (AuthContext, ToastContext)
│       └── styles/dashboard.css
│
├── egyptian_tts.py          # TTS script (HF Space + edge-tts fallback)
├── .venv/                   # Python venv for TTS
└── HANDOFF.md               # ← this file
```

## Deployments

| Platform | URL | Root | Auto-deploy |
|---|---|---|---|
| **Vercel** | https://demy-site-2-4.vercel.app | `prototype/` | ✅ on push to `main` |
| GitHub Pages | Not enabled | `docs/` | ❌ |

## Database (Supabase)

- **Project ref:** `xehqycyiuywtfknwuzle`
- **Pooler URL:** `postgresql://...@db.xehqycyiuywtfknwuzle.supabase.co:6543/postgres`
- **Connection:** Via `prototype/db/pool.js` — reads `DATABASE_URL` env var

### Key tables

- `products` — id, category_slug, name_ar, slug, featured, image, video_url, sort_order
- `product_specs` — id, product_id, key_ar, value_ar
- `product_features` — id, product_id, feature_ar, sort_order
- `product_images` — id, product_id, path, sort_order (extra images)
- `categories` — slug, name_ar, description_ar, icon, sort_order
- `media` — id, title, description, type, file_path, section, sort_order
- `users` — id, username, password, name, role, security_question, security_answer

### Migration needed for new deployments
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
```

## Admin Dashboard

**URL:** https://demy-site-2-4.vercel.app/admin/
**Build:** `cd dashboard && npm run build -- --outDir ../prototype/public/admin/`

### Features
- Login/logout (JWT auth)
- Product CRUD (add, edit, delete, toggle featured)
- Photo & video upload (Vercel Blob in production, local disk in dev)
- User management (admin only)
- Quiz builder

### File uploads
- **Vercel:** Files go to Vercel Blob store `waterpumper-uploads`
- **Local:** Files go to `prototype/public/uploads/`
- `BLOB_READ_WRITE_TOKEN` set in Vercel env

## Key Design Decisions

### Public products page loads from API first
`products.js` fetches `/api/products` → uses live data (new products from admin). Falls back to `data.js` (STATIC_PRODUCTS) if API unavailable.

### Product detail page loads from API first
`product-detail.js` fetches `/api/products/:slug` → uses live `video_url`. Falls back to `data.js`.

### Absolute paths everywhere
All asset URLs use leading `/` (e.g., `/assets/products/...`, `/product.html?slug=...`) to prevent broken links when pages are at subdirectories like `/products`.

### Card-level click handler
Product cards use a delegated JavaScript click handler — clicking anywhere on the card navigates to `/product.html?slug=...`. Interactive elements (buttons, links, gallery) are excluded.

### SPA basename
Admin dashboard uses `<BrowserRouter basename="/admin">` so all routes are `/admin/products`, `/admin/users`, etc. Server catches `/admin*` and serves `index.html`.

## Critical API Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/auth/login` | No | Login → returns JWT |
| `GET /api/products` | No | Product list (public) |
| `GET /api/products/:slug` | No | Single product (public) |
| `POST /api/products` | JWT | Create product |
| `PUT /api/products/:id` | JWT | Update product |
| `DELETE /api/products/:id` | JWT | Delete product |
| `POST /api/upload` | JWT | Single file upload |
| `POST /api/upload/multiple` | JWT | Multiple file upload |
| `GET/POST/DELETE /api/products/:id/images` | JWT* | Manage extra images |
| `POST /api/sql` | JWT+Admin | Raw SQL queries (debug) |
| `GET /api/media` | No | Media list |

## Vercel Environment Variables (required)

- `DATABASE_URL` — Supabase connection string
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token (for file uploads)
- `JWT_SECRET` — JWT signing secret (default: `demy-secret-key-2026`)
- `VERCEL_OIDC_TOKEN` — Set automatically by Vercel when Blob is linked

## Running Locally

```bash
# 1. Static site (no DB needed)
cd docs && python3 -m http.server 8080
# → http://localhost:8080

# 2. Full prototype (needs DATABASE_URL)
cd prototype && DATABASE_URL=... node server.js
# → http://localhost:3003

# 3. Admin dashboard dev mode
cd dashboard && npm run dev
# → http://localhost:5173 (proxies /api to localhost:3003)
```

## Egyptian Arabic TTS

```bash
# Setup
python3 -m venv .venv
.venv/bin/pip install gradio_client huggingface_hub edge-tts

# Usage
.venv/bin/python egyptian_tts.py "النص" --fallback -o output.mp3
```

## File Upload Storage

| Environment | Storage | URL Format |
|---|---|---|
| Vercel | Vercel Blob CDN | `https://*.public.blob.vercel-storage.com/...` |
| Local dev | `prototype/public/uploads/` | `/uploads/...` |

## Common Gotchas

1. **`video_url` column missing** → Run ALTER TABLE migration
2. **Images 404** → Check paths use leading `/` (absolute), not relative
3. **Dashboard white page** → Hard refresh (Ctrl+Shift+R), check SPA basename
4. **Uploads fail on Vercel** → Verify `BLOB_READ_WRITE_TOKEN` is set
5. **Products not showing** → Public page uses API; check if API returns data
6. **build dashboard** → `cd dashboard && npx vite build --outDir ../prototype/public/admin/`

## Vercel Blob

- Store name: `waterpumper-uploads`
- Store ID: `store_qo8EQ8mbjXU6ZZuf`
- Access: Public
- Region: iad1
- Base URL: `kazjxppykucjyquh.public.blob.vercel-storage.com`
