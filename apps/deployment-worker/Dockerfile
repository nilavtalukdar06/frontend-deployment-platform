# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/deployment-worker ./apps/deployment-worker
RUN pnpm install --frozen-lockfile --filter deployment-worker...
RUN pnpm --filter deployment-worker build
RUN pnpm --filter deployment-worker deploy --prod --legacy /prod/deployment-worker

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /prod/deployment-worker/dist ./dist
COPY --from=build --chown=appuser:appgroup /prod/deployment-worker/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /prod/deployment-worker/package.json ./package.json

USER appuser

CMD ["node", "dist/index.js"]
