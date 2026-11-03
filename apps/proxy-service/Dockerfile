# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/proxy-service ./apps/proxy-service
RUN pnpm install --frozen-lockfile --filter proxy-service...
RUN pnpm --filter proxy-service build
RUN pnpm --filter proxy-service deploy --prod --legacy /prod/proxy-service

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /prod/proxy-service/dist ./dist
COPY --from=build --chown=appuser:appgroup /prod/proxy-service/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /prod/proxy-service/package.json ./package.json

USER appuser

EXPOSE 8080

CMD ["node", "dist/index.js"]
