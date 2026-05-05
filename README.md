# Event Management and Ticket Booking System

Production-ready full-stack platform for discovering events, selecting seats, and completing secure bookings with concurrency-safe seat locking.

## Live Demo

- Frontend: `https://<your-vercel-app>.vercel.app`
- Backend API: `https://<your-render-service>.onrender.com`

## Features

- Event management (create, update, publish events)
- Interactive seat selection UI with pricing by section
- Booking and payment workflow
- Concurrency control to prevent duplicate booking:
  - transactional booking with `SELECT ... FOR UPDATE`
  - unique constraint on `event_seat(event_id, seat_id)`

## Tech Stack

- Frontend: React.js, Vite, Tailwind CSS
- Backend: Node.js, Express, JWT, MySQL2
- Database: MySQL (Railway)
- Deployment: Vercel (frontend), Render (backend), Railway (database)

## Project Structure

```text
root/
├── frontend/
├── backend/
├── database/
│   ├── schema.sql
│   └── sample_data.sql
├── screenshots/
├── .env.example
├── .gitignore
└── README.md
```

## Local Setup

### 1) Clone the repository

```bash
git clone <your-repository-url>
cd EventVault
```

### 2) Database setup

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/sample_data.sql
```

### 3) Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

### 4) Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=3306
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
JWT_SECRET=
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173,https://your-frontend.vercel.app
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
VITE_PROXY_TARGET=http://localhost:5000
```

## Deployment Guide

### 1) Railway (MySQL)

1. Create a new Railway project.
2. Add a MySQL service.
3. Open the MySQL service variables and copy:
   - `MYSQLHOST` -> `DB_HOST`
   - `MYSQLPORT` -> `DB_PORT`
   - `MYSQLUSER` -> `DB_USER`
   - `MYSQLPASSWORD` -> `DB_PASSWORD`
   - `MYSQLDATABASE` -> `DB_NAME`
4. Run migrations/seed:
   - import `database/schema.sql`
   - import `database/sample_data.sql`
5. If SSL is required, set `DB_SSL=true`.

### 2) Render (Backend)

1. Create a new **Web Service** from this repository.
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `DB_SSL` and `DB_SSL_REJECT_UNAUTHORIZED` (as needed)
   - `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
6. Deploy and verify:
   - `https://<render-service>.onrender.com/health`

### 3) Vercel (Frontend)

1. Import repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite.
4. Add environment variable:
   - `REACT_APP_API_URL=https://<render-service>.onrender.com/api`
5. Deploy and open your Vercel URL.

## Deployment Validation Checklist

- Backend health endpoint returns 200.
- Backend logs show successful MySQL connection.
- Frontend loads event listing from deployed API.
- Booking flow works end-to-end.
- Attempting to double-book the same seat fails as expected.
- No credentials are hardcoded in source files.

## Screenshots

Add screenshots under `screenshots/` and reference them here:

- Home
- Event List
- Seat Selection
- Checkout
- Booking Confirmation

## Future Improvements

- Integrate real payment gateways (Stripe/Razorpay)
- Add seat hold timeout and release mechanism
- Add automated test suites (unit/integration/e2e)
- Containerize stack with Docker Compose
- Add CI/CD pipeline with lint, test, and build gates
