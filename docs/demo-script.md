# KongsiGo — 1-Minute Demo Script
## System Security Architecture + AWS Device-Bind + Alibaba Cloud Hosting

> **Total time: ~60 seconds. Speak at a natural pace. Each section is ~20s.**

---

### 🎬 PART 1 — Multi-Cloud Architecture Overview (0:00 – 0:20)

> *[Show: System Architecture diagram]*

"KongsiGo is a **group wallet** for families and friends — built on a **multi-cloud architecture** across **Alibaba Cloud** and **AWS**, both hosted in the **Singapore region** for low-latency access in Southeast Asia.

The **frontend** — a React progressive web app — is hosted on **Alibaba Cloud ECS** with **Nginx** handling SSL termination via **Let's Encrypt**, and a Node.js server serving the SPA and proxying API calls.

All **backend logic** — pool management, contributions, payments, and our passwordless authentication — runs on **AWS** with **FastAPI on EC2**, connected to a **Supabase PostgreSQL** database."

---

### 🎬 PART 2 — AWS Device-Bind Security (0:20 – 0:40)

> *[Show: Device-Bind AWS Architecture diagram]*

"For authentication, we use a **passwordless device-bind** flow — no passwords at all.

Here's how it works: the user enters their phone number, and our backend creates a **challenge**. The **TNG eWallet app** picks up this challenge and signs it with **HMAC-SHA256**.

This signed approval goes through our **AWS Lambda gate** — which performs a **6-point verification**: it checks the challenge exists, hasn't expired, matches the device fingerprint, verifies the HMAC signature using **constant-time comparison**, and does a **DynamoDB conditional put** to prevent **replay attacks**.

Every request is logged with **source IP** and **device fingerprint** for forensic tracing."

---

### 🎬 PART 3 — Security Monitoring & Alibaba Hosting (0:40 – 1:00)

> *[Show: Security Architecture diagram]*

"On the security monitoring side, we have a **four-layer defense**:

**Detection** — signature verification, nonce-based replay protection, device fingerprint matching, and IP threat intelligence.

**Monitoring** — all events emit **CloudWatch metrics** — BadSignature, ReplayDetected — with structured JSON logs.

**Alerts** — CloudWatch alarms trigger if we see **5 bad signatures in 5 minutes** or **any replay attempt**, sending instant **SNS email notifications**.

**SOC Forensics** — we can query CloudWatch Logs Insights by IP, geo-location, ISP, and user agent for incident investigation.

The entire frontend is served over **HTTPS** from Alibaba Cloud with a backup deployment on **Alibaba Function Compute** for high availability. Thank you."

---

## 📝 Key Talking Points (cheat sheet)

| Topic | Sound Bite |
|-------|-----------|
| **Multi-cloud** | "Alibaba Cloud frontend + AWS backend, both Singapore region" |
| **Passwordless** | "No passwords — device-bind with HMAC-SHA256 challenge-response" |
| **Anti-replay** | "DynamoDB conditional put — each nonce can only be used once" |
| **6-point check** | "Challenge exists, not expired, device match, HMAC verify, constant-time, replay guard" |
| **Real-time alerts** | "CloudWatch alarms → SNS email within seconds" |
| **Forensics** | "Source IP, geo, ISP, device fingerprint — all logged for SOC" |
| **HTTPS** | "Let's Encrypt SSL on Alibaba ECS — auto-renew" |
| **HA backup** | "Function Compute on Alibaba as fallback" |
| **Cost** | "Under $20/month total on Alibaba side" |

---

## 🖥️ Slides to Show

1. **0:00** — Full system architecture diagram (Alibaba + AWS + Supabase)
2. **0:20** — Device-bind AWS architecture (Lambda → DynamoDB → EC2 flow)
3. **0:40** — Security architecture (Threat Sources → Detection → Monitoring → Alerts → SOC)
