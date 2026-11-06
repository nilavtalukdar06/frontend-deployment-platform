# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/analytics-service ./apps/analytics-service
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter analytics-service...
RUN pnpm --filter analytics-service build
RUN pnpm --filter analytics-service deploy --prod --legacy /prod/analytics-service

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /prod/analytics-service/dist ./dist
COPY --from=build --chown=node:node /prod/analytics-service/node_modules ./node_modules
COPY --from=build --chown=node:node /prod/analytics-service/package.json ./package.json
COPY --chown=node:node apps/analytics-service/ca.pem ./ca.pem
ENV KAFKA_CA_CERT_PATH=/app/ca.pem

USER node

ENTRYPOINT ["/usr/bin/tini", "--"]
EXPOSE 4004

CMD ["node", "dist/index.js"]
