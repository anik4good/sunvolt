#!/bin/sh
set -e

# The upload directories are bind-mounted from the host and are owned by
# the host user (usually root), so the non-root "nextjs" runtime user
# cannot write to them. Fix ownership at startup, then drop privileges.
# Requires the container to start as root (no "user:" in compose).
if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs /app/public/products /app/public/uploads 2>/dev/null || true
  exec su-exec nextjs "$@"
fi

exec "$@"
