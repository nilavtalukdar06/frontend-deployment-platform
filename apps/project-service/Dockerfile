# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/project-service ./apps/project-service
RUN pnpm install --frozen-lockfile
RUN pnpm --filter project-service build
RUN pnpm --filter project-service deploy --prod --legacy /prod/project-service

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /prod/project-service/dist ./dist
COPY --from=build --chown=appuser:appgroup /prod/project-service/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /prod/project-service/package.json ./package.json

USER appuser

EXPOSE 4001

CMD ["node", "dist/index.js"]
