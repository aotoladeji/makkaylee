# MakkayLee Football Academy Web App

This repository contains:

- Frontend: React app (Create React App + react-app-rewired)
- Backend: Express + Sequelize + SQLite API

## Features

- Parent account registration and login
- Child registration and multi-child profile management
- Payment workflow with receipt upload and admin confirmation
- Admin dashboard for registrations, payments, users, and content
- Performance badge assignment per child (admin) and badge display on child profile

## Project Structure

- `src/`: frontend source code
- `backend/`: API server and Sequelize models
- `public/`: static public assets

## Prerequisites

- Node.js 18+
- npm
- SQLite (included through the backend dependency)

## Environment

Frontend `.env` example:

```env
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
```

Backend `.env` example (inside `backend/`):

```env
PORT=5000
JWT_SECRET=your_jwt_secret
SQLITE_STORAGE=database/makkaylee.sqlite
```

## Install

From repository root:

```bash
npm install
```

Backend dependencies:

```bash
npm --prefix backend install
```

Create the SQLite database and seed the default administrator:

```bash
npm --prefix backend run sync
npm --prefix backend run seed:default-user
```

The sync command configures the generated `backend/database/makkaylee.sqlite` file with SQLite WAL journal mode, making it ready for Turso. After logging in with the Turso CLI, import it with:

```bash
turso db create makkaylee --from-file ./backend/database/makkaylee.sqlite
```

## Run (Development)

Start backend:

```bash
npm --prefix backend start
```

Start frontend (new terminal):

```bash
npm start
```

Frontend runs on `http://localhost:3000` and API on `http://localhost:5000`.

## Build

```bash
npm run build
```

## Deployment

Vercel serves the React frontend and routes same-origin `/api/*` requests to the Express function defined in `api/index.js`. Do not set `REACT_APP_API_URL` in Vercel; the production build uses `/api`, so requests remain on your deployed domain rather than redirecting to localhost.

Set these environment variables in **Vercel Project Settings > Environment Variables** for Production, Preview, and Development as appropriate:

```env
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=1d
TURSO_DATABASE_URL=libsql://your-database-your-organization.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

Retrieve the Turso values with:

```bash
turso db show makkaylee --url
turso db tokens create makkaylee
```

The current backend uses Sequelize with a local SQLite file, which cannot connect directly to Turso's remote `libsql://` endpoint. Before deploying write-capable API routes to Vercel, migrate the backend data access layer to `@tursodatabase/serverless` or `@libsql/client` and read `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Until that migration is complete, Vercel Functions would use temporary local storage and changes would not persist.

- Frontend: `npm run build`
- Backend: `npm --prefix backend start`

If you host the frontend separately, set `REACT_APP_API_URL` to the backend base URL.

## Additional Notes

- `react-app-rewired` is used to override webpack behavior and avoid source-map-loader issues.
- The `build/` folder is generated output and should not be edited manually.
- The current Express service uses SQLite locally. Turso imports the generated SQLite file; connecting this Sequelize service directly to a remote `libsql://` Turso database requires a separate libSQL data-layer migration.
