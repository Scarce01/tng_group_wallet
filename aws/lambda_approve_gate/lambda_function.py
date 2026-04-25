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
  6. Logs structured threat intelligence (source IP, geolocation, user-agent)
     for SOC traceability and forensic attribution.

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

# ── Threat Intelligence Helpers ──────────────────────────────

_GEO_CACHE: dict[str, dict] = {}


def _extract_source_ip(event: dict) -> str:
    """Extract client IP from API Gateway v2 or Function URL event."""
    rc = event.get("requestContext", {})
    # API Gateway HTTP API (v2)
    ip = rc.get("http", {}).get("sourceIp", "")
    if not ip:
        # API Gateway REST / Function URL
        ip = rc.get("identity", {}).get("sourceIp", "")
    if not ip:
        # X-Forwarded-For fallback
        headers = event.get("headers", {})
        xff = headers.get("x-forwarded-for", "")
        ip = xff.split(",")[0].strip() if xff else "unknown"
    return ip


def _extract_user_agent(event: dict) -> str:
    headers = event.get("headers", {})
    return headers.get("user-agent", "unknown")


def _geolocate_ip(ip: str) -> dict:
    """Lookup IP geolocation via ip-api.com (free, no key, 45 req/min).
    Returns {country, region, city, isp, org, lat, lon, query} or {} on failure."""
    if ip in ("unknown", "127.0.0.1", ""):
        return {}
    if ip in _GEO_CACHE:
        return _GEO_CACHE[ip]
    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,country,regionName,city,isp,org,lat,lon,query"
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=2) as r:
            data = json.loads(r.read())
        if data.get("status") == "success":
            geo = {
                "country": data.get("country", ""),
                "region": data.get("regionName", ""),
                "city": data.get("city", ""),
                "isp": data.get("isp", ""),
                "org": data.get("org", ""),
                "lat": data.get("lat"),
                "lon": data.get("lon"),
            }
            _GEO_CACHE[ip] = geo
            return geo
    except Exception:
        pass
    return {}


def _log_threat(event_type: str, severity: str, ip: str, geo: dict, **extra):
    """Emit a structured JSON log line for SOC/SIEM ingestion.
    CloudWatch Logs Insights can query these directly."""
    log.warning(json.dumps({
        "threat": True,
        "eventType": event_type,
        "severity": severity,
        "sourceIp": ip,
        "geo": geo,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **extra,
    }, default=str))


def _emit(metric: str, count: int = 1, ip: str = "") -> None:
    dims = [{"Name": "Service", "Value": "ApproveGate"}]
    if ip and ip != "unknown":
        dims.append({"Name": "SourceIP", "Value": ip})
    try:
        _cw.put_metric_data(
            Namespace="TNG/DeviceBind",
            MetricData=[{
                "MetricName": metric,
                "Value": count,
                "Unit": "Count",
                "Dimensions": dims,
            }],
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

    # ── Extract source intelligence ──
    source_ip = _extract_source_ip(event)
    user_agent = _extract_user_agent(event)

    try:
        req = json.loads(raw)
    except Exception:
        _emit("BadRequest", ip=source_ip)
        return _resp(400, {"error": "invalid json"})

    req_id = req.get("requestId")
    device_id = req.get("deviceId")
    sig = req.get("approverSig")
    phone = req.get("phone")
    if not all([req_id, device_id, sig, phone]):
        _emit("BadRequest", ip=source_ip)
        return _resp(400, {"error": "missing fields (requestId, deviceId, approverSig, phone)"})

    # 1. Find the pending challenge for this phone.
    code, body = _http("GET", f"/api/v1/auth/device-bind/pending?phone={urllib.parse.quote_plus(phone)}")
    if code != 200:
        _emit("BackendError", ip=source_ip)
        return _resp(502, {"error": "backend unavailable"})
    items = body.get("items", []) if isinstance(body, dict) else []
    challenge = next((c for c in items if c.get("requestId") == req_id), None)
    if not challenge:
        _emit("ChallengeNotFound", ip=source_ip)
        return _resp(404, {"error": "challenge not pending"})

    # 2. Expiry — independent of the backend's expiry, so we never forward
    #    an approval for a row the backend would reject anyway.
    exp_iso = challenge["expiresAt"]
    exp_dt = datetime.strptime(exp_iso, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    if exp_dt <= datetime.now(timezone.utc):
        _emit("ChallengeExpired", ip=source_ip)
        return _resp(410, {"error": "challenge expired"})

    # 3. Device binding match.
    if challenge.get("deviceId") != device_id:
        geo = _geolocate_ip(source_ip)
        _emit("DeviceMismatch", ip=source_ip)
        _log_threat("DEVICE_MISMATCH", "HIGH", source_ip, geo,
                    requestId=req_id, phone=phone,
                    expectedDevice=challenge.get("deviceId"),
                    claimedDevice=device_id,
                    userAgent=user_agent)
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
        geo = _geolocate_ip(source_ip)
        _emit("BadSignature", ip=source_ip)
        _log_threat("BAD_SIGNATURE", "CRITICAL", source_ip, geo,
                    requestId=req_id, phone=phone,
                    deviceId=device_id,
                    userAgent=user_agent)
        return _resp(401, {"error": "invalid approver signature"})

    # 5. Replay protection. DynamoDB conditional put — first submission wins.
    try:
        _table.put_item(
            Item={
                "requestId": req_id,
                "nonce": challenge.get("nonce", ""),
                "phone": phone,
                "deviceId": device_id,
                "sourceIp": source_ip,
                "ttl": int(time.time()) + 24 * 3600,
            },
            ConditionExpression="attribute_not_exists(requestId)",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            geo = _geolocate_ip(source_ip)
            _emit("ReplayDetected", ip=source_ip)
            _log_threat("REPLAY_ATTACK", "CRITICAL", source_ip, geo,
                        requestId=req_id, phone=phone,
                        deviceId=device_id,
                        userAgent=user_agent)
            return _resp(409, {"error": "replay detected"})
        raise

    # 6. Forward the vetted approval to the backend.
    code, body = _http(
        "POST",
        "/api/v1/auth/device-bind/approve",
        {"requestId": req_id, "deviceId": device_id, "approverSig": sig},
    )
    if code != 200:
        _emit("BackendApproveFailed", ip=source_ip)
        return _resp(code, body)

    _emit("Approved", ip=source_ip)
    log.info("approved requestId=%s phone=%s sourceIp=%s", req_id, phone, source_ip)
    return _resp(200, body)
