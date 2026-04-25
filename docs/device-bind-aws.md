# Device-bind login — AWS deployment notes

The device-bind passwordless login is implemented in three places:

| Component | Path | What it does |
|---|---|---|
| Backend service | `backend/app/services/device_bind_service.py` | Creates challenges, verifies approver signatures, issues sessions |
| Backend routes | `backend/app/routes/auth.py` (`/auth/device-bind/*`) | HTTP surface |
| Web login | `web/src/app/LoginPage.tsx` + `web/src/api/hooks.ts` | Phone-only sign-in, polls for approval |
| Mock TNG app | `mock_approval/lib/main.dart` | Stands in for the real TNG eWallet on the approver side |

The critical secrets are:

- `DEVICE_BIND_SECRET` — server-only HMAC key used to bind the challenge tuple. Never leaves the backend.
- `TNG_APPROVER_KEY` — shared between the backend and the (mock) TNG app. The TNG app HMACs the canonical challenge to prove "an approver signed this." In production this would be replaced by an asymmetric signature using a TNG-held private key.

Both default to dev values for the demo. Override via `.env`:

```env
DEVICE_BIND_SECRET=<32+ random bytes hex>
TNG_APPROVER_KEY=<32+ random bytes hex>
DEVICE_BIND_TTL_SECONDS=120
```

## Where AWS fits in (the high-level shape)

The `todo.md` requirement is "approval backend on AWS". That maps cleanly to one of three deployment shapes — pick whichever your team is most comfortable with:

### Option A — Run the FastAPI backend on AWS App Runner (simplest)

1. Push the repo to a private ECR-backed image, or point App Runner at the GitHub repo + a `Dockerfile` (the existing one needs the Python rewrite — Node Dockerfile is legacy).
2. Configure the service:
   - `DATABASE_URL` → Supabase pooler URL
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → 32-byte random
   - `DEVICE_BIND_SECRET`, `TNG_APPROVER_KEY` → 32-byte random
   - `CORS_ORIGINS` → your web-app origin
3. Health check path: `/api/v1/health`.
4. The web app's `/api/v1/auth/device-bind/*` calls now hit App Runner.

This is the fastest path: no code split, the whole approval flow is one binary.

### Option B — Lambda + API Gateway for the *verification* path only

The `todo.md` specifically mentions "Lambda 做 checking 是好的" for **auth / approval verification, replay / nonce / expiry checking, risk / alert / logging**. That maps to:

- Keep the FastAPI backend as the system of record (DB writes, session issuance).
- Put a small Lambda in front of `/auth/device-bind/approve` that:
  - validates the approver signature,
  - checks nonce hasn't been seen (DynamoDB conditional put on `requestId`),
  - logs to CloudWatch + emits a CloudWatch alarm if signature fails or replay is attempted.
- Lambda forwards the (now-vetted) request to the FastAPI backend's internal `/device-bind/approve`.

This gives you a hard auth gate that's auditable independently of the main app, which is the security argument for splitting it out at all.

### Option C — Full stack on ECS Fargate

If you also need to run the WebSocket server in HA, ECS Fargate behind an ALB with `REDIS_URL` set is the standard shape. CDK template is straightforward; the FastAPI app is already a stock `uvicorn` binary.

## ⚠️ Credential handling

The `todo.md` file in the repo currently includes a **plaintext AWS SSO username + password** for the `talenttap+finhackuser80@tngdigital.com.my` account. **Do not commit or leave that in the repo.** Recommended next steps before any deploy:

1. Rotate that password immediately — it's been written to a file in the working tree.
2. Move credentials out of `todo.md`. Use `aws sso login` from your terminal so credentials never sit in a file:
   ```bash
   aws configure sso \
     --sso-start-url https://d-9667a99701.awsapps.com/start \
     --sso-region <your-region>
   aws sso login
   ```
3. Add `todo.md` to `.gitignore` if it'll keep holding secrets, or move scratch notes outside the repo.

I deliberately did **not** run any `aws` commands with those credentials — depositing them in shell history or writing artifacts under that identity from this session would make it harder to scope-check later. Once the password is rotated and you've done `aws sso login` yourself, point me at the empty AWS environment and I'll wire whichever of A/B/C you prefer.

## How the demo runs locally today

```bash
# 1. Backend (one tab)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload

# 2. Web app (another tab)
cd web
npm run dev   # http://localhost:5173

# 3. Mock TNG (Flutter)
cd mock_approval
flutter run -d chrome   # or any device

#    On Android emulator, point it at the host loopback:
#    flutter run --dart-define=BACKEND_BASE_URL=http://10.0.2.2:4000
```

Sign-in flow:

1. Open the web app, type a phone (`+60112345001`), click **Verify with TNG**.
2. The mock TNG app shows a card with the binding details. Tap **Approve**.
3. The web app's poll picks up `APPROVED`, the row is consumed, tokens are issued.
