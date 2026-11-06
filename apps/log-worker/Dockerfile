# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/log-worker ./apps/log-worker
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter log-worker...
RUN pnpm --filter log-worker build
RUN pnpm --filter log-worker deploy --prod --legacy /prod/log-worker

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /prod/log-worker/dist ./dist
COPY --from=build --chown=node:node /prod/log-worker/node_modules ./node_modules
COPY --from=build --chown=node:node /prod/log-worker/package.json ./package.json
COPY --chown=node:node apps/log-worker/ca.pem ./ca.pem
ENV KAFKA_CA_CERT_PATH=/app/ca.pem

USER node

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]
