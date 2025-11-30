# syntax=docker/dockerfile:1.7
FROM node:22-bookworm AS build
ARG BUF_VERSION=1.45.0
WORKDIR /repo

# Install buf CLI for build-time proto generation
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && curl -sSL "https://github.com/bufbuild/buf/releases/download/v${BUF_VERSION}/buf-Linux-$(uname -m).tar.gz" \
    | tar -xz -C /usr/local/bin buf \
  && apt-get purge -y curl \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

# Workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json .npmrc ./
COPY packages ./packages

RUN corepack enable \
  && pnpm install --frozen-lockfile \
  && pnpm -C packages/ts-contract-plugin build \
  && pnpm prune --prod \
  && pnpm --filter @winor30/protoc-gen-ts-contract deploy --prod /deploy

FROM gcr.io/distroless/nodejs22-debian12:latest
WORKDIR /app
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /deploy/package.json ./package.json
COPY --from=build /deploy/dist ./dist
ENTRYPOINT ["/nodejs/bin/node", "/app/dist/cli.js"]
