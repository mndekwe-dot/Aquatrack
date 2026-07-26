<div align="center">

# 💧 AquaTrack Rwanda

**Smart Water Monitoring & Leak Detection System for WASAC**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E?logo=railway&logoColor=white)](https://railway.app/)

*African Leadership University — BSc (Hons) Software Engineering — Group 6*

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Team](#team)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Meter Simulator](#meter-simulator)
- [Authentication](#authentication)
- [Frontend Portals](#frontend-portals)
- [Poster & Presentation](#poster--presentation)
- [License](#license)

---

## Overview

AquaTrack Rwanda is a full-stack smart water monitoring system built for the **Water and Sanitation Corporation (WASAC)**. The platform ingests real-time telemetry from IoT water meters, detects pipe leaks and usage anomalies, and provides separate dashboards for **WASAC staff** and **citizens**.

### Key Features

- 🔄 **Automated Telemetry Polling** — 5-minute interval poller fetches live meter readings from a cloud-hosted IoT simulator
- 🚨 **Real-Time Leak Detection** — Persistent pipe-leak and high-usage alarms auto-generated from telemetry anomalies
- 📊 **Dual Web Portals** — Citizen consumption dashboard + WASAC staff management dashboard
- 🔐 **Role-Based Access Control** — Dual JWT auth system (citizen tokens & staff tokens with admin/meter_reader/technician/billing roles)
- 📝 **Citizen Incident Reporting** — Citizens can file water-leak reports with photo evidence
- 💬 **In-App Messaging** — Staff-to-citizen communication channel
- 🔔 **Push Notifications** — Real-time alert delivery to staff and citizens
- 🌍 **Internationalization (i18n)** — Multi-language support via frontend i18n service
- 🏭 **Three Vendor Protocols** — Kamstrup (residential), Susteq (communal taps), EoI (prepaid meters)

---

## Team

| Member | Role | Responsibilities |
|--------|------|-----------------|
| **Merci Ndekwe** | Project Manager + Database Architect | Database design, ERD, project coordination, poster setup |
| **Luigi** | Backend Developer | Express API, solution architecture, methodology, references |
| **Joseph** | Frontend Developer | UI/UX, citizen & staff portals, problem statement, objectives |
| **Ange** | Integration Developer | Data flow integration, impact analysis, limitations & next steps |

---

## Architecture

```
┌─────────────────────┐     HTTPS      ┌──────────────────────┐
│   Citizen Portal    │ ──────────────► │                      │
│   (HTML/CSS/JS)     │                 │   Express REST API   │
└─────────────────────┘                 │   (Node.js)          │
                                        │                      │
┌─────────────────────┐     HTTPS      │   Middleware:         │
│   WASAC Staff       │ ──────────────► │   • CORS + Helmet    │
│   Dashboard         │                 │   • Morgan Logger    │
└─────────────────────┘                 │   • Dual JWT Auth    │
                                        └──────────┬───────────┘
                                                   │
                                          Sequelize ORM
                                                   │
                                        ┌──────────▼───────────┐
                                        │   PostgreSQL DB      │
                                        │   8 Relational       │
                                        │   Tables             │
                                        └──────────▲───────────┘
                                                   │
                                            Save Readings
                                            & Alerts
                                                   │
┌─────────────────────┐   5-Min Poll   ┌──────────┴───────────┐
│  FastAPI Simulator  │ ◄──────────────│   Automated Poller   │
│  (Railway Cloud)    │                 │   (poller.js)        │
│                     │  Telemetry     │                      │
│  • Kamstrup (×10)   │ ──────────────►│   • Delta calc       │
│  • Susteq  (×5)     │                │   • Leak detection   │
│  • EoI     (×5)     │                │   • Alert creation   │
└─────────────────────┘                 └──────────────────────┘
```

> A detailed draw.io diagram is available at [`poster/architecture.drawio.xml`](poster/architecture.drawio.xml).

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend API** | Node.js 18+, Express 4.x | REST API server, routing, middleware |
| **ORM** | Sequelize 6.x | Database abstraction, migrations, associations |
| **Database** | PostgreSQL 16 | Relational data persistence |
| **Authentication** | JWT + bcryptjs | Dual-token auth (citizen & staff) |
| **Meter Simulator** | Python 3.10+, FastAPI 0.115, Uvicorn | IoT telemetry generation |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Dual web portals (citizen + WASAC) |
| **Deployment** | Railway | Simulator cloud hosting |
| **Security** | Helmet, CORS | HTTP security headers, cross-origin policy |
| **Logging** | Morgan | HTTP request logging |

---

## Project Structure

```
Aquatrack/
├── backend/
│   ├── apps/
│   │   ├── alerts/              # Alert model & routes (leak/high-usage/faulty)
│   │   ├── households/          # Citizen/household model, routes, auth
│   │   ├── messaging/           # Staff-citizen messaging model & routes
│   │   ├── meters/              # Meter + MeterReading models & routes
│   │   ├── notifications/       # Push notification model & routes
│   │   ├── reports/             # Citizen incident report model & routes
│   │   └── staff/               # WASAC staff model, RBAC routes, auth
│   ├── config/
│   │   └── database.js          # Sequelize + PostgreSQL connection
│   ├── middleware/
│   │   └── auth.js              # JWT verification + adminOnly guard
│   ├── models/
│   │   └── index.js             # Model associations & FK constraints
│   ├── poller.js                # 5-min automated telemetry poller
│   ├── seed-bulk.js             # Seed: 10 households, 10 meters, 40 readings
│   ├── seed-citizen.js          # Seed: demo citizen account
│   ├── seed-demo.js             # Seed: comprehensive demo dataset
│   ├── seed.js                  # Seed: basic starter data
│   └── server.js                # Express app entry point (port 5000)
│
├── frontend/
│   ├── index.html               # Landing page
│   ├── login.html               # Citizen login
│   ├── register.html            # Citizen registration
│   ├── style.css                # Global styles (AquaTrack theme)
│   ├── auth.css                 # Authentication page styles
│   ├── auth.js                  # Login/register logic
│   └── src/
│       ├── pages/
│       │   ├── citizen/         # Citizen portal pages
│       │   │   ├── home.html        # Dashboard (consumption overview)
│       │   │   ├── history.html     # Usage history & charts
│       │   │   ├── alert.html       # Leak & anomaly alerts
│       │   │   ├── report.html      # File incident reports
│       │   │   ├── profile.html     # Account settings
│       │   │   ├── citizen.css      # Citizen portal styles
│       │   │   └── citizen.js       # Citizen portal logic
│       │   └── wasac/           # WASAC staff portal pages
│       │       ├── overview.html    # Staff dashboard overview
│       │       ├── alerts.html      # Leak alarm management
│       │       ├── analytics.html   # Usage analytics & charts
│       │       ├── districts.html   # Zone/district management
│       │       ├── reports.html     # Citizen report review
│       │       ├── staff.html       # Staff account management
│       │       ├── change-password.html
│       │       ├── wasac-login.html # Staff login page
│       │       ├── wasac.css        # WASAC portal styles
│       │       └── wasac.js         # WASAC portal logic
│       └── services/
│           ├── api.js           # Centralized API client
│           └── i18n.js          # Internationalization service
│
├── meter-simulator/
│   ├── server.py                # FastAPI simulator (3 vendor endpoints)
│   ├── requirements.txt         # Python dependencies
│   └── Procfile                 # Railway deployment config
│
├── poster/                      # Academic poster (LaTeX / tikzposter)
│   ├── main.tex                 # Poster entry point
│   ├── sections/                # Modular poster sections (s01–s10)
│   ├── figures/                 # Architecture diagram PNGs
│   ├── architecture.drawio.xml  # Editable draw.io system diagram
│   └── alu-logo-white-full.png  # ALU logo asset
│
├── docs/
│   └── proposal/                # Project proposal & task division
│
└── docker/                      # Docker configuration (placeholder)
```

---

## Getting Started

### Prerequisites

| Tool | Version | Required For |
|------|---------|-------------|
| Node.js | 18+ | Backend API |
| npm | 9+ | Package management |
| Python | 3.10+ | Meter simulator (local only) |
| PostgreSQL | 14+ | Database |

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/Aquatrack.git
cd Aquatrack
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `backend/.env` file:

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

On startup the backend will:
1. **Sync the database** — auto-creates all 8 tables via Sequelize
2. **Start Express** — REST API listening on port 5000
3. **Start the Poller** — fetches simulator telemetry every 5 minutes

### 3. Seed the Database

```bash
# Basic seed (10 households, 10 meters, 40 readings)
node seed-bulk.js

# Demo citizen account
node seed-citizen.js

# Full demo dataset
node seed-demo.js
```

### 4. Meter Simulator (Local — optional)

The simulator is already deployed on Railway. To run locally:

```bash
cd meter-simulator
pip install -r requirements.txt
uvicorn server:app --reload --port 4000
```

Then update `SIMULATOR_URL=http://localhost:4000` in your `.env`.

### 5. Access the Application

| Portal | URL |
|--------|-----|
| Landing Page | `http://localhost:5000/` |
| Citizen Login | `http://localhost:5000/login.html` |
| WASAC Staff Login | `http://localhost:5000/src/pages/wasac/wasac-login.html` |

---

## API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/staff/login` | WASAC staff authentication |
| `POST` | `/api/households/login` | Citizen authentication |
| `GET` | `/api/health` | Backend health check |

### Protected Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/meters` | List all meters |
| `GET` | `/api/meters/:id` | Get single meter details |
| `PATCH` | `/api/meters/:id/reading` | Update meter reading |
| `GET` | `/api/alerts` | List all alerts |
| `POST` | `/api/alerts` | Create a new alert |
| `GET` | `/api/households` | List all households |
| `POST` | `/api/households` | Register a new household |
| `GET` | `/api/reports` | List incident reports |
| `POST` | `/api/reports` | Submit an incident report |
| `GET` | `/api/notifications` | List notifications |
| `GET` | `/api/messages` | List messages |
| `POST` | `/api/messages` | Send a message |
| `GET` | `/api/staff` | List staff accounts (admin) |

All protected endpoints require the `Authorization: Bearer <token>` header.

---

## Database Schema

### Entity-Relationship Model

AquaTrack uses **8 Sequelize models** with the following associations:

```
Staff ──┬── hasMany ──► MeterReading (recorded_by)
        └── hasMany ──► Report       (generated_by)

Household ──┬── hasMany ──► Meter        (household_id)
            ├── hasMany ──► MeterReading (household_id)
            ├── hasMany ──► Report       (household_id)
            └── hasMany ──► Alert        (household_id)

Meter ──┬── hasMany ──► MeterReading (meter_id)
        ├── hasMany ──► Report       (meter_id)
        └── hasMany ──► Alert        (meter_id)
```

### Model Summary

| Model | Key Fields | Constraints |
|-------|-----------|------------|
| **Staff** | name, email, password, role | `role` ∈ {admin, meter_reader, technician, billing}; password bcrypt-hashed |
| **Household** | address, owner_name, owner_phone, owner_email, zone, status | Unique email; zone-based grouping |
| **Meter** | serial_number, household_id, installation_date, last_reading, status | FK → Household; ON DELETE RESTRICT |
| **MeterReading** | meter_id, household_id, reading_value, consumption_delta, reading_date | FK → Meter (CASCADE), FK → Household (CASCADE) |
| **Alert** | household_id, meter_id, type, severity, resolved | `type` ∈ {leak, high_usage, faulty}; FK → Meter, Household |
| **Report** | household_id, meter_id, description, status, photo_url | FK → Household (RESTRICT), FK → Meter (SET NULL) |
| **Notification** | recipient_type, recipient_id, title, body, read_at | Polymorphic recipient |
| **Message** | sender_id, recipient_id, content, created_at | Staff ↔ Citizen messaging |

---

## Meter Simulator

The IoT hardware simulator is a **FastAPI microservice** deployed on Railway:

```
https://aquatrack-meter-simulator-api.up.railway.app
```

### Simulator Endpoints

| Endpoint | Vendor | Description |
|----------|--------|-------------|
| `GET /health` | — | Status, timestamp, active meter count |
| `GET /kamstrup/api/readings` | Kamstrup | 10 residential smart meters |
| `GET /susteq/api/events` | Susteq | 5 communal prepaid taps |
| `GET /eoi/api/readings` | EoI | 5 prepaid home meters |

### Vendor Protocol Details

| Protocol | Meters | Key Behaviour |
|----------|--------|--------------|
| **Kamstrup** | KAM-001 → KAM-010 | Cumulative m³ readings; instantaneous flow rate; persistent pipe-leak alarms (5–12 polls) and high-usage alarms (3–6 polls) |
| **Susteq** | TAP-001 → TAP-005 | Event-based dispense stream; token-ID linked transactions; 5–20 L per dispense |
| **EoI** | EOI-001 → EOI-005 | Token balance system (1 token ≈ 0.02 m³); automatic valve shutoff at 0 tokens; 5% recharge probability; 2% tamper detection |

### Diurnal Usage Model

All readings scale with a time-of-day `usage_factor()`:

| Time Window | Usage Factor | Description |
|-------------|-------------|-------------|
| 06:00 – 09:00 | 1.00 | Morning peak |
| 09:00 – 17:00 | 0.35 – 0.55 | Midday / afternoon |
| 17:00 – 21:00 | 0.90 | Evening peak |
| 21:00 – 06:00 | 0.04 | Night baseline (leak detection window) |

---

## Authentication

AquaTrack implements a **dual JWT authentication** system:

| User Type | Login Endpoint | Token Key | Roles |
|-----------|---------------|-----------|-------|
| **WASAC Staff** | `POST /api/staff/login` | `aquatrack_token` | admin, meter_reader, technician, billing |
| **Citizens** | `POST /api/households/login` | `citizen_token` | citizen (default) |

- Tokens are stored in `localStorage` on the client
- Protected routes validate via `Authorization: Bearer <token>` header
- Admin-only routes are guarded by `adminOnly` middleware

---

## Frontend Portals

### Citizen Portal

| Page | File | Features |
|------|------|----------|
| Dashboard | `home.html` | Live water consumption overview, recent readings |
| Usage History | `history.html` | Historical consumption data and charts |
| Alerts | `alert.html` | Pipe leak and anomaly notifications |
| Report Incident | `report.html` | Submit water leak reports with photo upload |
| Profile | `profile.html` | Account settings and preferences |

### WASAC Staff Portal

| Page | File | Features |
|------|------|----------|
| Overview | `overview.html` | System-wide dashboard, key metrics |
| Alerts | `alerts.html` | Real-time leak alarm management |
| Analytics | `analytics.html` | Usage trends and consumption analytics |
| Districts | `districts.html` | Zone and district management |
| Reports | `reports.html` | Review citizen incident reports |
| Staff | `staff.html` | Staff account management (RBAC) |
| Change Password | `change-password.html` | Staff password update |

---

## Poster & Presentation

The academic poster is built with LaTeX (`tikzposter`):

```bash
cd poster
# Compile with pdflatex or upload to Overleaf
pdflatex main.tex
```

| File | Purpose |
|------|---------|
| `main.tex` | Poster entry point (AquaTrack colour theme) |
| `sections/s01–s10` | Modular content sections |
| `figures/` | Architecture and ERD diagram images |
| `architecture.drawio.xml` | Editable system architecture (import in draw.io) |
| `alu-logo-white-full.png` | ALU branding |

---

## Known Issues

- **Notification routes are broken.** `notification.routes.js` queries `household_id` and `is_read`, but `notification.model.js` defines `recipient_type` / `recipient_id` / `read`. `GET /api/notifications/mine` and the two `read` routes currently throw a "column does not exist" error for both citizens and staff.
- **`seed-bulk.js` is stale.** It targets old Household fields (`owner_name`, `owner_email`, `zone`) that no longer exist on the model. Use `seed-demo.js` instead (see [Seed the Database](#seed-the-database)).
- **Recording a reading on an unassigned meter fails.** `PATCH /api/meters/:id/reading` sets `MeterReading.household_id` from `meter.household_id`, which is `null` until a citizen registers against that meter — since `household_id` is `NOT NULL` on `MeterReading`, this 400s. Only record readings on meters already linked to a household.

---

## License

Academic project — African Leadership University © 2026

---

<div align="center">

**Built with 💧 by Group 6 — AquaTrack Rwanda**

</div>
