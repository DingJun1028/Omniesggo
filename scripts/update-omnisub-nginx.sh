cat << 'EOF' > /etc/nginx/sites-available/omnisub.esggo.co.conf
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name omnisub.esggo.co;

    ssl_certificate     /etc/letsencrypt/live/omnisub.esggo.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/omnisub.esggo.co/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    access_log /var/log/nginx/omnisub.esggo.co.access.log;
    error_log  /var/log/nginx/omnisub.esggo.co.error.log;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type "text/plain";
        allow all;
    }

    location / {
        proxy_pass http://127.0.0.1:3000/omnisub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
EOF
systemctl reload nginx
