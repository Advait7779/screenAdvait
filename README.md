# ScreenAdvait

Enterprise Desktop Screenshot Management & License Management Platform.

## Project Structure

```
├── frontend/          ← Frontend (Coolify Resource #1)
│   ├── apps/
│   │   ├── admin-web/     ← SuperAdmin Portal (React + Vite)
│   │   └── customer-web/  ← Company Portal (React + Vite)
│   ├── packages/
│   │   ├── shared-types/  ← Shared TypeScript types
│   │   └── shared-utils/  ← Shared utilities
│   ├── Dockerfile         ← Builds both portals + nginx
│   └── docker/nginx.conf  ← Nginx config with API proxy
│
├── backend/           ← Backend API (Coolify Resource #2)
│   ├── src/               ← NestJS API source
│   ├── prisma/            ← Database schema & migrations
│   ├── packages/
│   │   ├── shared-types/  ← Shared TypeScript types
│   │   └── shared-utils/  ← Shared utilities
│   ├── Dockerfile         ← Backend Docker build
│   └── .env.example       ← Environment variables template
│
└── desktop/           ← Desktop App (Electron, not hosted)
```

## Coolify Deployment

This project is designed for deployment on **Coolify** with **2 separate resources**:

### Resource 1: Frontend
- **Build Pack**: Dockerfile
- **Dockerfile Location**: `frontend/Dockerfile`
- **Base Directory**: `frontend`
- **Port**: `8080`
- **Environment Variable**:
  - `BACKEND_URL` — URL of the backend API (e.g., `http://api:5000` or the internal Coolify service URL)

### Resource 2: Backend
- **Build Pack**: Dockerfile
- **Dockerfile Location**: `backend/Dockerfile`
- **Base Directory**: `backend`
- **Port**: `5000`
- **Environment Variables**: See `backend/.env.example`

### URL Routing
- `/` → Company Portal (customer-web)
- `/admin/` → SuperAdmin Portal (admin-web)
- `/api/*` → Backend API (proxied by nginx)

## Local Development

```bash
# Backend
cd backend
pnpm install
pnpm dev

# Frontend (both portals)
cd frontend
pnpm install
pnpm dev

# Or individual portals
pnpm dev:admin    # SuperAdmin on :3001
pnpm dev:company  # Company on :3002
```

## Production SuperAdmin Provisioning

Keep `AUTO_SEED=false` in production. The `SUPERADMIN_*` environment variables
do not modify the database during normal backend startup.

To create the first SuperAdmin or securely reset an existing one:

1. Set `SUPERADMIN_USERNAME`, `SUPERADMIN_EMAIL`, and `SUPERADMIN_PASSWORD` on
   the backend resource. `SUPERADMIN_FULL_NAME` is optional.
2. Deploy the backend so the provisioning command is present in `dist`.
3. Run this once in the backend container terminal:

   ```bash
   npm run superadmin:provision
   ```

The command creates the account when absent. When the account exists, it resets
the password, restores the `SUPER_ADMIN` role, activates the account, and
invalidates its existing sessions. It refuses to continue if the configured
username and email belong to different users.

Remove `SUPERADMIN_PASSWORD` from the long-lived deployment environment after
successful provisioning. Set a temporary value again only when recovery is
needed. Do not enable `AUTO_SEED` for this operation because that mode also
creates demo data.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: NestJS, Prisma, PostgreSQL
- **Desktop**: Electron
- **Infrastructure**: Docker, Nginx, Coolify
