# MediFindAI

A full-stack platform for finding, comparing, and reserving medicines at nearby pharmacies —
built with Spring Boot, React, and MySQL.

> **Status:** This is the **foundation build** — project skeleton, complete database schema, and a
> fully working **User Authentication** module (register, login, JWT refresh, logout, forgot/reset
> password, role-based access). Every other module described below has its database schema, JPA
> entities, and architecture already in place; their service/controller/UI layers are being built
> module-by-module next. Pages for not-yet-built modules render a clear "Coming soon" state rather
> than broken buttons or fake data.

---

## 1. Project Overview

MediFindAI connects patients with local pharmacies in real time: search medicines, compare prices
and stock across pharmacies, reserve for pickup, and get notified along the way. It also includes
architecture for an AI medicine assistant, voice search, prescription OCR, and a nearby-pharmacy
map finder.

## 2. Features

| Module | Status |
|---|---|
| User Authentication (JWT, RBAC, forgot/reset password) | ✅ Fully working |
| Pharmacy Management | 🗂️ Schema + entities ready, UI/API next |
| Medicine Search | 🗂️ Schema + entities ready, UI/API next |
| AI Medicine Assistant | 🗂️ Architecture defined |
| Voice Search | 🗂️ Architecture defined |
| Prescription OCR | 🗂️ Schema + entities ready |
| Nearby Pharmacy Finder | 🗂️ Schema + entities ready |
| Real-time Availability | 🗂️ Schema ready (stock status enum) |
| Price Comparison | 🗂️ Schema ready |
| Medicine Reservation (full lifecycle) | 🗂️ Schema + entities ready |
| Notifications | 🗂️ Schema + entities ready |
| Admin Panel | 🗂️ Dashboard shell ready |

## 3. Technology Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router DOM, Redux Toolkit, React Hook Form + Yup,
Axios, React Toastify, React Icons, Framer Motion

**Backend:** Java 17, Spring Boot 3, Spring Security, Spring Data JPA/Hibernate, JWT (jjwt), Maven, Lombok, Bean Validation

**Database:** MySQL 8

## 4. Architecture

```
Browser (React SPA)
   │  Axios (JWT bearer + auto-refresh interceptor)
   ▼
Spring Boot REST API  (/api/**)
   │  Spring Security (stateless JWT) → Service layer → Spring Data JPA
   ▼
MySQL
```

## 5. Folder Structure

```
MediFindAI/
├── backend/                 Spring Boot API
│   └── src/main/java/com/medifindai/
│       ├── config/          Security & CORS config
│       ├── controller/      REST controllers
│       ├── dto/              Request/response DTOs
│       ├── entity/           JPA entities (16 tables)
│       ├── repository/       Spring Data repositories
│       ├── security/         JWT provider, filter, UserDetails
│       ├── service/          Business logic + impl
│       └── exception/        Global exception handling
├── frontend/                 React + Vite SPA
│   └── src/
│       ├── api/               Axios client with JWT interceptors
│       ├── components/        common / layout / forms
│       ├── pages/              public / auth / user / pharmacy / admin
│       ├── routes/             route config + ProtectedRoute
│       ├── store/               Redux slices
│       └── services/            API service wrappers
├── database/
│   ├── database_schema.sql
│   └── sample_data.sql
├── docs/
├── postman/
├── docker-compose.yml
└── README.md
```

## 6. Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+ and npm
- MySQL 8.0+
- (Optional) Docker & Docker Compose

## 7. MySQL Setup

```bash
mysql -u root -p < database/database_schema.sql
mysql -u root -p < database/sample_data.sql
```

This creates the `medifindai` database with all tables and loads realistic sample data
(5 users, 4 pharmacies, 10 medicines, sample reservations). All sample users share the password
`Password@123` (see section 15).

## 8. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env: set DB_PASSWORD and JWT_SECRET at minimum.
# Generate a strong JWT secret with: openssl rand -base64 64

mvn spring-boot:run
```

The API runs at `http://localhost:8080/api`. Swagger UI is available at
`http://localhost:8080/api/swagger-ui.html`.

> The backend reads `.env` automatically via `spring-dotenv`. Alternatively, export the same
> variables in your shell before running.

## 9. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## 10. Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Key backend variables:

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | Signs JWTs — **required**, must be a long random string |
| `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | Token lifetimes (ms) |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) allowed to call the API |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | AI Medicine Assistant (module not yet wired) |
| `GOOGLE_MAPS_API_KEY`, `GOOGLE_VISION_API_KEY` | Maps and OCR (modules not yet wired) |
| `SMTP_*` | Email delivery — if unset, emails are logged instead of sent (safe demo fallback) |

No real secrets are committed anywhere in this repository. `.env` is gitignored; only `.env.example`
files are tracked.

## 11. API Key Configuration

External integrations (AI assistant, Maps/Places, Vision OCR, Firebase, SMTP) are designed so the
app **never crashes** if a key is missing — services fall back to a documented demo mode instead
(see `EmailServiceImpl` for the pattern used). Add real keys to `.env` as those modules come online.

## 12. How to Run the Application

1. Start MySQL and load the schema (section 7)
2. Start the backend (section 8)
3. Start the frontend (section 9)
4. Visit `http://localhost:5173`, register a new account, or log in with a sample credential below

## 13. How to Run Tests

**Backend:**
```bash
cd backend
mvn test
```

**Frontend:**
```bash
cd frontend
npm run test
```

## 14. API Documentation

Interactive Swagger UI: `http://localhost:8080/api/swagger-ui.html`
OpenAPI JSON: `http://localhost:8080/api/v3/api-docs`

A Postman collection will be added to `/postman` as more endpoints come online.

### Currently available endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create an account (USER or PHARMACY_OWNER) |
| POST | `/api/auth/login` | Public | Log in, returns access + refresh token |
| POST | `/api/auth/refresh` | Public | Exchange a refresh token for a new access token |
| POST | `/api/auth/logout` | Public | Revoke a refresh token |
| POST | `/api/auth/forgot-password` | Public | Request a password reset email |
| POST | `/api/auth/reset-password` | Public | Reset password with a valid token |
| GET | `/api/users/me` | Bearer JWT | Get the logged-in user's profile |

## 15. Sample Credentials

All sample accounts use the password: **`Password@123`**

| Role | Email |
|---|---|
| Admin | admin@medifindai.com |
| User | ravi.kumar@example.com |
| User | ananya.sharma@example.com |
| Pharmacy Owner | suresh.pharmacy@example.com |
| Pharmacy Owner | priya.pharmacy@example.com |

## 16. Screenshots

_Add screenshots here as the UI is built out (e.g. `docs/screenshots/`)._

## 17. Deployment Guidance

- **Backend:** package with `mvn package`, deploy the resulting jar (or the provided `Dockerfile`)
  behind a reverse proxy (nginx/Caddy) with HTTPS termination. Set `SPRING_PROFILES_ACTIVE=prod`.
- **Frontend:** `npm run build` produces static assets in `dist/`; serve via nginx (see
  `frontend/Dockerfile`) or any static host, pointed at your API via `VITE_API_BASE_URL`.
- **Database:** use a managed MySQL instance in production; run `database_schema.sql` as a migration
  and skip `sample_data.sql`.
- **One-command local stack:** `docker compose up --build` (requires a `.env` at the project root
  with at least `JWT_SECRET` and `DB_PASSWORD` set).

## Disclaimer

This is a demonstration / academic project. It is **not** a licensed medical or pharmacy service.
Nothing in this application constitutes medical advice.
