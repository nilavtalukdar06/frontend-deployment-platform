# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api-gateway ./apps/api-gateway
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api-gateway build
RUN pnpm --filter api-gateway deploy --prod --legacy /prod/api-gateway

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /prod/api-gateway/dist ./dist
COPY --from=build --chown=appuser:appgroup /prod/api-gateway/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /prod/api-gateway/package.json ./package.json

USER appuser

EXPOSE 3000

CMD ["node", "dist/index.js"]
