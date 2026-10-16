FROM node:22-alpine AS deps
WORKDIR /app
# 升級系統套件以修復已知的 Alpine 漏洞
RUN apk upgrade --no-cache
# 啟用 corepack 以支援 pnpm
RUN corepack enable pnpm

# 複製 package.json 與 lock 檔案
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
# 安裝所有相依套件
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk upgrade --no-cache
RUN corepack enable pnpm

# 複製所有原始碼
COPY . .
# 從 deps 階段複製 node_modules（--ignore-scripts 跳過了 prisma generate）
COPY --from=deps /app/node_modules ./node_modules

# 手動執行 prisma generate（因為 --ignore-scripts 跳過了 postinstall）
RUN npx prisma generate

# 執行建置（用 npx next build 繞過 pnpm 11 deps-status-check 鎖定，與本機驗證一致）
RUN npx next build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
RUN apk upgrade --no-cache
RUN corepack enable pnpm
# healthcheck 探活依賴 curl
RUN apk add --no-cache curl
# 應用資料目錄 (NCBDB / uploads / 5T 存證目錄等需要)
RUN mkdir -p /app/data /app/public/uploads /app/Omni-Sanctuary/omni-one-萬能筆記/memories

# 複製構建出的靜態資源與 .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
# 拷貝完整的 node_modules 以解決 ADR-005 提到的 "sh: next: not found" 問題
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml* ./
# 拷貝 workspace 套件（node_modules/@esggo/* 是 symlink 到 packages/*）
COPY --from=builder /app/packages ./packages
# 拷貝 10 層設施 SDK 與 5T 記憶存證（支援 /api/omni-center/radar 等端點）
COPY --from=builder /app/sdks ./sdks
COPY --from=builder /app/Omni-Sanctuary ./Omni-Sanctuary

EXPOSE 3000

# 容器健康探活：Next.js 監聽 0.0.0.0:3000，探 /api/healthz
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f -s -o /dev/null http://127.0.0.1:3000/api/healthz || exit 1

# 啟動服務（綁定 0.0.0.0 以支援 Docker 容器網路與外部請求轉發）
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0"]
