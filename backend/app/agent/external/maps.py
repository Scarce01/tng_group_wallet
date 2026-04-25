"""Google Maps Places adapter (Text Search + Nearby Search).

Used by the agent to suggest cheaper / better-rated nearby restaurants
when evaluating trip-pool spend requests.

API: https://developers.google.com/maps/documentation/places/web-service/text-search
Free tier: $200/mo credit ≈ 6.6k Place Details / 11k Text Searches per month.
We hit the legacy Places API (no field-mask billing) — simpler and free for
this hackathon's volume."""
import logging
import os
from typing import Optional

import httpx

log = logging.getLogger("agent.maps")

TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"


def _api_key() -> Optional[str]:
    return os.getenv("GOOGLE_MAPS_API_KEY") or None


_PRICE_LABELS = {0: "free", 1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}


async def search_places(query: str, *, limit: int = 5) -> Optional[list[dict]]:
    """Returns up to `limit` simplified place dicts, or None on failure.

    Each place: { name, address, rating, ratingCount, priceLevel, priceLabel,
                  placeId, openNow }"""
    key = _api_key()
    if not key:
        log.info("GOOGLE_MAPS_API_KEY not set, skipping places fetch")
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(TEXT_SEARCH_URL, params={
                "query": query, "key": key,
            })
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        log.warning("google maps fetch failed for %r: %s", query, e)
        return None

    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        log.warning("google maps non-OK: %s — %s",
                    data.get("status"), data.get("error_message", "")[:200])
        return None

    out = []
    for p in (data.get("results") or [])[:limit]:
        price_lvl = p.get("price_level")
        out.append({
            "name": p.get("name"),
            "address": p.get("formatted_address"),
            "rating": p.get("rating"),
            "ratingCount": p.get("user_ratings_total"),
            "priceLevel": price_lvl,
            "priceLabel": _PRICE_LABELS.get(price_lvl) if price_lvl is not None else None,
            "placeId": p.get("place_id"),
            "openNow": (p.get("opening_hours") or {}).get("open_now"),
            "types": p.get("types", [])[:3],
        })
    return out


async def nearby_restaurants(location: str, *, limit: int = 5) -> Optional[list[dict]]:
    """Convenience helper — top-rated restaurants near a place."""
    return await search_places(f"top rated restaurants in {location}", limit=limit)
