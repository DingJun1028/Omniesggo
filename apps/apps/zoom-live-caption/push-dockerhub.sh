#!/usr/bin/env bash
# Docker Hub 推送腳本 — zoom-live-caption
set -e

IMAGE="dingjunhong1028/zoom-live-caption"
TAG="${1:-latest}"

echo "=== 登入 Docker Hub ==="
docker login

echo "=== 標記映像 ==="
docker tag zoom-live-caption:latest ${IMAGE}:${TAG}

echo "=== 推送 Docker Hub ==="
docker push ${IMAGE}:${TAG}

echo "=== 完成 ==="
echo "部署指令："
echo "  docker run -d --restart unless-stopped \ "
echo "    -p 8080:8080 -p 8081:8081 \ "
echo "    -e OLLAMA_API_KEY=<your_key> \ "
echo "    ${IMAGE}:${TAG}"
