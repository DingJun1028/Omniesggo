# syntax=docker/dockerfile:1
# mcp-gateway 內網映像 — issue #91 第 5 項
# 注意：CI 之 Docker Build Test 僅建置根 Dockerfile，本映像未在 CI 建置驗證（見 PR 未驗證清單）。
FROM node:22-slim

WORKDIR /app

# pnpm via corepack（repo packageManager: pnpm@11.5.2）
RUN corepack enable

# workspace 清單 + 本 app 原始碼（僅需 mcp-gateway 依賴鏈）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/mcp-gateway ./apps/mcp-gateway

RUN pnpm install --frozen-lockfile --filter @esggo/mcp-gateway...

ENV NODE_ENV=production
ENV PORT=8787
# MCP_GATEWAY_TOKEN 必須於執行時注入（-e），未設定 = fail-closed（受保護路徑 503）
EXPOSE 8787

WORKDIR /app/apps/mcp-gateway
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
