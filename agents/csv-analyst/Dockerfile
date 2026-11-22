FROM ghcr.io/astral-sh/uv:0.11-debian-slim

# The worker's Temporal client reads the system CA certificates, which the base image does not ship.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# uv installs the Python version the project asks for, so the image needs none of its own. It goes
# outside /root so that the worker's user can run it. UV_PYTHON pins the version: the managed
# build context does not carry dotfiles such as .python-version.
ENV UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_INSTALL_DIR=/opt/python \
    UV_PYTHON=3.12 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app
# Copy only the files the worker needs: never the whole build context.
COPY pyproject.toml uv.lock README.md ./
COPY main.py ./
# --no-build: install only pre-built wheels, never run setup scripts from source distributions.
RUN uv sync --frozen --no-dev --no-build \
 && useradd --create-home --shell /usr/sbin/nologin agent \
 && chown -R agent:agent /app

# The worker does not need root.
USER agent

CMD ["agents", "run-worker"]
