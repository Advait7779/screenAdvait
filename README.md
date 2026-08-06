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

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: NestJS, Prisma, PostgreSQL
- **Desktop**: Electron
- **Infrastructure**: Docker, Nginx, Coolify
