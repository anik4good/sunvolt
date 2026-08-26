<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Deployment

Only commit and push — never deploy. The user deploys production themselves (no SSH deploys, `git pull`, `docker compose`, or container restarts on the server).

# Documentation

Keep `docs/CODEBASE.md` and `docs/DEVELOPERS.md` in sync with every change: any new feature, page, component, or schema change → update `docs/CODEBASE.md`; anything API-related (endpoints, auth, schemas) → also update `docs/DEVELOPERS.md`.
