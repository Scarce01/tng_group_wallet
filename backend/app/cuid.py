"""Minimal cuid generator — collision-resistant 25-char id, Prisma-compatible shape.

Original cuid (v1) format: c + timestamp(8) + counter(4) + fingerprint(4) + random(8)
all base-36 lowercase. We replicate the shape so tokens visually match Prisma output.
"""
import os
import secrets
import time

_BASE = 36
_FINGERPRINT_BLOCK = 4
_RANDOM_BLOCK = 4
_pid = os.getpid()
_hostname = os.uname().nodename if hasattr(os, "uname") else os.environ.get("COMPUTERNAME", "py")
_counter = 0


def _b36(n: int) -> str:
    if n == 0:
        return "0"
    chars = "0123456789abcdefghijklmnopqrstuvwxyz"
    out = []
    while n > 0:
        n, r = divmod(n, _BASE)
        out.append(chars[r])
    return "".join(reversed(out))


def _pad(s: str, n: int) -> str:
    if len(s) >= n:
        return s[-n:]
    return ("0" * (n - len(s))) + s


def _fingerprint() -> str:
    pid_block = _pad(_b36(_pid), 2)
    host_sum = sum(ord(c) for c in _hostname) + len(_hostname) + 36
    host_block = _pad(_b36(host_sum), 2)
    return pid_block + host_block


_FP = _fingerprint()


def cuid() -> str:
    global _counter
    ts = _pad(_b36(int(time.time() * 1000)), 8)
    _counter = (_counter + 1) % (_BASE ** 4)
    counter = _pad(_b36(_counter), 4)
    rand_n = secrets.randbits(20)
    rand_block = _pad(_b36(rand_n), 4)
    rand2 = _pad(_b36(secrets.randbits(20)), 4)
    return "c" + ts + counter + _FP + rand_block + rand2
