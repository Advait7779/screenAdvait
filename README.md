# ScreenAdvait

ScreenAdvait is an enterprise screenshot-management platform with:

- a Windows Electron desktop client for employees;
- one role-based web portal for super administrators and company administrators;
- a NestJS API with PostgreSQL/Prisma;
- seven-day screenshot retention and optional Google Drive for Desktop storage.

Super administrators create company subscriptions. Company administrators create employees and
their activation keys. If the parent company subscription expires, is suspended, or is revoked,
all employee logins, captures, uploads, and keys under that subscription stop working.

## Local requirements

- Node.js 22, 23, or 24
- pnpm 11.9.0
- PostgreSQL 16, either installed locally or through Docker Desktop

## Local setup

1. Copy `services/api/.env.development.example` to `services/api/.env`.
2. Replace the database password and both JWT secrets. The access and refresh secrets must be
   different and at least 32 characters.
3. Start PostgreSQL:

   ```powershell
   docker compose -f docker/docker-compose.yml up -d postgres
   ```

4. Install and prepare the project:

   ```powershell
   pnpm install --frozen-lockfile
   pnpm --filter @screenadvait/api prisma:generate
   pnpm --filter @screenadvait/api exec prisma migrate deploy --schema prisma/schema.prisma
   ```

5. Run `start-platform.bat`.

The unified management portal is available at `http://localhost:3001`. Both super administrators
and company administrators use the same login form and are routed to the correct workspace by
their authenticated role. The separate `apps/customer-web` package is deprecated and is not part
of the workspace or production build.

## Screenshot storage

Set `STORAGE_PROVIDER=local`. For Google Drive for Desktop, set `LOCAL_STORAGE_PATH` to the synced
folder, for example:

```text
G:/My Drive/ScreenAdvait Screenshots
```

Files are stored under tenant, employee, year, month, and day folders. The API retains screenshot
records and files for seven days by default. The desktop keeps failed uploads in its offline queue
and retries them automatically.

## Verification

Before creating a release, run:

```powershell
pnpm install --frozen-lockfile
pnpm audit --prod
pnpm typecheck
pnpm test
pnpm --filter @screenadvait/desktop build:electron
```

The Windows installer is created in `apps/desktop/release`. Share the `.exe`, not the `.blockmap`.

## Production deployment

Use the production Compose deployment and the instructions in [DEPLOYMENT.md](./DEPLOYMENT.md).
Production requires HTTPS, strong unique secrets, a restricted CORS origin, a durable screenshot
folder, daily database backups, and a code-signing certificate for public desktop distribution.

Never commit a real `.env`, database dump, screenshot, JWT secret, employee password, or
activation key.
