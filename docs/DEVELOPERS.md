# SunVolt Management API — Developer Guide

A REST API that exposes **full CRUD over the entire SunVolt business** —
products, packages, orders, invoices, appliances, and settings — so the site
can be managed from scripts, integrations, or **any AI provider** (ChatGPT,
Claude, Gemini, etc.).

- **Base URL:** `https://<your-domain>/api/v1` (local dev: `http://localhost:3000/api/v1`)
- **Format:** JSON in / JSON out (except `POST /uploads`, which is multipart)
- **Interactive index:** `GET /api/v1` returns this endpoint list as JSON

---

## 1. Authentication

Every request needs an API key:

```
Authorization: Bearer sv_live_xxxxxxxxxxxxxxxx
```

(`X-Api-Key: sv_live_…` also works.)

Keys are created and revoked in **Admin Panel → Developers**. The full key
is shown **only once** at creation — only its SHA-256 hash is stored. Treat
keys like passwords; rotate by creating a new key and revoking the old one.

| Error | Meaning |
| ----- | ------- |
| `401 unauthorized` | Missing, malformed, revoked, or wrong key |

## 2. Conventions

- **Lists** return `{ "data": [...], "meta": { "total", "limit", "offset" } }`.
- **Single resources** are returned directly. Timestamps are ISO-8601.
  Money/watt fields are JSON numbers (stored as numeric in Postgres).
- **Errors** return `{ "error": { "code", "message", "details?" } }` with
  status `400` (validation), `401`, `404`, `409` (conflict), `500`.
- **Validation errors** list every bad field in `details`.
- All mutations instantly revalidate the public site — no cache to clear.

## 3. Endpoint overview

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/` | API index (this table as JSON) |
| GET | `/stats` | Dashboard numbers + low-stock + recent orders |
| GET | `/categories` | Product categories with live product counts |
| GET | `/products` | List products & packages (filters below) |
| POST | `/products` | Create a product/package |
| GET | `/products/{idOrSlug}` | Fetch one by UUID **or** slug |
| PATCH | `/products/{idOrSlug}` | Partial update (send only changed fields) |
| DELETE | `/products/{idOrSlug}` | Delete (409 if ordered before — set `active:false` instead) |
| GET | `/appliances` | List calculator appliances |
| POST | `/appliances` | Create appliance |
| GET | `/appliances/{id}` | Fetch one |
| PATCH | `/appliances/{id}` | Partial update |
| DELETE | `/appliances/{id}` | Delete (409 if used in orders) |
| GET | `/orders` | List orders (filters below) |
| POST | `/orders` | Create a manual order (phone/walk-in) |
| GET | `/orders/{id}` | Order with items + calculator appliances |
| PATCH | `/orders/{id}` | Update status / customer info / notes |
| DELETE | `/orders/{id}` | Delete order (items cascade) |
| GET | `/invoices` | List manual invoices |
| POST | `/invoices` | Create invoice with line items |
| GET | `/invoices/{id}` | Invoice with items |
| DELETE | `/invoices/{id}` | Delete invoice (items cascade) |
| GET | `/settings` | Business + calculator settings |
| PATCH | `/settings` | Partial settings update (incl. panel rates) |
| POST | `/uploads` | Upload a product image (multipart) → path for `images` |

---

## 4. Products

`category = "package"` makes it a **backup package** (appears in
/packages and calculator recommendations) — then `batteryVoltage`,
`batteryCapacityAh`, `backupHours`, `recommendedLoadWatt` are **required**.
Any other category is a standalone component. Valid categories:
`package, solar-inverter, bms, solar-panel, inverter, diy-solar,
mppt-charger, dc-charger, accessories, battery` (see `GET /categories`).

**Product fields**

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` ★ | string | 2–120 chars |
| `nameBn` | string | Bangla display name |
| `category` | string | default `package` |
| `slug` | string | auto-generated from `name` if omitted; unique |
| `description`, `brand`, `model`, `sourceUrl` | string | `description` is optional sanitized HTML (up to 20,000 characters); supports formatting, lists, links, and images; blank values hide the Description tab |
| `specs` | object | `{ "Key": "Value" }` detailed Technical specification sheet |
| `features` | string[] | `Label: Value` lines drive compact product tiles after stock status |
| `highlights` | string[] | bullet lists for marketing content |
| `packaging` | object | packaging/delivery table |
| `images` | string[] | ordered paths — **first is the cover**; upload via `POST /uploads` |
| `price` ★ | number | BDT. ★ auto-computed for solar panels (below) |
| `discountPct` | int 0–90 | default 0 |
| `installationPrice` | number | |
| `warrantyMonths` | int | default 6 |
| `stock` | int | default 0 |
| `active` | bool | default true — inactive products hide from the site |
| `featured` | bool | default false — featured first on homepage |
| `panelVoltage` | int | solar panels only: nominal V, picks the per-watt rate |
| `batteryVoltage`, `batteryCapacityAh`, `batteryType`, `solarPanelWatt`, `controllerWatt`, `backupHours`, `recommendedLoadWatt`, `exampleFanCount`, `exampleLightCount` | numbers/string | package-spec fields (nulled for non-packages) |
| `costPrice` | `{ "perPiece": number }` | supplier cost for margin display |

★ = required on create.

**Solar-panel auto-pricing:** a `solar-panel` product with `panelVoltage` +
`solarPanelWatt` gets `price = perWattRate(voltage) × watts` from
`GET/PATCH /settings → panelRates`, overriding the sent price when a rate
exists.

### List

```
GET /api/v1/products?category=package&q=lifepo4&active=true&featured=true
                       &sort=newest|price-asc|price-desc&limit=50&offset=0
```

`limit` ≤ 100. Packages **are** included (filter with `category=package`).

### Create / update examples

```bash
curl -X POST https://your-domain/api/v1/products \
  -H "Authorization: Bearer $SUNVOLT_KEY" -H "Content-Type: application/json" \
  -d '{
    "name": "SunVolt 450W Home Package",
    "category": "package",
    "batteryVoltage": 12, "batteryCapacityAh": 45,
    "backupHours": 12, "recommendedLoadWatt": 39,
    "price": 18900, "stock": 5, "featured": true,
    "images": ["/products/1690000000-ab12cd.jpg"],
    "features": ["LiFePO4 battery", "1-year warranty"]
  }'
```

```bash
curl -X PATCH https://your-domain/api/v1/products/450w-home-package \
  -H "Authorization: Bearer $SUNVOLT_KEY" -H "Content-Type: application/json" \
  -d '{ "price": 17900, "discountPct": 5 }'
```

### Delete

Returns `409 conflict` when the product appears in any order — deactivate
(`PATCH … { "active": false }`) instead.

## 5. Appliances

Calculator load presets.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` ★ | string | ≤ 60 |
| `category` | string | default `general` |
| `defaultWatt` ★ | int 1–2000 | |
| `icon` | string | emoji, default 🔌 |
| `active` | bool | default true |

Same CRUD pattern as products (by UUID). `DELETE` → `409` if referenced by
orders.

## 6. Orders

Statuses: `pending, confirmed, processing, installed, completed, cancelled`.

### List

```
GET /api/v1/orders?status=pending&q=01712345678&limit=50&offset=0
```

`q` matches customer name or phone. Sorted newest-first.

### Create (manual order — phone / walk-in)

Prices are **always taken from the database**, never from the request.

```json
POST /api/v1/orders
{
  "customerName": "Rahim Uddin",
  "phone": "01712345678",
  "address": "House 12, Road 3, Dhanmondi",
  "district": "Dhaka",
  "installationRequired": true,
  "notes": "Called at noon",
  "items": [ { "slug": "450w-home-package", "quantity": 1 } ]
}
```

`items` entries identify the product by `slug` **or** `productId`.
Phone must be a valid BD number (`01XXXXXXXXX`, `+880…` accepted and
normalized). Returns the created order incl. items and computed `totalPrice`.

### Update

`PATCH /api/v1/orders/{id}` accepts any of: `status`, `customerName`,
`phone`, `address`, `district`, `notes`, `installationRequired`.

```bash
curl -X PATCH .../api/v1/orders/0192ab3c-… \
  -H "Authorization: Bearer $SUNVOLT_KEY" -H "Content-Type: application/json" \
  -d '{ "status": "confirmed" }'
```

## 7. Invoices

Manual invoices for sales outside the website. `invoiceNo` is assigned
sequentially (`INV-0007`); totals are computed server-side.

```json
POST /api/v1/invoices
{
  "customerName": "Karim Traders",
  "phone": "01812345678",
  "district": "Chattogram",
  "paymentTerms": "50% advance",
  "salesPerson": "Anik",
  "items": [
    { "description": "SunVolt 450W Package", "quantity": 2, "unitPrice": 18900 }
  ]
}
```

Response includes `invoiceNo`, `totalAmount` and the stored `items`.
`GET /invoices` supports `limit`/`offset`.

## 8. Settings

`GET /api/v1/settings` returns the singleton. `PATCH` accepts any subset of
fields — among them:

| Field | Notes |
| ----- | ----- |
| `businessName`, `phone`, `whatsapp`, `address`, `currency` | contact info shown site-wide |
| `batteryEfficiency`, `systemEfficiency`, `recommendedReserve` | 0.1–1 factors |
| `systemVoltage`, `panelOutputFactor`, `peakSunHours` | calculator params |
| `batterySizes`, `controllerSizes` | arrays of numbers |
| `usdToBdt` | supplier-cost conversion |
| `showMargin` | bool — margin column in admin product list |
| `panelRates` | `[{ "volt": 12, "perWatt": 30 }]` — drives solar-panel auto-pricing |

```bash
curl -X PATCH .../api/v1/settings \
  -H "Authorization: Bearer $SUNVOLT_KEY" -H "Content-Type: application/json" \
  -d '{ "usdToBdt": 125, "panelRates": [ { "volt": 12, "perWatt": 32 } ] }'
```

## 9. Uploads

```
POST /api/v1/uploads          (multipart/form-data, field: file)
→ { "path": "/api/media/products/1690000000-ab12cd.jpg" }
```

PNG/JPG/WebP/GIF, ≤ 5 MB. Use the returned `path` in product `images`.

The returned path is served by the public `GET /api/media/<dir>/<file>`
handler (dirs: `products`, `uploads` — images only, no API key needed).
Fresh uploads are readable immediately; production static-file serving only
covers files that existed at server startup, which is why uploads use this
route instead of `/products/<file>`.

## 10. Stats & categories

- `GET /api/v1/stats` → order counts by stage, active products, order value
  (excl. cancelled), recent orders, and products with `stock ≤ 3`.
- `GET /api/v1/categories` → category slugs, labels, icons and live counts.

## 11. Using the API with an AI provider

Give your AI both the key and `DEVELOPERS.md` (or just the URL — the model
can discover endpoints via `GET /api/v1`). Example system prompt:

> You manage the SunVolt solar shop via its REST API.
> Base URL: https://your-domain/api/v1 — authenticate every request with
> header `Authorization: Bearer <KEY>`. Discover endpoints with
> `GET /api/v1`. Use `GET /stats` for an overview, `GET /products` to
> inspect items, `PATCH /products/{slug}` to update prices/stock, and
> `PATCH /orders/{id}` to move order status. Create packages with
> `POST /products` (category `package` needs batteryVoltage,
> batteryCapacityAh, backupHours, recommendedLoadWatt).

Then you can say things like *"raise the 450W package price to 19,500 and
mark order SV-A1B2C3 as confirmed"* and the AI maps them to two API calls.

## 12. Security notes

- Keys are long random tokens stored hashed; revoke immediately if leaked
  (Admin → Developers → Revoke).
- Serve the API only over HTTPS in production.
- The API has the same power as the admin panel — it can delete data.
  Prefer `active: false` over `DELETE` for anything with order history.
- No built-in rate limiting yet; keep keys private.
