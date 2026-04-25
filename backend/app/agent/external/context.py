"""Aggregator — fetches all enabled external context for a pool and caches
it on PoolAgentMemory. Today only weather is wired; maps/currency/search
slots are reserved for future adapters (each one is independently optional)."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..memory import get_pool_memory, upsert_pool_memory
from . import maps as maps_adapter
from . import weather as weather_adapter


async def refresh_context_if_needed(
    session: AsyncSession, pool_id: str, *, force: bool = False,
) -> Optional[dict]:
    """Refresh external context if stale (or `force=True`). Returns the
    new (or cached) context dict, or None if there's no agent memory yet."""
    mem = await get_pool_memory(session, pool_id)
    if mem is None:
        return None

    # TRIP pools refresh every 12h, others every 7d
    pool_type_q = mem.poolId  # placeholder — read pool type from state
    from ..state import pool_financial_state
    state = await pool_financial_state(session, pool_id)
    is_trip = state.get("type") == "TRIP"
    refresh_interval_hours = 12 if is_trip else 168

    if not force and mem.lastContextRefresh:
        age_h = (datetime.now(timezone.utc) - mem.lastContextRefresh).total_seconds() / 3600
        if age_h < refresh_interval_hours:
            return _read_cache(mem)

    # Fetch in parallel where adapters exist. Both adapters fail-open:
    # a None return just means that slot stays empty in the cache.
    import asyncio as _asyncio
    weather = None
    places = None
    if mem.location:
        days = min(5, max(1, state.get("daysRemaining") or 3))
        weather, places = await _asyncio.gather(
            weather_adapter.get_forecast(mem.location, days=days),
            maps_adapter.nearby_restaurants(mem.location, limit=5),
            return_exceptions=False,
        )

    await upsert_pool_memory(
        session, pool_id,
        weatherCache=weather,
        locationTips={"restaurants": places} if places else None,
        lastContextRefresh=datetime.now(timezone.utc),
    )
    return {
        "weather": weather,
        "locationTips": {"restaurants": places} if places else None,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }


def _read_cache(mem) -> dict:
    return {
        "weather": mem.weatherCache,
        "locationTips": mem.locationTips,
        "currencyRates": mem.currencyRates,
        "searchCache": mem.searchCache,
        "fetchedAt": mem.lastContextRefresh.isoformat() if mem.lastContextRefresh else None,
    }


def format_external_for_prompt(context: Optional[dict]) -> str:
    """Render a small chunk to splice into LLM prompts. Empty string if
    nothing is cached."""
    if not context:
        return ""
    lines = []
    w = context.get("weather")
    if w and w.get("forecast"):
        head = f"WEATHER ({w.get('location', '?')}): currently {w.get('current')}."
        details = "; ".join(
            f"{f['date']} {f['description']} {f['temp_low']}-{f['temp_high']}°C"
            for f in w["forecast"][:3]
        )
        alerts = "; ".join(w.get("alerts", []) or [])
        chunk = head + " Forecast: " + details + (f". ⚠ {alerts}" if alerts else "")
        lines.append(chunk)

    tips = context.get("locationTips") or {}
    rests = tips.get("restaurants") or []
    if rests:
        rest_lines = []
        for p in rests[:5]:
            star = f"{p.get('rating')}★" if p.get("rating") else "no rating"
            count = f" ({p.get('ratingCount')})" if p.get("ratingCount") else ""
            price = f" {p['priceLabel']}" if p.get("priceLabel") else ""
            rest_lines.append(f"- {p.get('name')}: {star}{count}{price}")
        lines.append("NEARBY RESTAURANTS (use as alternative suggestions when relevant):\n"
                     + "\n".join(rest_lines))

    if not lines:
        return ""
    return "\n\nEXTERNAL CONTEXT:\n" + "\n".join(lines)
