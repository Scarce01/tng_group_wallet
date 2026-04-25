"""OpenWeather adapter (5-day / 3-hour forecast).

Free tier: 1,000 calls/day, ~60/min. We hit /geo + /forecast — exactly two
calls per refresh — and the result is cached on PoolAgentMemory.weatherCache
for 12h (trip pools) / 7d (others), so a single project won't come close
to the cap.

The output shape is intentionally Claude-friendly: just the prose snippets
the prompt needs (`current`, `forecast` array of plain dicts, `alerts`)."""
import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx

log = logging.getLogger("agent.weather")

GEO_URL = "https://api.openweathermap.org/geo/1.0/direct"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"


def _api_key() -> Optional[str]:
    return os.getenv("OPENWEATHER_API_KEY") or None


async def get_forecast(location: str, *, days: int = 3) -> Optional[dict]:
    """Returns {current, forecast: [...], alerts: [...]} or None on failure.

    Never raises — graceful degradation is the design (the agent should
    still work without weather)."""
    key = _api_key()
    if not key:
        log.info("OPENWEATHER_API_KEY not set, skipping weather fetch")
        return None

    days = max(1, min(days, 5))  # free-tier 5-day cap

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            geo_r = await client.get(GEO_URL, params={"q": location, "limit": 1, "appid": key})
            geo_r.raise_for_status()
            geo = geo_r.json()
            if not geo:
                log.warning("openweather geocode empty for %r", location)
                return None
            lat, lon = geo[0]["lat"], geo[0]["lon"]
            country = geo[0].get("country")

            f_r = await client.get(FORECAST_URL, params={
                "lat": lat, "lon": lon, "appid": key, "units": "metric",
                "cnt": days * 8,  # 3-hour intervals
            })
            f_r.raise_for_status()
            f = f_r.json()
    except Exception as e:
        log.warning("openweather fetch failed for %s: %s", location, e)
        return None

    # Compress 3-hourly into per-day high/low/description
    by_day: dict[str, dict] = {}
    for entry in f.get("list", []):
        ts = entry.get("dt_txt", "")[:10]  # "YYYY-MM-DD"
        if not ts:
            continue
        slot = by_day.setdefault(ts, {
            "date": ts, "temp_high": -1e9, "temp_low": 1e9,
            "descriptions": set(), "rain_mm": 0.0, "any_thunderstorm": False,
        })
        main = entry.get("main", {})
        slot["temp_high"] = max(slot["temp_high"], main.get("temp_max", main.get("temp", 0)))
        slot["temp_low"] = min(slot["temp_low"], main.get("temp_min", main.get("temp", 0)))
        for w in entry.get("weather", []):
            slot["descriptions"].add(w.get("description", "").lower())
            if "thunder" in (w.get("main", "") or "").lower():
                slot["any_thunderstorm"] = True
        slot["rain_mm"] += float(entry.get("rain", {}).get("3h", 0) or 0)

    forecast = []
    alerts: list[str] = []
    for date in sorted(by_day.keys())[:days]:
        d = by_day[date]
        # Pick the most informative description (prefer 'thunderstorm' / 'rain' over 'clouds')
        descs = d["descriptions"]
        priority = ("thunderstorm", "snow", "heavy rain", "rain", "drizzle", "clouds", "clear")
        chosen = next((p for p in priority if any(p in x for x in descs)), next(iter(descs), "")) or "—"
        forecast.append({
            "date": date,
            "description": chosen,
            "temp_high": round(d["temp_high"]),
            "temp_low": round(d["temp_low"]),
            "rain_mm": round(d["rain_mm"], 1),
        })
        if d["any_thunderstorm"] or d["rain_mm"] > 10:
            alerts.append(f"{date}: heavy rain / thunderstorms expected")

    current = forecast[0]["description"] if forecast else "—"
    return {
        "location": location,
        "country": country,
        "current": current,
        "forecast": forecast,
        "alerts": alerts,
        "fetchedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
