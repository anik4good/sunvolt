# Product Upload Runbook

How products get added to SunVolt — use this every time. It has two halves:
**§1 is for the person requesting the product** (what to provide),
**§2–§5 is the procedure the assistant follows** to insert, verify, and ship.
Followed since the Microtek Vertiga series import; update it whenever a new
gotcha appears.

---

## 1. What to provide with each product request

Give as much of this as you have. Anything marked *optional* falls back to a
sensible default — see §1.1. Only **price** is truly mandatory besides the name.

| # | Field | Notes |
| - | ----- | ----- |
| 1 | **Name** | Exact display name, e.g. `Microtek Vertiga 1050 Solar IPS/UPS Inverter`. Bengali name (`nameBn`) optional — assistant translates otherwise. |
| 2 | **Category** | Must be one of: `solar-inverter`, `solar-panel`, `mppt-charger`, `dc-charger`, `inverter`, `battery`, `bms`, `diy-solar`, `accessories`. A full backup kit is `package` instead (extra fields required — see §2.2). |
| 3 | **Price (BDT)** | Selling price, whole numbers fine (`18000`). Numeric-range prices (`1250VA–1450VA`) belong in specs, not here. |
| 4 | Cost price *(optional)* | Supplier/reference buying price for the admin margin column. Set `showMargin` off in Settings to hide entirely. |
| 5 | Discount % *(optional)* | Whole percent, stored on the product. |
| 6 | Specs | Technical specification as `Label: Value` pairs. If absent, assistant researches reputable listings and states its sources. |
| 7 | Feature tiles *(optional)* | The compact tiles under the stock badge. Assistant generates 8 short spec-derived items unless told otherwise. **Must be `Label: Value` — see §2.3.** |
| 8 | Images | One of: (a) *none*, (b) *file(s)* to upload, (c) *live URL(s)*. External hosts need one-time config — see §2.4. Say explicitly which you want. |
| 9 | Warranty *(optional)* | In months. Omitted = stored `0` = badge hidden on the site (never invent a warranty). |
| 10 | Stock *(optional)* | Defaults to 10. |
| 11 | Source link(s) *(optional)* | Where specs/prices came from; saved on the product as `sourceUrl`. |

### 1.1 Example of a complete request

> Add **Luminous EVO D 2300 Square Wave Inverter**, category `inverter`,
> brand Luminous model EVO D 2300, price **17,500tk**, cost 12,800, warranty
> 24 months, stock 8. Specs attached below. Use the solarhousebd.com image
> URL <…>. Source: bdstall.com/…

Anything not listed gets confirmed back to the requester *after* insertion,
not blocked upfront — e.g. "price not given, used market-ref + standard
margin; adjust in Admin → Products".

---

## 2. Platform facts the upload depends on

Learned the hard way — each of these has broken an upload before.

1. **DB access, not admin UI.** Products live in Postgres (`products` table,
   Drizzle schema in `db/schema.ts`). Insert/update through an idempotent
   `tsx` script in `db/` (pattern: `db/add-microtek-vertiga-series.ts`) using
   `.env`'s `DATABASE_URL`. This survives re-runs and recreating the DB.
   *Alternative:* if `SUNVOLT_API_KEY` is set in `.env`, `POST/PATCH
   /api/v1/products/{idOrSlug}` works too (same validation, auto
   revalidation) — good for one-off tweaks, less durable than a committed
   script for seeding.
2. **Categories are closed enum-ish.** Slug must exist in both
   `lib/categories.ts` and `CATEGORY_SLUGS` in
   `app/admin/(panel)/products/actions.ts`. New category = code change in
   both places (see CODEBASE.md §10).
3. **Feature tiles REQUIRE `Label: Value` format.**
   `app/(public)/products/[slug]/page.tsx` splits each `features` item on the
   first colon; **lines without a colon are silently dropped from the page.**
   All feature items must look like `Capacity: 650VA / 520W`. Keep values
   short (~≤18 chars) — tiles truncate; full value shows as hover tooltip.
   Standard set per component product: Capacity · Waveform/type · Battery /
   system voltage · Controller type · Max solar input · Display · Design ·
   one differentiator.
4. **Images.**
   - *Files* → save into `public/products/<slug>.jpg`; reference as
     `/api/media/products/<slug>.jpg` (served fresh via the media route).
   - *Live URLs* → must be HTTPS **and** their host must be in
     `next.config.ts` → `images.remotePatterns`, or Next's image optimizer
     errors at render. Currently allowed:
     `sc04.alicdn.com/kf/**`, `solarhousebd.com/wp-content/uploads/**`.
     Adding a host = config edit + commit.
   - Hotlinked URLs die if the source site renames/deletes them — warn once.
5. **Money format.** Store `"18000.00"` strings (`numeric` columns). Display
   formatting (`৳18,000`) is automatic — never store formatted text.
6. **Warranty `0` hides the badge** rather than showing "0 months".
7. **Package vs component.** `category = 'package'` additionally REQUIRES
   battery voltage/Ah, backup hours, recommended load — enforced by the form
   schema; null them for components. Also: `solar-panel` products may have
   price auto-computed from Settings → panelRates (see CODEBASE.md §6).

---

## 3. Upload procedure (assistant does this every time)

1. **Search/collect data** (specs, real market prices for the margin column)
   if the requester didn't supply everything; cite sources in the final reply.
2. **Write/extend a committed upsert script** `db/add-<series-or-name>.ts`
   following `db/add-microtek-vertiga-series.ts`: rows typed as
   `typeof products.$inferInsert`, lookup by slug, UPDATE-vs-INSERT, log per
   row, `process.exit(0)` inside, catch-and-exit(1). Never hand-run raw SQL.
3. **Run it:** `npx tsx db/add-<name>.ts` (dev machine talks to the live DB).
4. **Verify rendered pages, not just the DB:**
   ```bash
   # detail page + catalog + image all resolve
   curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/products/<slug>
   curl -s localhost:3000/products | grep -c "<Product Name Fragment>"
   # count feature tiles actually rendered (must equal intended number!)
   curl -s localhost:3000/products/<slug> | python3 -c "…extract label/title pairs…"
   ```
   Known trap: grepping the HTML for `Label: Value` finds nothing because the
   page splits label/value into separate elements — extract the tile block
   after `In stock` instead (see §5 example one-liner).
5. **Lint** (`npx eslint <script>`), **commit & push** (one commit per logical
   change, plain subject line). NEVER deploy — user deploys production.
6. **Report back**: what was inserted, chosen defaults/placeholders (prices,
   warranty, translated names), sources, and anything needing manual attention.

---

## 4. Requester-side checklist (before hitting send)

```text
[ ] Name (+ Bangla name wanted?)
[ ] Category from the fixed list
[ ] Selling price
[ ] Cost price? discount %?
[ ] Spec sheet attached / or "search online"
[ ] Feature tiles: supply own or let assistant derive 8
[ ] Images: none / attach files / live URL (host already allowed?)
[ ] Warranty? Stock?
[ ] Source URL?
```

## 5. Assistant-side verification snippet

```bash
curl -s http://localhost:3000/products/<slug> | python3 -c "
import sys, re
html = sys.stdin.read()
seg = html[html.find('In stock'):]
for m in re.findall(r'tracking-wide text-muted-foreground\">([^<]*)</p>\s*<p[^>]*>([^<]*)</p>', seg):
    print(*m, sep=': ')   # expect exactly the shipped feature list
"
```

*Update history:* created 2026-08-27 after the Vertiga series imports
(slug upsert pattern, colon-format tile drop, image-host allowlist lessons).
