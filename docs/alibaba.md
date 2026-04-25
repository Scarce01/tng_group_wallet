# KongsiGo — Alibaba Cloud Architecture

## 🌐 Domain & Access

| Item | Value |
|------|-------|
| **URL** | `https://kongsigo.8.219.142.196.nip.io/` |
| **IP** | `8.219.142.196` |
| **DNS** | nip.io wildcard (free, zero-config) |
| **SSL** | Let's Encrypt, auto-renew, expires 2026-07-24 |
| **Region** | `ap-southeast-1` (Singapore) |

---

## 📐 Architecture Diagram

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

---

## 📦 Resource Inventory

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

---

## 🔧 ECS Software Stack

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

### Running Services

| Service | Port | Manager | Auto-Start |
|---------|------|---------|------------|
| **Nginx** | 80, 443 | systemd | ✅ Yes |
| **Node.js server.cjs** | 3000 | nohup | ❌ Manual |

---

## 🌊 Request Flow

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

---

## 🔐 Security Configuration

### Nginx SSL (Let's Encrypt)
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

### Security Group Rules

| Direction | Protocol | Port | Source | Purpose |
|-----------|----------|------|--------|---------|
| Inbound | TCP | 22 | 0.0.0.0/0 | SSH |
| Inbound | TCP | 80 | 0.0.0.0/0 | HTTP → HTTPS redirect |
| Inbound | TCP | 443 | 0.0.0.0/0 | HTTPS (production) |
| Inbound | TCP | 3000 | 0.0.0.0/0 | Node.js direct (dev) |
| Inbound | TCP | 5173 | 0.0.0.0/0 | Vite dev server (dev) |

---

## 🔄 Deployment Steps

### Build & Deploy Frontend

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

### Restart Services

```bash
# Restart Nginx (if config changed)
sudo systemctl restart nginx

# Restart Node.js server
# Find and kill existing process
ps aux | grep server.cjs
kill <PID>

# Start new instance
cd /root/tng_group_wallet/web
nohup node server.cjs > /tmp/server.log 2>&1 &
```

---

## 🔗 FC (Function Compute) — Backup Deployment

The FC deployment serves as a **backup / alternative** endpoint.

| Property | Value |
|----------|-------|
| **Function** | `kongsigo-web` |
| **Runtime** | Custom (Node.js CommonJS) |
| **Memory** | 512 MB |
| **CPU** | 0.35 vCPU |
| **URL** | `https://kongsigo-web-xrnohqpdht.ap-southeast-1.fcapp.run/` |
| **Entry** | `server.cjs` (CommonJS required — `package.json` has `"type": "module"`) |

### FC Deploy via Python SDK

```python
from alibabacloud_fc20230330.client import Client
from alibabacloud_fc20230330.models import UpdateFunctionRequest, InputCodeLocation

config = Config()
config.endpoint = '5478576265816504.ap-southeast-1.fc.aliyuncs.com'
client = Client(config)

# Upload zip with dist/ + server.cjs
request = UpdateFunctionRequest(
    code=InputCodeLocation(zip_file='base64-encoded-zip'),
    handler='server.handler',
    runtime='custom'
)
client.update_function('kongsigo-web', request)
```

---

## ⚠️ Known Issues & Notes

| Issue | Detail | Resolution |
|-------|--------|------------|
| `crypto.randomUUID()` | Fails over HTTP (requires Secure Context) | ✅ Fixed by HTTPS |
| Node.js server.cjs | No systemd service, manual restart on reboot | Create systemd unit |
| ECS files in `/root/` | Nginx needs `user root;` or `chmod 755 /root` | ✅ Configured |
| FC body size | CLI `--body` too large for zip upload | Use Python SDK |
| OSS | Returns `UserDisable` (403) — not activated | Use FC or ECS instead |

---

## 💰 Cost Estimate (Hackathon)

| Resource | Billing | Est. Monthly |
|----------|---------|-------------|
| **ECS** (t6-c1m1.large) | Pay-As-You-Go | ~$15 USD |
| **EIP** (5 Mbps) | PayByTraffic | ~$3-5 USD |
| **FC** (backup, idle) | Pay-Per-Invocation | ~$0 (minimal) |
| **SSL** (Let's Encrypt) | Free | $0 |
| **DNS** (nip.io) | Free | $0 |
| **Total** | | **~$18-20 USD/mo** |
