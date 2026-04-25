# TNG Group Wallet — Pool Engine

Backend service for the **shared Pool Engine** that powers both Trip Wallets and Family Wallets in the TNG Group Wallet hackathon project.

This slice is **backend only**. It exposes a REST API + WebSocket for real-time pool events.

## What's in this slice

| Module | Endpoints |
|---|---|
| Auth | register / login / refresh / logout (phone + 6-digit PIN, JWT access + rotating refresh) |
| Users | profile, main wallet balance, top-up (demo), notifications, personal transactions |
| Pools | create / list / detail / patch / archive / delete (TRIP and FAMILY) |
| Members | add / list (with contributed totals) / patch role / leave / remove |
| Invites | generate code, list pending, accept, decline |
| Contributions | atomic deduct-from-wallet → credit-pool with double-entry ledger |
| Spend Requests | create, list, detail with votes |
| Voting | cast vote, automatic resolution (MAJORITY / UNANIMOUS / THRESHOLD / ADMIN_ONLY), expiry sweep |
| Execution | execute approved spend → credit requester wallet |
| Emergency | family-only emergency override skips voting |
| Ledger | pool transactions, pool analytics (per-member net, spend by category, flow data) |
| Real-time | WebSocket: subscribe to pool, receive `vote_cast`, `balance_updated`, `spend_request_resolved`, `member_*` events |

What is **not** in this slice (intentionally scoped out):
- Family-specific features: income streams, budget plans, scam shield, grant matching
- Settlement calculation (trip pool dissolution payouts)
- Admin dashboard endpoints
- KYC document upload to S3
- Mobile app (Flutter)

These can be layered on top of this engine later.

## Tech stack

- **Node.js 20** + **TypeScript** (strict mode, `noUncheckedIndexedAccess`)
- **Express 4**, **Zod** request validation
- **Prisma 5** + **PostgreSQL 16** (all balance changes inside `$transaction`)
- **Redis 7** for WebSocket pub/sub fan-out (multi-instance safe)
- **ws** for the WebSocket server (Flutter-friendly)
- **JWT** (rotating refresh tokens, hashed at rest)
- **Helmet**, **CORS**, **express-rate-limit** on auth endpoints
- **Winston** structured logging

## Local development

### 1. Prerequisites

- Node 20+
- Docker Desktop (for Postgres + Redis)
- (optional) `psql` / `redis-cli` for inspection

### 2. Boot Postgres + Redis only

```bash
cp .env.example .env
docker compose up -d postgres redis
```

### 3. Install + migrate + seed

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

Seed creates 4 users (PIN = `123456`), 2 pools (1 trip, 1 family) with contributions and a pending spend request.

### 4. Run the API

```bash
npm run dev      # tsx watch
# or
npm run build && npm start
```

API: `http://localhost:4000/api/v1`
WebSocket: `ws://localhost:4000/ws?token=<accessToken>`

### 5. Smoke test

```bash
# Login as Ahmad (seeded)
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"phone":"+60112345001","pin":"123456"}' | jq

# Save the accessToken, then list pools
curl -s http://localhost:4000/api/v1/pools \
  -H "authorization: Bearer $TOKEN" | jq
```

### 6. Full stack with Docker

```bash
docker compose up --build
```

Brings up `postgres`, `redis`, and `api` (which runs `prisma migrate deploy` then starts the server). The API container does **not** seed — run `npm run seed` against the dockerized DB if you want demo data.

## Project layout

```
src/
├── app.ts                  Express wiring
├── index.ts                HTTP + WebSocket boot, graceful shutdown
├── config/env.ts           Zod-validated environment
├── lib/                    prisma, redis, logger
├── middleware/             auth, error handler, validate
├── schemas/                Zod request schemas
├── services/               Business logic (pure where possible — see resolveVotingStatus)
├── routes/                 Express routers
├── utils/                  jwt, errors, async wrapper
└── websocket/              ws server + Redis pub/sub publisher
prisma/
├── schema.prisma           Pool Engine subset of the full hackathon schema
└── seed.ts                 Demo data
```

## Voting engine

`resolveVotingStatus` in [`src/services/spend.service.ts`](src/services/spend.service.ts) is a pure function — given pool config + active member count + current votes, it returns `APPROVED` / `REJECTED` / `PENDING`. The service runs it inside the same transaction as the vote insert, so vote casting and resolution are atomic.

Resolution rules:
- `MAJORITY` → ≥ 51% of (members − abstentions) approved
- `UNANIMOUS` → 100% approved
- `THRESHOLD` → ≥ `approvalThreshold` approved
- `ADMIN_ONLY` → owner's vote decides
- `REJECTED` early if remaining unvoted members can no longer reach the threshold
- `EXPIRED` swept by a 60s background timer (`expireStaleRequests`)

Emergency override (FAMILY pools with `emergencyOverride=true`) creates the request as `APPROVED` immediately and skips voting.

## Real-time events

Connect to `ws://host/ws?token=<accessToken>`. The server auto-subscribes you to your `user:` channel. To receive pool events, send:

```json
{ "action": "subscribe", "poolId": "clx..." }
```

Events emitted:

| Event | Channel | Trigger |
|---|---|---|
| `ready` | direct | on connect |
| `subscribed` / `unsubscribed` | direct | after pool sub change |
| `balance_updated` | pool | contribution or spend execution |
| `spend_request_created` | pool | new spend request |
| `vote_cast` | pool | any vote, includes new `resolution` |
| `spend_request_resolved` | user | only sent to requester when their request flips |
| `spend_request_cancelled` | pool | requester cancelled |
| `member_added`/`updated`/`left`/`removed`/`joined` | pool | membership changes |

WebSocket fan-out goes through Redis pub/sub, so you can scale the API horizontally on ECS Fargate without losing events across replicas.

## AWS deployment (ECS Fargate + RDS + ElastiCache)

The `Dockerfile` produces a non-root, multi-stage runtime image with `tini` as PID 1 and a built-in `HEALTHCHECK` against `/api/v1/health`. Terraform isn't included in this slice, but the deploy contract is:

1. **Push image** to ECR
   ```bash
   aws ecr get-login-password --region ap-southeast-1 | \
     docker login --username AWS --password-stdin <acct>.dkr.ecr.ap-southeast-1.amazonaws.com
   docker build -t tng-pool-api .
   docker tag tng-pool-api:latest <acct>.dkr.ecr.ap-southeast-1.amazonaws.com/tng-pool-api:latest
   docker push <acct>.dkr.ecr.ap-southeast-1.amazonaws.com/tng-pool-api:latest
   ```

2. **Provision** (Terraform-shaped):
   - VPC with 2 public + 2 private subnets across AZs
   - **RDS PostgreSQL 16** in private subnets (Multi-AZ for prod), security group allows 5432 from ECS SG
   - **ElastiCache Redis 7** in private subnets, security group allows 6379 from ECS SG
   - **ECR** repository `tng-pool-api`
   - **ECS Cluster** + Fargate **Service** running 2+ tasks of the image
   - **ALB** in public subnets, target group on port 4000
   - **ALB listener** on 443 (ACM cert) → forward to target group
   - **WebSocket support**: ALB target group needs `stickiness.enabled = true` (or use ALB-native sticky-cookie); WebSocket upgrades work out of the box on ALB.

3. **Task environment** (via Secrets Manager / SSM Parameter Store, not env files):
   - `DATABASE_URL` → RDS endpoint
   - `REDIS_URL` → ElastiCache primary endpoint
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → 32+ byte random strings
   - `CORS_ORIGINS` → comma-separated list (e.g. mobile build origin, admin domain)
   - `NODE_ENV=production`
   - `PORT=4000`

4. **Migrations on deploy** — easiest path: pre-deploy ECS task that runs `npx prisma migrate deploy` against the same DB. Don't bake `prisma migrate dev` into the runtime image.

5. **Health check** — ALB target group should hit `GET /api/v1/health` (ECS task already declares it for container health).

## Tested API surface

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/me/balance
POST   /api/v1/users/me/topup           # demo only
GET    /api/v1/users/me/notifications
PATCH  /api/v1/users/me/notifications/:id
GET    /api/v1/users/me/transactions

POST   /api/v1/pools
GET    /api/v1/pools?type=&status=
GET    /api/v1/pools/:id
PATCH  /api/v1/pools/:id
POST   /api/v1/pools/:id/archive
DELETE /api/v1/pools/:id

GET    /api/v1/pools/:id/members
POST   /api/v1/pools/:id/members
PATCH  /api/v1/pools/:id/members/:uid
POST   /api/v1/pools/:id/members/:uid/leave
DELETE /api/v1/pools/:id/members/:uid

POST   /api/v1/pools/:id/invites
GET    /api/v1/pools/:id/invites
POST   /api/v1/invites/:code/accept
POST   /api/v1/invites/:code/decline

POST   /api/v1/pools/:id/contributions
GET    /api/v1/pools/:id/contributions
GET    /api/v1/pools/:id/contributions/summary

POST   /api/v1/pools/:id/spend-requests
GET    /api/v1/pools/:id/spend-requests
GET    /api/v1/pools/:id/spend-requests/:sid
POST   /api/v1/pools/:id/spend-requests/:sid/vote
POST   /api/v1/pools/:id/spend-requests/:sid/cancel
POST   /api/v1/pools/:id/spend-requests/:sid/execute

GET    /api/v1/pools/:id/transactions
GET    /api/v1/pools/:id/analytics

GET    /api/v1/health
```
