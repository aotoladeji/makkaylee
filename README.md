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

The resulting `backend/database/makkaylee.sqlite` file is ready for Turso. After logging in with the Turso CLI, import it with:

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

This app runs with the React frontend and the Express backend.

- Frontend: `npm run build`
- Backend: `npm --prefix backend start`

If you host the frontend separately, set `REACT_APP_API_URL` to the backend base URL.

## Additional Notes

- `react-app-rewired` is used to override webpack behavior and avoid source-map-loader issues.
- The `build/` folder is generated output and should not be edited manually.
- The current Express service uses SQLite locally. Turso imports the generated SQLite file; connecting this Sequelize service directly to a remote `libsql://` Turso database requires a separate libSQL data-layer migration.
