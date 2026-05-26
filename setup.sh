#!/usr/bin/env bash
#
# Workspace env bootstrapper.
#
# Reads env-manifest.json and creates per-target .env files with only the
# variables that each target consumer actually reads. Secrets flagged
# `generate` get a fresh random value on first run.
#
# Usage:
#   bash setup.sh                  # dev mode — localhost defaults
#   bash setup.sh --prod           # prod mode — prompts for backend & frontend URLs
#   bash setup.sh --force          # rewrite every file from manifest (regenerates JWT_SECRET!)
#   bash setup.sh --prod --force   # both
#
# Non-interactive prod (CI / scripted):
#   BACKEND_URL=https://api.example.com \
#   FRONTEND_URL=https://app.example.com \
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
  echo ""
  echo "▸ Checking env drift against Zod schemas…"
  if pnpm -s check:env; then
    echo "✓ no drift"
  else
    echo "✗ drift detected — update env-manifest.json to match (details above)"
    exit 1
  fi
fi
