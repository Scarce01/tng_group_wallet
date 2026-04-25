# KongsiGo — 1-Minute Demo Script
## Flow: Security Architecture → AWS Device-Bind → Alibaba Cloud Hosting

> **Total time: ~60 seconds. Speak at a natural pace. Each section is ~20s.**
> **Flow order: Security first → AWS implementation → Alibaba hosting**

---

### 🎬 PART 1 — Security Architecture (0:00 – 0:20)

> *[Show: Security Architecture diagram — Threat Sources → Detection → Monitoring → Alerts → SOC]*

"KongsiGo is a **group wallet** for families — and security is our foundation. Let me walk you through our **threat detection and response** pipeline.

On the left, we defend against four threat types: **forged signatures**, **replay attacks**, **untrusted devices**, and **bot abuse**.

Each threat passes through our **Detection Layer** — **HMAC signature verification**, **DynamoDB nonce protection** to block replays, **device fingerprint matching**, and **IP threat intelligence** via geo and ISP lookups.

Every event emits **CloudWatch metrics and structured JSON logs**. If we see **5 bad signatures in 5 minutes** or **any single replay attempt**, **CloudWatch Alarms** fire instantly — pushing **SNS notifications** to our team via email. All evidence feeds into our **SOC forensics dashboard** for incident investigation."

---

### 🎬 PART 2 — AWS Device-Bind Implementation (0:20 – 0:40)

> *[Show: Device-Bind AWS Architecture diagram — the full Lambda → DynamoDB → EC2 flow]*

"Now let me show you **how we implemented this** on AWS.

Our authentication is **completely passwordless** — we use a **device-bind** flow. The user enters their phone number on the web app, and our **FastAPI backend on EC2** creates a challenge.

The **TNG eWallet app** picks up this challenge, signs it with **HMAC-SHA256**, and sends approval to our **AWS Lambda gate**.

The Lambda performs a **6-point verification**: ① fetch the pending challenge, ② check it exists, ③ confirm it hasn't expired within the 120-second window, ④ match the device fingerprint, ⑤ verify the HMAC signature using **constant-time comparison**, and ⑥ do a **DynamoDB conditional put** — if the nonce was already used, the request is **rejected as a replay**.

Once verified, the Lambda forwards the approval to EC2, which issues **JWT tokens** back to the browser."

---

### 🎬 PART 3 — Alibaba Cloud Web Hosting (0:40 – 1:00)

> *[Show: Alibaba Cloud Architecture diagram — ECS + Nginx + Node.js + FC backup]*

"For the **frontend delivery**, we chose **Alibaba Cloud** — also in the **Singapore region** — giving our Malaysian users **sub-150ms latency**.

Our React SPA is hosted on an **Alibaba ECS instance** running **Ubuntu 22.04**. **Nginx** handles **SSL termination** with a **Let's Encrypt certificate** and auto-redirects HTTP to HTTPS — this is critical because our device ID generation requires a **Secure Context**.

Behind Nginx, a **Node.js server** serves the static build files and **proxies all `/api/*` requests** across to our **AWS EC2 backend** — bridging the two clouds seamlessly.

For **high availability**, we also maintain a backup deployment on **Alibaba Function Compute**, ready to take over if the ECS instance goes down.

The entire Alibaba infrastructure — VPC, security groups, EIP — runs at just **under $20 a month**. Thank you."

---

## 📝 Key Talking Points (cheat sheet)

| # | Topic | Sound Bite |
|---|-------|-----------|
| 1 | **4 threats** | "Bad signatures, replay attacks, device mismatch, bot abuse" |
| 2 | **Detection layer** | "HMAC verify, nonce protection, device fingerprint, IP intelligence" |
| 3 | **Real-time alerts** | "CloudWatch alarms → SNS email in seconds" |
| 4 | **SOC forensics** | "Query by IP, geo, ISP, user agent for investigation" |
| 5 | **Passwordless** | "No passwords — device-bind with HMAC-SHA256 challenge-response" |
| 6 | **6-point check** | "Exists, not expired, device match, HMAC verify, constant-time, replay guard" |
| 7 | **Anti-replay** | "DynamoDB conditional put — each nonce used exactly once, TTL 24h" |
| 8 | **Multi-cloud** | "Alibaba frontend + AWS backend, both Singapore ap-southeast-1" |
| 9 | **HTTPS required** | "crypto.randomUUID() needs Secure Context — Let's Encrypt solves it" |
| 10 | **HA backup** | "Function Compute on Alibaba as serverless fallback" |

---

## 🖥️ Slides to Show (in order)

| Time | Slide | Diagram |
|------|-------|---------|
| **0:00** | Security Architecture | Threat Sources → Detection → Monitoring → Alerts → SOC |
| **0:20** | AWS Device-Bind | Lambda 6-point verification → DynamoDB → EC2 → JWT |
| **0:40** | Alibaba Cloud Hosting | ECS + Nginx + Node.js → AWS proxy + FC backup |
