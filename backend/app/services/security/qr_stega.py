"""QR steganography — Python port of MyLayak's generate-qr.js / scanner-qr.js.

A QR code carries a *visible* payload that any normal QR scanner can read,
plus 64 *hidden* bits (32-bit timestamp + 32-bit HMAC-SHA256 truncated tag)
that we force-flip in non-functional modules of the QR matrix. Standard
scanners ignore those modules because they sit inside the error-correction
budget; our custom scanner samples them by absolute (x, y) coordinates and
recovers the timestamp + tag.

Properties:
  - Looks identical to humans / off-the-shelf scanners.
  - HMAC tag binds visible payload + timestamp → tamper-evident.
  - 60-second time window → replay-resistant.

Algorithm constants (must match the JS implementation byte-for-byte):
  VERSION        = 5     (37x37 modules)
  ECC            = "H"   (Reed-Solomon high)
  SCALE          = 12    pixels per module
  BORDER         = 4     module quiet zone
  HIDDEN_BITS    = 64    (32 ts + 32 tag)
  TIME_WINDOW    = 60    seconds
"""
import hashlib
import hmac
import io
import time
from typing import Iterable

import numpy as np
import qrcode
from PIL import Image
from qrcode.constants import ERROR_CORRECT_H

# Constants — these MUST match generate-qr.js / scanner-qr.js exactly.
VERSION = 5
N = 37  # modules per side at version 5
SCALE = 12
BORDER = 4
HIDDEN_BITS = 64
TIME_WINDOW_SEC = 60


def hmac32(key: bytes, msg: str) -> int:
    """First 4 bytes of HMAC-SHA256 as unsigned 32-bit big-endian int."""
    digest = hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()
    return int.from_bytes(digest[:4], "big", signed=False)


def _int_to_bits_be(x: int, bits: int) -> list[int]:
    return [(x >> (bits - 1 - i)) & 1 for i in range(bits)]


def _bits_to_int(bits: Iterable[int]) -> int:
    out = 0
    for b in bits:
        out = (out << 1) | (b & 1)
    return out & 0xFFFFFFFF


def _embed_coords() -> list[tuple[int, int]]:
    """Pick HIDDEN_BITS (x, y) module coordinates that are NOT in any
    structurally-significant region (finder patterns, timing patterns,
    alignment pattern, format strips).

    Order matches generate-qr.js: walk y from N-1 down, x from N-1 down.
    """
    n = N

    def is_finder(x: int, y: int) -> bool:
        return (
            (x <= 8 and y <= 8)
            or (x >= n - 9 and y <= 8)
            or (x <= 8 and y >= n - 9)
        )

    def is_timing(x: int, y: int) -> bool:
        return x == 6 or y == 6

    def is_align(x: int, y: int) -> bool:
        return 28 <= x <= 32 and 28 <= y <= 32

    def is_format(x: int, y: int) -> bool:
        return (y == 8 and (x <= 8 or x >= n - 8)) or (
            x == 8 and (y <= 8 or y >= n - 8)
        )

    coords: list[tuple[int, int]] = []
    for y in range(n - 1, -1, -1):
        for x in range(n - 1, -1, -1):
            if is_finder(x, y) or is_timing(x, y) or is_align(x, y) or is_format(x, y):
                continue
            coords.append((x, y))
            if len(coords) == HIDDEN_BITS:
                return coords
    raise RuntimeError("Not enough coords for hidden bits")


# Pre-compute once — coords don't depend on payload.
_COORDS = _embed_coords()


def _render_matrix(matrix: list[list[bool]]) -> bytes:
    """Render the 37x37 module matrix as a PNG with the project's standard
    SCALE/BORDER. Returns raw PNG bytes."""
    size = (N + BORDER * 2) * SCALE
    img = Image.new("L", (size, size), 255)  # 8-bit grayscale, white background
    px = img.load()
    for y in range(N):
        for x in range(N):
            if matrix[y][x]:
                for dy in range(SCALE):
                    for dx in range(SCALE):
                        px[(x + BORDER) * SCALE + dx, (y + BORDER) * SCALE + dy] = 0
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _embed_coords_for_n(n: int) -> list[tuple[int, int]]:
    """Compute embed coordinates for any QR module size *n*."""
    def is_finder(x: int, y: int) -> bool:
        return (x <= 8 and y <= 8) or (x >= n - 9 and y <= 8) or (x <= 8 and y >= n - 9)

    def is_timing(x: int, y: int) -> bool:
        return x == 6 or y == 6

    def is_format(x: int, y: int) -> bool:
        return (y == 8 and (x <= 8 or x >= n - 8)) or (x == 8 and (y <= 8 or y >= n - 8))

    # Alignment patterns for versions > 1 (simplified: skip the center 5×5 blocks)
    # For exact positions we'd need the alignment table; conservatively skip a
    # generous zone around the bottom-right area where they typically sit.
    def is_align(x: int, y: int) -> bool:
        if n <= 21:
            return False  # version 1 has no alignment
        # Version 2-6: single alignment at (n-9, n-9) ± 2
        c = n - 9
        return abs(x - c) <= 2 and abs(y - c) <= 2

    coords: list[tuple[int, int]] = []
    for y in range(n - 1, -1, -1):
        for x in range(n - 1, -1, -1):
            if is_finder(x, y) or is_timing(x, y) or is_align(x, y) or is_format(x, y):
                continue
            coords.append((x, y))
            if len(coords) == HIDDEN_BITS:
                return coords
    raise RuntimeError("Not enough coords for hidden bits")


def _render_matrix_dynamic(matrix: list[list[bool]], n: int) -> bytes:
    """Render an n×n module matrix as a PNG."""
    size = (n + BORDER * 2) * SCALE
    img = Image.new("L", (size, size), 255)
    px = img.load()
    for y in range(n):
        for x in range(n):
            if matrix[y][x]:
                for dy in range(SCALE):
                    for dx in range(SCALE):
                        px[(x + BORDER) * SCALE + dx, (y + BORDER) * SCALE + dy] = 0
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_stega_qr(visible_payload: str, secret: bytes) -> tuple[bytes, int, int]:
    """Build a steganographic QR. Returns (png_bytes, ts, tag).

    `secret` is the HMAC key. The same key must be passed to `verify_stega_qr`.
    Auto-selects QR version to fit the payload (minimum version 5)."""
    qr = qrcode.QRCode(
        version=VERSION,
        error_correction=ERROR_CORRECT_H,
        box_size=1,
        border=0,
    )
    qr.add_data(visible_payload)
    qr.make(fit=True)  # auto-upgrade version if data overflows

    src = qr.get_matrix()
    actual_n = len(src)
    matrix = [list(row) for row in src]

    ts = int(time.time())
    tag = hmac32(secret, f"{visible_payload}|{ts}")
    hidden_bits = _int_to_bits_be(ts, 32) + _int_to_bits_be(tag, 32)

    if actual_n == N:
        coords = _COORDS
    else:
        coords = _embed_coords_for_n(actual_n)

    for (x, y), bit in zip(coords, hidden_bits):
        matrix[y][x] = bool(bit)

    return _render_matrix_dynamic(matrix, actual_n), ts, tag


def _decode_visible(image_bytes: bytes) -> tuple[str, np.ndarray, int, int]:
    """Decode the visible payload via OpenCV's QR detector and return
    (payload, grayscale_array, width, height). Raises on failure."""
    import cv2

    img = Image.open(io.BytesIO(image_bytes)).convert("L")
    arr = np.array(img)
    detector = cv2.QRCodeDetector()
    payload, _pts, _ = detector.detectAndDecode(arr)
    if not payload:
        raise ValueError("Could not decode QR (no visible payload)")
    return payload, arr, arr.shape[1], arr.shape[0]


def _detect_module_count(width: int) -> int:
    """Infer QR module count from the image width rendered with our SCALE/BORDER.

    width = (n + 2*BORDER) * SCALE  →  n = width/SCALE - 2*BORDER
    """
    n = round(width / SCALE) - 2 * BORDER
    # QR versions 1-40 have module counts 21, 25, 29, … (4k+17)
    if n < 21 or (n - 21) % 4 != 0:
        # Fall back to default
        return N
    return n


def _sample_hidden_bits(arr: np.ndarray, width: int, height: int,
                        coords: list[tuple[int, int]], n: int) -> list[int]:
    """Sample the hidden bits from the image using the given coords and module count."""
    module_px = width / (n + BORDER * 2)
    bits: list[int] = []
    for x, y in coords:
        cx = int((x + BORDER + 0.5) * module_px)
        cy = int((y + BORDER + 0.5) * module_px)
        cy = min(max(cy, 0), height - 1)
        cx = min(max(cx, 0), width - 1)
        bits.append(1 if arr[cy, cx] < 128 else 0)
    return bits


class StegaError(Exception):
    """Raised when steganographic verification fails."""


def verify_stega_qr(
    image_bytes: bytes,
    secret: bytes,
    *,
    time_window_sec: int = TIME_WINDOW_SEC,
) -> str:
    """Validate a stega QR and return the visible payload.

    Raises `StegaError` on any of: decode failure, HMAC mismatch, expired ts."""
    payload, arr, w, h = _decode_visible(image_bytes)
    n = _detect_module_count(w)
    coords = _COORDS if n == N else _embed_coords_for_n(n)
    bits = _sample_hidden_bits(arr, w, h, coords, n)
    if len(bits) != HIDDEN_BITS:
        raise StegaError("Hidden bit count mismatch")
    ts = _bits_to_int(bits[:32])
    tag = _bits_to_int(bits[32:])
    expected = hmac32(secret, f"{payload}|{ts}")
    if tag != expected:
        raise StegaError("Stega tag mismatch")
    if abs(int(time.time()) - ts) > time_window_sec:
        raise StegaError("QR expired")
    return payload
