# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS node

FROM node AS build
ENV PNPM_HOME=/pnpm
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/deployment-service ./apps/deployment-service
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter deployment-service...
RUN pnpm --filter deployment-service build
RUN pnpm --filter deployment-service deploy --prod --legacy /prod/deployment-service

FROM ubuntu:24.04 AS runner
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git tini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && ln -s ../lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack \
    && corepack enable \
    && node --version && npm --version && git --version

ENV NODE_ENV=production
WORKDIR /app
RUN chown ubuntu:ubuntu /app

COPY --from=build --chown=ubuntu:ubuntu /prod/deployment-service/dist ./dist
COPY --from=build --chown=ubuntu:ubuntu /prod/deployment-service/node_modules ./node_modules
COPY --from=build --chown=ubuntu:ubuntu /prod/deployment-service/package.json ./package.json

USER ubuntu

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]
