# PRC Rental

Occupancy management system for tracking rental rooms across buildings — who's in which room, move-in dates, and vacancy status. Two services: a Next.js frontend and an Express API.

## Tech stack

| Layer    | Stack                                                              |
| -------- | ------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, ESLint 9 |
| Backend  | Node.js, Express 4, JWT auth, `mssql` driver                       |
| Data     | Microsoft SQL Server, with an automatic JSON-file fallback (`backend/data/store.json`) when SQL Server isn't reachable |

The frontend stack is fully current (Next 16 / React 19 / Tailwind 4). The backend is a deliberately lightweight, plain Express + CommonJS API — no ORM, no TypeScript, no build step — which keeps it simple but is a more traditional setup than the frontend.

## Project structure

```
PRC_Rental/
├── backend/            Express API (port 4000)
│   ├── server.js       Routes, auth, DB connection, JSON-store fallback
│   ├── db/schema.sql    SQL Server schema, applied automatically on connect
│   ├── data/store.json Local fallback data store (used when SQL Server is unavailable)
│   └── .env             Local config (not committed — see Configuration below)
├── frontend/           Next.js app (port 3000)
│   └── app/            App Router pages, components, and API client
├── scripts/
│   ├── dev.js           Boots both services together (installs deps on first run)
│   └── import-prc.js    One-off data import utility
└── package.json         Root orchestration scripts
```

## Prerequisites

- Node.js 20+
- (Optional) A running SQL Server instance. If none is reachable, the API automatically falls back to the local JSON store in `backend/data/store.json`, so you can develop without a database.

## Configuration

The backend reads its config from `backend/.env`. Copy the example and adjust as needed:

```bash
cp backend/.env.example backend/.env
```

| Variable                      | Purpose                                              | Default                |
| ------------------------------ | ----------------------------------------------------- | ----------------------- |
| `PORT`                         | API port                                              | `4000`                  |
| `JWT_SECRET`                   | Secret used to sign session tokens                    | `dev-secret`             |
| `DB_CONNECTION`                | Set to `mssql` to enable SQL Server                   | `mssql`                  |
| `DB_SERVER` / `DB_INSTANCE`    | SQL Server host / named instance                      | `localhost` / _(none)_ |
| `DB_PORT`                      | SQL Server port                                       | `1433`                  |
| `DB_USER` / `DB_PASSWORD`      | SQL Server credentials                                | _(none)_                |
| `DB_NAME`                      | Database name                                         | `prc_rental_db`          |
| `DB_ENCRYPT`                   | Encrypt the SQL connection                            | `false`                  |
| `DB_TRUST_SERVER_CERTIFICATE`  | Trust a self-signed SQL Server cert                   | `false`                  |
| `DB_CONNECTION_STRING`         | Overrides the individual `DB_*` values if set          | _(empty)_               |
| `FRONTEND_URL`                 | Allowed CORS origin for the frontend                  | `http://localhost:3000` |
| `ALLOW_CUSTOM_ROOMS`           | Allow room numbers outside the predefined ranges       | `false`                  |

If `DB_CONNECTION_STRING` (or the SQL Server it points to) isn't reachable, the API logs a warning and continues to serve from `backend/data/store.json` — no database is required to run the app locally.

The frontend needs no configuration for local development; it talks to the API on the same hostname, port `4000`. Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` only if the API is hosted elsewhere.

## Run it — one command

From the repository root:

```bash
npm run dev
```

That's it. On first run this installs `backend/` and `frontend/` dependencies automatically, then starts both services together:

- Frontend: http://127.0.0.1:3000
- API: http://localhost:4000

Press `Ctrl+C` to stop both.

**Default login** (seeded when the JSON store is empty): mobile `0812345678`, password `password123`.

## Scripts

| Command                | Location | What it does                                  |
| ----------------------- | -------- | ----------------------------------------------- |
| `npm run dev`            | root     | Installs deps if needed, runs API + frontend together |
| `npm run import:prc`     | root     | Runs the one-off PRC data import utility         |
| `npm run dev` / `start`  | backend  | Runs the API alone                               |
| `npm run dev`            | frontend | Runs the frontend alone                          |
| `npm run build` / `start`| frontend | Production build / serve                         |
| `npm run lint`           | frontend | Lints the frontend                               |
