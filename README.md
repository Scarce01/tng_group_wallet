# 🏦 TNG Group Wallet — KongsiGo

> 🚀 A shared-wallet engine built for the Touch 'n Go eWallet hackathon. Trip Wallets. Family Wallets. Phone + PIN auth, device-bound passwordless login, atomic ledgered contributions, democratic spend voting, real-time WebSocket sync, AI-powered financial agents, and a React/shadcn frontend — all backed by FastAPI and PostgreSQL.

<p align="center">

**`🐍 Python/FastAPI`** · **`⚛️ React 18`** · **`🗄️ PostgreSQL`** · **`🤖 Claude + Ollama AI`** · **`🧠 DistilBERT + Isolation Forest`** · **`☁️ AWS Lambda`** · **`📱 Flutter`**

</p>

### ✨ Highlights at a Glance

| | Feature | What Makes It Special |
|---|---------|----------------------|
| 🔐 | **Device-Bind Passwordless Auth** | HMAC-sealed challenges + AWS Lambda 6-check verification + DynamoDB replay protection. Zero passwords. |
| 💸 | **Atomic Ledgered Wallets** | Every ringgit tracked in double-entry. Pool/user balances wrapped in a single DB transaction — they literally cannot drift. |
| 🗳️ | **Democratic Spend Voting** | 4 strategies (Majority, Unanimous, Threshold, Admin-Only) with early rejection and emergency override. |
| 🤖 | **Dual AI Agents (27 tools)** | Pool Agent (per-pool financial brain) + Main Agent (MCP-style personal assistant). Claude → Ollama → rule fallback. |
| 🧠 | **On-Device ML Pipeline** | DistilBERT tx classifier + Isolation Forest anomaly detector + BOCPD changepoint — all ONNX, <10ms inference. |
| 📡 | **Real-Time WebSocket Sync** | Per-pool event fan-out with Redis pub/sub option for horizontal scaling. |
| 💳 | **TNG-Gated QR Payments** | Scan → HMAC sign → Lambda verify → atomic debit. IP geolocation + CloudWatch alarms on suspicious activity. |
| 🔗 | **Steganographic QR Invites** | Pool invitation codes embedded in QR images via steganography. |
| 🛡️ | **50+ REST Endpoints** | Full CRUD for pools, members, contributions, spend requests, votes, transactions, agents, payments, ZK proofs. |

---

## Table of Contents

- [💡 What Is This?](#-what-is-this)
- [🔄 How It Works 
- [🏗️ Architecture Overview](#️-architecture-overview)
- [📂 Repository Structure](#-repository-structure)
- [⚙️ Tech Stack](#️-tech-stack)
- [🐍 Backend Deep Dive](#-backend-deep-dive)
- [⚛️ Frontend Deep Dive](#️-frontend-deep-dive)
- [🤖 AI Agent System](#-ai-agent-system)
- [🧠 Machine Learning Pipeline](#-machine-learning-pipeline)
- [🔐 Device-Bind Passwordless Login](#-device-bind-passwordless-login)
- [💳 Secure Payment Approval](#-secure-payment-approval)
- [🗳️ Voting Engine](#️-voting-engine)
- [⚡ Real-Time Events (WebSocket)](#-real-time-events-websocket)
- [📡 Full API Surface](#-full-api-surface)
- [🗄️ Database Schema](#️-database-schema)
- [☁️ AWS Infrastructure](#️-aws-infrastructure)
- [🌏 Alibaba Cloud Architecture](#-alibaba-cloud-architecture)
- [🚀 Getting Started](#-getting-started)
- [👤 Demo Accounts](#-demo-accounts)
- [📦 Deployment](#-deployment)
- [🚧 What's Not In This Slice](#-whats-not-in-this-slice)
- [📝 Notes for Contributors](#-notes-for-contributors)
- [👥 Contributors](#-contributors)

---

## 💡 What Is This?

KongsiGo (from Malay "kongsi" — to share) is a group wallet platform that sits on top of the TNG eWallet ecosystem. Think of it like Splitwise, but actually connected to a real wallet where money moves.

You create a pool (a trip fund, a family pot, a group bill tracker), invite your people, everyone chips in, and when someone needs to spend from it, the group votes. If it passes, the money moves. If it doesn't, nothing happens. No arguments, no awkward WhatsApp messages.

The whole thing was built in about 13 hours for a hackathon — ported from a Node/TypeScript backend to Python/FastAPI mid-sprint — and it works end-to-end: login, create pool, contribute, spend request, vote, execute, real-time updates, AI advisor, QR payments, the lot.

---

## 🔄 How It Works 

1. 📱 **Sign up** with your Malaysian phone number and a 6-digit PIN.
2. 🏊 **Create a pool** — pick "Trip" or "Family", name it, set a target amount, choose your voting rules (majority, unanimous, admin-only, etc.).
3. 🤝 **Invite friends** — share an invite code or scan a steganographic QR code.
4. 💰 **Contribute** — move money from your TNG wallet into the pool. Every ringgit is tracked as a ledger entry.
5. 🛒 **Spend** — someone creates a spend request ("RM 200 for hotel deposit"). The group sees it in real-time.
6. 🗳️ **Vote** — members approve or reject. The engine resolves the vote atomically based on the pool's rules.
7. ✅ **Execute** — once approved, pool balance goes down, requester's balance goes up. Two transaction records, one database transaction. Balances never drift.
8. 🤖 **AI watches over you** — the agent tracks spending patterns, flags anomalies, warns about budget overruns, and can even detect scam messages.

---

## 🏗️ Architecture Overview

### System Architecture

```mermaid
graph TB
    subgraph Frontend["⚛️ Frontend — React 18 + Vite + Tailwind"]
        LP[LoginPage<br/>PIN / Device-Bind]
        HP[HomePage<br/>Pools + Wallet]
        PP[PoolPage<br/>Contributions + Voting]
        SP[ScanPage<br/>QR Payments]
        SC[ScamCheck<br/>AI Fraud Analysis]
        MAC[MainAgentChat<br/>27 MCP Tools]
        AAD[AiAdvisorDialog<br/>Per-Pool AI]
    end

    subgraph Backend["🐍 Backend — FastAPI + Uvicorn"]
        Routes["routes/<br/>auth · pools · members · invites<br/>contributions · spend · transactions<br/>agent · payment_approval · zk"]
        Services["services/<br/>Business Logic"]
        Agent["agent/<br/>Pool Agent — 3-tier LLM"]
        MainAgent["main_agent/<br/>MCP Tool Registry (27 tools)"]
        WS["WebSocket Fan-out<br/>(in-process or Redis)"]
        ML["ML Inference<br/>ONNX Runtime"]
    end

    subgraph Data["🗄️ Data Layer"]
        PG[(PostgreSQL<br/>Supabase)]
        Redis[(Redis<br/>optional pub/sub)]
    end

    subgraph AWS["☁️ AWS"]
        EC2[EC2 — FastAPI Host]
        Lambda[Lambda — Approve Gate<br/>Sig Verify + Replay Protection]
        APIGW[API Gateway — HTTPS]
        DDB[(DynamoDB<br/>Nonce Replay Table)]
        CW[CloudWatch Metrics]
        SNS[SNS Alerts]
    end

    subgraph External["📱 External"]
        TNG[TNG Mock App<br/>Flutter — HMAC Approvals]
        LLM["Claude API / Ollama<br/>LLM Inference"]
    end

    Frontend -->|REST + WebSocket| Backend
    Backend --> PG
    Backend -.-> Redis
    Backend --> EC2
    Backend --> LLM
    ML --> Agent
    TNG -->|HMAC Approval| Lambda
    Lambda --> DDB
    Lambda --> CW
    CW --> SNS
    Lambda -->|Forwarded Approval| Backend
    APIGW --> Lambda

    style Frontend fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style Backend fill:#1e293b,stroke:#22c55e,color:#e2e8f0
    style Data fill:#1e293b,stroke:#a855f7,color:#e2e8f0
    style AWS fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
    style External fill:#1e293b,stroke:#ef4444,color:#e2e8f0
```

### User Journey Flow

```mermaid
flowchart LR
    A[📱 Sign Up<br/>Phone + PIN] --> B[🏊 Create Pool<br/>Trip / Family]
    B --> C[🤝 Invite Friends<br/>Code or QR]
    C --> D[💰 Contribute<br/>Move Money In]
    D --> E[🛒 Spend Request<br/>Describe + Amount]
    E --> F[🗳️ Group Votes]
    F -->|Approved| G[✅ Execute<br/>Atomic Transfer]
    F -->|Rejected| H[❌ Rejected]
    G --> I[🤖 AI Monitors<br/>Anomalies + Insights]
    I --> D

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style C fill:#06b6d4,stroke:#0891b2,color:#fff
    style D fill:#22c55e,stroke:#16a34a,color:#fff
    style E fill:#f59e0b,stroke:#d97706,color:#fff
    style F fill:#ef4444,stroke:#dc2626,color:#fff
    style G fill:#22c55e,stroke:#16a34a,color:#fff
    style H fill:#6b7280,stroke:#4b5563,color:#fff
    style I fill:#a855f7,stroke:#7c3aed,color:#fff
```

<details>
<summary>📐 ASCII Architecture (click to expand)</summary>

```
┌──────────────────────────────── FRONTEND (React + Vite) ────────────────────────────┐
│                                                                                      │
│  LoginPage ────▶ PIN auth / Device-Bind passwordless (TNG approval)                  │
│  HomePage  ────▶ Pool list, wallet balance, Main Agent sparkle chat                  │
│  PoolPage  ────▶ Contributions, spend requests, votes, analytics                     │
│  ScanPage  ────▶ QR code pool payments (real camera + jsQR)                          │
│  ScamCheck ────▶ Paste suspicious messages → AI analysis                             │
│                                                                                      │
│  MainAgentChat ──▶ /agent/message (MCP-style tools, 27 wired actions)                │
│  AiAdvisorDialog ──▶ /pools/{id}/agent/ask (per-pool AI with ML signals)             │
│  PoolScanPayDialog ──▶ /payment-approval/* (TNG-gated secure payments)               │
│                                                                                      │
└──────────────────────────────┬────────────────┬──────────────────────────────────────┘
                               │  REST + WS     │
                               ▼                ▼
┌──────────────────────────── BACKEND (FastAPI + Uvicorn) ────────────────────────────┐
│                                                                                      │
│  routes/          ── auth, pools, members, invites, contributions, spend,            │
│                      transactions, agent, main_agent, payment_approval, zk            │
│  services/        ── business logic (auth, pool, contribution, spend, device-bind,   │
│                      payment approval, ZK proofs)                                     │
│  agent/           ── Pool Agent: 3-tier LLM router + ML signals + memory             │
│  main_agent/      ── Main Agent: MCP-style tool registry (27 tools)                  │
│  schemas/         ── Pydantic v2 request validators                                  │
│  models.py        ── 11+ SQLAlchemy models (mirrors old Prisma schema)               │
│                                                                                      │
│  WebSocket fan-out (in-process or Redis pub/sub)                                     │
│  Background tasks: expire stale spend requests every 60s                             │
│                                                                                      │
└──────────────────────────────┬────────────────┬──────────────────────────────────────┘
                               │                │
                               ▼                ▼
┌───────── PostgreSQL (Supabase) ─────────┐  ┌──────── AWS ────────────────────────┐
│                                          │  │                                     │
│  Users, Pools, PoolMembers,              │  │  EC2 — FastAPI backend              │
│  Contributions, SpendRequests,           │  │  Lambda — approve-gate (sig verify, │
│  Transactions, Votes, Notifications,     │  │           replay protection)        │
│  Invites, DeviceBindChallenges,          │  │  API Gateway — HTTPS termination    │
│  PaymentApprovalChallenges,              │  │  DynamoDB — nonce replay table      │
│  AgentConversation, PoolAgentMemory,     │  │  CloudWatch — security metrics      │
│  UserAgentMemory, AgentMessage           │  │  SNS — alert emails                 │
│                                          │  │                                     │
└──────────────────────────────────────────┘  └─────────────────────────────────────┘

┌──────── TNG Mock App (Flutter) ─────────┐  ┌──────── ML Training (Python) ───────┐
│                                          │  │                                     │
│  Polls pending challenges                │  │  DistilBERT → tx_classifier.onnx    │
│  Shows full binding details              │  │  Isolation Forest → anomaly.onnx    │
│  HMAC-signs approvals                    │  │  BOCPD changepoint detection        │
│  Sends to Lambda (not backend directly)  │  │  Zero Python at runtime (ONNX)     │
│                                          │  │                                     │
└──────────────────────────────────────────┘  └─────────────────────────────────────┘
```

</details>

---

## 📂 Repository Structure

```
.
├── backend/                  Python FastAPI backend (the one that actually runs)
│   ├── app/
│   │   ├── main.py           FastAPI app + lifespan + CORS + error handlers + SPA fallback
│   │   ├── config.py         Env loader (.env at repo root)
│   │   ├── db.py             Async SQLAlchemy engine; auto-disables prepared stmts on Supabase
│   │   ├── models.py         11+ SQLAlchemy models (mirrors old Prisma schema 1:1)
│   │   ├── enums.py          12 enums (PoolType, MemberRole, SpendStatus, …)
│   │   ├── serialize.py      Prisma-shape JSON (Decimal→"1.23", DateTime→ISO Z)
│   │   ├── jwt_utils.py      python-jose access/refresh tokens
│   │   ├── security.py       bcrypt cost-10 (interoperable with old Node hashes)
│   │   ├── auth_dep.py       FastAPI dependency — pulls userId from Bearer token
│   │   ├── pubsub.py         In-process EventBus or Redis pub/sub
│   │   ├── publisher.py      Fire-and-forget publish helpers
│   │   ├── ws.py             WebSocket; per-pool subscribe with membership check
│   │   ├── rate_limit.py     In-memory window limiter on auth endpoints
│   │   ├── errors.py         AppError hierarchy + Express-shape error envelope
│   │   ├── cuid.py           25-char Prisma-compatible CUID generator
│   │   ├── seed.py           Demo data — 4 users, 2 pools, contributions, votes
│   │   ├── bootstrap.py      Drop-and-recreate public schema (one-time)
│   │   ├── routes/           auth, users, pools, members, invites, contributions,
│   │   │                     spend, transactions, agent, main_agent, payment_approval, zk
│   │   ├── schemas/          Pydantic v2 input validators (Zod-equivalent)
│   │   ├── services/         Business logic — auth, pool, contribution, spend
│   │   │                     (incl. resolveVotingStatus), device-bind, payment approval, ZK
│   │   ├── agent/            Pool Agent — 3-tier LLM router + ML signals + memory
│   │   │   ├── router.py     Claude → Ollama → rule-based fallback
│   │   │   ├── claude_client.py
│   │   │   ├── ollama_client.py
│   │   │   ├── prompts.py    Trip + Home behaviour specifications
│   │   │   ├── tools.py      gather_ml_signals + ask + brief + forecast
│   │   │   ├── memory.py     PoolAgentMemory read/write
│   │   │   ├── bocpd.py      Bayesian Online Changepoint Detection (NumPy)
│   │   │   ├── bocpd_service.py   Per-pool detector cache
│   │   │   ├── ml/           DistilBERT ONNX classifier + Isolation Forest anomaly
│   │   │   └── external/     Weather (Open-Meteo) + Places (Google)
│   │   └── main_agent/       Main Agent — MCP-style tools
│   │       ├── prompt.py     System prompt + tool catalogue
│   │       ├── tool_registry.py   27 tools + confirm_action
│   │       └── conversation.py    handle_message
│   ├── scripts/              Utility scripts (seed generation, etc.)
│   ├── Dockerfile
│   ├── apprunner.yaml
│   └── requirements.txt
│
├── web/                      React 18 + Vite + Tailwind + shadcn/Radix + MUI frontend
│   ├── src/
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   ├── client.ts     HTTP client (Axios/fetch wrapper)
│   │   │   ├── adapter.ts    Response adapters
│   │   │   ├── hooks.ts      TanStack Query hooks (all API operations)
│   │   │   ├── useRealtimeSync.ts   WebSocket hook
│   │   │   └── useUiData.ts  UI-specific data hooks
│   │   ├── app/
│   │   │   ├── App.tsx        Router + auth guard
│   │   │   ├── AppShell.tsx   Bottom nav layout
│   │   │   ├── LoginPage.tsx  Phone + PIN / Device-Bind passwordless
│   │   │   └── components/
│   │   │       ├── PoolPage.tsx              Pool detail + contributions + spend
│   │   │       ├── AnalyticsDashboard.tsx    Charts and analytics
│   │   │       ├── MainAgentChat.tsx         Full-screen AI chat (MCP tools)
│   │   │       ├── AiAdvisorDialog.tsx       Per-pool AI advisor overlay
│   │   │       ├── ScamCheckPage.tsx         Paste + analyse suspicious messages
│   │   │       ├── PoolScanPayDialog.tsx     QR scan → TNG-gated payment
│   │   │       ├── QrInviteDialog.tsx        Steganographic QR pool invites
│   │   │       ├── QrScannerDialog.tsx       Camera QR scanner (jsQR)
│   │   │       ├── ContributeToPoolDialog.tsx
│   │   │       ├── NewSpendingRequestDialog.tsx
│   │   │       ├── ManageMembersDialog.tsx
│   │   │       ├── CreatePoolDialog.tsx
│   │   │       ├── SplitCalculator.tsx       Fair-split helper
│   │   │       ├── TransactionHistory.tsx
│   │   │       ├── ProfilePage.tsx
│   │   │       └── ... (20+ more components)
│   │   ├── imports/           Figma-exported design components
│   │   ├── lib/               Utilities
│   │   └── styles/            Global CSS + Tailwind config
│   ├── package.json
│   └── vite.config.ts        Dev proxy /api + /ws → FastAPI :4000
│
├── ml/                        Offline ML training (Python, dev-only)
│   ├── transaction_classifier/   DistilBERT fine-tune → ONNX export
│   ├── anomaly_detector/         Isolation Forest train → ONNX export
│   ├── requirements.txt
│   ├── run_training.bat          One-shot training script
│   └── copy_artifacts.bat        Drop .onnx files into backend
│
├── mock_approval/             Flutter app — mock TNG eWallet for device-bind + payments
│   ├── lib/main.dart          Polls pending, computes HMAC, sends to Lambda
│   ├── pubspec.yaml
│   └── (android/, ios/, macos/, linux/, windows/, web/ platform dirs)
│
├── aws/                       AWS infra configs
│   ├── lambda_approve_gate/   Lambda function — sig verification + replay protection
│   └── apprunner-source.json  App Runner deploy config
│
├── exploit/                   Security testing
│   └── trigger_alarms.sh     Script to trigger CloudWatch security alarms
│
├── docs/                      Technical writeups
│   ├── AGENT_ARCHITECTURE.md  Full AI agent system documentation
│   ├── writeup-device-binding.md   Device-bind auth flow
│   ├── payment.md             Secure payment approval flow
│   └── qr-customize-flow.md  QR code invitation flow
│
├── prisma/                    OLD Prisma schema + seed (kept for TS backend reference)
├── src/                       OLD Node/TypeScript backend (kept for reference, not runtime)
├── .claude/                   Claude Code preview launchers
├── Dockerfile                 Legacy Node image
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## ⚙️ Tech Stack

### 🐍 Backend (Python)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **FastAPI** + Uvicorn (asyncio) | Async HTTP + WebSocket server |
| ORM | **SQLAlchemy 2.0** async + asyncpg | Database access with full async support |
| Validation | **Pydantic v2** | Request/response validation (replaces Zod from the TS era) |
| Auth | **python-jose** (JWT, HS256) | Access + refresh tokens |
| Password | **passlib/bcrypt** (cost 10) | PIN hashing, interoperable with old Node hashes |
| Real-time | **FastAPI WebSockets** | Per-pool event fan-out |
| Pub/Sub | **redis-py** (optional) | Horizontal scale for WebSocket fan-out |
| ML Inference | **onnxruntime** | CPU-only inference — no Python ML libs needed at runtime |
| AI (Cloud) | **Anthropic Claude** via API | High-quality LLM reasoning when budget allows |
| AI (Local) | **Ollama** (llama3.2 + deepseek-r1:8b) | Offline-capable LLM for agents |
| Changepoint | **NumPy** (BOCPD) | Bayesian Online Changepoint Detection for spend patterns |

### 🗄️ Database

| Component | Technology |
|-----------|-----------|
| Engine | **PostgreSQL 17** |
| Hosting | **Supabase** (transaction pooler) or local Postgres |
| Guarantees | All balance changes in a single SQLAlchemy transaction — pool/user balances never drift |

### ⚛️ Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **React 18** + Vite 6 | SPA with hot reload |
| Language | **TypeScript** | Type safety across the frontend |
| Routing | **React Router 7** | Client-side navigation |
| Data | **TanStack Query** | Server state, caching, mutation management |
| UI Components | **shadcn/Radix UI** + **MUI** | Accessible, composable component library |
| Styling | **Tailwind CSS 4** | Utility-first CSS |
| QR Scanning | **jsQR** | Client-side QR decode from camera feed |

### 📱 Mobile (Mock TNG App)

| Layer | Technology |
|-------|-----------|
| Framework | **Flutter** (Dart) |
| Platforms | Android, iOS, macOS, Linux, Windows, Web |
| Crypto | **HMAC-SHA256** for approval signatures |

### 🧠 ML Training (Offline)

| Model | Architecture | Purpose |
|-------|-------------|---------|
| tx_classifier.onnx | **DistilBERT** fine-tuned on ~130 Malaysian transactions | Categorise into 24 categories (food, transport, petrol, etc.) |
| anomaly_detector.onnx | **Isolation Forest** over 13 engineered features | Flag unusual spending patterns |
| BOCPD | **Bayesian Online Changepoint Detection** (NumPy) | Detect shifts in spending behaviour |

### ☁️ Infrastructure

| Service | What It Does |
|---------|-------------|
| **AWS EC2** (t2.micro) | Hosts the FastAPI backend |
| **AWS Lambda** (Python 3.12) | Approve-gate — signature verification + replay protection |
| **AWS API Gateway** (HTTP API) | HTTPS termination for Lambda |
| **AWS DynamoDB** | Nonce table for replay protection (auto-TTL) |
| **AWS CloudWatch** | Security metrics — BadSignature, ReplayDetected alarms |
| **AWS SNS** | Email alerts on security events |
| **Supabase** | Managed PostgreSQL with connection pooling |

---

## 🐍 Backend Deep Dive

### 🧱 Core Modules

The backend follows a clean layered architecture:

- **`routes/`** — Thin FastAPI route handlers. They validate input (via Pydantic schemas), call services, serialize output, and publish WebSocket events. That's it.
- **`services/`** — Where all the business logic lives. Auth workflows, pool management, contribution processing, voting resolution, device-bind challenge management, payment approval flows, ZK proofs.
- **`schemas/`** — Pydantic v2 models that validate incoming requests. These are the equivalent of the Zod schemas from the old TypeScript backend.
- **`models.py`** — SQLAlchemy ORM models. 11+ tables that mirror the original Prisma schema one-to-one. Includes `User`, `Pool`, `PoolMember`, `Contribution`, `SpendRequest`, `Vote`, `Transaction`, `Notification`, `Invite`, `DeviceBindChallenge`, `PaymentApprovalChallenge`, `AgentConversation`, `PoolAgentMemory`, `UserAgentMemory`, `AgentMessage`.

### 💸 How Money Moves

Every financial operation happens inside a single database transaction. When someone contributes RM 50 to a pool:

1. Their `User.mainBalance` goes down by 50
2. The `Pool.currentBalance` goes up by 50
3. A `Contribution` record is created
4. A `Transaction` record (direction=OUT for user, direction=IN for pool) is created

All four writes happen atomically. If any one fails, they all roll back. This is the same pattern for spend execution, payment approval consumption, and every other flow where money changes hands.

### 🔄 Serialization

The serializer (`serialize.py`) converts Python objects to a JSON shape that matches what Prisma used to emit — `Decimal` becomes a 2-decimal-place string (`"1234.50"`), `DateTime` becomes ISO-8601 with `Z` suffix and millisecond precision. This means the frontend doesn't need to know the backend was rewritten.

### 🛡️ Rate Limiting

Auth endpoints (`/login`, `/register`) have an in-memory sliding-window rate limiter. Nothing fancy, but enough to slow down brute-force PIN attempts during a demo.

### ⏱️ Background Tasks

A 60-second loop (`expire_stale_requests`) sweeps pending spend requests that have exceeded their voting window and marks them as `EXPIRED`.

---

## ⚛️ Frontend Deep Dive

### 🗺️ Page Structure

| Page | Route | What It Does |
|------|-------|-------------|
| **LoginPage** | `/login` | Phone number + 6-digit PIN, or device-bind passwordless flow |
| **HomePage** | `/` | Pool list, wallet balance card, Main Agent chat trigger |
| **PoolPage** | `/pools/:id` | Pool detail — balance, contributions, spend requests, votes, analytics, AI advisor |
| **ScanPage** | `/scan` | Camera-based QR code scanning for pool payments |
| **ScamCheckPage** | `/scam-check` | Paste suspicious text → AI analysis for fraud signals |
| **ProfilePage** | `/profile` | User settings and profile management |

### 🧩 Key Components

- **`MainAgentChat`** — Full-screen conversational AI. Users type natural language ("contribute RM 50 to my trip pool"), the agent figures out which tool to call, confirms via widgets (pool selector, PIN entry, confirmation card), then executes. 27 tools wired.
- **`AiAdvisorDialog`** — Floating AI character on each pool page. Auto-fires a daily brief, answers pool-specific questions, includes ML-powered spending insights.
- **`PoolScanPayDialog`** — Five-state payment flow: scanning → confirm → approving (polls TNG) → success/failed. Uses real camera via jsQR.
- **`QrInviteDialog`** — Generates steganographic QR codes for pool invitations.
- **`SplitCalculator`** — Fair expense splitting, powered by the AI's DeepSeek reasoning tier.
- **`AnalyticsDashboard`** — Charts, transaction breakdowns, budget tracking.

### 📊 Data Layer

The frontend uses **TanStack Query** exclusively for server state. All API calls go through `hooks.ts` which wraps every endpoint in a typed hook. WebSocket events (`useRealtimeSync.ts`) automatically invalidate relevant queries so the UI stays current without manual refetching.

The Vite dev server proxies `/api` and `/ws` to `localhost:4000`, so the frontend hot-reloads without touching the backend.

---

## 🤖 AI Agent System

There are two agents running in this app, and they're completely different beasts.

### 🧠 Pool Agent (one per pool)

Lives at `/api/v1/pools/{id}/agent/*`. This is the financial brain for each pool.

**What it does:**
- **Daily briefs** — 3-sentence summary of pool health, spending pace, and anything suspicious
- **Q&A** — "Are we on budget?" "What did we spend on food?" "Is this merchant legit?"
- **Spend evaluation** — Weighs a spend request against pool goals and budget
- **Budget forecast** — End-of-period projections
- **Smart splits** — Fairness-aware expense splitting (uses DeepSeek for structured reasoning)
- **Scam detection** — Analyses suspicious messages for fraud signals

**How it thinks:**

Every time the Pool Agent gets a question or generates a brief, it runs `gather_ml_signals()`:

1. Pull the 100 most-recent pool transactions
2. Run DistilBERT classifier → category labels (food, transport, petrol, etc.)
3. Run Isolation Forest → anomaly scores per transaction
4. Run BOCPD → detect if spending pattern has shifted
5. Render all of this as a compact text block that gets injected into the LLM prompt

The LLM then uses these signals to give grounded, data-backed advice — not just vibes.

**Personality:** Two personas — *Trip Agent* (TRIP pools) and *Home Agent* (FAMILY pools). Both follow a strict "stay silent unless it matters" rule. No chatty filler.

### 💬 Main Agent (one per user)

Lives at `/api/v1/agent/*`. This is the user's personal assistant for the entire app.

**What it does:**

It has 27 tools that let users do *anything* through chat:

| Category | Tools |
|----------|-------|
| Wallet | `get_balance`, `top_up` |
| Pools | `list_my_pools`, `get_pool_detail`, `create_pool`, `archive_pool`, `delete_pool` |
| Members | `list_pool_members`, `remove_member`, `leave_pool` |
| Contributions | `contribute` (PIN-gated), `list_contributions`, `get_contribution_summary` |
| Spend | `create_spend_request`, `list_spend_requests`, `vote`, `cancel_spend_request` |
| Transactions | `get_my_transactions`, `get_pool_transactions` |
| Profile | `get_profile`, `update_profile`, `get_notifications`, `mark_notification_read` |
| Safety | `check_scam`, `ask_pool_agent`, `get_budget_forecast`, `suggest_smart_split` |

PIN-gated tools (`contribute`, `archive_pool`) don't execute immediately — they return a `{requiresPin: true}` payload. The frontend renders a bottom-sheet PIN entry, then calls `/action-confirm` to actually execute.

**Frontend widgets the agent can trigger:**
- `pin_required` — PIN entry bottom sheet
- `confirmation` — Summary card with Confirm/Edit buttons
- `pool_selector` — Tap to pick a pool
- `vote` — Inline Approve/Reject buttons

### 🔀 3-Tier LLM Router

Both agents share the same routing logic:

```mermaid
flowchart LR
    Q["User Query"] --> A{"ANTHROPIC_API_KEY<br/>set?"}
    A -->|Yes| Claude["🧠 Claude API<br/>(highest quality)"]
    A -->|No| B{"Ollama reachable<br/>at :11434?"}
    B -->|Yes| C{"Task type?"}
    C -->|General chat / Q&A| Llama["🦙 llama3.2"]
    C -->|Structured / splits / forecast| DS["🔬 deepseek-r1:8b<br/>(CoT stripped)"]
    B -->|No| Rule["📏 Rule-based stub<br/>(deterministic fallback)"]

    Claude --> R["✅ Response"]
    Llama --> R
    DS --> R
    Rule --> R

    style Claude fill:#a855f7,stroke:#7c3aed,color:#fff
    style Llama fill:#3b82f6,stroke:#1e40af,color:#fff
    style DS fill:#06b6d4,stroke:#0891b2,color:#fff
    style Rule fill:#6b7280,stroke:#4b5563,color:#fff
```

```
1. Anthropic Claude        ← if ANTHROPIC_API_KEY is set
2. Ollama (local models)   ← if daemon is reachable at localhost:11434
3. Rule-based stub         ← deterministic fallback, never errors
```

For Ollama, there are two model tiers:
- **`llama3.2`** — General chat, briefs, Q&A, spend evaluation
- **`deepseek-r1:8b`** — Structured extraction, splits, forecasts (chain-of-thought is stripped before the user sees it)

### 🧠 Memory (Persistent, Postgres-Backed)

| Table | Scope | What It Stores |
|-------|-------|---------------|
| `PoolAgentMemory` | Per pool | Goals, location, spending plan, observations diary, weather/places cache |
| `UserAgentMemory` | Per user | Dietary prefs, activity prefs, budget tendency, voting style, language |
| `AgentMessage` | Per pool | Agent-emitted events (DAILY_BRIEF, BUDGET_WARNING, SPEND_EVALUATION) |
| `AgentConversation` | Per user | Main Agent chat history (JSON array of turns, capped at 20 for LLM context) |

---

## 🧠 Machine Learning Pipeline

The ML pipeline trains two models offline in Python and exports them to ONNX, so the production backend runs inference with `onnxruntime` — zero Python ML frameworks at runtime.

```mermaid
flowchart LR
    subgraph Training["🏋️ Offline Training (Python)"]
        TD["Transaction Data<br/>~130 MY transactions"] --> DB["DistilBERT<br/>Fine-tune"]
        SD["Synthetic Data<br/>~1,250 transactions"] --> IF["Isolation Forest<br/>13 features"]
        DB --> ONNX1["tx_classifier.onnx"]
        IF --> ONNX2["anomaly_detector.onnx"]
    end

    subgraph Runtime["⚡ Production Inference (ONNX Runtime)"]
        TX["New Transaction"] --> CLS["DistilBERT Classifier<br/><10ms CPU"]
        TX --> ANO["Isolation Forest<br/><5ms CPU"]
        TX --> BCP["BOCPD<br/>NumPy changepoint"]
        CLS --> SIG["📊 ML Signals"]
        ANO --> SIG
        BCP --> SIG
        SIG --> LLM["🤖 Pool Agent LLM<br/>Grounded advice"]
    end

    ONNX1 -.->|copy_artifacts| CLS
    ONNX2 -.->|copy_artifacts| ANO

    style Training fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
    style Runtime fill:#1e293b,stroke:#22c55e,color:#e2e8f0
```

### 🏷️ Transaction Classifier (DistilBERT)

- Fine-tuned on ~130 Malaysian transaction descriptions
- Classifies into 24 categories: `food_dining`, `transport_petrol`, `shopping_personal`, `medical`, `entertainment`, etc.
- Inference: <10ms per transaction on CPU
- Training data in `ml/transaction_classifier/data/transactions.csv`

### 🚨 Anomaly Detector (Isolation Forest)

- Trained on ~1,250 synthetic transactions (8% labelled anomalous)
- Scores each transaction on a 13-feature vector
- Inference: <5ms per transaction on CPU
- Features include amount, time-of-day, category entropy, rolling averages

### 📈 BOCPD (Bayesian Online Changepoint Detection)

- Pure NumPy implementation of Adams & MacKay 2007
- Normal-inverse-gamma prior, constant hazard rate (30)
- Per-pool detector cache — only replays transactions newer than the last seen
- Alert threshold: 0.5 on `log1p(amount)` transformed series

### 🏋️ Training

```bash
cd ml
run_training.bat       # Creates venv, installs deps, trains both models, exports ONNX
copy_artifacts.bat     # Drops .onnx + tokenizer into backend/app/agent/ml/models/
```

CPU: ~30-60 min. GPU (CUDA 12.1): ~5-10 min.

---

## 🔐 Device-Bind Passwordless Login

No password. No OTP. No PIN. Just your phone.

### 🔄 The Flow

```mermaid
sequenceDiagram
    actor User
    participant Web as 🌐 Web App
    participant API as 🐍 FastAPI Backend
    participant DB as 🗄️ PostgreSQL
    participant TNG as 📱 TNG Mock App (Flutter)
    participant Lambda as ☁️ AWS Lambda
    participant DDB as 📦 DynamoDB

    User->>Web: Select phone, tap "Sign in with TNG"
    Web->>API: POST /device-bind/initiate
    API->>DB: Create DeviceBindChallenge<br/>(nonce + HMAC seal + 120s TTL)
    API-->>Web: challengeId + requestId

    loop Poll every 2s
        Web->>API: GET /device-bind/status/{requestId}
        API-->>Web: PENDING
    end

    TNG->>API: GET /device-bind/pending
    API-->>TNG: Challenge details<br/>(phone, device, app, countdown)
    User->>TNG: 👆 Tap Approve
    TNG->>TNG: HMAC-SHA256(key, canonical + "|approved")
    TNG->>Lambda: POST /approve (signature)
    
    Lambda->>Lambda: 6-Check Verification
    Note over Lambda: 1. Fetch challenge<br/>2. Exists?<br/>3. Expired?<br/>4. Match deviceId<br/>5. Verify HMAC (constant-time)<br/>6. DynamoDB conditional put
    Lambda->>DDB: ConditionalPut (replay protection)
    Lambda->>API: Forward approval
    API->>DB: Challenge → APPROVED

    Web->>API: GET /device-bind/status/{requestId}
    API-->>Web: APPROVED
    Web->>API: POST /device-bind/consume
    API->>API: Re-verify HMAC + atomic consumedAt
    API-->>Web: 🎉 JWT Access + Refresh tokens
```

1. **Web app** — User selects phone number, taps "Sign in with TNG"
2. **Backend** — Creates a `DeviceBindChallenge` with a cryptographic nonce, HMAC-seals the binding tuple, sets 120-second TTL
3. **TNG Mock App (Flutter)** — Polls for pending challenges, shows the user exactly what they're approving (phone, device, app, request ID, countdown)
4. **User taps Approve** — Flutter app computes `HMAC-SHA256(TNG_APPROVER_KEY, canonical + "|approved")` and POSTs to Lambda (not the backend)
5. **Lambda runs 6 checks** — fetch challenge, verify it exists, check expiry, match deviceId, verify HMAC signature (constant-time), DynamoDB conditional put (replay protection)
6. **Lambda forwards to backend** — challenge flips to APPROVED
7. **Web app detects approval** (polling) — calls consume, which re-verifies the HMAC, atomically marks `consumedAt`, and issues JWT tokens

### 🛡️ Security Properties

| Attack | Mitigation |
|--------|-----------|
| Credential leak | No credentials exist — approval is device-bound |
| Phishing | Nothing to capture — approval shows exact binding on TNG app |
| MITM replay | DynamoDB nonce table rejects duplicate requestIds |
| Forged approval | HMAC-SHA256 over full canonical binding; constant-time comparison |
| Challenge tampering | challengeHash seals the tuple at creation; mismatch = reject |
| Expired challenge | 120s TTL enforced at both Lambda AND backend independently |
| Wrong device | deviceId is part of the signed canonical, checked at Lambda + backend |

### 🔑 Canonical Binding Format

```
v1|{requestId}|{phone}|{deviceId}|{appId}|{nonce}|{expiresAt ISO}
```

Two independent HMAC keys protect different trust boundaries:
- **`DEVICE_BIND_SECRET`** (backend only) — seals the binding tuple
- **`TNG_APPROVER_KEY`** (backend + Lambda) — proves the approval came from the TNG app

---

## 💳 Secure Payment Approval

Pool payments follow the same TNG-approval pattern but with an extra financial dimension.

### 🔄 The Flow

```mermaid
sequenceDiagram
    actor User
    participant Web as 🌐 Web App
    participant Cam as 📷 Camera (jsQR)
    participant API as 🐍 FastAPI Backend
    participant TNG as 📱 TNG Mock App
    participant Lambda as ☁️ AWS Lambda
    participant DB as 🗄️ PostgreSQL

    User->>Cam: Scan merchant QR
    Cam-->>Web: Decoded QR payload
    
    rect rgb(30, 41, 59)
        Note over Web: State: scanning → confirm
        Web->>Web: Show merchant card + amount
        User->>Web: Tap "Secure Pay"
    end

    Web->>API: POST /payment-approval/initiate
    API->>DB: Create PaymentApprovalChallenge<br/>(pool + amount + merchant + HMAC)
    API-->>Web: challengeId

    rect rgb(30, 41, 59)
        Note over Web: State: approving (polls every 1.5s)
    end

    TNG->>API: GET /payment-approval/pending
    API-->>TNG: Payment details card
    User->>TNG: 👆 Tap Approve
    TNG->>Lambda: HMAC-signed approval
    Lambda->>Lambda: 6 checks + IP geolocation
    Lambda->>API: Forward approval

    Web->>API: POST /payment-approval/status
    API->>API: consume_if_approved()
    Note over API: Re-verify challengeHash + approverSig<br/>Atomic claim: WHERE consumedAt IS NULL<br/>Re-check pool balance<br/>Debit pool → Credit user
    API->>DB: Dual Transaction records
    API-->>Web: ✅ Success

    rect rgb(30, 41, 59)
        Note over Web: State: success (2.5s auto-close)
    end
```

1. User scans a merchant QR code on the web app
2. Backend creates a `PaymentApprovalChallenge` — bound to pool, amount, merchant, device, and phone
3. TNG mock app shows a payment card with full details
4. User taps Approve → HMAC signature → Lambda verification (same 6 checks + IP geolocation tracking)
5. On first poll after APPROVED, backend runs `consume_if_approved`:
   - Re-verifies challengeHash AND approverSig
   - Atomic claim: `UPDATE ... WHERE consumedAt IS NULL`
   - Re-checks pool balance at execution time
   - Debits pool, credits user
   - Creates dual Transaction records (pool outflow + user inflow)

### 🖥️ Frontend Payment States

| State | UI | Transition |
|-------|-----|-----------|
| `scanning` | Animated QR scan overlay | 2.2s auto |
| `confirm` | Merchant card + "Secure Pay" button | User action |
| `approving` | Spinner + "Waiting for TNG Approval" | Polls every 1.5s |
| `success` | ✅ "Verified by TNG + AWS Lambda" | 2.5s auto-close |
| `failed` | ❌ Error + "Try Again" | User action |

### 🚨 CloudWatch Alarms

| Alarm | Metric | Threshold |
|-------|--------|-----------|
| `tng-bad-approver-signatures` | BadSignature | ≥ 5 in 5 min |
| `tng-replay-detected` | ReplayDetected | ≥ 1 in 5 min |

Alerts go to SNS → email.

---

## 🗳️ Voting Engine

The voting engine is the heart of the spend approval flow. `resolve_voting_status` in `backend/app/services/spend_service.py` is a pure function — given the pool config, eligible member count, and current votes, it returns `APPROVED`, `REJECTED`, or `PENDING`.

It runs inside the same DB transaction as the vote insert, so vote casting and resolution are atomic.

```mermaid
flowchart TD
    A["🛒 Spend Request Created"] --> B{Pool Voting Strategy?}
    
    B -->|MAJORITY| C["≥ 51% of<br/>(members − abstentions)"]
    B -->|UNANIMOUS| D["100% must approve"]
    B -->|THRESHOLD| E["≥ approvalThreshold<br/>approved"]
    B -->|ADMIN_ONLY| F["Owner's vote<br/>decides"]

    C --> G{Enough votes?}
    D --> G
    E --> G
    F --> G

    G -->|Yes — Passes| H["✅ APPROVED"]
    G -->|Yes — Fails| I["❌ REJECTED"]
    G -->|Not Yet| J{"Can threshold<br/>still be reached?"}

    J -->|No| I
    J -->|Yes| K["⏳ PENDING"]
    K -->|60s sweep| L{"Expired?"}
    L -->|Yes| M["⏰ EXPIRED"]
    L -->|No| K

    H --> N["💸 Execute: Atomic transfer<br/>Pool balance ↓ · User balance ↑"]

    subgraph Emergency["🚨 Emergency Override"]
        O["FAMILY pool +<br/>emergencyOverride=true"] --> P["Skip vote entirely<br/>→ Instant APPROVED"]
    end

    style H fill:#22c55e,stroke:#16a34a,color:#fff
    style I fill:#ef4444,stroke:#dc2626,color:#fff
    style K fill:#f59e0b,stroke:#d97706,color:#fff
    style M fill:#6b7280,stroke:#4b5563,color:#fff
    style N fill:#3b82f6,stroke:#1e40af,color:#fff
    style P fill:#22c55e,stroke:#16a34a,color:#fff
```

### 📋 Resolution Rules

| Strategy | Rule |
|----------|------|
| **MAJORITY** | ≥ 51% of (members − abstentions) approved |
| **UNANIMOUS** | 100% approved |
| **THRESHOLD** | ≥ `approvalThreshold` approved |
| **ADMIN_ONLY** | Owner's vote decides |

### ⚠️ Edge Cases

- **Early rejection** — If remaining unvoted members can no longer reach the threshold, the request is rejected immediately. No point waiting.
- **Emergency override** — FAMILY pools with `emergencyOverride=true` create spend requests as `APPROVED` immediately, skipping the vote entirely.
- **Expiry sweep** — A 60-second background task marks stale requests as `EXPIRED`.

---

## ⚡ Real-Time Events (WebSocket)

Connect to `ws://host/ws?token=<accessToken>`. The server auto-subscribes you to your user channel. To get pool events:

```json
{ "action": "subscribe", "poolId": "clx..." }
```

### 📨 Event Types

| Event | Channel | When |
|-------|---------|------|
| `ready` | direct | On connect |
| `subscribed` / `unsubscribed` | direct | After pool sub change |
| `balance_updated` | pool | Contribution or spend execution |
| `spend_request_created` | pool | New spend request |
| `vote_cast` | pool | Any vote, includes new resolution status |
| `spend_request_resolved` | user | Sent to requester when their request flips |
| `spend_request_cancelled` | pool | Requester cancelled |
| `member_added` / `updated` / `left` / `removed` / `joined` | pool | Membership changes |

Fan-out is in-process by default. Set `REDIS_URL` to switch to Redis pub/sub for horizontal scaling.

---

## 📡 Full API Surface

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/device-bind/initiate
GET    /api/v1/auth/device-bind/pending
POST   /api/v1/auth/device-bind/approve
POST   /api/v1/auth/device-bind/reject
GET    /api/v1/auth/device-bind/status/{requestId}

GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/me/balance
POST   /api/v1/users/me/topup                    # demo only
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

POST   /api/v1/pools/:id/agent/setup
POST   /api/v1/pools/:id/agent/ask
POST   /api/v1/pools/:id/agent/brief
GET    /api/v1/pools/:id/agent/forecast
POST   /api/v1/pools/:id/agent/suggest-split
GET    /api/v1/pools/:id/agent/messages
GET    /api/v1/pools/:id/agent/context
POST   /api/v1/pools/:id/agent/refresh-context

POST   /api/v1/agent/message
GET    /api/v1/agent/conversation
DELETE /api/v1/agent/conversation
POST   /api/v1/agent/action-confirm
POST   /api/v1/agent/check-scam

POST   /api/v1/payment-approval/initiate
GET    /api/v1/payment-approval/pending
POST   /api/v1/payment-approval/approve
POST   /api/v1/payment-approval/status/{requestId}
POST   /api/v1/payment-approval/reject

GET    /api/v1/health
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    User ||--o{ PoolMember : "joins"
    User ||--o{ Contribution : "makes"
    User ||--o{ SpendRequest : "creates"
    User ||--o{ Vote : "casts"
    User ||--o{ Transaction : "has"
    User ||--o{ Notification : "receives"
    User ||--o{ DeviceBindChallenge : "initiates"
    User ||--o{ AgentConversation : "chats"
    User ||--o{ UserAgentMemory : "preferences"

    Pool ||--o{ PoolMember : "has"
    Pool ||--o{ Contribution : "receives"
    Pool ||--o{ SpendRequest : "tracks"
    Pool ||--o{ Transaction : "records"
    Pool ||--o{ Invite : "generates"
    Pool ||--o{ PaymentApprovalChallenge : "secures"
    Pool ||--o{ PoolAgentMemory : "AI memory"
    Pool ||--o{ AgentMessage : "AI events"

    SpendRequest ||--o{ Vote : "voted on"

    User {
        string id PK
        string phone UK
        string name
        string hashedPin
        decimal mainBalance
        string deviceFingerprint
    }

    Pool {
        string id PK
        string name
        enum type "TRIP | FAMILY"
        decimal targetAmount
        decimal currentBalance
        enum votingStrategy "MAJORITY | UNANIMOUS | THRESHOLD | ADMIN_ONLY"
        boolean emergencyOverride
    }

    PoolMember {
        string userId FK
        string poolId FK
        enum role "OWNER | ADMIN | MEMBER"
    }

    Contribution {
        string id PK
        decimal amount
        datetime createdAt
    }

    SpendRequest {
        string id PK
        decimal amount
        string description
        enum status "PENDING | APPROVED | REJECTED | EXPIRED"
    }

    Vote {
        string id PK
        enum decision "APPROVE | REJECT"
    }

    Transaction {
        string id PK
        enum type "CONTRIBUTION | SPEND | TOPUP"
        enum direction "IN | OUT"
        decimal amount
    }
```

11+ SQLAlchemy models mirroring the original Prisma schema:

| Model | Purpose |
|-------|---------|
| `User` | Phone, name, hashed PIN, main balance, device fingerprint |
| `Pool` | Name, type (TRIP/FAMILY), target amount, current balance, voting strategy, emergency override |
| `PoolMember` | User ↔ Pool junction with role (OWNER/ADMIN/MEMBER) |
| `Contribution` | Ledger entry — who contributed how much, when |
| `SpendRequest` | Amount, description, status (PENDING/APPROVED/REJECTED/EXPIRED), requester |
| `Vote` | Member's vote on a spend request (APPROVE/REJECT) |
| `Transaction` | Double-entry: type (CONTRIBUTION/SPEND/TOPUP), direction (IN/OUT), amount |
| `Notification` | Push-style notifications with read tracking |
| `Invite` | Pool invite codes with expiry |
| `DeviceBindChallenge` | Passwordless login challenges with nonce, HMAC hash, TTL |
| `PaymentApprovalChallenge` | Payment challenges — pool, amount, merchant, nonce, HMAC, TTL |
| `PoolAgentMemory` | Per-pool AI memory — goals, location, spending plan, observations |
| `UserAgentMemory` | Per-user AI preferences — dietary, budget tendency, voting style |
| `AgentMessage` | Agent-emitted events log |
| `AgentConversation` | Main Agent chat history (JSON array of turns) |

---

## ☁️ AWS Infrastructure

```mermaid
graph TB
    subgraph AWS["☁️ AWS Cloud"]
        subgraph Compute
            EC2["🖥️ EC2 t2.micro<br/>FastAPI + Uvicorn"]
            Lambda["⚡ Lambda<br/>tng-approve-gate<br/>Python 3.12 / 256MB"]
        end
        subgraph Networking
            APIGW["🌐 API Gateway<br/>HTTP API — HTTPS"]
        end
        subgraph Storage
            DDB[("📦 DynamoDB<br/>tng-device-bind-nonces<br/>on-demand + 24h TTL")]
        end
        subgraph Monitoring
            CW["📊 CloudWatch<br/>TNG/DeviceBind namespace"]
            SNS["📧 SNS<br/>Security alert emails"]
        end
    end

    subgraph External
        TNG["📱 TNG App<br/>(Flutter)"]
        Browser["🌐 Browser<br/>(React SPA)"]
        Supabase[("🐘 Supabase<br/>PostgreSQL 17")]
    end

    Browser -->|REST + WS| EC2
    EC2 --> Supabase
    TNG -->|HMAC Approval| APIGW
    APIGW --> Lambda
    Lambda --> DDB
    Lambda -->|Metrics| CW
    Lambda -->|Forward| EC2
    CW -->|Alarm| SNS

    style AWS fill:#1a1a2e,stroke:#f59e0b,color:#e2e8f0
    style Compute fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style Networking fill:#1e293b,stroke:#22c55e,color:#e2e8f0
    style Storage fill:#1e293b,stroke:#a855f7,color:#e2e8f0
    style Monitoring fill:#1e293b,stroke:#ef4444,color:#e2e8f0
```

| Service | Resource | Purpose |
|---------|----------|---------|
| EC2 | t2.micro instance | FastAPI backend host |
| Lambda | `tng-approve-gate` (Python 3.12, 256MB) | Signature verification + replay protection for device-bind and payment flows |
| API Gateway | HTTP API | Public HTTPS endpoint for Lambda |
| DynamoDB | `tng-device-bind-nonces` (on-demand) | Replay protection nonce table with 24h TTL auto-cleanup |
| CloudWatch | `TNG/DeviceBind` namespace | Metrics: Approved, BadSignature, ReplayDetected |
| SNS | Security alerts topic | Email notifications on alarm triggers |
| IAM | `tng-approve-gate-role` | Lambda execution role (logs + DynamoDB + CloudWatch) |

**Why this split?** Lambda for the checker because it's stateless and scales to zero. DynamoDB for nonces because conditional puts are single-digit milliseconds with auto-TTL. EC2 for the backend because it needs persistent Postgres connections, WebSocket support, and OpenCV for QR steganography.

---

## 🌏 Alibaba Cloud Architecture

The frontend is deployed on Alibaba Cloud (Singapore region) as a static SPA, with API calls proxied back to the AWS-hosted FastAPI backend.

### 🌐 Domain & Access

| Item | Value |
|------|-------|
| **URL** | `https://kongsigo.8.219.142.196.nip.io/` |
| **IP** | `8.219.142.196` |
| **DNS** | nip.io wildcard (free, zero-config) |
| **SSL** | Let's Encrypt, auto-renew, expires 2026-07-24 |
| **Region** | `ap-southeast-1` (Singapore) |

### 📐 Architecture Diagram

```
                         ┌────────────────────────────────────────┐
                         │          ALIBABA CLOUD                 │
                         │        ap-southeast-1 (Singapore)      │
                         │                                        │
                         │  ┌──────────────────────────────────┐  │
                         │  │  nip.io Wildcard DNS             │  │
                         │  │  kongsigo.8.219.142.196.nip.io   │  │
                         │  │  → 8.219.142.196                 │  │
                         │  └───────────────┬──────────────────┘  │
                         │                  │                     │
  ┌──────────────┐       │  ┌───────────────▼──────────────────┐  │
  │ 📱 Browser   │──HTTPS──▶│  EIP: 8.219.142.196 (5 Mbps)    │  │
  │ (User)       │       │  │  PayByTraffic                    │  │
  └──────────────┘       │  └───────────────┬──────────────────┘  │
                         │                  │                     │
                         │  ┌───────────────▼──────────────────┐  │
                         │  │  ECS Instance                    │  │
                         │  │  i-t4n8yxqknl6nr9m2jipc          │  │
                         │  │  ecs.t6-c1m1.large               │  │
                         │  │  2 vCPU / 2 GB RAM               │  │
                         │  │  Ubuntu 22.04 LTS                │  │
                         │  │                                  │  │
                         │  │  ┌────────────────────────────┐  │  │
                         │  │  │  Nginx (Port 80 / 443)     │  │  │
                         │  │  │                            │  │  │
                         │  │  │  • SSL termination         │  │  │
                         │  │  │    (Let's Encrypt cert)    │  │  │
                         │  │  │  • HTTP → HTTPS redirect   │  │  │
                         │  │  │  • Reverse proxy → :3000   │  │  │
                         │  │  └─────────────┬──────────────┘  │  │
                         │  │               │                  │  │
                         │  │  ┌─────────────▼──────────────┐  │  │
                         │  │  │  Node.js Server (:3000)    │  │  │
                         │  │  │  server.cjs                │  │  │
                         │  │  │                            │  │  │
                         │  │  │  Static Files:             │  │  │
                         │  │  │  └─ web/dist/              │  │  │
                         │  │  │     ├─ index.html          │  │  │
                         │  │  │     ├─ assets/*.js         │  │  │
                         │  │  │     ├─ assets/*.css        │  │  │
                         │  │  │     └─ assets/*.png        │  │  │
                         │  │  │                            │  │  │
                         │  │  │  Proxy Rules:              │  │  │
                         │  │  │  /api/* ──────────────────────────────▶ AWS EC2
                         │  │  │     → 47.128.148.79:8000   │  │  │    (Backend)
                         │  │  │                            │  │  │
                         │  │  │  SPA Fallback:             │  │  │
                         │  │  │  /* → index.html           │  │  │
                         │  │  └────────────────────────────┘  │  │
                         │  │                                  │  │
                         │  └──────────────────────────────────┘  │
                         │                                        │
                         │  ┌──────────────────────────────────┐  │
                         │  │  VPC                             │  │
                         │  │  vpc-t4nt4fcj67lhsiyme97ci       │  │
                         │  │  CIDR: 172.16.0.0/16             │  │
                         │  │                                  │  │
                         │  │  VSwitch                         │  │
                         │  │  vsw-t4nl4cqzk9ocicdn1isj3      │  │
                         │  │  Zone: ap-southeast-1a           │  │
                         │  │  CIDR: 172.16.0.0/24             │  │
                         │  │                                  │  │
                         │  │  Security Group                  │  │
                         │  │  sg-t4ne69ubo68hlkqxbzff         │  │
                         │  │  Inbound: 22, 80, 443, 3000,    │  │
                         │  │           5173 (0.0.0.0/0)       │  │
                         │  └──────────────────────────────────┘  │
                         │                                        │
                         │  ┌──────────────────────────────────┐  │
                         │  │  FC (Function Compute) — Backup  │  │
                         │  │  Function: kongsigo-web           │  │
                         │  │  Runtime: Custom (Node.js)       │  │
                         │  │  Memory: 512 MB / CPU: 0.35      │  │
                         │  │  URL: kongsigo-web-xrnohqpdht    │  │
                         │  │  .ap-southeast-1.fcapp.run       │  │
                         │  └──────────────────────────────────┘  │
                         │                                        │
                         └────────────────────────────────────────┘
```

### 📦 Resource Inventory

| Resource | ID / Name | Spec | Status |
|----------|-----------|------|--------|
| **ECS** | `i-t4n8yxqknl6nr9m2jipc` | t6-c1m1.large (2vCPU / 2GB) | ✅ Running |
| **EIP** | `eip-t4nlfah53crdtjjlaqzr4` | 8.219.142.196, 5 Mbps | ✅ Bound |
| **VPC** | `vpc-t4nt4fcj67lhsiyme97ci` | 172.16.0.0/16 | ✅ Active |
| **VSwitch** | `vsw-t4nl4cqzk9ocicdn1isj3` | zone-a, 172.16.0.0/24 | ✅ Active |
| **Security Group** | `sg-t4ne69ubo68hlkqxbzff` | 22/80/443/3000/5173 | ✅ Active |
| **FC** | `kongsigo-web` | Custom runtime, 512MB | ✅ Backup |
| **SSL Cert** | Let's Encrypt | Auto-renew, exp 2026-07-24 | ✅ Valid |
| **Domain** | `kongsigo.8.219.142.196.nip.io` | nip.io wildcard DNS | ✅ Resolving |

### 🔧 ECS Software Stack

```
Ubuntu 22.04 LTS
├── Node.js 20.x (LTS)
├── npm 10.x
├── Nginx 1.18
│   ├── /etc/nginx/sites-available/kongsigo
│   └── /etc/letsencrypt/live/kongsigo.8.219.142.196.nip.io/
├── Certbot (Let's Encrypt client)
└── Application
    └── /root/tng_group_wallet/
        ├── web/dist/          ← Production build (React SPA)
        ├── web/server.cjs     ← Node.js static server + API proxy
        └── web/vite.config.ts ← Dev config (proxy → AWS EC2)
```

#### Running Services

| Service | Port | Manager | Auto-Start |
|---------|------|---------|------------|
| **Nginx** | 80, 443 | systemd | ✅ Yes |
| **Node.js server.cjs** | 3000 | nohup | ❌ Manual |

### 🌊 Request Flow

```
User Browser
    │
    │  HTTPS (port 443)
    ▼
┌─────────────────────┐
│  Nginx              │
│  SSL termination    │
│  Let's Encrypt cert │
└─────────┬───────────┘
          │ proxy_pass :3000
          ▼
┌─────────────────────┐       ┌──────────────────────────┐
│  Node.js server.cjs │       │  AWS EC2 Backend          │
│                     │       │  47.128.148.79:8000        │
│  /api/* ────────────────▶   │  FastAPI + Uvicorn         │
│                     │       │                            │
│  /* ─── dist/ files │       │  ├── /api/v1/auth/*        │
│  fallback: index.html       │  ├── /api/v1/pools/*       │
└─────────────────────┘       │  ├── /api/v1/payment/*     │
                              │  └── /api/v1/invites/*     │
                              └──────────────────────────┘
```

### 🔐 Security Configuration

#### Nginx SSL (Let's Encrypt)

```nginx
server {
    listen 443 ssl;
    server_name kongsigo.8.219.142.196.nip.io;

    ssl_certificate     /etc/letsencrypt/live/kongsigo.8.219.142.196.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kongsigo.8.219.142.196.nip.io/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}

server {
    listen 80;
    return 301 https://$host$request_uri;  # Force HTTPS
}
```

#### Security Group Rules

| Direction | Protocol | Port | Source | Purpose |
|-----------|----------|------|--------|--------|
| Inbound | TCP | 22 | 0.0.0.0/0 | SSH |
| Inbound | TCP | 80 | 0.0.0.0/0 | HTTP → HTTPS redirect |
| Inbound | TCP | 443 | 0.0.0.0/0 | HTTPS (production) |
| Inbound | TCP | 3000 | 0.0.0.0/0 | Node.js direct (dev) |
| Inbound | TCP | 5173 | 0.0.0.0/0 | Vite dev server (dev) |

### 🔄 Deployment Steps

#### Build & Deploy Frontend

```bash
# On local machine
cd web
npm run build

# Upload to ECS
scp -r dist/ root@8.219.142.196:/root/tng_group_wallet/web/

# Or SSH in and pull from git
ssh root@8.219.142.196
cd /root/tng_group_wallet
git pull
cd web && npm install && npm run build
```

#### Restart Services

```bash
# Restart Nginx (if config changed)
sudo systemctl restart nginx

# Restart Node.js server
ps aux | grep server.cjs
kill <PID>

cd /root/tng_group_wallet/web
nohup node server.cjs > /tmp/server.log 2>&1 &
```

### 🔗 FC (Function Compute) — Backup Deployment

The FC deployment serves as a **backup / alternative** endpoint.

| Property | Value |
|----------|-------|
| **Function** | `kongsigo-web` |
| **Runtime** | Custom (Node.js CommonJS) |
| **Memory** | 512 MB |
| **CPU** | 0.35 vCPU |
| **URL** | `https://kongsigo-web-xrnohqpdht.ap-southeast-1.fcapp.run/` |
| **Entry** | `server.cjs` (CommonJS required — `package.json` has `"type": "module"`) |

### ⚠️ Known Issues & Notes

| Issue | Detail | Resolution |
|-------|--------|------------|
| `crypto.randomUUID()` | Fails over HTTP (requires Secure Context) | ✅ Fixed by HTTPS |
| Node.js server.cjs | No systemd service, manual restart on reboot | Create systemd unit |
| ECS files in `/root/` | Nginx needs `user root;` or `chmod 755 /root` | ✅ Configured |
| FC body size | CLI `--body` too large for zip upload | Use Python SDK |
| OSS | Returns `UserDisable` (403) — not activated | Use FC or ECS instead |

### 💰 Cost Estimate (Hackathon)

| Resource | Billing | Est. Monthly |
|----------|---------|-------------|
| **ECS** (t6-c1m1.large) | Pay-As-You-Go | ~$15 USD |
| **EIP** (5 Mbps) | PayByTraffic | ~$3-5 USD |
| **FC** (backup, idle) | Pay-Per-Invocation | ~$0 (minimal) |
| **SSL** (Let's Encrypt) | Free | $0 |
| **DNS** (nip.io) | Free | $0 |
| **Total** | | **~$18-20 USD/mo** |

---

## 🚀 Getting Started

### 1️⃣ Configure Environment

```bash
cp .env.example .env
# Edit .env — most importantly DATABASE_URL
```

**For Supabase:**
```
DATABASE_URL=postgresql://postgres.<project-ref>:<URL-encoded-password>@aws-1-<region>.pooler.supabase.com:6543/postgres
```

**For local Postgres:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tng_pool
```

### 2️⃣ Install Python Dependencies

```bash
cd backend
python -m pip install -r requirements.txt
```

### 3️⃣ Create Schema + Seed Demo Data

```bash
python -m app.bootstrap     # DROP+CREATE schema public, then create_all()
python -m app.seed           # 4 users, 2 pools, contributions, votes
```

### 4️⃣ Run the API

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
```

- API: `http://localhost:4000/api/v1`
- WebSocket: `ws://localhost:4000/ws?token=<accessToken>`
- OpenAPI docs: `http://localhost:4000/docs`

### 5️⃣ Run the Frontend

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:5173`. Vite proxies `/api` and `/ws` to the FastAPI backend on `:4000`.

### 6️⃣ Smoke Test

```bash
# Login as Ahmad
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"phone":"+60112345001","pin":"123456"}' | jq -r .accessToken)

# List pools
curl -s http://localhost:4000/api/v1/pools \
  -H "authorization: Bearer $TOKEN" | jq
```

---

## 👤 Demo Accounts

All accounts use PIN `123456`:

| Phone | Name | Role |
|-------|------|------|
| +60112345001 | Ahmad | Owner of both pools |
| +60112345002 | Siti | Family pool admin |
| +60112345003 | Raj | Trip pool member |
| +60112345004 | Mei | Trip pool member |

---

## 📦 Deployment

The backend is a stock FastAPI + Uvicorn app. It deploys identically to Render, Fly.io, Railway, or AWS App Runner / ECS Fargate.

### 🔧 Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Supabase transaction pooler URI or local Postgres |
| `JWT_ACCESS_SECRET` | Yes | ≥ 32-byte random string |
| `JWT_REFRESH_SECRET` | Yes | ≥ 32-byte random string |
| `CORS_ORIGINS` | Yes | Comma-separated frontend origins |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `4000` or whatever the platform sets |
| `REDIS_URL` | Optional | Only if running > 1 replica for WebSocket fan-out |
| `ANTHROPIC_API_KEY` | Optional | Enables Claude as primary AI tier |
| `DEVICE_BIND_SECRET` | For device-bind | HMAC key for challenge sealing |
| `TNG_APPROVER_KEY` | For device-bind | HMAC key for approval verification |

### ▶️ Start Command

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 🩺 Health Check

```
GET /api/v1/health → {"status":"ok",...}
```

The Supabase pooler runs PgBouncer in transaction mode; `backend/app/db.py` auto-detects `*.pooler.supabase.com` / port `6543` and disables asyncpg prepared statements + JIT. No manual flags needed.

---

## 🚧 What's Not In This Slice

These features are spec'd but not implemented in this hackathon cut:

- Family-specific features beyond the engine: income streams, budget plans, scam shield, grant matching
- Settlement calculation (trip-pool dissolution payouts)
- Admin dashboard endpoints
- KYC document upload to S3
- Mobile (Flutter) app beyond the mock TNG approval
- Transfer widget, receipt OCR, loan agent
- Server-side PIN verification (currently client-side trusted)

All of these can be layered on top without touching the core engine.

---

