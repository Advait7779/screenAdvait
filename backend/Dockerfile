FROM node:24-bookworm-slim AS builder

ENV CI=true
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# Copy workspace config first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/tsconfig.json ./packages/shared-utils/

RUN pnpm install --frozen-lockfile

# Copy source and build
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json ./

RUN pnpm --filter @screenadvait/shared-types build \
  && pnpm --filter @screenadvait/shared-utils build \
  && npx prisma generate --schema prisma/schema.prisma \
  && npx nest build

# Prune dev dependencies for smaller production image
RUN pnpm prune --prod

# --- Production image ---
FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy production node_modules, built output, and prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/storage /data/screenshots && chmod -R 777 /app/storage /data/screenshots

EXPOSE 5008

CMD ["sh", "-c", "mkdir -p /app/storage && chmod 777 /app/storage 2>/dev/null || true; npx prisma migrate deploy --schema prisma/schema.prisma && node dist/src/main.js"]
