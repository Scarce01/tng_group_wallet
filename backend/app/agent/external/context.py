"""Aggregator — fetches all enabled external context for a pool and caches
it on PoolAgentMemory. Today only weather is wired; maps/currency/search
slots are reserved for future adapters (each one is independently optional)."""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..memory import get_pool_memory, upsert_pool_memory
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

    # Fetch in parallel where adapters exist
    weather = None
    if mem.location:
        weather = await weather_adapter.get_forecast(
            mem.location,
            days=min(5, max(1, state.get("daysRemaining") or 3)),
        )

    await upsert_pool_memory(
        session, pool_id,
        weatherCache=weather,
        lastContextRefresh=datetime.now(timezone.utc),
    )
    return {"weather": weather, "fetchedAt": datetime.now(timezone.utc).isoformat()}


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
    if not lines:
        return ""
    return "\n\nEXTERNAL CONTEXT:\n" + "\n".join(lines)
