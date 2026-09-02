# SunVolt — Codebase Guide

Complete map of the SunVolt codebase: architecture, data model, business
rules, and conventions. Read this before making changes.
For the management REST API see **[DEVELOPERS.md](./DEVELOPERS.md)**;
for adding products see **[PRODUCT_UPLOAD.md](./PRODUCT_UPLOAD.md)**.

---

## 1. What SunVolt is

SunVolt is a bilingual (Bangla/English) e-commerce + solar-sizing website for
a Bangladeshi solar backup business. It has two halves:

- **Public site** — product catalog, backup-package shop, an interactive
  load calculator that recommends a matching package, cart/checkout, order
  confirmation, about & contact pages.
- **Admin panel** (`/admin`) — single-admin dashboard to manage products,
  packages, orders, appliances, manual invoices, and business/calculator
  settings. Exposes a REST API (`/api/v1`) for external/AI management.

Money is BDT (৳), prices are stored as numeric strings, and phone numbers
follow the Bangladeshi `01XXXXXXXXX` format.

## 2. Tech stack

| Layer      | Choice |
| ---------- | ------ |
| Framework  | **Next.js 16.3** (App Router, `output: "standalone"`, typed routes) |
| UI         | React 19, Tailwind CSS 4, Radix UI (`components/ui/*`, shadcn-style) |
| Language   | TypeScript (strict) |
| Database   | PostgreSQL via **Drizzle ORM** (`drizzle-orm` + `postgres.js`) |
| Validation | **Zod 4** — every mutation validates through a schema |
| Icons      | lucide-react |
| Runtime    | Node.js, Docker deployment |

> ⚠️ This is **Next.js 16** — `params`/`searchParams` are **Promises**,
> `cookies()`/`headers()` are async, typed `LayoutProps<"/route">` and
> `RouteContext<'/route'>` helpers are available, and middleware is named
> `proxy.ts`. Docs live in `node_modules/next/dist/docs/` — check them when
> unsure.

## 3. Getting started

```bash
npm install
cp .env.example .env        # then fill in real values
npm run db:push             # create/sync tables from db/schema.ts
npm run db:seed             # seed settings row + demo data (REQUIRED — settings singleton must exist)
npm run dev                 # http://localhost:3000
```

### Environment variables (`.env`)

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Postgres connection string |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The single admin login (there is no users table) |
| `SESSION_SECRET` | ≥16 chars, HMAC-signs the admin session cookie |
| `NEXT_PUBLIC_SITE_URL` | Public URL for sitemap/robots/metadata |
| `SUNVOLT_PORT` | Legacy host port — current `docker-compose.yml` hardcodes `8085:3000` and no longer reads this |

### npm scripts

| Script | What it does |
| ------ | ------------ |
| `dev` / `build` / `start` | Next.js dev / standalone build / serve |
| `lint` | ESLint |
| `db:push` | Push `db/schema.ts` to the database (drizzle-kit) |
| `db:studio` | Drizzle Studio GUI |
| `db:seed` | Seed database (`db/seed.ts`) |
| `db:import-surjoone` | One-off product import (`db/import-surjoone.ts`) |

## 4. Directory structure

```
app/
  layout.tsx           Root layout (fonts Manrope + Noto Sans Bengali, metadata, global CSS)
  globals.css          Tailwind 4 theme tokens (navy/solar/leaf…)
  error.tsx            Root error boundary
  not-found.tsx        404 page
  robots.ts sitemap.ts SEO endpoints
  (public)/            Public site (route group — no URL prefix)
    layout.tsx         CartProvider + site header/footer, floating CTA, WhatsApp button
    page.tsx           Home: hero, featured products, packages, calculator
    products/          Component catalog + [slug] detail page (gallery lightbox)
    packages/          Backup packages listing + [slug] detail
    calculator/        Interactive load calculator
    cart/ checkout/    Cart (client state) and checkout (server action order)
    order/[id]/        Customer order confirmation
    about/ contact/    Static-ish content pages
  admin/
    login/             Login page + form + credentials action
    (panel)/           Auth-guarded admin panel (layout calls requireAdmin)
      loading.tsx      Panel-wide loading fallback (spinner) shown while pages fetch
      error.tsx        Panel error boundary (retry button)
      page.tsx         Dashboard: order counts, revenue, recent orders
      products/        List / new / [id] edit, toggle-active route, clone & delete actions
      categories/      List / new / [id] edit — DB-backed category CRUD
      orders/          List + [id] detail, status update action
      invoices/        List, new (manual invoices), actions
      appliances/      Calculator appliance catalog CRUD
      settings/        Business + calculator settings
      developers/      API key management + endpoint reference
    (print)/           Print-styled invoice pages (own layout, no sidebar)
  actions/
    orders.ts          createOrder — public checkout server action
  api/
    health/            Liveness + DB probe (used by Docker healthcheck)
    media/[...path]/   Streams public/products + public/uploads from disk
                       (extension allowlist, nosniff header) — see §8 Media route
    v1/                Management REST API — see DEVELOPERS.md
components/
  admin/               Admin-only components (product form + images/description
                       editors, data table, filters, sidebar, delete/clone
                       buttons, invoice sheet/toolbar, API keys manager…)
  ui/                  Generic UI primitives (button, card, input…)
  site/                Header, footer, package card, lang toggle, WhatsApp/floating CTA
  products/            Product card, gallery (lightbox), details tabs, sort select
  cart/ checkout/      Cart provider/view, add-to-cart, checkout form
  calculator/ home/    Calculator client, home calculator section
  appliance-icon.tsx   Appliance icon renderer/picker
db/
  schema.ts            Drizzle schema (single source of truth for tables)
  index.ts             Lazy Postgres client cached on globalThis
  seed.ts              Seeding
  add-*.ts import-*.ts One-off product import/upsert scripts (PRODUCT_UPLOAD.md §3)
lib/
  auth.ts              Admin session (HMAC cookie), login throttle
  queries.ts           Cached read helpers (getSettings, getProducts,
                       getCategories, isValidCategorySlug…)
  categories.ts        Built-in category slugs/labels/icons (seed + fallback)
  panel-rates.ts       Parse/format solar-panel per-watt rates
  order-status.ts      Order status labels (Bangla) + colors
  format.ts            ৳ price / W / Wh formatting, Bengali digits
  i18n.ts              Server-side language from cookie (default Bangla)
  dictionaries.ts      bn/en calculator strings + LANG_COOKIE
  product-description.ts  Rich-text sanitizer for product descriptions
  taka-in-words.ts     Invoice amount-in-words (lakh/crore grouping)
  whatsapp.ts          WhatsApp deep-link helper
  solar/               Pure solar math (no React/DB): calculator, battery,
                       sizing, packages — the recommendation engine
  api.ts               /api/v1 plumbing: withApiKey guard, JSON envelopes,
                       pagination, generic 500s (no internals leak)
  api-auth.ts          API key hashing/verification (SHA-256)
  api-schemas.ts       Zod schemas for /api/v1 request bodies
  api-products.ts      buildProductValues/slugify shared by API product routes
  api-endpoints.ts     Endpoint reference table shown in Admin → Developers
  utils.ts             cn() class-merge helper
scripts/               One-off maintenance scripts (tsx)
docs/                  CODEBASE.md (this file — read FIRST), DEVELOPERS.md
                       (API reference), PRODUCT_UPLOAD.md (upload runbook)
proxy.ts               Middleware: bounces anonymous users off /admin
v1/                    ⚠️ ARCHIVED design prototype (admin re-skin experiment).
                       NOT part of the live app — nothing imports it and it
                       does not type-check. Never read, import, or build on
                       it; exclude v1/ paths from searches and tsc output.
```

## 5. Data model (`db/schema.ts`)

| Table | Purpose | Notes |
| ----- | ------- | ----- |
| `products` | **Packages AND components.** `category = 'package'` = complete backup package (calculator-recommendable); anything else is a standalone component (inverter, panel, battery…). | Slugs unique. JSONB columns: `specs`, `features`, `images[]` (gallery; cover is `imageUrl`), `highlights`, `packaging`, `costPrice`. Numeric columns are stored as strings. |
| `categories` | **Product categories, managed in Admin → Categories** (slug, label, Bangla label, icon, active, sort order). Seeded with the built-in list from `lib/categories.ts`; the site falls back to that list when the table is empty. Deleting a category in use is blocked — disable it instead. |
| `appliances` | Calculator load presets (name, icon, defaultWatt). | Soft-referenced by orders. |
| `orders` | Customer orders (checkout or manual). Status enum: `pending → confirmed → processing → installed → completed / cancelled`. | Snapshot fields (`totalLoad`, `backupHours`, `requiredEnergy`) recomputed server-side at checkout. |
| `order_items` | Line items per order — `productName`/`unitPrice` **snapshotted** so later product edits don't rewrite history. | Cascade-delete with order. |
| `order_appliances` | Calculator load list attached to an order (`applianceId` null for custom devices). | Cascade-delete with order. |
| `invoices` | **Manual** invoices only (phone/walk-in sales). Website orders render invoices on the fly from order data and are never stored here. Sequential `invoiceNo` (`INV-0007`). | |
| `invoice_items` | Invoice line items with `position` ordering. | Cascade-delete with invoice. |
| `settings` | **Singleton row (`id = 1`)** holding business contact info, currency, calculator parameters, USD→BDT rate, solar-panel per-watt rates (`"12:30,24:28"`), `showMargin` flag. | Must exist — `getSettings()` throws otherwise (run `db:seed`). |
| `api_keys` | REST API keys for the `/api/v1` management API. Keys stored as SHA-256 hashes; plaintext shown once at creation. | See DEVELOPERS.md. |

Key relationships: `orders.productId → products`, `order_items → orders`,
`order_appliances → orders/appliances`, `invoices/invoice_items`. Deletion
guards: products/appliances referenced by orders **cannot be deleted** —
disable (`active = false`) instead.

## 6. Business logic

### Packages vs components (important!)

- `category = 'package'` → shown in **/packages** and the calculator's
  recommendations. Requires `batteryVoltage`, `batteryCapacityAh`,
  `backupHours`, `recommendedLoadWatt` (enforced by the product form schema).
- Any other category → shown in **/products** catalog. Package-only fields
  are nulled for components.
- Categories are **DB rows** managed in Admin → Categories. Product writes
  validate the category with `isValidCategorySlug()` (`lib/queries.ts`) —
  the `categories` table, falling back to the built-in `lib/categories.ts`
  list. `package` is reserved and cannot be created as a category row.

### Managing products in admin

- **Admin → Products** lists everything with search/filters, per-row
  Enable/Disable, **Clone**, and Edit. Clone (`cloneProduct` in
  `app/admin/(panel)/products/actions.ts`) duplicates a product as a
  **disabled** draft — "{name} (copy)" with slug `…-copy` (`…-copy-2`… if
  taken) — and opens its edit form; the fastest way to add a similar
  product (see PRODUCT_UPLOAD.md fast path).

### Solar-panel auto-pricing

Solar-panel products can be priced globally: `Settings → panelRates` maps a
nominal system voltage to a price-per-watt (e.g. `12 → ৳30/W`). A
`solar-panel` product with `panelVoltage` + `solarPanelWatt` set gets
`price = rate × watts` automatically on save (falls back to the entered
price when no rate matches). See `lib/panel-rates.ts`.

### The calculator engine (`lib/solar/`)

Pure functions, no React/DB dependencies: total load → required Wh →
battery Ah → matching package. Tunable parameters come from the settings
row (`batteryEfficiency`, `systemEfficiency`, `recommendedReserve`,
`systemVoltage`, `panelOutputFactor`, `peakSunHours`, standard
`batterySizes`/`controllerSizes`). Package matching applies a single usable
factor (no stacking) — see the comment atop `lib/solar/calculator.ts`.

### Order flow

1. Customer builds load in calculator / cart (client state in
   `components/cart/cart-provider.tsx`).
2. `createOrder` (`app/actions/orders.ts`) validates with Zod, **recomputes
   prices server-side from the DB** (client prices never trusted),
   normalizes BD phone numbers, snapshots line items, stores calculator
   context, redirects to `/order/{id}`.
3. Admin updates status from the order detail page; every transition is a
   full enum value.

### Invoices

- Manual: created in admin (`invoices/actions.ts`); totals always computed
   server-side; `invoiceNo` gapless `INV-NNNN` via `nextInvoiceNo()`.
- Website orders: printed from order data on the fly (`app/admin/(print)/`)
   — never inserted into `invoices`.

## 7. Authentication & security

- Single admin from env (`ADMIN_EMAIL`/`ADMIN_PASSWORD`), no users table.
- Session = HMAC-SHA256-signed cookie `sunvolt_admin_session` (7-day TTL),
  created/verified in `lib/auth.ts`. `requireAdmin()` guards every admin
   page/action (redirects to login).
- `proxy.ts` (middleware) only does a **fast cookie-presence check** on
   `/admin/*` — the real signature check happens in the layout/actions.
- Login throttle: 5 failed attempts / 10 min per identifier, in-memory.
- Constant-time comparisons everywhere (`timingSafeEqual`).
- The `/api/v1` management API authenticates with **API keys**
  (`Authorization: Bearer sv_live_…`) — creation/revocation in
  Admin → Developers. Every handler is wrapped by `withApiKey()`
  (`lib/api.ts`): unexpected errors are logged server-side and answered
  with a generic `500 {"error":{"code":"internal_error"}}` so DB/driver
  internals never leak to clients.

## 8. Conventions

- **Mutations = Server Actions** (`"use server"` files next to the pages
  they serve). Every action: `await requireAdmin()` → Zod-validate → DB
  write → `revalidatePath("/", "layout")` (public pages read live data
  through cached query helpers) → `redirect`.
- **`redirect()` throws — keep it outside `try/catch`.** A route handler
  that calls a redirect-ending server action inside its try/catch swallows
  the throw and returns 500 *after* the DB write already happened (this was
  the toggle-active bug). JSON route handlers such as
  `/admin/products/toggle-active` do the update + `revalidatePath` directly
  and never redirect.
- **Validation = Zod** at every boundary (forms, actions, API bodies).
- **Money** = Drizzle `numeric` → JS **string**; convert with `Number(x)`
  and write back with `.toFixed(2)`. Format for display with
  `formatPrice()`.
- **Dates & numbers in shared components must be deterministic** — use
  `formatDate()` / `formatDateTime()` / `formatNumber()` from
  `lib/format.ts`. Raw `toLocaleDateString()`-style calls render different
  strings on the server (UTC) vs the browser (Asia/Dhaka), breaking
  hydration; and in `ProductsDataTable` a hydration mismatch cascaded into
  an endless re-render loop that froze the whole admin tab (fixed by the
  memoized `columns`/`enrichedData` + post-hydration localStorage merge).
- **Reads** go through `lib/queries.ts` helpers (React `cache`-deduped per
  request).
- **Images**: uploads land in `public/products/` with generated filenames
  (PNG/JPG/WebP/GIF, ≤5 MB), stored as site paths
  (`/api/media/products/<file>`). Product URLs from external CDNs are also
  allowed by the Next.js image optimizer when their host is listed in
  `next.config.ts` → `images.remotePatterns` (currently
  `sc04.alicdn.com/kf/**`, `solarhousebd.com/wp-content/uploads/**`, and
  `safebdes.com/image/cache/catalog/**`).
  Add new hosts there before using them as product image URLs. The volume is mounted persistent in Docker. The container
  entrypoint fixes ownership of bind-mounted upload directories before
  dropping to the `nextjs` user, so admin uploads work in production as well
  as local development.
- **Media route**: production Next.js only serves `public/` files that existed
  at server startup, so freshly uploaded files would 404 until a restart.
  `app/api/media/[...path]/route.ts` streams uploaded files from disk on every
  request (`/api/media/products|uploads/<file>` — extension allowlist, no path
  traversal, `X-Content-Type-Options: nosniff`). All uploaders return
  `/api/media/...` paths; legacy
  `/products/<file>` URLs of pre-existing images keep working unchanged.
- **Product gallery**: `components/products/product-gallery.tsx` renders a
  full-fit cover with a thumbnail strip; clicking opens a click-to-zoom
  lightbox with prev/next arrows and keyboard navigation.
- **Product detail tiles**: the `features` textarea accepts `Label: Value`
  lines; these drive the compact tiles shown after stock status. The `specs`
  object remains the detailed Technical specification table.
- **Product descriptions**: the optional `description` field is edited with the
  rich-text editor and stored as sanitized HTML. It supports pasted formatting,
  lists, links, and uploaded images. The public product page shows it in a
  Description tab beside Technical Specification; empty content hides that tab.
  Unsafe tags, attributes, and URL schemes are removed server-side.
- **Styling**: Tailwind utility classes with custom tokens — `navy`
  (primary dark), `solar` (accent), `leaf` (success), `secondary`
  (surface), `destructive` (danger). UI primitives in `components/ui/`.
- **i18n**: public UI is largely Bangla with English mix; product names
  have optional `nameBn`. No i18n framework — dictionaries only for
  calculator strings (`lib/dictionaries.ts`).
- **Errors**: forms return `{ message }` state (used with
  `useActionState`); the API returns `{ error: { code, message } }`.

## 9. Deployment

- `Dockerfile` builds the **standalone** Next.js server; container listens
  on 3000, `docker-compose.yml` maps host **8085** → container 3000
  (hardcoded in its `ports:` — the legacy `SUNVOLT_PORT` env var is no
  longer read by compose).
- Persistent volumes: `./public/products` and `./public/uploads` (uploaded
  images survive rebuilds).
- Healthcheck: `GET /api/health` (returns `{ status, database }`).
- All credentials via `.env` — never baked into the image. See
  `../DEPLOYMENT.md` (repo root) for the full runbook.

## 10. Common tasks

| Task | Where |
| ---- | ----- |
| Create a similar product | Admin → Products → **Clone** (disabled draft → edit → enable). Bulk/one-off imports: committed `db/add-*.ts` script per PRODUCT_UPLOAD.md §3 |
| Add/change a product field | `db/schema.ts` → `npm run db:push` → product zod schema + `values` mapping in `app/admin/(panel)/products/actions.ts` → `components/admin/product-form.tsx` → (if public) relevant components |
| Add a category | Admin → Categories (no code change). Built-in defaults seed/fallback list lives in `lib/categories.ts` — product form, admin list/filters, zod schemas and API index all read the DB via `getCategories()` |
| Change calculator math/params | `lib/solar/*` (math) or the `settings` table (params) |
| Add an admin section | Folder under `app/admin/(panel)/`, add nav entry in `components/admin/sidebar.tsx` |
| Add an API endpoint | `app/api/v1/…` — follow `DEVELOPERS.md`, auth via `lib/api-auth.ts` |
| Update seeding | `db/seed.ts` |
