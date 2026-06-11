# Xeno CRM - Deployment Guide

This guide explains how to deploy the **Frontend (Next.js)** and **Backend (Express Channel Service)** separately using different strategies:
1. **Cloud Platforms** (Vercel + Render / Railway)
2. **Containerized** (Docker / Docker Compose)
3. **VPS / VM** (PM2 Process Manager)

---

## 🔑 Environment Variables Checklist

Ensure these variables are properly configured in both environments:

| Variable | Service | Purpose | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Frontend & Backend | Database connection string. Must be accessible by both services. | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `CHANNEL_SERVICE_URL`| Frontend | URL of the Express backend. Do not include trailing `/send`. | `https://xeno-backend.onrender.com` |
| `CRM_RECEIPT_URL` | Frontend | Callback webhook URL passed to the backend for status updates. | `https://xeno-frontend.vercel.app/api/receipts` |
| `CLAUDE_API_KEY` | Frontend | API key for Anthropic Claude (used for segment generation). | `sk-ant-api03-...` |
| `PORT` | Frontend & Backend | Port to listen on. | `3000` (frontend), `3001` (backend) |

---

## 1. ☁️ Cloud Platforms (Vercel + Render / Railway)

### 🖥️ Frontend: Next.js on Vercel

Vercel has built-in support for npm/yarn workspaces. Follow these settings:

1. Import the repository in Vercel.
2. In the project settings, configure:
   - **Root Directory**: `apps/web`
   - **Build & Development Settings**:
     - **Build Command**: `npm run build --workspace=packages/db && next build`
     - **Install Command**: `npm install --prefix=../..` (This ensures dependencies at the monorepo root are installed, including workspace symlinks)
   - **Environment Variables**: Add your `DATABASE_URL`, `CHANNEL_SERVICE_URL`, `CRM_RECEIPT_URL`, and `CLAUDE_API_KEY`.

---

### ⚙️ Backend: Express on Render / Railway

The backend can be deployed completely standalone.

#### Option A: Render
1. Create a new **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Root Directory**: `apps/channel-service` (or leave blank and use build commands from root)
   - **Build Command**: `npm install && npm run build` (if root directory is set to `apps/channel-service`)
   - **Start Command**: `npm run start:prod`
   - **Environment Variables**: Add `DATABASE_URL` and `PORT` (usually automatic on Render).

#### Option B: Railway
1. Create a new service from the Git repository.
2. Under **Settings**:
   - **Root Directory**: Set to `/apps/channel-service`.
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
3. Under **Variables**: Add `DATABASE_URL`.

---

## 2. 🐳 Containerized Deployment (Docker Compose)

We have created separate Dockerfiles for both applications. You can run them in a production-ready, isolated container network.

### Steps to Run:

1. Populate your environment variables in `.env` (or pass them via command-line).
2. Run:
   ```bash
   docker compose up -d --build
   ```
3. This spins up:
   - PostgreSQL (`db` container at port `5432`)
   - Backend (`channel-service` container at port `3001`)
   - Frontend (`web` container at port `3000`)

---

## 3. 🖥️ VPS / VM Deployment (PM2 Process Manager)

To deploy both apps separately as system processes on a virtual server:

### Prerequisites:
Install Node.js, npm, PM2, and your database (e.g. PostgreSQL).
```bash
npm install -g pm2
```

### Steps:
1. Build both projects from the root directory:
   ```bash
   # Build the database package
   npm run build --workspace=packages/db
   
   # Build the channel service backend
   npm run build:channel
   
   # Build the next.js frontend
   npm run build:web
   ```

2. Start the services using the PM2 ecosystem file:
   ```bash
   pm2 start ecosystem.config.js
   ```

3. Save the PM2 list and configure to start on boot:
   ```bash
   pm2 save
   pm2 startup
   ```
