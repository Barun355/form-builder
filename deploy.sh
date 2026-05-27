#!/usr/bin/env bash
#
# One-shot deploy for an Ubuntu VPS.
#
# Installs the toolchain (nvm + Node 24, pnpm, Caddy, PM2), then builds and
# runs the app: db:generate → db:migrate → build → pm2 start, and configures
# + starts Caddy as the HTTPS reverse proxy.
#
# Usage:
#   bash deploy.sh
#
# Interactive once: if env files are missing it runs `setup.sh --prod`, which
# prompts you for URLs + DB/mail credentials. After that it's hands-off.
#
# Pre-reqs this script does NOT do for you:
#   - Postgres: expects docker-compose's postgresdb to be runnable (it will
#     `docker compose up -d` if docker is present).
#
# Re-runnable: every step is idempotent. Env files already present are reused
# (no re-prompt). To reconfigure, delete them or run `bash setup.sh --prod`.

set -euo pipefail

# ─── Setup ─────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

NODE_MAJOR=24
NVM_VERSION="v0.40.1"
PNPM_VERSION="9.0.0"   # matches root package.json "packageManager"

# Caddy reverse-proxy targets. Adjust domains/ports here if they change.
FRONTEND_DOMAIN="simple-form.dosomething.qzz.io"
BACKEND_DOMAIN="back-form.dosomething.qzz.io"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"
ACME_EMAIL="consultingarmindia@gmail.com"

say() { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ─── 1. System packages ────────────────────────────────────────────────────
# jq + openssl are required by setup.sh.

say "Updating apt and installing base packages"
$SUDO apt-get update -y
$SUDO apt-get install -y curl git ca-certificates debian-keyring debian-archive-keyring apt-transport-https jq openssl

# ─── 2. nvm + Node 24 ──────────────────────────────────────────────────────

export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  say "Installing nvm $NVM_VERSION"
  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
else
  say "nvm already installed"
fi

# Load nvm into this non-interactive shell.
# shellcheck disable=SC1090
. "$NVM_DIR/nvm.sh"

say "Installing & switching to Node $NODE_MAJOR"
nvm install "$NODE_MAJOR"
nvm use "$NODE_MAJOR"
nvm alias default "$NODE_MAJOR"
echo "  node $(node -v)  |  npm $(npm -v)"

# ─── 3. pnpm (via corepack) ────────────────────────────────────────────────

say "Enabling pnpm $PNPM_VERSION via corepack"
corepack enable
corepack prepare "pnpm@${PNPM_VERSION}" --activate
echo "  pnpm $(pnpm -v)"

# ─── 4. PM2 ────────────────────────────────────────────────────────────────

if ! command -v pm2 >/dev/null 2>&1; then
  say "Installing PM2 globally"
  npm install -g pm2
else
  say "PM2 already installed ($(pm2 -v))"
fi

# ─── 5. Caddy ──────────────────────────────────────────────────────────────

if ! command -v caddy >/dev/null 2>&1; then
  say "Installing Caddy from official apt repo"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | $SUDO gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | $SUDO tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y caddy
else
  say "Caddy already installed ($(caddy version | head -1))"
fi

say "Writing /etc/caddy/Caddyfile"
$SUDO tee /etc/caddy/Caddyfile >/dev/null <<EOF
{
	email ${ACME_EMAIL}
}

${FRONTEND_DOMAIN} {
	encode zstd gzip
	reverse_proxy 127.0.0.1:${FRONTEND_PORT}
}

${BACKEND_DOMAIN} {
	encode zstd gzip
	reverse_proxy 127.0.0.1:${BACKEND_PORT}
}
EOF
$SUDO caddy validate --config /etc/caddy/Caddyfile

# ─── 6. Env files (interactive on first run) ───────────────────────────────
# MUST run before the DB container starts: setup.sh writes the root .env with
# POSTGRES_* (used to initialize the container) and the matching DATABASE_URL.
# It prompts for URLs + DB/mail credentials and writes apps/api/.env,
# apps/web/.env.local and packages/database/.env. Already-present files are
# left alone so re-runs stay hands-off.

if [ -f apps/api/.env ] && [ -f apps/web/.env.local ] && [ -f packages/database/.env ]; then
  say "Env files present — skipping setup.sh (delete them or run 'bash setup.sh --prod' to reconfigure)"
else
  say "Generating env files — enter your production credentials when prompted"
  bash setup.sh --prod
fi

# ─── 6b. Docker + Postgres container ───────────────────────────────────────
# Install Docker from Ubuntu's own repos — the lightweight path (engine + CLI
# + compose plugin, no Docker Desktop). Runs AFTER env generation so the
# container initializes with the right POSTGRES_* credentials and db:migrate
# below can connect.

if ! command -v docker >/dev/null 2>&1; then
  say "Installing Docker (engine + CLI + compose plugin)"
  $SUDO apt-get install -y docker.io docker-compose-v2
  $SUDO systemctl enable --now docker
else
  say "Docker already installed ($(docker --version))"
  $SUDO systemctl enable --now docker 2>/dev/null || true
fi

# Sanity check the compose plugin is available (docker compose, not v1).
docker compose version >/dev/null 2>&1 \
  || die "docker compose plugin missing — install 'docker-compose-v2' (or Docker's compose-plugin)"

say "Starting Postgres container"
docker compose up -d

# Wait for Postgres to accept connections before migrating, so a cold start
# doesn't race db:migrate.
say "Waiting for Postgres to be ready"
for i in $(seq 1 30); do
  if docker exec postgresdb-typeform pg_isready -U postgres >/dev/null 2>&1; then
    echo "  ✓ Postgres ready"
    break
  fi
  [ "$i" -eq 30 ] && die "Postgres did not become ready in time"
  sleep 1
done

# ─── 7. Install deps + DB schema + build ───────────────────────────────────

say "Installing workspace dependencies"
pnpm install --frozen-lockfile

say "Generating Drizzle schema"
pnpm run db:generate

say "Applying migrations"
pnpm run db:migrate

say "Building all apps (turbo)"
pnpm build

# ─── 8. Start apps with PM2 ────────────────────────────────────────────────

say "Starting apps via PM2 ecosystem config"
pm2 start ecosystem.config.js
pm2 save
# Register PM2 to start on boot (systemd). Harmless if already registered.
pm2 startup systemd -u "$(whoami)" --hp "$HOME" | tail -1 | grep -E '^sudo|^env' | bash || true

# ─── 9. Start / reload Caddy ───────────────────────────────────────────────

say "Enabling and (re)starting Caddy"
$SUDO systemctl enable caddy
$SUDO systemctl reload caddy 2>/dev/null || $SUDO systemctl restart caddy

# ─── Done ──────────────────────────────────────────────────────────────────

say "Deploy complete"
cat <<EOF

  Frontend : https://${FRONTEND_DOMAIN}   (→ 127.0.0.1:${FRONTEND_PORT})
  Backend  : https://${BACKEND_DOMAIN}    (→ 127.0.0.1:${BACKEND_PORT})

  pm2 status            # process health
  pm2 logs              # app logs
  journalctl -u caddy -f  # TLS / proxy logs (watch for 'certificate obtained')
EOF
