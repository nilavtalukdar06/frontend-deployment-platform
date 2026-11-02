# Agent rules for this repository

## Formatting

- Every file in this project is formatted with Prettier. Run `pnpm format`
  before considering any change complete, or `pnpm format:check` to verify
  without writing.
- Root config: `.prettierrc.json`, `.prettierignore`.

## Comments

- Never add comments to code. No inline comments, no block comments, no
  docblocks. Identifiers should be named well enough that comments are not
  needed.

## Docker

- `docker-compose.yml` never lives at the monorepo root. Each app under
  `apps/*` owns its own `Dockerfile` and `docker-compose.yml`
  (e.g. `apps/auth-service/Dockerfile`, `apps/auth-service/docker-compose.yml`).
- Since the build still needs the workspace root (`pnpm-workspace.yaml`,
  `packages/*`), each app's `docker-compose.yml` sets the build `context` to
  the repo root relative to its own location (e.g. `../..` from
  `apps/<app>/docker-compose.yml`) and points `dockerfile` at
  `apps/<app>/Dockerfile`.
- `.dockerignore` stays at the repo root, since the build context is always
  the repo root regardless of which app's compose file triggered the build.

## Environment variables

- Whenever a new package is installed or a new service (database, cache,
  queue, third-party API, etc.) is added that requires configuration via an
  environment variable, update both of these in the same change, for the
  app that needs it:
  1. `apps/<app>/.env.example` — add the new variable with a sane example
     value.
  2. `apps/<app>/src/config/env.ts` — add the corresponding key to the Zod
     schema so it is typesafe and validated at startup.
- `docker-compose.yml`-only variables (container credentials, published
  ports) still belong in `.env.example` even if the app itself never reads
  them directly, but do not need a matching entry in `env.ts`.
- After touching the Dockerfile's dependency/build steps for a service,
  review whether the Dockerfile itself needs updating (new build args, new
  copied files, new runtime env vars).
