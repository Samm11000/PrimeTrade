# PrimeTrade — Scalable REST API with Auth & RBAC

A production-ready REST API with JWT Authentication, Role-Based Access Control, and a React frontend — built for the PrimeTrade.ai Backend Intern Assignment.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcrypt (12 salt rounds) |
| Validation | Zod |
| API Docs | Swagger UI (`/api-docs`) |
| Frontend | React 18 + Vite |
| HTTP Client | Axios |

---

## 📁 Project Structure

```
PrimeTrade/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, Swagger spec
│   │   ├── middleware/     # Auth, RBAC, Validate, ErrorHandler
│   │   ├── modules/
│   │   │   ├── auth/       # Register, Login, User model
│   │   │   ├── tasks/      # Full CRUD, Task model
│   │   │   └── admin/      # Admin-only user mgmt & stats
│   │   ├── utils/          # JWT helpers, response helpers
│   │   └── app.js
│   ├── server.js
│   └── .env
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance (auto-attaches JWT)
    │   ├── pages/          # Login, Register, Dashboard
    │   ├── components/     # ProtectedRoute
    │   └── App.jsx
    └── index.html
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

Server starts at: `http://localhost:5000`  
Swagger Docs: `http://localhost:5000/api-docs`  
Health Check: `http://localhost:5000/health`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at: `http://localhost:5173`

---

## 🔑 Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/primetrade
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Endpoints (v1)

### Auth (Public)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register (name, email, password, role) |
| POST | `/api/v1/auth/login` | Login → returns JWT |
| GET | `/api/v1/auth/me` | Get current user profile (🔒) |

### Tasks (JWT Required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/tasks` | List tasks (user → own; admin → all) |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/:id` | Get single task |
| PUT | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |

Supports query params: `?status=pending&priority=high&page=1&limit=10`

### Admin (JWT + admin role required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/admin/stats` | Platform stats (total users, tasks) |
| GET | `/api/v1/admin/users` | All users (paginated) |
| GET | `/api/v1/admin/users/:id` | Single user |
| DELETE | `/api/v1/admin/users/:id` | Delete user + their tasks |

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT**: Signed tokens, 7-day expiry, verified on every protected request
- **Input Sanitization**: Zod schemas strip unknown fields
- **Role-Based Access**: Middleware guards at route level
- **CORS**: Configured to allow only the frontend origin
- **Helmet**: HTTP security headers
- **Body size limit**: 10KB max to prevent large payload attacks

---

## 🗄️ Database Schema

### User
```js
{ name, email (unique), password (hashed), role: 'user'|'admin', timestamps }
```

### Task
```js
{ title, description, status: 'pending'|'in-progress'|'completed',
  priority: 'low'|'medium'|'high', dueDate, owner (ref: User), timestamps }
```

Index: `{ owner, status }` for efficient user-scoped queries.

---

## 📚 API Documentation

Full interactive Swagger docs available at:  
👉 **`http://localhost:5000/api-docs`**

---

## 🧪 Quick Test (curl)

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","role":"user"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Create Task (replace TOKEN)
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","priority":"high"}'
```
