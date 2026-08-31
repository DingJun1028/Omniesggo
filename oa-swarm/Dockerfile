# OA-Team 30 萬能蜂群 — Docker 佈署 (VPS)
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY dist ./dist
ENV PORT=8788
EXPOSE 8788
CMD ["node", "dist/index.js"]
