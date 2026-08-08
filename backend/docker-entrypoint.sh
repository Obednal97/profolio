#!/bin/sh
set -e

# Applies pending migrations before the API accepts traffic, so that
# `docker compose up` on an empty volume produces a working system with no
# manual step. Compose already gates this container on a healthy Postgres.
#
# Single-instance assumption: if you ever run more than one backend replica,
# set RUN_MIGRATIONS=false here and apply migrations as a separate one-shot
# job instead, otherwise replicas race each other for the migration lock.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "==> Applying database migrations"
  # Invoke the binary directly rather than via `pnpm exec`, which makes corepack
  # try to download pnpm on every container start - a network dependency at
  # boot, and a failure if the registry is unreachable.
  ./node_modules/.bin/prisma migrate deploy
  echo "==> Migrations applied"
else
  echo "==> RUN_MIGRATIONS=false, skipping migrations"
fi

exec "$@"
