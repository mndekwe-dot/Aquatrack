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
node seed-bulk.js
```

Creates: 10 households, 10 meters (KAM-001 to KAM-010), 40 readings.

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
| POST | `/api/households/login` | Citizen login | No |
| GET | `/api/meters` | List all meters | JWT |
| GET | `/api/meters/:id` | Get single meter | JWT |
| PATCH | `/api/meters/:id/reading` | Update meter reading | JWT |
| GET | `/api/alerts` | List alerts | JWT |
| GET | `/api/reports` | List reports | JWT |
| GET | `/api/health` | Backend health check | No |

---

## Authentication

- **WASAC staff** — login via `/api/staff/login` → token stored as `aquatrack_token`
- **Citizens** — login via `/api/households/login` → token stored as `citizen_token`
- Protected routes require `Authorization: Bearer <token>` header

---

## License

Academic project — African Leadership University 2026
