# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/queue-dashboard ./apps/queue-dashboard
RUN pnpm install --frozen-lockfile --filter queue-dashboard...
RUN pnpm --filter queue-dashboard build
RUN pnpm --filter queue-dashboard deploy --prod --legacy /prod/queue-dashboard

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /prod/queue-dashboard/dist ./dist
COPY --from=build --chown=appuser:appgroup /prod/queue-dashboard/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /prod/queue-dashboard/package.json ./package.json

USER appuser

EXPOSE 4002

CMD ["node", "dist/index.js"]
