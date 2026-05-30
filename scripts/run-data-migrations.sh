#!/usr/bin/env bash
#
# JSONB content migrations for tokens that drizzle-kit can't generate.
# Drizzle schema migrations (CREATE/ALTER TABLE) live in
# packages/database/drizzle/ and run via `pnpm db:migrate`. THIS script
# runs the SQL files in packages/database/drizzle-data/ in order — they
# transform JSONB content inside existing rows when the TypeScript shape
# changes but the column type doesn't.
#
# Each .sql file is wrapped in BEGIN/COMMIT and has its own idempotency
# guard, so re-running this script is safe.
#
# Usage:
#   pnpm db:data-migrate
#
# Run order in deploy.sh: db:migrate → db:data-migrate → seed:default-themes.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$REPO_ROOT/packages/database/drizzle-data"

# Read DATABASE_URL from packages/database/.env. Matches how drizzle-kit
# picks up env in `pnpm db:migrate`.
ENV_FILE="$REPO_ROOT/packages/database/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE not found — run 'bash setup.sh' first." >&2
  exit 1
fi

# shellcheck disable=SC1090
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)
if [ -z "${DATABASE_URL:-}" ]; then
  echo "✗ DATABASE_URL missing from $ENV_FILE" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  # Fall back to the Docker container's psql when the host doesn't have it
  # installed — same setup as deploy.sh uses for the database.
  PSQL="docker exec -i postgresdb-typeform psql"
  USE_DOCKER_URL=0
  # Inside the container, localhost is the container itself; we need to use
  # the container env's DB name instead of the URL. The migration files
  # don't reference any specific DB; we connect via the container's default.
  if ! command -v docker >/dev/null 2>&1; then
    echo "✗ neither psql nor docker is available — install one to run data migrations." >&2
    exit 1
  fi
  # Pull POSTGRES_USER / POSTGRES_DB from the container env so the connect
  # honors whatever credentials setup.sh --prod set.
  PG_USER=$(docker exec postgresdb-typeform printenv POSTGRES_USER)
  PG_DB=$(docker exec postgresdb-typeform printenv POSTGRES_DB)
  PSQL="docker exec -i postgresdb-typeform psql -U $PG_USER -d $PG_DB"
else
  USE_DOCKER_URL=1
  PSQL="psql $DATABASE_URL"
fi

# Apply each .sql file in sorted order.
shopt -s nullglob
for sql in "$DATA_DIR"/*.sql; do
  name=$(basename "$sql")
  echo "▸ Applying $name"
  if [ "$USE_DOCKER_URL" = "1" ]; then
    $PSQL -v ON_ERROR_STOP=1 -f "$sql"
  else
    cat "$sql" | $PSQL -v ON_ERROR_STOP=1
  fi
  echo "  ✓ $name"
done

echo ""
echo "▸ Data migrations applied."
