# Render Deployment Configuration

This project is configured for deployment on Render.com with two separate services:

## Frontend Service (Static)
**Service Type:** Static Site  
**Build Command:** `pnpm install --frozen-lockfile && pnpm run build`  
**Publish Directory:** `artifacts/balar-ibook/dist/public`  

**Routes** (if using Render static sites with redirects):
- `/api/*` → `https://api-service-name.onrender.com/api/*`
- `/*` → `/index.html` (SPA catch-all)

## Backend Service (Node.js Web Service)
**Service Type:** Web Service  
**Runtime:** Node.js  
**Build Command:** `pnpm install --frozen-lockfile && pnpm run typecheck && pnpm -r --filter "./artifacts/api-server" --if-present run build`  
**Start Command:** `node artifacts/api-server/dist/index.mjs`  
**Port:** `3001` (set via PORT environment variable)  

## Environment Variables

### API Server
- `NODE_ENV` = `production`
- `PORT` = `3001` (auto-set by Render)
- `SESSION_SECRET` = (set in Render dashboard - required)
- `DATABASE_URL` = (set in Render dashboard - PostgreSQL connection string)

### Frontend  
- `VITE_API_URL` = `https://api-service-name.onrender.com` (if needed for CORS)

## Notes
- The `render.yaml` file provides infrastructure-as-code configuration (optional)
- If render.yaml is not recognized, configure services manually in the Render dashboard
- Frontend uses `serve` package to properly serve static assets in production
- Ensure both services are created before deployment
