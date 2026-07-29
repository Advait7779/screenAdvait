# ScreenAdvait production deployment

## Before deployment

1. Install Docker Desktop/Engine with Compose v2.
2. Copy `.env.production.example` to `.env.production`.
3. Replace every `replace-with-...` value. Generate two different JWT secrets with at least
   64 random characters.
4. Set `PUBLIC_ORIGIN` to the final HTTPS portal address.
5. Set `SCREENSHOT_STORAGE_HOST_PATH` to a durable host folder. On a Windows host using
   Google Drive for Desktop, this may be a Drive-backed folder such as
   `G:/My Drive/ScreenAdvait Screenshots` if Docker Desktop has permission to share that drive.

## Start

```powershell
docker compose --env-file .env.production -f docker/docker-compose.production.yml up -d --build
docker compose --env-file .env.production -f docker/docker-compose.production.yml ps
```

The portal listens on port `8080` by default. Put it behind an HTTPS reverse proxy or managed
load balancer and route the final domain to that port. The API is intentionally not exposed
directly; Nginx serves it through `/api`.

## Health and logs

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/v1/health
docker compose --env-file .env.production -f docker/docker-compose.production.yml logs -f api
```

The health endpoint reports database and screenshot-storage readiness. A deployment is ready
only when the `api`, `portal`, and `postgres` containers are healthy/running.

## Backups

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-production.ps1
```

Schedule that command daily with Windows Task Scheduler or a server cron equivalent. Database
backups are retained for 14 days by default. Screenshot files are automatically deleted after
`SCREENSHOT_RETENTION_DAYS` (7 by default), so the screenshot folder should be backed up only if
business policy requires longer external retention.

## Restore

Stop portal/API traffic, copy the selected `.dump` into the PostgreSQL container, then run:

```powershell
docker exec screenadvait-postgres pg_restore -U screenadvait -d screenadvait --clean --if-exists /tmp/backup.dump
```

Run a restore rehearsal before launch and after any backup-system change.

## Desktop release

Build on Windows:

```powershell
pnpm --filter @screenadvait/desktop build:electron
```

Share the `ScreenAdvait Enterprise Desktop Setup <version>.exe` file from
`apps/desktop/release`. Do not distribute the `.blockmap` file as the installer.

For public distribution, configure an Authenticode certificate through Electron Builder's
`CSC_LINK` and `CSC_KEY_PASSWORD` environment variables before building. The certificate and
its password are external secrets and are not stored in this repository.
