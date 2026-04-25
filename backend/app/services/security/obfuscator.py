"""Token obfuscator — Python port of MyLayak's obfuscator.js.

Algorithm:
  obfuscate(jwt) = `${ROT13(base64url(XOR(header.payload, signature)))}.${signature}`

The signature is left unchanged so verification can recover (h.p) by:
  1. Splitting on the single dot,
  2. ROT13 the first part,
  3. base64url-decode,
  4. XOR with the signature bytes (cycled),
giving back `header.payload`. Concatenated with the original signature it's
once again a standard 3-part JWT, ready for the normal HMAC verifier.

Why bother:
  - At rest / in transit the token doesn't *look* like a JWT, so a casual
    bearer-token sniffer can't immediately recognize it as one and start
    reasoning about its structure.
  - The transform is reversible without any extra key — the security still
    comes from the JWT signature, this just adds a trivial layer.
  - Byte-for-byte interoperable with the JS implementation in
    backend/obfuscator.js from MyLayak.
"""
import base64


def _rot13(s: str) -> str:
    out = []
    for ch in s:
        c = ord(ch)
        if 65 <= c <= 90:        # A-Z
            out.append(chr((c - 65 + 13) % 26 + 65))
        elif 97 <= c <= 122:     # a-z
            out.append(chr((c - 97 + 13) % 26 + 97))
        else:
            out.append(ch)
    return "".join(out)


def _b64url_encode(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    pad = (-len(s)) % 4
    return base64.urlsafe_b64decode(s + ("=" * pad))


def _xor_with_sig(data: bytes, sig: bytes) -> bytes:
    if not sig:
        return data
    n = len(sig)
    return bytes(b ^ sig[i % n] for i, b in enumerate(data))


def obfuscate_token(jwt_token: str) -> str:
    """Return obfuscated form. If `jwt_token` isn't a 3-part JWT, return as-is."""
    parts = jwt_token.split(".")
    if len(parts) != 3:
        return jwt_token
    header, payload, signature = parts
    header_payload = f"{header}.{payload}"
    xored = _xor_with_sig(header_payload.encode("utf-8"), signature.encode("utf-8"))
    body = _rot13(_b64url_encode(xored))
    return f"{body}.{signature}"


def deobfuscate_token(obfuscated: str) -> str:
    """Reverse obfuscation. If the input has 3 parts (already a JWT) return as-is.

    This makes the wrapper *idempotent* — useful while old Node-issued tokens
    are still in circulation during a migration."""
    parts = obfuscated.split(".")
    if len(parts) == 3:
        return obfuscated
    if len(parts) != 2:
        raise ValueError("Token has unexpected structure")
    body, signature = parts
    xored = _b64url_decode(_rot13(body))
    hp = _xor_with_sig(xored, signature.encode("utf-8")).decode("utf-8")
    return f"{hp}.{signature}"
