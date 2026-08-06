FROM node:24-bookworm-slim AS builder

ENV CI=true
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# Copy workspace config first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/tsconfig.json ./packages/shared-utils/
COPY apps/admin-web/package.json apps/admin-web/tsconfig.json ./apps/admin-web/
COPY apps/customer-web/package.json apps/customer-web/tsconfig.json ./apps/customer-web/

RUN pnpm install --frozen-lockfile

# Copy source and build
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY apps/admin-web ./apps/admin-web
COPY apps/customer-web ./apps/customer-web

RUN pnpm --filter @screenadvait/shared-types build \
  && pnpm --filter @screenadvait/shared-utils build \
  && pnpm --filter @screenadvait/admin-web build \
  && pnpm --filter @screenadvait/customer-web build

# --- Production image ---
FROM nginx:1.29-alpine

# Copy built assets
COPY --from=builder /app/apps/admin-web/dist /usr/share/nginx/html/admin
COPY --from=builder /app/apps/customer-web/dist /usr/share/nginx/html/company

# Copy nginx template
COPY docker/nginx.conf /etc/nginx/templates/default.conf.template

ENV BACKEND_URL=http://api:5000

EXPOSE 3008
