"""Simple in-memory rate limiter (per-IP) — drop-in for express-rate-limit.

Window-counter style; concurrency-safe under asyncio (single-loop). Adds
RateLimit-* headers like the standardHeaders option in express-rate-limit.
"""
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response

from .errors import AppError


def _client_key(req: Request) -> str:
    fwd = req.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return req.client.host if req.client else "unknown"


class RateLimiter:
    def __init__(self, *, window_seconds: int, max_requests: int):
        self.window = window_seconds
        self.max = max_requests
        self._buckets: dict[str, tuple[int, float]] = {}

    def check(self, req: Request, resp: Response) -> None:
        key = _client_key(req)
        now = time.time()
        count, reset = self._buckets.get(key, (0, now + self.window))
        if now > reset:
            count = 0
            reset = now + self.window
        count += 1
        self._buckets[key] = (count, reset)
        remaining = max(0, self.max - count)
        resp.headers["RateLimit-Limit"] = str(self.max)
        resp.headers["RateLimit-Remaining"] = str(remaining)
        resp.headers["RateLimit-Reset"] = str(int(reset - now))
        if count > self.max:
            raise AppError("RATE_LIMITED", "Too many requests, please try again later", 429)


auth_limiter = RateLimiter(window_seconds=15 * 60, max_requests=10)
