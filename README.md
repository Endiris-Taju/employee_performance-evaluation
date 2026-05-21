# Employee Performance Evaluation System (PMS)

Full-stack performance management for Ethiopian civil service workflows: self/peer/leader evaluations, attendance, teams, complaints, and efficiency scoring.

## Stack

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Express + PostgreSQL
- **Auth:** JWT (6h expiry)

## Quick start

```bash
npm run install:all
```

Create `backend/.env` and `frontend/.env` from [.env.example](.env.example).

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:5000/api  

Default admin (seeded on first DB init): `admin@example.com` / `password123`

## Roles

| Role | Access |
|------|--------|
| **admin** | All employees, teams, analytics, audit log, cycles |
| **leader** | Team roster only (assign members under **Teams**) |
| **member** | Self eval, peer eval, attendance, own efficiency |

## Evaluation weights

Overall efficiency = **Self 5%** + **Peer 10%** + **Leader 15%** + **Admin/Work 70%**

## Key routes (frontend)

| Path | Description |
|------|-------------|
| `/admin` | Admin dashboard |
| `/teams` | Create teams & assign members |
| `/cycles` | Evaluation periods |
| `/audit-log` | Admin audit trail |
| `/evaluations` | Staff evaluation list |
| `/analytics` | Live org analytics |
| `/profile` | Profile & password |
| `/efficiency` | Weighted score breakdown |

## API overview

- `POST /api/auth/login` — login  
- `GET/PUT /api/auth/me` — profile  
- `POST /api/auth/change-password` — password change  
- `GET /api/evaluations/completion` — cycle completion status  
- `GET /api/cycles/active` — active evaluation period  
- `GET /api/audit` — audit log (admin)  
- `GET /api/notifications/me` — in-app notifications  

## Production notes

- Set a strong `JWT_SECRET` and restrict CORS to your frontend origin in `backend/server.js`
- Profile/attendance photos are stored as truncated base64 in PostgreSQL; migrate to object storage (S3/MinIO) for production scale
- Change the default admin password after first login
