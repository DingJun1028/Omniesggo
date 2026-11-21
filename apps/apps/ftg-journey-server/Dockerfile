FROM node:22-slim

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev

COPY server.js ./

RUN mkdir -p /data /var/www/ftg-journey-web/uploads

VOLUME ["/data", "/var/www/ftg-journey-web/uploads"]

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["node", "server.js"]
