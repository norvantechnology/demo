# A2Z Printing

Job-order, invoicing, and HR management web app for a printing press business.
Built from the four handoff specs in this repo (`01`–`04`).

## Stack

- **Backend:** Node.js, Express, Mongoose/MongoDB, JWT (access + httpOnly refresh cookie)
- **Frontend:** React (Vite), Tailwind CSS, TanStack Query, react-i18next (EN/AR + RTL), lucide-react, dayjs

## Prerequisites

- Node.js 20+
- MongoDB running locally (default `mongodb://127.0.0.1:27017/a2z_printing`)

## Setup

```bash
# install root + backend + frontend deps
npm run install:all

# copy env files
cp backend/.env.example backend/.env

# seed sample data
npm run seed
```

## Run

```bash
# starts API on :4000 and Vite on :5173 (or next free port)
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). API requests are proxied to `:4000`.

### Logins

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@a2z.kw` | `password123` |
| Supervisor | `supervisor@a2z.kw` | `password123` |

## Deploy

### Backend — [Render](https://render.com)

1. New → **Blueprint** → connect this GitHub repo (uses root `render.yaml`).
2. Set env vars when prompted:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `CLIENT_ORIGIN` — your Vercel URL (e.g. `https://your-app.vercel.app`)
3. After deploy, open Render **Shell** and run `npm run seed` once.
4. Confirm the service URL is `https://a2z-printing-api.onrender.com` (matches `vercel.json`). If Render gives a different hostname, update the two rewrite URLs in `vercel.json` and push again.

### Frontend — [Vercel](https://vercel.com)

1. Import this GitHub repo in Vercel.
2. Leave **Root Directory** empty (repo root). `vercel.json` already sets:
   - install / build / output → `frontend/`
   - `/api/*` and `/uploads/*` → proxied to Render
   - SPA fallback → `index.html`
3. Deploy. No `VITE_*` env required when using the proxy rewrites.

Optional: set `VITE_API_URL=https://a2z-printing-api.onrender.com/api` only if you skip Vercel rewrites and call Render from the browser directly.

## Project layout

```
backend/          Express API + Mongoose models + seed
frontend/         Vite React app
vercel.json       Vercel frontend config + API rewrites
render.yaml       Render backend Blueprint
01–04-*.md        Product / schema / API / UI specs
```

## Env (backend)

See `backend/.env.example`:

- `MONGODB_URI`
- `PORT` (Render sets this automatically)
- `CLIENT_ORIGIN` — allowed frontend origin(s), comma-separated
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`

## Notes

- Currency is always **KWD** with **3** decimal places.
- Dates display as **DD/MM/YYYY**.
- UI is mobile-first (≤640px) with card layouts / horizontal-scroll tables per screen.
- Supervisors cannot access Settings or payroll approve/pay actions.
- Attendance device sync is stubbed until a live terminal is connected.
- Uploaded files on Render free tier are ephemeral; use object storage for production uploads.
