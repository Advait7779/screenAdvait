FROM node:24-bookworm-slim AS builder

ENV CI=true
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/tsconfig.json ./packages/shared-utils/
COPY apps/admin-web/package.json apps/admin-web/tsconfig.json ./apps/admin-web/

RUN pnpm install --frozen-lockfile

COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY apps/admin-web ./apps/admin-web

RUN pnpm --filter @screenadvait/shared-types build \
  && pnpm --filter @screenadvait/shared-utils build \
  && pnpm --filter @screenadvait/admin-web build

FROM nginx:1.29-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/admin-web/dist /usr/share/nginx/html

EXPOSE 8080
