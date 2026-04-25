# KongsiGo — System Architecture

## 🌐 Domain & Access

```
https://kongsigo.8.219.142.196.nip.io/
├── Let's Encrypt SSL (expires 2026-07-24)
├── nip.io wildcard DNS → 8.219.142.196
└── Auto HTTP → HTTPS redirect
```

---

## 📐 Full Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              USER DEVICES                                          │
│                                                                                     │
│   📱 Mobile Browser              💻 Desktop Browser           📱 Mock TNG App       │
│   (KongsiGo PWA)                (KongsiGo Web)              (Flutter - Approver)   │
│                                                                                     │
└──────────┬───────────────────────────┬──────────────────────────┬───────────────────┘
           │                           │                          │
           │ HTTPS                     │ HTTPS                    │ HTTPS
           ▼                           ▼                          ▼
┌──────────────────────────────────────────────┐    ┌──────────────────────────────┐
│         ALIBABA CLOUD (ap-southeast-1)       │    │     AWS CLOUD (ap-se-1)      │
│         Singapore Region                     │    │     Singapore Region         │
│                                              │    │                              │
│  ┌────────────────────────────────────────┐  │    │  ┌────────────────────────┐  │
│  │  nip.io DNS                           │  │    │  │  AWS Lambda            │  │
│  │  kongsigo.8.219.142.196.nip.io        │  │    │  │  tng-approve-gate      │  │
│  │  → 8.219.142.196                      │  │    │  │                        │  │
│  └──────────────┬─────────────────────────┘  │    │  │  • HMAC-SHA256 verify  │  │
│                 │                            │    │  │  • Replay protection   │  │
│  ┌──────────────▼─────────────────────────┐  │    │  │  • Device-bind auth    │  │
│  │  ECS Instance (i-t4n8yxqknl6nr9m2jipc) │  │    │  │  • Payment approval   │  │
│  │  ecs.t6-c1m1.large (2vCPU / 2GB)      │  │    │  │  • CloudWatch metrics  │  │
│  │  Ubuntu 22.04                          │  │    │  │                        │  │
│  │                                        │  │    │  │  Python 3.12           │  │
│  │  ┌──────────────────────────────────┐  │  │    │  │  Function URL:         │  │
│  │  │  Nginx (Port 80/443)             │  │  │    │  │  arh5qev6ved5rt...     │  │
│  │  │  • SSL termination (Let's Encr.) │  │  │    │  │  .lambda-url.on.aws    │  │
│  │  │  • Reverse proxy → :3000        │  │  │    │  └───────────┬────────────┘  │
│  │  │  • HTTP → HTTPS redirect        │  │  │    │              │               │
│  │  └──────────────┬───────────────────┘  │  │    │              │               │
│  │                 │                      │  │    │  ┌───────────▼────────────┐  │
│  │  ┌──────────────▼───────────────────┐  │  │    │  │  DynamoDB              │  │
│  │  │  Node.js Static Server (:3000)   │  │  │    │  │  tng-device-bind-      │  │
│  │  │                                  │  │  │    │  │  nonces                │  │
│  │  │  • Serve dist/ (React SPA)      │  │  │    │  │                        │  │
│  │  │  • /api/* proxy → AWS EC2       │  │  │    │  │  • PK: requestId       │  │
│  │  │  • SPA fallback → index.html    │  │  │    │  │  • TTL: 24h auto-exp   │  │
│  │  │  • CORS headers                 │  │  │    │  │  • Replay detection    │  │
│  │  └──────────────────────────────────┘  │  │    │  └────────────────────────┘  │
│  │                                        │  │    │                              │
│  └────────────────────────────────────────┘  │    │  ┌────────────────────────┐  │
│                                              │    │  │  EC2 Instance           │  │
│  ┌────────────────────────────────────────┐  │    │  │  47.128.148.79:8000     │  │
│  │  VPC: vpc-t4nt4fcj67lhsiyme97ci       │  │    │  │  Amazon Linux 2023      │  │
│  │  CIDR: 172.16.0.0/16                  │  │    │  │                        │  │
│  │                                        │  │    │  │  Python 3.11 + Uvicorn │  │
│  │  VSwitch: vsw-t4nl4cqzk9ocicdn1isj3   │  │    │  │  FastAPI Backend       │  │
│  │  Zone: ap-southeast-1a                 │  │    │  │                        │  │
│  │  CIDR: 172.16.0.0/24                  │  │    │  │  • Auth (device-bind)   │  │
│  │                                        │  │    │  │  • Pool CRUD           │  │
│  │  SecurityGroup: sg-t4ne69ubo68hlkqxbzff│  │    │  │  • Spend requests      │  │
│  │  Ports: 22, 80, 443, 3000, 5173       │  │    │  │  • Contributions        │  │
│  │                                        │  │    │  │  • Payment approval     │  │
│  │  EIP: 8.219.142.196 (5Mbps)           │  │    │  │  • QR invite (stega)    │  │
│  └────────────────────────────────────────┘  │    │  │  • Agent AI endpoints   │  │
│                                              │    │  └───────────┬────────────┘  │
│  ┌────────────────────────────────────────┐  │    │              │               │
│  │  FC (Function Compute)                 │  │    │  ┌───────────▼────────────┐  │
│  │  kongsigo-web (backup)                 │  │    │  │  CloudWatch            │  │
│  │  Custom Runtime (Node.js)              │  │    │  │                        │  │
│  │  Memory: 512MB / CPU: 0.35            │  │    │  │  Alarms:               │  │
│  │  URL: kongsigo-web-xrnohqpdht          │  │    │  │  • tng-bad-approver-   │  │
│  │       .ap-southeast-1.fcapp.run       │  │    │  │    signatures (≥5/5m)  │  │
│  └────────────────────────────────────────┘  │    │  │  • tng-replay-         │  │
│                                              │    │  │    detected (≥1/5m)    │  │
└──────────────────────────────────────────────┘    │  │                        │  │
                                                    │  │  Metrics:              │  │
                                                    │  │  • TNG/DeviceBind      │  │
                                                    │  │    BadSignature        │  │
                                                    │  │    ReplayDetected      │  │
                                                    │  └───────────┬────────────┘  │
                                                    │              │               │
                                                    │  ┌───────────▼────────────┐  │
                                                    │  │  SNS                    │  │
                                                    │  │  tng-security-alerts    │  │
                                                    │  │  → hongymb07@gmail.com  │  │
                                                    │  └────────────────────────┘  │
                                                    │                              │
                                                    │  ┌────────────────────────┐  │
                                                    │  │  IAM                    │  │
                                                    │  │  tng-approve-gate-role  │  │
                                                    │  │  • DynamoDB access      │  │
                                                    │  │  • CloudWatch metrics   │  │
                                                    │  │  • Lambda execution     │  │
                                                    │  └────────────────────────┘  │
                                                    │                              │
                                                    └──────────────────────────────┘

                                                    ┌──────────────────────────────┐
                                                    │  SUPABASE (Cloud)            │
                                                    │                              │
                                                    │  PostgreSQL Database          │
                                                    │  aws-1-ap-southeast-1        │
                                                    │  .pooler.supabase.com:6543   │
                                                    │                              │
                                                    │  Tables:                     │
                                                    │  • users, pools              │
                                                    │  • pool_members              │
                                                    │  • contributions             │
                                                    │  • spend_requests            │
                                                    │  • spend_votes               │
                                                    │  • transactions              │
                                                    │  • invites                   │
                                                    └──────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Login (Passwordless Device-Bind)
```
Browser → Alibaba ECS (Nginx) → Node proxy → AWS EC2 /api/v1/auth/device-bind/init
                                                         │
AWS EC2 ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
  │ (challenge: requestId, nonce, expiresAt)
  ▼
Mock TNG App → AWS Lambda (tng-approve-gate)
                  │ HMAC-SHA256 verify → DynamoDB nonce check
                  │ → AWS EC2 /api/v1/auth/device-bind/approve
                  ▼
Browser polls → AWS EC2 /api/v1/auth/device-bind/status
  │ (JWT tokens returned)
  ▼
Authenticated ✅
```

### 2. Payment Approval
```
Browser (Scan QR) → amount input → confirm
  │
  ▼ POST /api/v1/payment-approval/initiate
AWS EC2 → creates PAC challenge
  │
Mock TNG App → approve/reject
  │ POST to Lambda → HMAC verify → EC2 /approve
  ▼
Browser polls status → deduct pool balance → success ✅
```

### 3. QR Invite (Steganography)
```
Owner generates invite → QR with hidden payload (LSB stega)
  │ Embedded: { poolId, inviterId, token, expiry }
  ▼
Joiner scans QR → extract hidden bits → POST /api/v1/invites/qr-accept
  │ Server validates token + expiry + pool membership
  ▼
Member added to pool ✅
```

---

## 📦 Resource Inventory

### Alibaba Cloud (`ap-southeast-1`)
| Resource | ID / Name | Spec |
|----------|-----------|------|
| **ECS** | `i-t4n8yxqknl6nr9m2jipc` | t6-c1m1.large (2vCPU/2GB) |
| **EIP** | `8.219.142.196` | 5 Mbps PayByTraffic |
| **VPC** | `vpc-t4nt4fcj67lhsiyme97ci` | 172.16.0.0/16 |
| **VSwitch** | `vsw-t4nl4cqzk9ocicdn1isj3` | zone-a, 172.16.0.0/24 |
| **SecurityGroup** | `sg-t4ne69ubo68hlkqxbzff` | 22/80/443/3000/5173 |
| **FC** | `kongsigo-web` | Custom runtime, 512MB (backup) |
| **SSL** | Let's Encrypt | Auto-renew, expires 2026-07-24 |
| **Domain** | `kongsigo.8.219.142.196.nip.io` | nip.io wildcard DNS |

### AWS (`ap-southeast-1`)
| Resource | ID / Name | Spec |
|----------|-----------|------|
| **EC2** | `47.128.148.79` | Backend (Python/FastAPI) |
| **Lambda** | `tng-approve-gate` | Python 3.12, 256MB, 10s timeout |
| **DynamoDB** | `tng-device-bind-nonces` | PAY_PER_REQUEST, TTL 24h |
| **CloudWatch** | 2 alarms | BadSignature ≥5, Replay ≥1 |
| **SNS** | `tng-security-alerts` | Email → hongymb07@gmail.com |
| **IAM** | `tng-approve-gate-role` | DynamoDB + CloudWatch + Lambda |

### External
| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database (pooled connection) |
| **nip.io** | Free wildcard DNS |
| **Let's Encrypt** | Free SSL certificate |

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **Passwordless Auth** | Device-bind with HMAC-SHA256 challenge-response |
| **Replay Protection** | DynamoDB nonce table with 24h TTL |
| **Signature Verification** | AWS Lambda verifies `TNG_APPROVER_KEY` |
| **Intrusion Detection** | CloudWatch alarms → SNS email alerts |
| **IP Forensics** | Lambda logs `sourceIp` for SOC tracing |
| **QR Steganography** | LSB encoding for invite tokens |
| **HTTPS** | Let's Encrypt SSL on Alibaba ECS |
| **CORS** | Controlled `Access-Control-Allow-Origin` |
| **JWT Auth** | Access (15m) + Refresh (7d) tokens |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **UI Components** | Radix UI + Lucide Icons |
| **State** | TanStack Query (React Query) |
| **Backend** | Python 3.11 + FastAPI + Uvicorn |
| **ORM** | Prisma (via prisma-client-py) |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | JWT + HMAC-SHA256 device-bind |
| **Serverless** | AWS Lambda (Python 3.12) |
| **NoSQL** | AWS DynamoDB |
| **Monitoring** | AWS CloudWatch + SNS |
| **Web Server** | Nginx + Node.js static server |
| **SSL** | Let's Encrypt (Certbot) |
| **Mobile Mock** | Flutter (Dart) |
| **QR** | jsQR (scanning) + qrcode (generation) |
