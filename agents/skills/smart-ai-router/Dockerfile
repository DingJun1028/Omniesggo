# Smart AI Router - 生產 Docker 映像
# 多階段構建 (Multi-stage build) 以縮小映像體大小

# ===== Build Stage =====
FROM node:20-alpine AS builder

WORKDIR /app

# 安裝依賴
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 複製程式碼
COPY . .

# 建置 TypeScript (如果需要)
RUN if [ -f "tsconfig.json" ]; then \
        npm install -g typescript && \
        npx tsc --build; \
    fi

# ===== Production Stage =====
FROM node:20-alpine AS production

WORKDIR /app

# 僅安裝生產依賴
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 複製編譯後的程式碼
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/*.md ./

# 建立非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app
USER nextjs

# 環境變數
ENV NODE_ENV=production
ENV PORT=3000

# 暴露埠口
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# 啟動指令
CMD ["node", "dist/index.js"]