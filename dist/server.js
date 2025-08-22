import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
const app = express();
/* OCEANSAI_REQ_LOG */
app.use((req, _res, next) => {
    console.log('[REQ]', req.method, req.url);
    next();
});
/* END_OCEANSAI_REQ_LOG */
/* OCEANSAI_ROOT_GUARD */
// Serve a simple message for GET /
app.use((req, res, next) => {
    if (req.method === 'GET' && (req.path === '/' || req.url === '/')) {
        return res.type('text/plain').send('OceansAI API is running. See /health for status.');
    }
    next();
});
/* END_OCEANSAI_ROOT_GUARD */
/* OCEANSAI_ROOT_ROUTE */
app.get('/', (_req, res) => {
    res.type('text/plain').send('OceansAI API is running. See /health for status.');
});
/* END_OCEANSAI_ROOT_ROUTE */ app.use(express.json());
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://fijianai.com';
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
const DATABASE_URL = process.env.DATABASE_URL;
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;
app.use((req, _res, next) => { req.user = { id: 'u1', name: 'Dev', username: 'dev', role: 'STUDENT' }; next(); });
app.get('/health', async (_req, res) => { try {
    if (!pool)
        return res.json({ ok: true, db: false });
    const r = await pool.query('select 1 as ok');
    return res.json({ ok: true, db: r.rows[0].ok === 1 });
}
catch (e) {
    return res.status(500).json({ ok: false, error: e?.message });
} });
app.get('/dashboard', (req, res) => { const u = req.user; if (!u)
    return res.status(401).json({ ok: false }); const route = u.role === 'ADMIN' ? '/admin/home' : u.role === 'TEACHER' ? '/teacher/home' : '/student/home'; res.json({ ok: true, route }); });
app.get('/modules', async (_req, res) => res.json({ ok: true, data: [] }));
const PORT = process.env.PORT || 3000;
app.get('/', (_req, res) => {
    res.type('text/plain').send('OceansAI API is running. See /health for status.');
});
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
