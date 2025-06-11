FROM python:3.13-slim-bullseye AS base

# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy the application into the container.
COPY . /app

# Install the application dependencies.
WORKDIR /app
RUN uv sync --frozen --no-cache

# Production target
FROM base AS production
CMD ["/app/.venv/bin/fastapi", "run", "app/main.py", "--port", "80"]

# Development target
FROM base AS development
RUN uv pip install --system fastapi uvicorn[standard] watchfiles
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]