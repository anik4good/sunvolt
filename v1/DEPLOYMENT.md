# Deploying SunVolt with Docker

## What you need

- Docker (or OrbStack) on the server
- The PostgreSQL database reachable from the container
  (fill in your own DB host — do not commit real hosts/credentials)

## 1. Configure environment

Copy `.env.example` to `.env` next to `docker-compose.yml` and fill in:

```env
DATABASE_URL=postgresql://<user>:<password>@<db-host>:5432/<db-name>
ADMIN_EMAIL=admin@sunvolt.com
ADMIN_PASSWORD=<strong password>          # admin panel login
SESSION_SECRET=<random 64-char hex>       # openssl rand -hex 32
NEXT_PUBLIC_SITE_URL=https://your-domain.com
SUNVOLT_PORT=3000                         # host port
```

`.env` is git-ignored — credentials never enter the image or the repo.

## 2. Build and run

```bash
docker compose up -d --build
```

The site is now on `http://<server>:$SUNVOLT_PORT`.

- Multi-stage build → small runtime image (~440MB) running as a
  non-root user with Next.js standalone output
- Healthcheck at `/api/health` (also reports DB reachability)
- `restart: unless-stopped` → survives reboots
- All business data (packages, products, appliances, settings, orders)
  is read live from PostgreSQL — deploy a new image and prices/content
  update without touching the DB

## 3. Updating

```bash
git pull
docker compose up -d --build
```

## 4. Useful commands

```bash
docker compose logs -f          # follow logs
docker compose ps               # status + health
docker compose down             # stop
docker exec -it sunvolt sh      # shell into the container
```

## Reverse proxy / HTTPS (optional)

Point nginx/Caddy at the published port. Example Caddyfile:

```
sunvolt.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

## Database migrations

The schema is managed with drizzle-kit against the live DB:

```bash
npm run db:push       # sync schema changes
npm run db:seed       # seed reference data (idempotent)
```

Run these from a machine that can reach the database (or inside the
container: `docker exec -it sunvolt sh` — the standalone image is
minimal, so prefer running them from a checkout).
