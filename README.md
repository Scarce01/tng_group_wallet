# TNG Group Wallet

Shared **Pool Engine** that powers Trip Wallets and Family Wallets in the TNG Group Wallet hackathon project. Phone + 6-digit-PIN auth, atomic ledgered contributions and votes, real-time WebSocket fan-out, and a React/shadcn frontend.

## Repo layout

```
.
├── backend/         Python FastAPI backend (canonical)
│   └── app/
│       ├── main.py              FastAPI app + lifespan + CORS + error handlers + SPA fallback
│       ├── config.py            env loader (.env at repo root)
│       ├── db.py                async SQLAlchemy engine; auto-disables prepared statements on Supabase pooler
│       ├── models.py            11 SQLAlchemy models, mirrors the Prisma schema 1:1
│       ├── enums.py             12 enums (PoolType, MemberRole, SpendStatus, …)
│       ├── serialize.py         Prisma-shape JSON (Decimal -> "1.23", DateTime -> ISO Z, enums uppercase)
│       ├── jwt_utils.py         python-jose access/refresh tokens
│       ├── security.py          bcrypt cost-10 (interoperable with the old Node hashes)
│       ├── auth_dep.py          FastAPI dep that pulls userId from Bearer token
│       ├── pubsub.py            in-process EventBus or Redis pub/sub
│       ├── publisher.py         fire-and-forget publish helpers used by HTTP routes
│       ├── ws.py                FastAPI WebSocket; per-pool subscribe with membership check
│       ├── rate_limit.py        in-memory window limiter on auth endpoints
│       ├── errors.py            AppError hierarchy + Express-shape error envelope
│       ├── cuid.py              25-char Prisma-compatible cuid generator
│       ├── routes/              auth, users, pools, members, invites, contributions, spend, transactions, zk
│       ├── schemas/             Pydantic v2 input validators (Zod-equivalent shapes)
│       ├── services/            business logic — auth, pool, contribution, spend (incl. resolveVotingStatus), zk
│       ├── seed.py              demo data — 4 users, 1 trip pool, 1 family pool
│       └── bootstrap.py         drop-and-recreate public schema (one-time)
├── web/             React 18 + Vite + Tailwind + shadcn/Radix UI + MUI frontend
├── src/             OLD Node/TypeScript backend — kept for reference, not used at runtime
├── prisma/          OLD Prisma schema + seed (kept so the TS backend in src/ still builds)
├── public/          Legacy vanilla-HTML prototype (used as static fallback if web/dist isn't built)
├── Dockerfile       (legacy — Node image; Python Dockerfile to be added)
├── docker-compose.yml
├── .env             local env (gitignored — see .env.example)
└── .claude/launch.json   preview launchers used by the Claude Code preview tooling
```

The **TypeScript backend in `src/`** was the original implementation; the project has since been ported to Python and that is what runs. The TS code is preserved in case anyone wants to compare or reuse it.

## Tech stack

**Backend (Python)**
- FastAPI, Uvicorn (asyncio)
- SQLAlchemy 2.0 async + asyncpg
- Pydantic v2 (request validation)
- python-jose (JWT, HS256), passlib/bcrypt (PIN hash, cost 10)
- redis-py (optional WebSocket pub/sub fan-out)
- Native FastAPI WebSockets

**Database**
- PostgreSQL 17 hosted on **Supabase** (transaction pooler), or any local Postgres for offline dev
- All balance changes inside a single SQLAlchemy transaction — pool/user balances cannot drift

**Frontend (in `web/`)**
- React 18 + Vite 6, TypeScript
- shadcn/Radix UI + MUI for components
- TanStack Query, React Router 7
- Tailwind 4

## Quick start

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — most importantly DATABASE_URL.
```

For Supabase:
```env
DATABASE_URL=postgresql://postgres.<project-ref>:<URL-encoded-password>@aws-1-<region>.pooler.supabase.com:6543/postgres
```
Get this string from Supabase dashboard → **Connect → Direct → Transaction pooler**. Free-tier projects do **not** have IPv4 on the direct host, so the pooler is required.

For local Postgres:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tng_pool
```

### 2. Install Python deps

```bash
cd backend
python -m pip install -r requirements.txt
```

### 3. Create schema + seed demo data

```bash
# From repo root or backend/
python -m app.bootstrap     # DROP+CREATE schema public, then create_all()
python -m app.seed          # 4 users, 2 pools, contributions, votes, ZK-verified Ahmad
```

Demo accounts (PIN `123456` for all):

| Phone | Name | Role |
|---|---|---|
| `+60112345001` | Ahmad | owner of both pools |
| `+60112345002` | Siti | family pool admin |
| `+60112345003` | Raj | trip pool member |
| `+60112345004` | Mei | trip pool member |

### 4. Run the API

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
```

API: `http://localhost:4000/api/v1`
WebSocket: `ws://localhost:4000/ws?token=<accessToken>`
OpenAPI docs: `http://localhost:4000/docs`

### 5. Run the frontend

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:5173`. The Vite dev server proxies `/api` and `/ws` to the FastAPI backend on `:4000`, so you can hot-reload UI without touching the API.

### 6. Smoke test the API

```bash
# Login as Ahmad
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"phone":"+60112345001","pin":"123456"}' | jq -r .accessToken)

# List pools
curl -s http://localhost:4000/api/v1/pools \
  -H "authorization: Bearer $TOKEN" | jq
```

## Voting engine

`resolve_voting_status` in [`backend/app/services/spend_service.py`](backend/app/services/spend_service.py) is a pure function — given the pool config, eligible-member count, and current votes, it returns `APPROVED` / `REJECTED` / `PENDING`. It runs inside the same DB transaction as the vote insert, so vote casting and resolution are atomic.

Resolution rules:
- `MAJORITY` → ≥ 51 % of (members − abstentions) approved
- `UNANIMOUS` → 100 % approved
- `THRESHOLD` → ≥ `approvalThreshold` approved
- `ADMIN_ONLY` → owner's vote decides
- Early `REJECTED` once remaining unvoted members can no longer reach the threshold
- `EXPIRED` swept by a 60 s background task (`expire_stale_requests`)

Emergency override (FAMILY pools with `emergencyOverride=true`) creates the request as `APPROVED` immediately and skips voting.

## Real-time events

Connect to `ws://host/ws?token=<accessToken>`. The server auto-subscribes you to your `user:` channel. To receive pool events, send:

```json
{ "action": "subscribe", "poolId": "clx..." }
```

Events:

| Event | Channel | Trigger |
|---|---|---|
| `ready` | direct | on connect |
| `subscribed` / `unsubscribed` | direct | after pool sub change |
| `balance_updated` | pool | contribution or spend execution |
| `spend_request_created` | pool | new spend request |
| `vote_cast` | pool | any vote, includes new `resolution` |
| `spend_request_resolved` | user | sent to requester when their request flips |
| `spend_request_cancelled` | pool | requester cancelled |
| `member_added` / `updated` / `left` / `removed` / `joined` | pool | membership changes |

Fan-out is in-process by default; set `REDIS_URL` to switch to Redis pub/sub so you can horizontally scale the API.

## API surface

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

GET    /api/v1/pools/:id/zk/params
POST   /api/v1/pools/:id/zk/prove
POST   /api/v1/pools/:id/zk/verify
GET    /api/v1/pools/:id/zk/status

GET    /api/v1/health
```

## Cloud deploy (any host that runs Python + can reach Supabase)

The backend is a stock FastAPI + Uvicorn app, so it deploys identically to **Render**, **Fly.io**, **Railway**, or **AWS App Runner / ECS Fargate**. Whichever you pick:

1. Build the container or push the repo.
2. Set environment variables — same names as `.env`:
   - `DATABASE_URL` → Supabase **transaction pooler** URI
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → ≥ 32-byte random strings (don't reuse the dev defaults)
   - `CORS_ORIGINS` → comma-separated list of frontend origins
   - `NODE_ENV=production`
   - `PORT=4000` (or whatever the platform sets — uvicorn binds to `--port`)
   - `REDIS_URL` → only if running > 1 replica and you want shared WebSocket fan-out
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Health check: `GET /api/v1/health` returns `{"status":"ok",...}`.

The Supabase pooler runs PgBouncer in transaction mode; `backend/app/db.py` auto-detects `*.pooler.supabase.com` / port `6543` and disables asyncpg prepared statements + JIT. No manual flags required.

## What's intentionally NOT in this slice

- Family-specific features beyond the engine: income streams, budget plans, scam shield, grant matching
- Settlement calculation (trip-pool dissolution payouts)
- Admin dashboard endpoints
- KYC document upload to S3
- Mobile (Flutter) app — the React app in `web/` is the reference UI

These can be layered on top without touching the engine.

## Notes for contributors

- **Money is `Decimal`**, never float. The serializer always emits 2-dp strings (`"1234.50"`) so the frontend doesn't have to deal with rounding.
- **DateTimes go out as ISO-8601 with `Z`** suffix and millisecond precision (matches Prisma's wire format) — see `backend/app/serialize.py`.
- **All ledger writes happen inside one DB transaction.** `make_contribution`, `cast_vote`, and `execute_approved_spend` are the canonical examples — copy the pattern when adding new ledger flows.
- **`metadata` is a reserved column name** in SQLAlchemy (clashes with `Base.metadata`); the model attribute is `metadata_` and the serializer emits it as `metadata` to keep the API stable. Don't rename it.
