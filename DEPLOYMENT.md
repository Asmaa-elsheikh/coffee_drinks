# Deployment Guide: Office Drinks Order

This application is built with a Node.js Express backend and a React Vite frontend. It uses Supabase for its PostgreSQL database.

## Prerequisites
1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Supabase Project**: You already have this set up with the required tables.

---

## Recommended Platform: Render.com
Render is the easiest platform for this specific "Monolith" setup (Frontend + Backend in one).

### Steps:
1.  **Create a New Web Service**:
    *   Connect your GitHub repository.
    *   Select the `main` branch.

2.  **Build & Command Settings**:
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`

3.  **Environment Variables**:
    Add the following in the Render "Environment" tab:
    *   `NODE_ENV`: `production`
    *   `PORT`: `10000` (Render's default)
    *   `DATABASE_URL`: `postgresql://postgres:...` (Your Supabase URI)
    *   `SUPABASE_URL`: `https://...`
    *   `SUPABASE_ANON_KEY`: `eyJhbGci...`
    *   `SESSION_SECRET`: `A_LONG_RANDOM_STRING_HERE` (Generate a secure random string)

4.  **Deploy**:
    *   Click "Create Web Service". Render will build the Vite app, bundle the Express server, and serve everything on a single URL.

---

## Alternative: Railway.app
Railway is also excellent and often faster for hobby projects.

1.  **New Project** -> **Deploy from GitHub repo**.
2.  Railway will automatically detect the `package.json`.
3.  Add the same **Environment Variables** listed above.
4.  Railway will use your `npm run build` and `npm start` automatically.

---

## Important Production Notes
*   **Database Migrations**: Your app uses Drizzle. If you change the schema, remember to run `npm run db:push` locally before deploying, or add it to your build command.
*   **Persistent Sessions**: The app currently uses `memorystore` for sessions. If the server restarts (which happens on every deploy), users will be logged out. For production, you might want to switch to a Redis store or a Postgres-backed session store.
*   **Security**: Ensure `SESSION_SECRET` is never committed to GitHub.

## Need help?
If you run into issues with the build or connection, let me know!
