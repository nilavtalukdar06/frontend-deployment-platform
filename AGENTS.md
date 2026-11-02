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

## API documentation

- Every service under `apps/*` (each microservice and the api gateway) owns
  an OpenAPI 3.1 document at `apps/<app>/src/docs/openapi.ts`, served with
  `swagger-ui-express` at `/docs` (raw JSON at `/docs.json`) through
  `apps/<app>/src/routes/docs.route.ts`.
- Any change to the code of a microservice or the api gateway that affects
  its public contract must update that app's OpenAPI document in the same
  change. This covers routes and methods, path/query/body parameters,
  validators, response shapes, status codes, error codes and messages,
  authentication, cookies, headers, and rate limiting.
- When a change in one service also changes what another service documents
  (for example the api gateway exposing or proxying that service's routes),
  update the API documentation of every affected service, not just the one
  that was edited.
- A new service must ship with its own OpenAPI document and `/docs` route
  before the change is considered complete.
- Never leave the document out of sync with the code: if a route is removed
  or renamed, remove or rename it in the document too.

## API gateway synchronization

- The api gateway is the single entry point for clients, so any change to a
  microservice's public API must be reflected in the api gateway in the same
  change. This covers added, removed or renamed routes, changed methods,
  request/response shapes, auth requirements, cookies and headers, and base
  paths.
- Reflecting a change means updating the gateway's routing/proxy
  configuration, any request or response handling that depends on the
  changed contract, and the gateway's own OpenAPI document.
- Before considering a microservice change complete, check whether the api
  gateway needs a matching update, and make it when it does.

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
