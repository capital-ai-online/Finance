# Deployment Architecture Design Specification
## Multi-Node Container Clusters and Middleware Layouts

The platform is built as a cloud-native, microservices-oriented system. It deploys across container clusters (e.g., Kubernetes, Cloud Run, AWS ECS) using a multi-stage Docker build pipeline and a highly decoupled Docker Compose layout.

---

## 1. Container Workspaces & Node Taxonomy

The architecture comprises four independent node instances:

```
                          ┌──────────────────────┐
                          │   Nginx Controller   │ (Host: Port 3000)
                          └──────────┬───────────┘
                                     │
      ┌────────────────────────┬─────┴──────────────────────┐
      ▼                        ▼                            ▼
┌──────────────┐       ┌──────────────┐             ┌──────────────┐
│ API Gateway  │       │ Platform Dir.│             │ Master Sup.  │
│ (Port 3000)  │       │ (Port 3005)  │             │ (Port 3100)  │
└──────┬───────┘       └──────┬───────┘             └──────┬───────┘
       │                      │                            │
       └──────────────────────┼────────────────────────────┘
                              ▼
                      ┌──────────────┐
                      │  Dashboard   │
                      │ (Port 3015)  │
                      └──────────────┘
```

- **API Gateway**: Serves the user interface and coordinates the primary transaction lifecycle.
- **Platform Director**: The regulatory controller, validating transaction compliance pre-execution.
- **Master Supervisor**: Monitor and failover controller, managing agent heartbeats and health logs.
- **Dashboard Backend**: Collects telemetry statistics and displays platform operational metrics.

---

## 2. Shared Multi-Stage Dockerfile Blueprint

To optimize container image sizing and accelerate deployment cold-starts, the platform utilizes a multi-stage build structure.

```dockerfile
# Stage 1: Build & Cache Workspace Dependencies
FROM node:20-alpine AS installer
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY agents/ ./agents/
RUN npm ci
RUN npm run build --workspaces

# Stage 2: Clean Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/apps ./apps
COPY --from=installer /app/agents ./agents
COPY --from=installer /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3000 3005 3100 3015
```

---

## 3. Distributed docker-compose Blueprint

The orchestration of service containers and backing databases is detailed in `docker-compose.yml`:

```yaml
version: "3.8"

services:
  api-gateway:
    build: .
    command: npm run dev --workspace=api-gateway
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    depends_on:
      - redis
      - nats

  platform-director:
    build: .
    command: npm run dev --workspace=platform-director
    ports:
      - "3005:3005"
    environment:
      - PORT_DIRECTOR=3005
    depends_on:
      - redis
      - nats

  master-supervisor:
    build: .
    command: npm run dev --workspace=master-supervisor
    ports:
      - "3100:3100"
    environment:
      - PORT_SUPERVISOR=3100
    depends_on:
      - redis
      - nats

  dashboard:
    build: .
    command: npm run dev --workspace=dashboard
    ports:
      - "3015:3015"
    environment:
      - PORT_DASHBOARD=3015
    depends_on:
      - redis
      - nats

  redis:
    image: redis:7-alpine
    container_name: fintech-redis-cache
    ports:
      - "6379:6379"

  nats:
    image: nats:2.10-alpine
    container_name: fintech-nats-broker
    ports:
      - "4222:4222"
```

---

## 4. Port and Middleware Architecture

- **Port Bindings**: Nginx binds only Port `3000` to external clients. All other ports (`3005`, `3100`, `3015`) are routed privately inside the Virtual Private Cloud (VPC) to block external threat actors.
- **NATS Broker**: Serves as the messaging backbone for low-latency, publish-subscribe events.
- **Redis Cache**: Holds short-lived cache states (e.g., historical beta data or agent locks) to minimize computation cycles.
