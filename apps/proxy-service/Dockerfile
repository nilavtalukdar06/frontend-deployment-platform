# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/proxy-service ./apps/proxy-service
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter proxy-service...
RUN pnpm --filter proxy-service build
RUN pnpm --filter proxy-service deploy --prod --legacy /prod/proxy-service

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /prod/proxy-service/dist ./dist
COPY --from=build --chown=node:node /prod/proxy-service/node_modules ./node_modules
COPY --from=build --chown=node:node /prod/proxy-service/package.json ./package.json
COPY --chown=node:node apps/proxy-service/ca.pem ./ca.pem
ENV KAFKA_CA_CERT_PATH=/app/ca.pem

USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
