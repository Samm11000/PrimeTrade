# Scalability Note — PrimeTrade API

## Current Architecture

The PrimeTrade API follows a **modular monolith** pattern — all business logic lives in a single Node.js process, but is structured in self-contained modules (`auth/`, `tasks/`, `admin/`) that can be extracted into microservices independently.

---

## Scaling Strategy

### 1. Horizontal Scaling (Immediate)
- **Load Balancer (Nginx / AWS ALB)**: Route traffic across multiple Node.js instances.
- **Stateless JWT auth**: No server-side sessions — every instance can validate tokens independently.
- **MongoDB Atlas**: Handles replication and connection pooling out of the box.

```
              ┌─────────────┐
  Users ─────▶│ Load Balancer│──▶ API Instance 1
              │  (Nginx/ALB) │──▶ API Instance 2
              └─────────────┘──▶ API Instance 3
                                     │
                               MongoDB Atlas (Replica Set)
```

### 2. Caching (Redis)
- Cache expensive queries (e.g., admin stats, task list by user) in **Redis** with TTL.
- Use `ioredis` or `@upstash/redis` (serverless-friendly).
- Cache invalidation on create/update/delete via event hooks.

```js
// Example: cache task list for 60 seconds
const cacheKey = `tasks:user:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
// ...fetch from DB...
await redis.setex(cacheKey, 60, JSON.stringify(tasks));
```

### 3. Microservices (Long-term)
Each module can become an independent service:
- **Auth Service** — handles registration, login, token refresh
- **Task Service** — CRUD for tasks
- **Admin Service** — user management, analytics
- **API Gateway** — single entry point, routes to services, handles auth

Communicate via **REST** or **message queues (RabbitMQ / Kafka)** for async operations (e.g., send email on task completion).

### 4. Database Scaling
- **Read Replicas**: Route read queries to replicas, writes to primary.
- **Mongoose Indexes**: Already added `{ owner, status }` compound index on tasks.
- **Data Sharding**: Shard by `userId` for very large datasets.

### 5. Docker & Kubernetes
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

Deploy multiple replicas with **Kubernetes** or **Docker Compose** + Nginx.

### 6. Logging & Monitoring
- **Morgan** already configured for HTTP logging.
- Add **Winston** for structured JSON logs.
- **Prometheus + Grafana** for metrics (request rate, error rate, latency).
- **Sentry** for real-time error tracking.

---

## Summary Table

| Concern | Solution |
|---|---|
| Multiple instances | Stateless JWT + Load Balancer |
| DB read performance | Redis cache + MongoDB read replicas |
| High write throughput | MongoDB sharding |
| Service isolation | Microservices via API Gateway |
| Deployment | Docker + Kubernetes |
| Observability | Winston logs + Prometheus + Sentry |
