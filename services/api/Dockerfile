FROM node:24-bookworm-slim AS builder

ENV CI=true
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/tsconfig.json ./packages/shared-utils/
COPY services/api/package.json services/api/tsconfig.json ./services/api/

RUN pnpm install --frozen-lockfile

COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY services/api ./services/api

RUN pnpm --filter @screenadvait/shared-types build \
  && pnpm --filter @screenadvait/shared-utils build \
  && pnpm --filter @screenadvait/api prisma:generate \
  && pnpm --filter @screenadvait/api build \
  && pnpm --filter @screenadvait/api deploy --prod --legacy /opt/screenadvait-api

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 10001 screenadvait \
  && useradd --system --uid 10001 --gid screenadvait --create-home screenadvait

COPY --from=builder --chown=screenadvait:screenadvait /opt/screenadvait-api ./
COPY --from=builder --chown=screenadvait:screenadvait /app/services/api/dist ./dist
COPY --from=builder --chown=screenadvait:screenadvait /app/services/api/prisma ./prisma

RUN mkdir -p /data/screenshots && chown -R screenadvait:screenadvait /data/screenshots

USER screenadvait
EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node dist/src/main.js"]
