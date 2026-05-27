#!/usr/bin/env bash
#
# Workspace env bootstrapper.
#
# Reads env-manifest.json and creates per-target .env files with only the
# variables that each target consumer actually reads. Secrets flagged
# `generate` get a fresh random value on first run.
#
# Usage:
#   bash setup.sh                  # dev mode — localhost defaults, no prompts
#   bash setup.sh --prod           # prod mode — prompts for URLs, DB + mail creds
#   bash setup.sh --force          # rewrite every file from manifest (regenerates JWT_SECRET!)
#   bash setup.sh --prod --force   # both
#
# In --prod the script prompts for: backend/frontend URLs, Postgres
# user/password/db (blank password → auto-generated), and mail credentials.
# It writes a repo-root .env with POSTGRES_* for docker-compose and derives
# DATABASE_URL from the same values so they never drift.
#
# Non-interactive prod (CI / scripted) — pre-set any of these to skip prompts:
#   BACKEND_URL=https://api.example.com \
#   FRONTEND_URL=https://app.example.com \
#   POSTGRES_USER=postgres POSTGRES_PASSWORD=… POSTGRES_DB=typeform \
#   MAIL_PROVIDER=resend RESEND_API_KEY=… \
#   bash setup.sh --prod
#
# Requirements:
#   - jq        (apt install jq  /  brew install jq)
#   - openssl   (almost always preinstalled)

set -euo pipefail

MANIFEST="env-manifest.json"
MODE="dev"
FORCE=""

for arg in "$@"; do
  case "$arg" in
    --prod)  MODE="prod" ;;
    --force) FORCE="--force" ;;
    *) echo "✗ Unknown arg: $arg" >&2; exit 1 ;;
  esac
done

# ─── Pre-flight ──────────────────────────────────────────────────────────

if ! command -v jq >/dev/null 2>&1; then
  echo "✗ jq not found. Install with:"
  echo "    apt install jq      # Debian/Ubuntu"
  echo "    brew install jq     # macOS"
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo "✗ $MANIFEST not found at repo root"
  exit 1
fi

echo "▸ Mode: $MODE${FORCE:+ (force-overwrite)}"

# ─── Prod-mode prompts ───────────────────────────────────────────────────
# In prod, gather the two public URLs. Skip the prompts if env vars
# already provide them (for CI / scripted runs). Validate scheme.

prompt_url() {
  local label="$1"
  local example="$2"
  local value
  while true; do
    read -r -p "  $label (e.g. $example): " value
    if [[ "$value" =~ ^https?://[^[:space:]]+$ ]]; then
      value="${value%/}"
      echo "$value"
      return
    fi
    echo "    ✗ must start with http:// or https://" >&2
  done
}

# Plain-text prompt with an optional default. Returns the default on empty
# input. Honors a pre-set env var of the same name (CI / scripted runs).
prompt_value() {
  local label="$1"
  local default="${2:-}"
  local value
  if [ -n "$default" ]; then
    read -r -p "  $label [$default]: " value
    echo "${value:-$default}"
  else
    read -r -p "  $label: " value
    echo "$value"
  fi
}

# Secret prompt (no echo). Blank input mints a strong, URL-safe value so it
# drops into a connection string without percent-encoding headaches.
prompt_secret_or_generate() {
  local label="$1"
  local value
  read -r -s -p "  $label (blank = auto-generate): " value
  echo "" >&2
  if [ -z "$value" ]; then
    value=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 32)
    echo "    ✓ generated: $value   (save it — shown only once)" >&2
  fi
  echo "$value"
}

declare -A OVERRIDES

if [ "$MODE" = "prod" ]; then
  echo ""
  echo "▸ Production URLs (or pre-set BACKEND_URL / FRONTEND_URL env vars to skip prompts)"

  : "${BACKEND_URL:=}"
  : "${FRONTEND_URL:=}"

  if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL=$(prompt_url "Backend (API) URL" "https://api.example.com")
  else
    BACKEND_URL="${BACKEND_URL%/}"
    echo "  ✓ BACKEND_URL=$BACKEND_URL (from env)"
  fi
  if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL=$(prompt_url "Frontend (web app) URL" "https://app.example.com")
  else
    FRONTEND_URL="${FRONTEND_URL%/}"
    echo "  ✓ FRONTEND_URL=$FRONTEND_URL (from env)"
  fi

  OVERRIDES[NODE_ENV]="production"
  OVERRIDES[BASE_URL]="$BACKEND_URL"
  OVERRIDES[CORS_ORIGIN]="$FRONTEND_URL"
  OVERRIDES[NEXT_PUBLIC_API_URL]="${BACKEND_URL}/trpc"
  OVERRIDES[NEXT_PUBLIC_APP_ORIGIN]="$FRONTEND_URL"
  OVERRIDES[LOGGER_LEVEL]="info"

  # ─── Database credentials ───────────────────────────────────────────
  # The backend connects over loopback (Postgres is bound to 127.0.0.1 by
  # docker-compose), so host stays localhost. User/password are real prod
  # secrets — prompt for them, then derive DATABASE_URL and the compose
  # credentials from the same values so they can never drift apart.
  echo ""
  echo "▸ Database credentials (Postgres runs in Docker, bound to 127.0.0.1)"
  : "${POSTGRES_USER:=}"
  : "${POSTGRES_PASSWORD:=}"
  : "${POSTGRES_DB:=}"
  [ -z "$POSTGRES_USER" ] && POSTGRES_USER=$(prompt_value "DB username" "postgres")
  [ -z "$POSTGRES_PASSWORD" ] && POSTGRES_PASSWORD=$(prompt_secret_or_generate "DB password")
  [ -z "$POSTGRES_DB" ] && POSTGRES_DB=$(prompt_value "DB name" "typeform")

  OVERRIDES[DATABASE_URL]="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"

  # Credentials docker-compose reads from the repo-root .env. Written below
  # after we know FORCE handling — kept in this var for now.
  DOCKER_ENV_WRITE=1

  # ─── Mail credentials ───────────────────────────────────────────────
  echo ""
  echo "▸ Mail credentials"
  : "${MAIL_PROVIDER:=}"
  [ -z "$MAIL_PROVIDER" ] && MAIL_PROVIDER=$(prompt_value "Mail provider (nodemailer|resend)" "nodemailer")
  OVERRIDES[MAIL_PROVIDER]="$MAIL_PROVIDER"
  OVERRIDES[MAIL_FROM]=$(prompt_value "From address" "Simple Form <no-reply@simpleform.local>")
  OVERRIDES[APP_ORIGIN]="$FRONTEND_URL"

  if [ "$MAIL_PROVIDER" = "resend" ]; then
    : "${RESEND_API_KEY:=}"
    [ -z "$RESEND_API_KEY" ] && RESEND_API_KEY=$(prompt_value "Resend API key")
    OVERRIDES[RESEND_API_KEY]="$RESEND_API_KEY"
  else
    : "${SMTP_HOST:=}"; : "${SMTP_PORT:=}"; : "${SMTP_USER:=}"; : "${SMTP_PASS:=}"; : "${SMTP_SECURE:=}"
    [ -z "$SMTP_HOST" ] && SMTP_HOST=$(prompt_value "SMTP host" "localhost")
    [ -z "$SMTP_PORT" ] && SMTP_PORT=$(prompt_value "SMTP port" "587")
    [ -z "$SMTP_USER" ] && SMTP_USER=$(prompt_value "SMTP user")
    [ -z "$SMTP_PASS" ] && SMTP_PASS=$(prompt_secret_or_generate "SMTP password")
    [ -z "$SMTP_SECURE" ] && SMTP_SECURE=$(prompt_value "SMTP secure (true|false)" "false")
    OVERRIDES[SMTP_HOST]="$SMTP_HOST"
    OVERRIDES[SMTP_PORT]="$SMTP_PORT"
    OVERRIDES[SMTP_USER]="$SMTP_USER"
    OVERRIDES[SMTP_PASS]="$SMTP_PASS"
    OVERRIDES[SMTP_SECURE]="$SMTP_SECURE"
  fi

  echo ""
fi

# ─── Helpers ─────────────────────────────────────────────────────────────

resolve_value() {
  local key="$1"
  # Prod-mode override takes precedence over manifest default & generator
  if [ "${OVERRIDES[$key]+x}" ]; then
    printf '%s' "${OVERRIDES[$key]}"
    return
  fi
  local generate
  generate=$(jq -r --arg k "$key" '.vars[$k].generate // empty' "$MANIFEST")
  if [ -n "$generate" ]; then
    # Preserve an already-issued JWT_SECRET. Rotating it under --force
    # would log everyone out and invalidate every issued token. To rotate
    # intentionally, delete the JWT_SECRET=… line from apps/api/.env and
    # rerun this script. Other generated keys (if any are added later)
    # are NOT preserved by this branch — opt them in here case-by-case.
    if [ "$key" = "JWT_SECRET" ]; then
      local target existing
      for target in $(jq -r --arg k "$key" '.vars[$k].targets[]' "$MANIFEST"); do
        if [ -f "$target" ]; then
          existing=$(grep -E "^${key}=" "$target" | head -1 | cut -d= -f2-)
          if [ -n "$existing" ]; then
            printf '%s' "$existing"
            return
          fi
        fi
      done
    fi
    case "$generate" in
      random-base64-48) openssl rand -base64 48 | tr -d '\n' ;;
      random-base64-32) openssl rand -base64 32 | tr -d '\n' ;;
      random-hex-32)    openssl rand -hex 32 ;;
      *)
        echo "✗ Unknown generator '$generate' for $key" >&2
        exit 1
        ;;
    esac
  else
    jq -r --arg k "$key" '.vars[$k].default // ""' "$MANIFEST"
  fi
}

all_targets() {
  jq -r '[.vars[].targets[]] | unique | .[]' "$MANIFEST"
}

keys_for_target() {
  local target="$1"
  jq -r --arg t "$target" '
    .vars | to_entries
    | map(select(.value.targets | index($t)))
    | .[].key
  ' "$MANIFEST"
}

comment_for_key() {
  local key="$1"
  jq -r --arg k "$key" '.vars[$k].comment // ""' "$MANIFEST"
}

emit_var_to_file() {
  local key="$1"
  local value="$2"
  local file="$3"
  local comment
  comment=$(comment_for_key "$key")
  if [ -n "$comment" ]; then
    echo "# $comment" >> "$file"
  fi
  echo "$key=$value" >> "$file"
  echo "" >> "$file"
}

# ─── Resolve values ONCE per run ────────────────────────────────────────

declare -A RESOLVED
for key in $(jq -r '.vars | keys[]' "$MANIFEST"); do
  RESOLVED["$key"]=$(resolve_value "$key")
done

# JWT_SECRET preservation: if the value we resolved already matches what
# lives in apps/api/.env, resolve_value found and reused it. Surface that
# in the output so the operator can see what happened — rotating a secret
# silently would be a footgun.
if [ -f "apps/api/.env" ]; then
  current_jwt=$(grep -E "^JWT_SECRET=" apps/api/.env | head -1 | cut -d= -f2-)
  if [ -n "$current_jwt" ] && [ "$current_jwt" = "${RESOLVED[JWT_SECRET]}" ]; then
    echo "✓ JWT_SECRET — reused existing value (delete the line + rerun to rotate)"
  fi
fi

# ─── Write each target file ──────────────────────────────────────────────

created=0
appended=0
skipped=0

for target in $(all_targets); do
  mkdir -p "$(dirname "$target")"

  if [ -f "$target" ] && [ "$FORCE" != "--force" ]; then
    added_any=0
    for key in $(keys_for_target "$target"); do
      if ! grep -qE "^${key}=" "$target"; then
        if [ "$added_any" -eq 0 ]; then
          echo "" >> "$target"
          echo "# ─── Added by setup.sh on $(date '+%Y-%m-%d') ─────────────────" >> "$target"
          added_any=1
        fi
        emit_var_to_file "$key" "${RESOLVED[$key]}" "$target"
        echo "  + $target ← $key"
      elif [ "${OVERRIDES[$key]+x}" ]; then
        # Key exists AND has a prod-override → update in place. This is the
        # whole point of `--prod`: URL-derived vars, the prompted
        # DATABASE_URL and mail credentials MUST reflect what the operator
        # just entered. JWT_SECRET has no override, so it's preserved.
        current=$(grep -E "^${key}=" "$target" | head -1 | cut -d= -f2-)
        want="${RESOLVED[$key]}"
        if [ "$current" != "$want" ]; then
          # Use a safe delimiter for sed (URLs contain /).
          sed -i.bak "s|^${key}=.*|${key}=${want}|" "$target" && rm "${target}.bak"
          echo "  ↻ $target ← $key (updated)"
          added_any=1
        fi
      fi
    done
    if [ "$added_any" -eq 0 ]; then
      echo "✓ $target (up to date)"
      skipped=$((skipped + 1))
    else
      appended=$((appended + 1))
    fi
  else
    : > "$target"
    {
      echo "# ═══════════════════════════════════════════════════════════════"
      echo "# Generated by setup.sh ($MODE) on $(date '+%Y-%m-%d %H:%M:%S')"
      echo "# Source of truth: env-manifest.json. Re-run setup.sh after edits."
      echo "# ═══════════════════════════════════════════════════════════════"
      echo ""
    } > "$target"
    for key in $(keys_for_target "$target"); do
      emit_var_to_file "$key" "${RESOLVED[$key]}" "$target"
    done
    n=$(keys_for_target "$target" | wc -l | tr -d ' ')
    echo "✓ $target (created, $n keys)"
    created=$((created + 1))
  fi
done

# ─── docker-compose credentials (prod only) ──────────────────────────────
# docker compose auto-reads a repo-root .env for ${POSTGRES_*} interpolation.
# Write it in prod so the container is created with the same credentials
# baked into DATABASE_URL above. Dev needs no file — compose falls back to
# the postgres/postgres/typeform defaults in docker-compose.yml. This file
# is gitignored (.env) and must never be committed.
if [ "$MODE" = "prod" ] && [ "${DOCKER_ENV_WRITE:-0}" = "1" ]; then
  {
    echo "# ═══════════════════════════════════════════════════════════════"
    echo "# docker-compose credentials — generated by setup.sh --prod"
    echo "# Consumed by docker-compose.yml \${POSTGRES_*} interpolation."
    echo "# Keep in sync with DATABASE_URL in apps/api/.env. DO NOT COMMIT."
    echo "# ═══════════════════════════════════════════════════════════════"
    echo "POSTGRES_USER=${POSTGRES_USER}"
    echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}"
    echo "POSTGRES_DB=${POSTGRES_DB}"
  } > .env
  echo "✓ .env (docker-compose POSTGRES_* credentials)"
fi

# ─── Regenerate root .env.example as a flat reference ────────────────────
# Always uses MANIFEST DEFAULTS (the dev-localhost values), not prod
# overrides — this file is documentation, not a deploy artifact.

{
  echo "# ═══════════════════════════════════════════════════════════════"
  echo "# Workspace env reference (auto-generated from env-manifest.json)"
  echo "# Shows DEV defaults. Run \`bash setup.sh --prod\` for prod overrides."
  echo "# ═══════════════════════════════════════════════════════════════"
  echo ""
  for key in $(jq -r '.vars | keys_unsorted[]' "$MANIFEST"); do
    targets=$(jq -r --arg k "$key" '.vars[$k].targets | join(", ")' "$MANIFEST")
    comment=$(comment_for_key "$key")
    [ -n "$comment" ] && echo "# $comment"
    echo "# → $targets"
    default=$(jq -r --arg k "$key" '
      if .vars[$k].generate
        then "<auto-generated>"
        else .vars[$k].default // ""
      end
    ' "$MANIFEST")
    echo "$key=$default"
    echo ""
  done
} > .env.example

# ─── Summary ─────────────────────────────────────────────────────────────

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "  Mode: $MODE  |  Created: $created  Updated: $appended  Up-to-date: $skipped"
echo "  Reference: .env.example (regenerated)"
echo "──────────────────────────────────────────────────────────────────"

# ─── Drift check ─────────────────────────────────────────────────────────

if command -v pnpm >/dev/null 2>&1 && [ -f scripts/check-env-drift.mts ]; then
  # Drift check requires tsx (dev dependency). On a stripped-down prod box
  # tsx may be absent — treat that as a soft skip, not a failure. Real
  # drift is caught in dev / CI; prod just consumes the manifest.
  if command -v tsx >/dev/null 2>&1 || pnpm -s exec tsx --version >/dev/null 2>&1; then
    echo ""
    echo "▸ Checking env drift against Zod schemas…"
    if pnpm -s check:env; then
      echo "✓ no drift"
    else
      echo "✗ drift detected — update env-manifest.json to match (details above)"
      exit 1
    fi
  else
    echo ""
    echo "▸ Skipping drift check (tsx not installed — fine on prod)"
  fi
fi
