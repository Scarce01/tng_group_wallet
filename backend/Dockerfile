# Python FastAPI runtime for App Runner / ECS / any container host.
# Build context is the `backend/` directory of the repo (point App Runner's
# "Source directory" at backend/).

FROM python:3.12-slim AS runtime

WORKDIR /app

# OpenCV's `cv2` needs libGL + glib at import time even on headless servers.
# tini gives us proper signal handling for Ctrl-C / SIGTERM on shutdown.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 tini curl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./app_src
# Repo layout has the Python package under backend/app/. Copying the
# directory above lets `app.main:app` resolve as a module without a
# fragile `cd app` step.
RUN mv app_src/app ./app && rm -rf app_src

ENV PORT=8000 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${PORT}/api/v1/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
