# Cache Strategy

## Static Assets
- Location: `/_next/static/`
- Cache-Control: `public, immutable, max-age=14400`
- Nginx: `expires 4h;`

## API Responses
- `/api/health`: `no-cache`
- `/api/health?format=metrics`: `no-cache`
- `/api/evidence-upload`: `no-store`
- `/api/agentic-twin`: `private, no-cache`

## CDN
- Cloudflare in front of esggo.co
- Stale-while-revalidate: enabled via Cloudflare settings
