"""AWS Lambda: TNG approval verifier ("the AWS checker").

Sits in front of `POST /api/v1/auth/device-bind/approve`. The mock TNG app
posts `{requestId, deviceId, approverSig, phone}` to this Lambda's Function
URL instead of hitting the FastAPI backend directly. The Lambda:

  1. Fetches the pending challenge from the backend so it knows the full
     canonical binding (phone, deviceId, appId, nonce, expiresAt).
  2. Re-derives the expected approver signature and constant-time compares.
  3. Inserts the requestId into DynamoDB with a conditional put — a second
     submission for the same requestId fails closed (replay protection).
  4. Forwards the (now-vetted) approval to the FastAPI backend.
  5. Emits CloudWatch metrics (Approved, BadSignature, ReplayDetected, ...)
     so you can alarm on auth failures.

Required env:
    BACKEND_BASE_URL   e.g. https://your-app-runner.example.com
    TNG_APPROVER_KEY   matches backend's TNG_APPROVER_KEY
    NONCE_TABLE        DynamoDB table name; PK = requestId (String)
"""
import base64
import hashlib
import hmac
import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

log = logging.getLogger()
log.setLevel(logging.INFO)

BACKEND_BASE_URL = os.environ["BACKEND_BASE_URL"].rstrip("/")
TNG_APPROVER_KEY = os.environ["TNG_APPROVER_KEY"]
NONCE_TABLE = os.environ["NONCE_TABLE"]

_dynamo = boto3.resource("dynamodb")
_table = _dynamo.Table(NONCE_TABLE)
_cw = boto3.client("cloudwatch")


def _emit(metric: str, count: int = 1) -> None:
    try:
        _cw.put_metric_data(
            Namespace="TNG/DeviceBind",
            MetricData=[{"MetricName": metric, "Value": count, "Unit": "Count"}],
        )
    except Exception:
        log.exception("metric emit failed")


def _canonical(req_id, phone, device_id, app_id, nonce, expires_at_iso):
    # Must match backend `device_bind_service._canonical()` byte-for-byte.
    return "|".join(["v1", req_id, phone, device_id, app_id, nonce, expires_at_iso])


def _expected_sig(req_id, phone, device_id, app_id, nonce, expires_at_iso):
    msg = _canonical(req_id, phone, device_id, app_id, nonce, expires_at_iso) + "|approved"
    return hmac.new(TNG_APPROVER_KEY.encode(), msg.encode(), hashlib.sha256).hexdigest()


def _http(method, path, body=None):
    url = f"{BACKEND_BASE_URL}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url, method=method, data=data,
        headers={"content-type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(body),
    }


def lambda_handler(event, _ctx):
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode()
    try:
        req = json.loads(raw)
    except Exception:
        _emit("BadRequest")
        return _resp(400, {"error": "invalid json"})

    req_id = req.get("requestId")
    device_id = req.get("deviceId")
    sig = req.get("approverSig")
    phone = req.get("phone")
    if not all([req_id, device_id, sig, phone]):
        _emit("BadRequest")
        return _resp(400, {"error": "missing fields (requestId, deviceId, approverSig, phone)"})

    # 1. Find the pending challenge for this phone.
    code, body = _http("GET", f"/api/v1/auth/device-bind/pending?phone={urllib.parse.quote_plus(phone)}")
    if code != 200:
        _emit("BackendError")
        return _resp(502, {"error": "backend unavailable"})
    items = body.get("items", []) if isinstance(body, dict) else []
    challenge = next((c for c in items if c.get("requestId") == req_id), None)
    if not challenge:
        _emit("ChallengeNotFound")
        return _resp(404, {"error": "challenge not pending"})

    # 2. Expiry — independent of the backend's expiry, so we never forward
    #    an approval for a row the backend would reject anyway.
    exp_iso = challenge["expiresAt"]
    exp_dt = datetime.strptime(exp_iso, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    if exp_dt <= datetime.now(timezone.utc):
        _emit("ChallengeExpired")
        return _resp(410, {"error": "challenge expired"})

    # 3. Device binding match.
    if challenge.get("deviceId") != device_id:
        _emit("DeviceMismatch")
        return _resp(401, {"error": "device mismatch"})

    # 4. HMAC signature check (constant-time).
    expected = _expected_sig(
        req_id,
        challenge["phone"],
        challenge["deviceId"],
        challenge["appId"],
        challenge["nonce"],
        exp_iso,
    )
    if not hmac.compare_digest(expected, sig):
        _emit("BadSignature")
        log.warning("bad approver signature requestId=%s phone=%s", req_id, phone)
        return _resp(401, {"error": "invalid approver signature"})

    # 5. Replay protection. DynamoDB conditional put — first submission wins.
    try:
        _table.put_item(
            Item={
                "requestId": req_id,
                "nonce": challenge.get("nonce", ""),
                "phone": phone,
                "deviceId": device_id,
                "ttl": int(time.time()) + 24 * 3600,
            },
            ConditionExpression="attribute_not_exists(requestId)",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            _emit("ReplayDetected")
            log.warning("replay attempt requestId=%s phone=%s", req_id, phone)
            return _resp(409, {"error": "replay detected"})
        raise

    # 6. Forward the vetted approval to the backend.
    code, body = _http(
        "POST",
        "/api/v1/auth/device-bind/approve",
        {"requestId": req_id, "deviceId": device_id, "approverSig": sig},
    )
    if code != 200:
        _emit("BackendApproveFailed")
        return _resp(code, body)

    _emit("Approved")
    log.info("approved requestId=%s phone=%s", req_id, phone)
    return _resp(200, body)
