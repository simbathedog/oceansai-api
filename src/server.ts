import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { studentRouter } from "./routes/student.js";

type Role = "ADMIN" | "TEACHER" | "STUDENT";
type User = { id: string; name: string; username: string; role: Role };

const app = express();

// Security headers
app.use(helmet());

// Tiny request logger
app.use(morgan("tiny"));

// JSON parser (keep early)
app.use(express.json());

// Global rate limit
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });
app.use(limiter);// Parse JSON before any routers that need it
app.use(express.json());

// Root route (single, canonical)
app.get("/", (_req, res) => {
  res.type("text/plain").send("OceansAI API is running. See /health for status.");
});

// CORS (keep your origin)
const CORS_ORIGIN = process\.env\.CORS_ORIGIN || "https://fijianai.com";
const ORIGINS = CORS_ORIGIN.split(',').map(o=>o.trim()).filter(Boolean);
app.use(cors({ origin: ORIGINS.length>1 ? ORIGINS : ORIGINS[0], credentials: true }));

// DB pool (optional)
const DATABASE_URL = process.env.DATABASE_URL;
const pool =
  DATABASE_URL
    ? new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
    : null;

// Demo user
app.use((req, _res, next) => {
  (req as any).user = {
    id: "u1",
    name: "Dev",
    username: "dev",
    role: "STUDENT" as Role,
  };
  next();
});

// Health
app.get("/health", async (_req, res) => {
  try {
    if (!pool) return res.json({ ok: true, db: false });
    const r = await pool.query("select 1 as ok");
    return res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message });
  }
});
const attemptsLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

const attemptSchema = z.object({
  lessonId: z.string().min(1),
  moduleId: z.string().min(1),
  response: z.object({
    blockIndex: z.number().int().min(0),
    choice: z.number().int().min(0)
  })
});

app.use("/me/attempts", attemptsLimiter, (req, res, next) => {
  const valid = attemptSchema.safeParse(req.body);
  if (!valid.success) {
    return res.status(400).json({ ok: false, error: "Invalid payload", details: valid.error.flatten() });
  }
  next();
});
// Mount student APIs
app.use(studentRouter);
// Tiny ping for quick smoke-tests
app.get("/catalog/ping", (_req, res) => res.json({ ok: true }));

// Other demo endpoints
app.get("/dashboard", (req, res) => {
  const u = (req as any).user as User | undefined;
  if (!u) return res.status(401).json({ ok: false });
  const route =
    u.role === "ADMIN"
      ? "/admin/home"
      : u.role === "TEACHER"
      ? "/teacher/home"
      : "/student/home";
  res.json({ ok: true, route });
});

app.get("/modules", async (_req, res) => res.json({ ok: true, data: [] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));

