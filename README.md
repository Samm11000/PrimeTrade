# PrimeTrade.ai – Backend Developer Intern Assignment

**Submitted by:** Swyam Yadav
**GitHub Repository:** https://github.com/Samm11000/PrimeTrade
**Submission Date:** April 23, 2026
**Tech Stack:** Node.js · Express · MongoDB Atlas · JWT · React · Swagger

---

## 📋 Deliverables Checklist

| Deliverable | Status | Details |
|---|---|---|
| Backend hosted on GitHub with README.md | ✅ DONE | Full README with setup, endpoints, env vars |
| Working APIs – Authentication | ✅ DONE | Register, Login, Get Profile — tested live against MongoDB Atlas |
| Working APIs – CRUD | ✅ DONE | Full Task CRUD: Create, Read (list + single), Update, Delete — paginated & filterable |
| Basic Frontend UI | ✅ DONE | React + Vite — Register, Login, Dashboard with task CRUD & admin panel |
| API Documentation (Swagger) | ✅ DONE | Swagger UI live at `http://localhost:5000/api-docs` |
| Scalability Note | ✅ DONE | `SCALABILITY.md` — covers Redis, microservices, Docker, load balancing, Kubernetes |

---

## 📁 Project Structure

```
PrimeTrade/
├── backend/
│   ├── src/
│   │   ├── config/           # DB connection (MongoDB Atlas), Swagger spec
│   │   ├── middleware/       # JWT auth, RBAC roleGuard, Zod validate, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/         # User model, register/login controllers, routes
│   │   │   ├── tasks/        # Task model, CRUD controllers, routes
│   │   │   └── admin/        # Admin-only: user management, platform stats
│   │   ├── utils/            # JWT helpers, standardised response helpers
│   │   └── app.js            # Express app — middleware, routes, Swagger
│   ├── server.js             # Entry point — DB connect → start server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.js      # Axios instance with JWT interceptor + auto-logout
│   │   ├── pages/            # LoginPage, RegisterPage, DashboardPage
│   │   ├── components/       # ProtectedRoute wrapper
│   │   └── App.jsx           # React Router + Toaster
│   └── index.html
├── README.md
├── SCALABILITY.md
└── .gitignore
```

---

## ⚙️ Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in your MONGO_URI and JWT_SECRET in .env
npm install
npm run dev
```

- Server → `http://localhost:5000`
- Swagger Docs → `http://localhost:5000/api-docs`
- Health Check → `http://localhost:5000/health`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App → `http://localhost:5173`

### Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/primetrade
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Endpoints (v1)

### Authentication – Public

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Register user (name, email, password, role) | 201 / 409 / 422 |
| POST | `/api/v1/auth/login` | Login → returns JWT token | 200 / 401 |
| GET | `/api/v1/auth/me` | Get current user profile *(JWT required)* | 200 / 401 |

### Tasks – JWT Required

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| GET | `/api/v1/tasks` | List tasks — user: own; admin: all. Supports `?status`, `?priority`, `?page`, `?limit` | 200 / 401 |
| POST | `/api/v1/tasks` | Create new task (title required) | 201 / 422 |
| GET | `/api/v1/tasks/:id` | Get single task by ID | 200 / 403 / 404 |
| PUT | `/api/v1/tasks/:id` | Update task fields | 200 / 403 / 404 |
| DELETE | `/api/v1/tasks/:id` | Delete task | 200 / 403 / 404 |

### Admin – JWT + Admin Role Required

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| GET | `/api/v1/admin/stats` | Platform stats: total users, tasks, breakdown by status | 200 / 403 |
| GET | `/api/v1/admin/users` | All registered users (paginated) | 200 / 403 |
| GET | `/api/v1/admin/users/:id` | Get user by ID | 200 / 403 / 404 |
| DELETE | `/api/v1/admin/users/:id` | Delete user + all their tasks | 200 / 403 / 404 |

### Other

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check — server status, version, timestamp |
| GET | `/api-docs` | Swagger UI — interactive API documentation |

---

## 🗄️ Database Schema (MongoDB)

### User Collection

```js
{
  name:      String   // required, 2–50 chars
  email:     String   // required, unique, lowercase
  password:  String   // hashed with bcrypt 12 salt rounds — never returned in responses
  role:      Enum     // ['user', 'admin']  default: 'user'
  createdAt: Date     // auto
  updatedAt: Date     // auto
}
```

### Task Collection

```js
{
  title:       String   // required, 3–100 chars
  description: String   // optional, max 500 chars
  status:      Enum     // ['pending', 'in-progress', 'completed']  default: 'pending'
  priority:    Enum     // ['low', 'medium', 'high']  default: 'medium'
  dueDate:     Date     // optional, ISO 8601
  owner:       ObjectId // ref: User (required)
  createdAt:   Date     // auto
  updatedAt:   Date     // auto

  // Index: { owner: 1, status: 1 } — for fast user-scoped queries
}
```

---

## 🧪 Live API Test Results

Tested live against the running server connected to **MongoDB Atlas**:

### POST /api/v1/auth/register
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "name": "Test User",
      "email": "test@primetrade.ai",
      "role": "user",
      "_id": "69e94e7d2fa7d0bd41bf4ffc",
      "createdAt": "2026-04-22T22:41:01.923Z"
    }
  }
}
```

### POST /api/v1/tasks
```json
{
  "success": true,
  "message": "Task created.",
  "data": {
    "task": {
      "title": "Complete PrimeTrade Assignment",
      "description": "Build scalable REST API",
      "status": "in-progress",
      "priority": "high",
      "owner": "69e94e7d2fa7d0bd41bf4ffc",
      "_id": "69e94e882fa7d0bd41bf4fff",
      "createdAt": "2026-04-22T22:41:12.274Z"
    }
  }
}
```

---

## 🔒 Security Implementation

| Practice | Implementation |
|---|---|
| Password Hashing | bcryptjs with 12 salt rounds — hashed in User model pre-save hook |
| JWT Auth | Signed tokens, 7-day expiry, verified on every protected request via middleware |
| Role-Based Access | `roleGuard('admin')` middleware factory — blocks non-admin users at route level with 403 |
| Input Validation | Zod schemas on all endpoints — strips unknown fields, returns 422 with field-level errors |
| CORS | Configured to only allow requests from `FRONTEND_URL` |
| HTTP Headers | Helmet middleware sets secure HTTP headers (XSS, HSTS, no-sniff, etc.) |
| Body Size Limit | 10KB max body — prevents large payload DoS attacks |
| Token Expiry | Returns 401 with clear message for expired or invalid tokens |
| Password never returned | `select: false` on password field in Mongoose schema |

---

## 🖥️ Frontend UI (React + Vite)

| Page | Route | Features |
|---|---|---|
| Register | `/register` | Name, email, password, role selector — field-level API errors shown inline |
| Login | `/login` | Email + password — error banner on invalid credentials |
| Dashboard | `/dashboard` | Task cards with Create/Edit/Delete modals, status & priority filters |
| Admin Dashboard | `/dashboard` *(admin)* | Extra tabs: All Tasks, Users Table (with delete), Platform Stats |

**Key Features:**
- Axios instance auto-attaches JWT Bearer token on every request
- Auto-logout on 401 response (token expired/invalid)
- Protected routes — unauthenticated users redirected to `/login`
- Toast notifications for all success/error actions
- Role-aware UI — admin sees additional tabs and admin banner

---

## 📚 API Documentation (Swagger)

**URL:** `http://localhost:5000/api-docs`

Generated via `swagger-jsdoc` from JSDoc annotations on every route file. Features:
- Try-it-out for every endpoint directly in the browser
- Bearer token authentication persisted across requests
- Request body schemas with examples
- Response schemas and status codes documented
- Grouped by tag: **Auth · Tasks · Admin**

> OpenAPI 3.0 spec — can be exported as JSON for Postman import.

---

## 📈 Scalability & Deployment Readiness

### 1. Horizontal Scaling
The API is **stateless** — JWT tokens contain all auth info, so any number of instances can serve requests independently behind a **load balancer (Nginx / AWS ALB)**. MongoDB Atlas handles connection pooling and replica sets automatically.

```
              ┌──────────────┐
  Users ─────▶│ Load Balancer │──▶ API Instance 1
              │  (Nginx/ALB)  │──▶ API Instance 2
              └──────────────┘──▶ API Instance 3
                                       │
                               MongoDB Atlas (Replica Set)
```

### 2. Caching (Redis)
Expensive queries (task lists, admin stats) cached in **Redis** with TTL. Cache invalidated on mutations. Implementation via `ioredis`.

```js
// Cache task list for 60 seconds
const cached = await redis.get(`tasks:user:${userId}`);
if (cached) return JSON.parse(cached);
// ...fetch from DB...
await redis.setex(`tasks:user:${userId}`, 60, JSON.stringify(tasks));
```

### 3. Microservices (Long-term)
Each module (`auth/`, `tasks/`, `admin/`) is self-contained and extractable into an independent service. An **API Gateway** routes traffic, handles auth, and rate limiting.

### 4. Docker + Kubernetes

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

Deploy multiple replicas with Kubernetes HPA for auto-scaling under load.

### 5. Monitoring & Logging
- **Morgan** — HTTP request logging (already integrated)
- **Winston** — structured JSON logs for production
- **Prometheus + Grafana** — metrics (req/s, error rate, latency)
- **Sentry** — real-time error tracking

---

## ✅ Evaluation Criteria – Self Assessment

| Criterion | Implementation |
|---|---|
| **API Design** (REST principles, status codes, modularity) | RESTful routes with correct HTTP verbs and status codes. Versioned under `/api/v1/`. Modular structure — each entity is a self-contained module. Consistent response shape: `{ success, message, data }` across all endpoints. |
| **Database Schema** (design & management) | Mongoose schemas with field-level validation, enums, defaults. Compound index `{ owner, status }` on Task. References with `populate()` for relational data. Password never stored in plaintext. |
| **Security Practices** (JWT, hashing, validation) | bcrypt 12-round hashing. JWT with expiry, verified per-request. Zod input sanitization. Helmet HTTP headers. CORS origin restriction. Role guards at middleware level. |
| **Frontend Integration** | React connects to all API endpoints. JWT auto-attached via Axios interceptor. All CRUD actions work from UI. API error messages shown inline or via toast. Admin-only UI hidden from regular users. |
| **Scalability & Deployment** | Stateless JWT ready for horizontal scaling. Modular codebase — each module extractable as microservice. Dockerfile ready. Redis caching strategy documented. MongoDB Atlas with replica sets. |

---

*PrimeTrade.ai Backend Intern Assignment · Submitted by Swyam Yadav · April 2026*
