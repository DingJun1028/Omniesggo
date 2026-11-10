FROM ghcr.io/astral-sh/uv:0.11-debian-slim

# The worker's Temporal client reads the system CA certificates, which the base image does not ship.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# uv installs the Python version the project asks for, so the image needs none of its own. It goes
# outside /root so that the worker's user can run it.
ENV UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_INSTALL_DIR=/opt/python \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app
COPY . .
RUN uv sync --frozen --no-dev \
 && useradd --create-home --shell /usr/sbin/nologin agent \
 && chown -R agent:agent /app

# The worker does not need root.
USER agent

CMD ["agents", "run-worker"]
