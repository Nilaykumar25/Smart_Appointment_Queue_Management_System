# 🏥 SAQMS — Smart Appointment & Queue Management System

A web-based clinic management system that allows patients to book appointments online and enables clinic staff to manage queues efficiently in real time.

Built by **Team SNARS** as part of DSC-11 Software Engineering coursework.

| Team Member | Role |
|---|---|
| Riddhima Chaturvedi | Backend — Auth & Security |
| Shambhavi Goel | Frontend — Patient UI |
| Nilay Kumar | Backend — Appointments & Queue |
| Shubh Mittal | Backend — Scheduling & Notifications |
| Amitansh Kesharwani | Frontend — Staff/Admin UI & Reports |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Bootstrap 5, Plain CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL / MySQL |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Notifications | SendGrid (email), Twilio (SMS) |
| PDF Export | pdfkit (server-side) |
| Session Store | Redis (token blacklist + rate limiting) |
| Deployment | AWS / GCP / Azure |

---

## 📋 Prerequisites

Make sure these are installed before setup:

- Node.js v18 or higher
- npm v9 or higher
- PostgreSQL 14 or higher
- Redis
- Git

---

## 🚀 Installation and Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/Nilaykumar25/Smart_Appointment_Queue_Management_System.git
cd Smart_Appointment_Queue_Management_System
```

### Step 2 — Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in all required values. See the [Environment Variables](#-environment-variables) section below.

### Step 3 — Install backend dependencies

```bash
cd server
npm install
```

### Step 4 — Install frontend dependencies

```bash
cd ../client
npm install
```

### Step 5 — Set up the database

```bash
cd ../server
npm run migrate
```

Seed test data (optional but recommended for testing):

```bash
npm run seed
```

### Step 6 — Start the backend server

```bash
cd server
npm run dev
```

Server runs on http://localhost:5000

### Step 7 — Start the frontend

```bash
cd client
npm run dev
```

App runs on http://127.0.0.1:3000

---

## 🔐 Environment Variables

> ⚠️ **NEVER commit your `.env` file. It contains secrets.**
> Only `.env.example` is committed to the repository.
> `.env` is listed in `.gitignore`.

### Root `.env`

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@localhost:5432/saqms_db

JWT_SECRET=replace_with_strong_random_secret
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=replace_with_refresh_secret
REFRESH_TOKEN_EXPIRY=7d

REDIS_URL=redis://localhost:6379

SENDGRID_API_KEY=replace_with_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@saqms.clinic

TWILIO_ACCOUNT_SID=replace_with_twilio_sid
TWILIO_AUTH_TOKEN=replace_with_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

FRONTEND_URL=http://localhost:3000
```

### Client `.env`

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

---

## 🧪 Test Credentials

> Available after running `npm run seed`. For development and testing only — not for production.

| Role | Email | Password |
|---|---|---|
| Admin | admin@saqms.clinic | Admin@1234 |
| Staff | staff@saqms.clinic | Staff@1234 |
| Patient | patient@saqms.clinic | Patient@1234 |

---

## 📜 Available Scripts

### Backend (run from `/server`)

| Command | Description |
|---|---|
| `npm run dev` | Start backend in development mode |
| `npm start` | Start backend in production mode |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed test data |
| `npm test` | Run backend tests |

### Frontend (run from `/client`)

| Command | Description |
|---|---|
| `npm run dev` | Start frontend in development mode |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build locally |

---

## 📁 Project Structure

```
Smart_Appointment_Queue_Management_System/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, TopBar, AdminShell
│   │   │   └── common/       # ProtectedRoute, StatusBadge, Toast
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── staff/        # QueueDashboard, BroadcastAlertForm
│   │   │   └── admin/        # ScheduleConfigUI, ReportsPage
│   │   ├── services/         # api.js, auth.js
│   │   ├── context/          # QueueContext
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   └── src/
│       ├── routes/           # auth.js, scheduleRoutes.js
│       ├── middleware/        # requireRole, rateLimiter, auditMiddleware
│       ├── services/         # business logic
│       └── db/               # database connection
│   └── package.json
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔌 API Overview

| Endpoint | Auth Required | Access |
|---|---|---|
| `POST /api/auth/register` | No | All |
| `POST /api/auth/login` | No | All |
| `POST /api/auth/logout` | Yes | All |
| `GET /api/queue/today` | Yes | Staff, Admin |
| `PATCH /api/appointments/:id/status` | Yes | Staff, Admin |
| `POST /api/notifications/broadcast` | Yes | Staff, Admin |
| `GET /api/schedule/config` | Yes | Admin |
| `POST /api/schedule/config` | Yes | Admin |
| `POST /api/schedule/blackout` | Yes | Admin |
| `DELETE /api/schedule/blackout/:date` | Yes | Admin |
| `GET /api/reports/daily` | Yes | Admin |

---

## ✅ SRS Requirements Coverage

| Requirement | Description | Status |
|---|---|---|
| REQ-1 | Role-based access control | ✅ Complete |
| REQ-2 | Data encryption in transit | ✅ Complete |
| REQ-3 | Brute-force protection | ✅ Complete |
| REQ-4 | Filter doctors by specialty | ✅ Complete |
| REQ-5 | Prevent double-booking | ✅ Complete |
| REQ-6 | Cancel/reschedule window | ✅ Complete |
| REQ-7 | Real-time queue updates | ✅ Complete |
| REQ-8 | Wait time calculation | ✅ Complete |
| REQ-9 | Define daily schedule | ✅ Complete |
| REQ-10 | Blackout dates | ✅ Complete |
| REQ-11 | Open/close slots | ✅ Complete |
| REQ-12 | One-click status update | ✅ Complete |
| REQ-13 | Auto no-show flag | ✅ Complete |
| REQ-14 | Dashboard response under 2 seconds | ✅ Complete |
| REQ-15 | Local schedule cache | ✅ Complete |
| REQ-16 | Booking confirmation notification | ✅ Complete |
| REQ-17 | Staff broadcast alert | ✅ Complete |
| REQ-18 | Immutable audit log | ✅ Complete |
| REQ-19 | Export PDF and CSV | ✅ Complete |

---

## ⚠️ Known Limitations

- Real-time queue updates use polling every 30 seconds. WebSocket push updates planned for v2.0.
- SMS notifications via Twilio require a paid account for non-trial phone numbers.
- System supports single-clinic deployment only. Multi-clinic support planned for v2.0.
- PDF report generation may be slow for 100+ appointments.
- MFA is architected but not yet activated. `mfa_secret` column exists in the database but TOTP is not enforced.
- Average consultation duration for wait time calculation must be manually configured by admin (TBD-1 in SRS).
- Tested on Chrome and Firefox. Safari not fully verified.
- Frontend currently uses mock data. Full backend integration will be completed in next sprint.

---

## 🌿 Git Workflow

### Branch naming

| Pattern | Purpose |
|---|---|
| `feat/description` | New feature |
| `fix/description` | Bug fix |
| `docs/description` | Documentation only |
| `hotfix/description` | Urgent production fix |

### Commit message format

```
type(scope): short description
```

Examples:

```
feat(auth): add JWT refresh token rotation
fix(queue): correct wait time on no-show
docs(readme): add installation steps
feat(reports): add CSV export REQ-19
```

### Rules

- Never commit directly to `main`
- Always branch off latest `main`
- After every PR merge into `main` run:

```bash
git pull origin main
git rebase origin/main
```

- Never commit `.env` — only `.env.example`
- Add this comment at the top of every route and service file:

```js
// Implements: REQ-X — see SRS Section Y
```

---

## 📄 License

This project was developed for academic purposes as part of DSC-11 Software Engineering coursework.
Not licensed for commercial use.
