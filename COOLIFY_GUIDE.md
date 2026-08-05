# Hostinger VPS + Coolify Deployment Guide for ScreenAdvait

This guide walks you through deploying **ScreenAdvait** on a **Hostinger VPS** using **Coolify**.

---

## 1. Prerequisites

1. **Hostinger VPS** with Coolify installed.
   - Hostinger provides a **Coolify OS template** (Ubuntu 22.04 + Coolify).
   - If using standard Ubuntu, install Coolify via:
     ```bash
     curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
     ```
2. A registered **Domain Name** (e.g. `screenadvait.yourdomain.com`) pointing to your Hostinger VPS IP address (A Record).
3. Your ScreenAdvait project pushed to a Git repository (**GitHub**, **GitLab**, or **Bitbucket**).

---

## 2. Deploying via Coolify (Docker Compose)

### Step 1: Add a New Resource in Coolify
1. Log into your Coolify Dashboard (`http://<YOUR-VPS-IP>:8000`).
2. Go to **Projects** -> Select your Project / Environment (e.g. `Production`).
3. Click **+ Add Resource** -> Select **Docker Compose**.
4. Choose **Public Repository** or **Private Repository** (connect your GitHub account).
5. Select your **Repository** and **Branch** (e.g., `main`).

### Step 2: Configure Compose File Location
1. In the service settings, set **Docker Compose Location / File**:
   - Use `docker-compose.coolify.yml` (located in the repository root).
2. Set **Base Directory** to `/` (Root directory).

### Step 3: Configure Domain & SSL
1. Under the **portal** container / service configuration in Coolify, set the **Domains**:
   ```
   https://screenadvait.yourdomain.com
   ```
2. Coolify will automatically configure Traefik / Caddy reverse proxy and issue a **Let's Encrypt SSL certificate**.

---

## 3. Environment Variables Configuration

In Coolify, navigate to **Environment Variables** tab for your Docker Compose deployment and add the following:

| Variable Name | Example / Value | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | `a_super_strong_random_db_password_123` | Password for PostgreSQL |
| `JWT_SECRET` | `at-least-64-character-random-secret-key-string...` | JWT Access Token Secret |
| `JWT_REFRESH_SECRET` | `at-least-64-character-different-random-secret-key...` | JWT Refresh Token Secret |
| `PUBLIC_ORIGIN` | `https://screenadvait.yourdomain.com` | Full HTTPS URL of your portal |
| `PORTAL_PORT` | `8080` | Internal port for Nginx portal |
| `SCREENSHOT_RETENTION_DAYS` | `7` | Retention period in days for screenshots |

---

## 4. Deploying & Verification

1. Click **Deploy**.
2. Coolify will:
   - Spin up PostgreSQL 16 (`postgres` service with healthy check).
   - Build the API container (`api` service) using `services/api/Dockerfile`.
   - Automatically run `prisma migrate deploy` to set up DB schemas.
   - Build the Admin Portal container (`portal` service) using `apps/admin-web/Dockerfile`.
3. Monitor the deployment logs in Coolify.
4. Once deployed, open `https://screenadvait.yourdomain.com` in your browser.

---

## 5. Health Check & Monitoring

- **Portal Health**: `https://screenadvait.yourdomain.com`
- **API Health**: `https://screenadvait.yourdomain.com/api/v1/health`
- **Database Persistence**: Saved in Docker volume `postgres_data`.
- **Screenshot Storage**: Saved in Docker volume `screenshot_data`.

---

## 6. Desktop Agent Configuration

When connecting the ScreenAdvait Desktop Client to your hosted server, set the Server URL to:
```
https://screenadvait.yourdomain.com
```
(Nginx will route all `/api/` traffic automatically to the API container).
