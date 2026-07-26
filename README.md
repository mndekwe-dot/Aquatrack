# AquaTrack Rwanda

A smart water monitoring system for WASAC (Water and Sanitation Corporation) that tracks meter readings, detects anomalies, and gives citizens visibility into their water usage.

**African Leadership University — BSc (Hons) Software Engineering — Group 6**

---

## Team

| Member | Role |
|--------|------|
| Merci Ndekwe | Project Manager + Database Architect |
| Luigi | Backend Developer |
| Joseph | Frontend Developer |
| Ange | Integration Developer |

---

## System Overview

```
Meter Simulator (FastAPI)
        ↓  every 5 minutes
Backend API (Node.js + Express)
        ↓
PostgreSQL Database
        ↓
Frontend (Citizen Portal + WASAC Dashboard)
```

Three meter types are simulated:
- **Kamstrup** — smart residential meters (10 meters, cumulative m³ readings)
- **Susteq** — communal prepaid tap meters (5 taps, event-based dispense)
- **EoI** — prepaid home meters (5 meters, token balance decreasing with usage)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Node.js, Express.js |
| ORM | Sequelize |
| Database | PostgreSQL |
| Authentication | JWT + bcryptjs |
| Meter Simulator | Python, FastAPI, Uvicorn |
| Frontend | HTML, CSS, JavaScript |
| Backend Testing | Jest, Supertest |

---

## Project Structure

```
Aquatrack/
├── backend/
│   ├── apps/
│   │   ├── households/       # Citizen model, routes, auth
│   │   ├── meters/           # Meter model, MeterReading model, routes
│   │   ├── staff/            # WASAC staff model, routes
│   │   ├── alerts/           # Alert model, routes
│   │   ├── reports/          # Report routes
│   │   ├── notifications/    # Notification routes
│   │   └── messaging/        # Message routes
│   ├── config/
│   │   └── database.js       # Sequelize + PostgreSQL config
│   ├── middleware/
│   │   └── auth.js           # JWT protect + adminOnly middleware
│   ├── poller.js             # Calls simulator every 5 min, saves to DB
│   ├── seed-bulk.js          # Seeds 10 households, 10 meters, 40 readings
│   └── server.js             # Express app entry point (port 5000)
├── meter-simulator/
│   ├── server.py             # FastAPI simulator (3 vendor endpoints)
│   ├── requirements.txt
│   └── Procfile              # Railway deployment config
├── frontend/
│   ├── css/
│   ├── wasac-login.html
│   ├── wasac-dashboard.html
│   ├── citizen-login.html
│   ├── citizen-dashboard.html
│   └── ...
└── docs/
    └── proposal/             # Task division documents
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL running locally
- A `.env` file in `backend/` (see below)

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=aquatrack
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

SIMULATOR_URL=https://aquatrack-meter-simulator-api.up.railway.app
POLL_INTERVAL_MS=300000
```

Start the backend:
```bash
npm run dev
```

The backend will:
1. Sync the database (auto-creates tables)
2. Start the Express server on port 5000
3. Start the poller — calls the simulator every 5 minutes and saves readings

### Seed the Database

```bash
cd backend
node seed-demo.js
```

Creates a full demo dataset: 4 staff (1 admin, 3 staff), 10 households, 10 meters, 110 readings, 9 alerts, 10 billing reports, 5 issue reports, and 10 notifications. Prints login credentials for the demo admin, staff, and a citizen account at the end.

> `seed-bulk.js` is an older script and is currently broken — it targets Household fields (`owner_name`, `zone`, ...) that predate a schema change. Use `seed-demo.js`.

### Run Backend Tests

```bash
cd backend
npm test
```

Tests use [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest) to drive the real Express app end-to-end (routes, auth middleware, Sequelize models) against an **isolated** Postgres database — `aquatrack_test` by default (override with `TEST_DB_NAME`) — on the same server as your dev DB, so `npm test` never touches your real `aquatrack` data.

One-time setup — create the test database on your Postgres server:
```sql
CREATE DATABASE aquatrack_test;
```
or, if using the Docker Postgres container:
```bash
docker exec <container_name> psql -U postgres -c "CREATE DATABASE aquatrack_test;"
```

Test suites live in `backend/tests/` and cover staff auth, household registration/login, meters, alerts, billing/issue reports, and the JWT `protect` middleware (missing/malformed/expired tokens).

### Meter Simulator (Local)

```bash
cd meter-simulator
pip install -r requirements.txt
uvicorn server:app --reload --port 4000
```

### Meter Simulator (Deployed)

The simulator is live on Railway:

```
https://aquatrack-meter-simulator-api.up.railway.app
```

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Simulator status |
| `GET /kamstrup/api/readings` | 10 residential meter readings |
| `GET /susteq/api/events` | Communal tap dispense events |
| `GET /eoi/api/readings` | 5 prepaid home meter readings |

Readings accumulate based on actual elapsed time and time-of-day usage patterns. Alarms persist across multiple polls. The simulator stays always-on (Railway, no sleep).

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/staff/login` | WASAC staff login | No |
| POST | `/api/staff/register` | Create a staff account | Admin |
| POST | `/api/staff/create` | Create a staff account with a temp password | Admin |
| GET | `/api/staff/me` | Current staff profile | JWT (staff) |
| GET | `/api/staff` | List all staff | Admin |
| POST | `/api/staff/change-password` | Change own password | JWT (staff) |
| POST | `/api/households/register` | Citizen self-registration | No |
| POST | `/api/households/login` | Citizen login | No |
| GET | `/api/households/me` | Current citizen profile | JWT (citizen) |
| PUT | `/api/households/me` | Update own profile | JWT (citizen) |
| GET | `/api/households/me/summary` | Usage, billing & alert summary | JWT (citizen) |
| GET | `/api/households` | List all households | JWT (staff) |
| GET | `/api/meters` | List all meters | JWT (staff) |
| POST | `/api/meters` | Create a meter | JWT (staff) |
| GET | `/api/meters/:id` | Get single meter | JWT (staff) |
| PATCH | `/api/meters/:id/reading` | Record a meter reading | JWT (staff) |
| GET | `/api/alerts` | List all alerts | JWT (staff) |
| GET | `/api/alerts/mine` | Alerts for your own meter | JWT (citizen) |
| PATCH | `/api/alerts/:id/resolve` | Resolve an alert | JWT (staff) |
| GET | `/api/reports/billing` | List all billing reports | JWT (staff) |
| GET | `/api/reports/billing/mine` | Your own billing history | JWT (citizen) |
| PATCH | `/api/reports/billing/:id/paid` | Mark a bill as paid | JWT (staff) |
| POST | `/api/reports/issues` | Submit an issue report | JWT (citizen) |
| GET | `/api/reports/issues/mine` | Your own submitted issues | JWT (citizen) |
| GET | `/api/reports/issues` | List all issue reports | JWT (staff) |
| PATCH | `/api/reports/issues/:id/status` | Update an issue's status | JWT (staff) |
| GET | `/api/notifications/mine` | Your own notifications | JWT |
| GET | `/api/health` | Backend health check | No |

---

## Authentication

- **WASAC staff** — login via `/api/staff/login` → token stored as `aquatrack_token`
- **Citizens** — login via `/api/households/login` → token stored as `citizen_token`
- Protected routes require `Authorization: Bearer <token>` header

---

## Known Issues

- **Notification routes are broken.** `notification.routes.js` queries `household_id` and `is_read`, but `notification.model.js` defines `recipient_type` / `recipient_id` / `read`. `GET /api/notifications/mine` and the two `read` routes currently throw a "column does not exist" error for both citizens and staff.
- **`seed-bulk.js` is stale.** It targets old Household fields (`owner_name`, `owner_email`, `zone`) that no longer exist on the model. Use `seed-demo.js` instead (see [Seed the Database](#seed-the-database)).
- **Recording a reading on an unassigned meter fails.** `PATCH /api/meters/:id/reading` sets `MeterReading.household_id` from `meter.household_id`, which is `null` until a citizen registers against that meter — since `household_id` is `NOT NULL` on `MeterReading`, this 400s. Only record readings on meters already linked to a household.

---

## License

Academic project — African Leadership University 2026
