# Secure Payment Approval Flow

> Pool payments are gated by TNG passwordless approval + AWS Lambda
> verification before any balance is debited.

---

## Architecture Overview

```
┌──────────────┐      ┌───────────────┐      ┌───────────────┐      ┌─────────────┐
│   Web App    │      │   Backend     │      │  TNG Mock App │      │ AWS Lambda  │
│  (Next.js)   │      │  (FastAPI)    │      │  (Flutter)    │      │  (Python)   │
└──────┬───────┘      └───────┬───────┘      └───────┬───────┘      └──────┬──────┘
       │                      │                      │                     │
       │  1. POST /initiate   │                      │                     │
       │─────────────────────>│                      │                     │
       │  {poolId, deviceId,  │                      │                     │
       │   amount, merchant}  │                      │                     │
       │                      │ Create challenge     │                     │
       │                      │ (nonce, HMAC hash,   │                     │
       │                      │  120s TTL)           │                     │
       │<─────────────────────│                      │                     │
       │  {requestId, nonce,  │                      │                     │
       │   expiresAt, ...}    │                      │                     │
       │                      │                      │                     │
       │  2. Poll /status     │  3. GET /pending     │                     │
       │─────────────────────>│<─────────────────────│                     │
       │  {status: PENDING}   │  Payment card shown  │                     │
       │                      │  to user in TNG app  │                     │
       │                      │                      │                     │
       │                      │                      │ 4. User taps       │
       │                      │                      │    "Approve"       │
       │                      │                      │        │           │
       │                      │                      │  POST /approve ───>│
       │                      │                      │  {requestId,       │
       │                      │                      │   approverSig,     │
       │                      │                      │   deviceId}        │
       │                      │                      │                    │
       │                      │                      │              5. Lambda verifies:
       │                      │                      │              ✓ HMAC signature
       │                      │                      │              ✓ Replay (DynamoDB)
       │                      │                      │              ✓ IP geolocation
       │                      │                      │              ✓ Device match
       │                      │                      │                    │
       │                      │  6. Forward /approve │                    │
       │                      │<──────────────────────────────────────────│
       │                      │  status → APPROVED   │                    │
       │                      │                      │                    │
       │  7. Poll /status     │                      │                     │
       │─────────────────────>│                      │                     │
       │                      │ 8. consume_if_approved:                    │
       │                      │    ✓ Re-verify HMAC                        │
       │                      │    ✓ Re-verify approverSig                 │
       │                      │    ✓ Atomic claim (consumedAt)             │
       │                      │    ✓ Pool.balance -= amount                │
       │                      │    ✓ User.balance += amount                │
       │                      │    ✓ Create 2 Transaction records          │
       │<─────────────────────│                      │                     │
       │  {status: APPROVED,  │                      │                     │
       │   transaction: {...}}│                      │                     │
       │                      │                      │                     │
       │  9. UI → ✅ Success   │                      │                     │
       └──────────────────────┘──────────────────────┘─────────────────────┘
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/payment-approval/initiate` | JWT | Create a payment challenge |
| `GET` | `/api/v1/payment-approval/pending?phone=…` | None | TNG app fetches pending payments |
| `POST` | `/api/v1/payment-approval/approve` | None | Lambda-verified approval |
| `POST` | `/api/v1/payment-approval/status/{requestId}` | JWT | Web polls; executes on first APPROVED |
| `POST` | `/api/v1/payment-approval/reject` | None | TNG app rejects payment |

---

## Canonical Format (Wire Contract)

Both the Flutter mock app and Lambda must produce the same bytes:

```
v1|{requestId}|{phone}|{deviceId}|{poolId}|{amount:.2f}|{merchantName}|{nonce}|{expiresAt_ISO}
```

- `amount` — always 2 decimal places: `"47.50"` not `"47.5"`
- `expiresAt` — UTC ISO 8601: `2026-04-25T15:08:52Z`

### HMAC Signatures

| Signature | Key | Message |
|-----------|-----|---------|
| `challengeHash` | `DEVICE_BIND_SECRET` | `canonical` |
| `approverSig` | `TNG_APPROVER_KEY` | `canonical\|approved` |

---

## Security Properties

### 1. Binding (What Gets Signed)

Every approval is cryptographically bound to:
- **Phone number** — who initiated
- **Device ID** — which device
- **Pool ID** — which pool
- **Amount** — exact RM value
- **Merchant name** — who receives
- **Nonce** — unique per challenge
- **Expiry** — 120s TTL

Changing any field invalidates the HMAC.

### 2. Replay Protection

- **DynamoDB nonce table** (`tng-device-bind-nonces`) — Lambda writes `requestId` on first use
- **TTL auto-expiry** — rows expire after 24h
- **Atomic claim** — `UPDATE ... WHERE consumedAt IS NULL` — first racer wins

### 3. IP Geolocation Tracking

Lambda extracts source IP and calls `ip-api.com`:
```json
{
  "threat": true,
  "eventType": "BAD_SIGNATURE",
  "sourceIp": "175.139.x.x",
  "geo": {
    "country": "Malaysia",
    "city": "Kuala Lumpur",
    "isp": "TT DOTCOM SDN BHD"
  }
}
```

### 4. CloudWatch Alarms

| Alarm | Metric | Threshold |
|-------|--------|-----------|
| `tng-bad-approver-signatures` | `BadSignature` | ≥ 5 in 5 min |
| `tng-replay-detected` | `ReplayDetected` | ≥ 1 in 5 min |

SNS alerts → `hongymb07@gmail.com`

---

## Payment Execution (Atomic)

When `consume_if_approved` runs on the first poll after APPROVED:

```python
# 1. Re-verify challengeHash and approverSig from stored bindings
# 2. Atomic claim: UPDATE ... WHERE consumedAt IS NULL
# 3. Re-check pool balance at execution time
# 4. Debit pool, credit user
pool.currentBalance -= amount
user.mainBalance    += amount
# 5. Create dual Transaction records
Transaction(type=SPEND, direction=OUT, ...)  # pool outflow
Transaction(type=SPEND, direction=IN,  ...)  # user inflow
```

If the pool balance changed between initiate and consume (e.g., another
member spent), the balance check at execution time catches it.

---

## Frontend Flow (PoolScanPayDialog)

| Step | UI | Duration |
|------|-----|----------|
| `scanning` | Animated QR scan overlay | 2.2s auto |
| `confirm` | Merchant card + "Secure Pay" button + TNG notice | User action |
| `approving` | Spinner + "Waiting for TNG Approval" | Polls 1.5s |
| `success` | ✅ "Verified by TNG + AWS Lambda" | 2.5s auto-close |
| `failed` | ❌ Error message + "Try Again" | User action |

---

## AWS Resources

| Resource | Name / ARN |
|----------|------------|
| Lambda | `tng-approve-gate` (Python 3.12) |
| DynamoDB | `tng-device-bind-nonces` |
| CloudWatch | `TNG/DeviceBind` namespace |
| SNS | `arn:aws:sns:ap-southeast-1:724413959651:tng-security-alerts` |
| EC2 | `47.128.148.79:8000` |

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/services/payment_approval_service.py` | Core service (initiate, approve, consume) |
| `backend/app/routes/payment_approval.py` | 5 REST endpoints |
| `backend/app/models.py` | `PaymentApprovalChallenge` model |
| `aws/lambda_approve_gate/lambda_function.py` | Dual-flow Lambda (pac_ / dbc_) |
| `mock_approval/lib/main.dart` | Flutter TNG app (Sign-in + Payments tabs) |
| `web/src/app/components/PoolScanPayDialog.tsx` | Payment dialog UI |
| `web/src/api/hooks.ts` | `usePaymentApproval()` hook |
| `exploit/trigger_alarms.sh` | Security exploit test script |
