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
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
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

## Deploy Frontend to Vercel

This project can be deployed with:

- Frontend: static build from `build/`
- Backend: Firebase Cloud Functions

### Required environment variables (Vercel)

- `REACT_APP_API_URL` (set this to your Firebase function API URL)
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`

### Notes

- Keep your frontend and backend in separate deploy targets: Vercel for React, Firebase for API.

### Deploy command

```bash
vercel --prod
```

## Deploy Backend to Firebase Functions

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login and set project

```bash
firebase login
firebase use --add
```

Then update `.firebaserc` with your real Firebase project ID.

### 3. Install backend dependencies

```bash
npm --prefix backend install
```

### 4. Set backend runtime config as environment secrets

```bash
firebase functions:secrets:set DATABASE_URL
firebase functions:secrets:set JWT_SECRET
firebase functions:secrets:set JWT_EXPIRE
firebase functions:secrets:set DB_SYNC
```

Use `DB_SYNC=false` in production.

### 5. Deploy functions

```bash
firebase deploy --only functions
```

### 6. Point Vercel frontend to Firebase API

Set `REACT_APP_API_URL` in Vercel to:

```text
https://us-central1-makkaylee-ec728.cloudfunctions.net/api/api
```

The second `/api` is your Express route prefix in this codebase.

The frontend Firebase app initialization lives in `src/firebase.js` and is loaded from `src/index.js`.

## Firebase Note

This codebase currently uses Sequelize + PostgreSQL across backend routes.

- Firebase Firestore is not a drop-in replacement for this backend.
- To use Firebase as the main database, backend models and queries must be rewritten.
- If you only want Firebase Hosting for frontend, keep backend API/database separate.

## Firebase Auth Login Flow

- Frontend now supports Firebase email/password sign-in.
- After Firebase login, the app exchanges Firebase `idToken` at `POST /api/login/firebase`.
- Backend verifies the Firebase token and returns the existing app JWT used by protected API routes.

Requirement:

- The Firebase account email must match a `User.email` value in your PostgreSQL app database.

Password reset:

- `ForgotPasswordPage` now tries Firebase reset email first.
- `ResetPasswordPage` supports Firebase reset links (`oobCode`) and legacy backend token links (`token`).

If you want, the backend can be migrated in phases to Firestore (users/auth, registrations, billing, media metadata) to reduce risk.

## Additional Notes

- `react-app-rewired` is used to override webpack behavior and avoid source-map-loader issues.
- The `build/` folder is generated output and should not be edited manually.
