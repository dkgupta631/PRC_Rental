# PRC Rental

Occupancy management system for tracking rental rooms across buildings — who's in which room, move-in dates, and vacancy status. Two services: a Next.js frontend and an Express API.

## Tech stack

| Layer    | Stack                                                              |
| -------- | ------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, ESLint 9 |
| Backend  | Node.js, Express 4, JWT auth, `mssql` driver                       |
| Data     | Microsoft SQL Server — the system of record. All reads and writes go through it when it's reachable. |

The frontend stack is fully current (Next 16 / React 19 / Tailwind 4). The backend is a deliberately lightweight, plain Express + CommonJS API — no ORM, no TypeScript, no build step — which keeps it simple but is a more traditional setup than the frontend.

**This is a real database-backed app, not a static demo.** Creating, editing, and deleting a rental writes directly to `dbo.prc_rental_table` in SQL Server (see the route handlers in `backend/server.js`) — `backend/data/store.json` is only a local write-through cache the API keeps in sync after every successful SQL write, so requests stay fast and the app can keep serving briefly if SQL Server hiccups. It is not the source of truth and is never read from once SQL Server is reachable at startup.

## Project structure

```
PRC_Rental/
├── backend/            Express API (port 4000)
│   ├── server.js       Routes, auth, SQL Server connection, local write-through cache
│   ├── db/schema.sql    SQL Server schema, applied automatically on connect
│   ├── data/store.json Local cache mirrored from SQL Server (used as a fallback only if SQL Server is unreachable at startup)
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
- A running SQL Server instance, configured via `backend/.env` (see [Configuration](#configuration)). This repo's checked-in `backend/.env` already points at a local SQL Server Express instance (`localhost\SQLEXPRESS`, database `prc_rental_db`) with the schema and real rental data loaded — `npm run dev` connects to it as-is.
- If SQL Server is briefly unreachable, the API logs a warning and keeps serving from its local write-through cache (`backend/data/store.json`) instead of going down — a resilience fallback, not the intended way to run the app. Point `backend/.env` at a real, reachable SQL Server for normal use.

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

On startup the API connects to SQL Server, applies `backend/db/schema.sql` (creates any missing tables), and seeds a default admin user if `dbo.users` is empty. From then on, every rental create/update/delete writes straight to `dbo.prc_rental_table`. If `DB_CONNECTION_STRING` (or the SQL Server it points to) isn't reachable at startup, the API logs a warning and falls back to reading/writing `backend/data/store.json` only — a temporary safety net, not a substitute for a working database connection.

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

**Default login** (seeded into `dbo.users` on first connect if the table is empty): mobile `0812345678`, password `password123`.

## Scripts

| Command                | Location | What it does                                  |
| ----------------------- | -------- | ----------------------------------------------- |
| `npm run dev`            | root     | Installs deps if needed, runs API + frontend together |
| `npm run import:prc`     | root     | Runs the one-off PRC data import utility         |
| `npm run dev` / `start`  | backend  | Runs the API alone                               |
| `npm run dev`            | frontend | Runs the frontend alone                          |
| `npm run build` / `start`| frontend | Production build / serve                         |
| `npm run lint`           | frontend | Lints the frontend                               |
