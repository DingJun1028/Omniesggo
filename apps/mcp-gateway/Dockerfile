# syntax=docker/dockerfile:1
# mcp-gateway 內網映像 — issue #91 第 5 項
# 注意：CI 之 Docker Build Test 僅建置根 Dockerfile，本映像未在 CI 建置驗證（見 PR 未驗證清單）。
FROM node:22-slim

WORKDIR /app

# corepack 快取集中於固定路徑（供 non-root 使用者執行期讀取，避免執行期連網下載 pnpm）
ENV COREPACK_HOME=/corepack

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

# 非 root 執行（SonarCloud docker:S6471：node 映像預設以 root 用戶執行，屬安全風險）。
# node 官方映像內建 uid=1000 之 node 使用者；corepack 快取歸屬該使用者，
# 執行期 pnpm 使用建置時快取的 pinned 版本，無需 root、無需連網。
RUN chown -R node:node /corepack
USER node

WORKDIR /app/apps/mcp-gateway
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
