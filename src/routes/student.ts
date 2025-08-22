import { Router } from "express";
import { subjects, modules, lessons } from "../data/fixtures.js";
import type { Attempt, Lesson, Module, ProgressStatus, UserProgress } from "../types";

const r = Router();

// --- In-memory stores (replace with DB later) ---
const progressStore = new Map<string, UserProgress>(); // key: userId|lessonId
const attemptsStore: Attempt[] = [];

function key(userId: string, lessonId: string) {
  return `${userId}|${lessonId}`;
}

// --- Catalog (read-only) ---
r.get("/catalog/grades", (_req, res) => {
  const grades = Array.from(new Set(modules.map(m => m.grade))).sort((a,b)=>a-b);
  res.json({ ok: true, data: grades });
});

r.get("/catalog/subjects", (_req, res) => {
  res.json({ ok: true, data: subjects });
});

r.get("/catalog/grades/:grade/subjects/:subject/modules", (req, res) => {
  const grade = Number(req.params.grade);
  const subjectSlug = String(req.params.subject).toLowerCase();
  const view = (req.query.view as string) || "outline";

  const subject = subjects.find(s => s.slug === subjectSlug);
  if (!subject) return res.status(404).json({ ok: false, error: "subject_not_found" });

  const mods = modules
    .filter(m => m.grade === grade && m.subjectId === subject.id)
    .sort((a,b)=>a.order-b.order);

  const data = mods.map(m => {
    const ls = lessons
      .filter(l => l.moduleId === m.id)
      .sort((a,b)=>a.order-b.order);

    return view === "textbook"
      ? { ...m, lessons: ls }
      : { module: m, lessons: ls.map(({id,title,order}) => ({id,title,order})) };
  });

  res.json({ ok: true, data });
});

r.get("/catalog/modules/:id", (req, res) => {
  const id = req.params.id;
  const view = (req.query.view as string) || "outline";
  const m = modules.find(x => x.id === id);
  if (!m) return res.status(404).json({ ok: false, error: "module_not_found" });
  const ls = lessons.filter(l => l.moduleId === id).sort((a,b)=>a.order-b.order);

  const data = view === "textbook"
    ? { ...m, lessons: ls }
    : { module: m, lessons: ls.map(({id,title,order}) => ({id,title,order})) };

  res.json({ ok: true, data });
});

r.get("/catalog/lessons/:id", (req, res) => {
  const l = lessons.find(x => x.id === req.params.id);
  if (!l) return res.status(404).json({ ok: false, error: "lesson_not_found" });
  res.json({ ok: true, data: l });
});

// --- Progress (proto; in-memory) ---
r.get("/me/progress", (req, res) => {
  const u = (req as any).user?.id || "anon";
  const moduleId = (req.query.moduleId as string) || "";
  const ls = moduleId ? lessons.filter(l => l.moduleId === moduleId) : lessons;

  const items = ls.map(l => {
    const p = progressStore.get(key(u, l.id));
    return {
      lessonId: l.id,
      status: p?.status ?? "not_started",
      score: p?.score ?? null,
      updatedAt: p?.updatedAt ?? null
    };
  });

  res.json({ ok: true, data: items });
});

r.post("/me/progress", (req, res) => {
  const u = (req as any).user?.id || "anon";
  const { lessonId, status, score } = req.body as {
    lessonId: string; status: ProgressStatus; score?: number;
  };

  if (!lessonId || !["not_started","in_progress","completed"].includes(status))
    return res.status(400).json({ ok: false, error: "bad_request" });

  const now = new Date().toISOString();
  const cur = progressStore.get(key(u, lessonId));
  const val: UserProgress = {
    userId: u, lessonId, status, score: typeof score==="number" ? score : cur?.score, updatedAt: now
  };
  progressStore.set(key(u, lessonId), val);
  res.json({ ok: true, data: val });
});

// --- Attempts (proto; simple autograde for MCQ blocks) ---
function autograde(lesson: Lesson, response: any) {
  // response: { blockIndex: number; choice: number }
  const idx = response?.blockIndex;
  const choice = response?.choice;
  const block = lesson.content.blocks[idx];
  if (block && block.type === "mcq" && typeof choice === "number") {
    const correct = block.answer;
    return { score: choice === correct ? 1 : 0, max: 1 };
  }
  return { score: 0, max: 0 };
}

r.post("/me/attempts", (req, res) => {
  const u = (req as any).user?.id || "anon";
  const { lessonId, moduleId, response } = req.body as {
    lessonId: string; moduleId: string; response: any;
  };

  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson || lesson.moduleId !== moduleId) {
    return res.status(400).json({ ok: false, error: "bad_request" });
  }

  const existing = attemptsStore.filter(a => a.userId===u && a.lessonId===lessonId);
  const tryIndex = existing.length + 1;
  const { score, max } = autograde(lesson, response);

  const attempt: Attempt = {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: u,
    moduleId,
    lessonId,
    tryIndex,
    startedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    response,
    autograded: max > 0,
    score: max>0 ? score : undefined,
    maxScore: max>0 ? max : undefined,
    status: max>0 ? "graded" : "submitted",
    feedback: max>0 ? { auto: score===max ? "Great job!" : "Review the concept and try again." } : undefined
  };

  attemptsStore.push(attempt);
  // Optionally bump progress
  if (max>0) {
    const status: ProgressStatus = score===max ? "completed" : "in_progress";
    const now = new Date().toISOString();
    const p = { userId: u, lessonId, status, score, updatedAt: now };
    progressStore.set(key(u, lessonId), p);
  }

  res.json({ ok: true, data: attempt });
});

r.get("/me/attempts", (req, res) => {
  const u = (req as any).user?.id || "anon";
  const lessonId = req.query.lessonId as string | undefined;
  const moduleId = req.query.moduleId as string | undefined;

  let data = attemptsStore.filter(a => a.userId === u);
  if (lessonId) data = data.filter(a => a.lessonId === lessonId);
  if (moduleId) data = data.filter(a => a.moduleId === moduleId);

  // newest first
  data.sort((a,b)=> (b.submittedAt||"").localeCompare(a.submittedAt||""));
  res.json({ ok: true, data });
});

export const studentRouter = r;


