# syntax=docker/dockerfile:1
FROM python:3.11-slim

# 系統相依套件
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 複製相依檔案先安裝 (快取最佳化)
COPY requirements-web.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 複製原始碼
COPY . .

# 建立靜態檔目錄
RUN mkdir -p /app/static

# Web Only Mode — 預設啟動 headless 網頁服務
ENV PYTHONUNBUFFERED=1
ENV RUN_MODE=headless

EXPOSE 8080 8081

ENTRYPOINT ["python", "web_only.py"]
