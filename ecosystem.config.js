// PM2 process definitions for the prod VPS.
//
// Runs the two apps from their BUILT artifacts — build first:
//   pnpm install
//   pnpm build                 # turbo builds @repo/api (tsup) + web (next build)
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup     # persist across reboots
//
// Env: each app loads its own file, so PM2 does not inject app config.
//   - apps/api/.env        (api start uses node --env-file=.env)
//   - apps/web/.env.local  (Next.js loads it automatically)
// Generate both with `bash setup.sh --prod` before starting.
//
// cwd is resolved from this file's location, so it works regardless of where
// pm2 is invoked. Paths assume the standard monorepo layout.

const path = require("path");

module.exports = {
  apps: [
    {
      // Express + tRPC API. Bundled by tsup to dist/index.js; the package
      // start script is `node --env-file=.env dist/index.js`, replicated here
      // via node_args so PORT/DATABASE_URL/etc. come from apps/api/.env.
      name: "typeform-api",
      cwd: path.join(__dirname, "apps/api"),
      script: "dist/index.js",
      node_args: "--env-file=.env",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      // Next.js web app. Point at Next's real JS CLI — NOT node_modules/.bin/next,
      // which is a pnpm shell shim that node can't execute. `next start` reads
      // apps/web/.env.local on its own.
      name: "typeform-web",
      cwd: path.join(__dirname, "apps/web"),
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3000",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
