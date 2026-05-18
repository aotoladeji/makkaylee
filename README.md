# MakkayLee Football Academy Web App

This repository contains:

- Frontend: React app (Create React App + react-app-rewired)
- Backend: Express + Sequelize + PostgreSQL API

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
- `config/`: app config helpers

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL

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
DATABASE_URL=postgres://user:password@localhost:5432/makkaylee
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

## Deploy to Vercel

This project can be deployed as:

- Frontend: static build from `build/`
- Backend: serverless function at `/api/*`

### Required environment variables (Vercel)

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET`
- `JWT_EXPIRE` (optional, defaults to `1d`)
- `DB_SYNC` (optional, set to `false` in production)
- `REACT_APP_API_URL` (optional, leave empty to use same-origin `/api`)

### Notes

- `backend/db.js` uses `DATABASE_URL` in deployment and local DB vars in development.
- Do not enable `DB_SYNC=true` in production unless you intentionally want runtime schema sync.
- File uploads stored on local disk are ephemeral on serverless platforms. For production media/receipts, move to persistent object storage (for example, Cloudinary, S3, or Vercel Blob).

### Deploy command

```bash
vercel --prod
```

## Aiven PostgreSQL Setup

### 1. Create the database in Aiven

- Create a PostgreSQL service in Aiven.
- In service settings, create a database (for example: `makkaylee_db`).
- Create a database user and password.
- Copy the connection URI from Aiven (the `postgres://...` URL).

### 2. Configure backend environment

In `backend/.env` for local testing against Aiven, set:

```env
DATABASE_URL=postgres://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB>?sslmode=require
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRE=1d
DB_SYNC=true
```

Notes:

- `DB_SYNC=true` is acceptable for initial setup/testing only.
- For production, set `DB_SYNC=false` and use migrations.

### 3. Configure Vercel environment variables

Add the same values in your Vercel project:

- `DATABASE_URL`
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=false`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `DB_SYNC=false`

### 4. Optional data migration from local PostgreSQL to Aiven

Export local DB:

```bash
pg_dump -h localhost -U postgres -d makkaylee_db -Fc -f local.dump
```

Import into Aiven:

```bash
pg_restore --no-owner --no-acl --clean --if-exists \
	-d "postgres://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB>?sslmode=require" \
	local.dump
```

If `pg_restore` is unavailable on your machine, use Aiven's migration/import tools in the console.

## Additional Notes

- `react-app-rewired` is used to override webpack behavior and avoid source-map-loader issues.
- The `build/` folder is generated output and should not be edited manually.
