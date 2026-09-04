FROM python:3.11-slim

WORKDIR /app

# Install ffmpeg (needed for rendering)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY aistation/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI Station package
COPY aistation/ ./aistation/

# Create storage directory
RUN mkdir -p /storage/aistation

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8788/health')"

EXPOSE 8788

CMD ["python3", "-m", "aistation"]