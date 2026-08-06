FROM node:24-bookworm-slim AS builder

ENV CI=true
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# Copy workspace config first for layer caching
COPY package.json pnpm-workspace.yaml .npmrc tsconfig.base.json ./
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
  && npx nest build \
  && pnpm deploy --prod --legacy /opt/screenadvait-api

# --- Production image ---
FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 10001 screenadvait \
  && useradd --system --uid 10001 --gid screenadvait --create-home screenadvait

COPY --from=builder --chown=screenadvait:screenadvait /opt/screenadvait-api ./
COPY --from=builder --chown=screenadvait:screenadvait /app/dist ./dist
COPY --from=builder --chown=screenadvait:screenadvait /app/prisma ./prisma

RUN mkdir -p /data/screenshots && chown -R screenadvait:screenadvait /data/screenshots

USER screenadvait
EXPOSE 5008

CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node dist/src/main.js"]
