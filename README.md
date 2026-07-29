# ScreenAdvait

ScreenAdvait is a pnpm TypeScript monorepo containing an Electron screenshot client, two React portals, a NestJS API, shared packages, PostgreSQL/Prisma, and optional Google Drive storage.

## Requirements

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 (or Docker Desktop)

## Setup

1. Copy `services/api/.env.example` to `services/api/.env` and replace every secret/password value.
2. Start PostgreSQL with `docker compose -f docker/docker-compose.yml up -d`.
3. Run `pnpm install`.
4. Run `pnpm --filter @screenadvait/api prisma:generate`.
5. Apply the database schema with `pnpm --filter @screenadvait/api prisma:migrate` for development or `prisma migrate deploy` in production.
6. Seed demo data only when explicitly needed with `pnpm --filter @screenadvait/api prisma:seed` and immediately change seeded passwords.
7. Run `start-platform.bat` on Windows or start the API/web/desktop packages independently.

## Security notes

- Never commit `services/api/.env`.
- Production deployments must use HTTPS, strong unique JWT secrets, a restricted CORS allowlist, and non-demo credentials.
- Screenshot access is authenticated and tenant/role scoped.
- When Google Drive is not configured, files are stored under the API storage directory rather than reported as fake cloud uploads.

## Validation

Run `pnpm build`, `pnpm typecheck`, and `pnpm test` before packaging. Build the Windows installer with `pnpm --filter @screenadvait/desktop build:electron`.
