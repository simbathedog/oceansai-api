# FijianAI API (DigitalOcean App Platform)
Deploy steps :
1) Create a GitHub repo (e.g., `fijianai-api`) and upload these files.
2) App Platform → **Web Services** → connect repo (region: same as DB).
3) Build: `npm install && npm run build`
   Run: `npm run migrate && npm start`
4) Env vars:
   - `DATABASE_URL` (Postgres URI with `?sslmode=require`)
   - `CORS_ORIGIN` = `https://fijianai.com`
5) Deploy. Test `/health`. Add custom domain `api.fijianai.com` in **Settings → Domains**.
6) DB → Trusted sources: add the API app; remove any home IPs.
