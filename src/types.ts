export type Grade = number;

export type Subject = {
  id: string;
  slug: string;
  title: string;
};

export type Module = {
  id: string;
  subjectId: string;
  grade: number;
  slug: string;
  title: string;
  summary?: string;
  lang?: string;
  order: number;
};

export type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  content: {
    blocks: Array<
      | { type: "text"; md: string }
      | { type: "image"; src: string; alt?: string }
      | { type: "video"; url: string; caption?: string }
      | { type: "example"; md: string }
      | { type: "mcq"; stem: string; choices: string[]; answer: number }
    >;
  };
};

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export type UserProgress = {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  score?: number;
  updatedAt: string; // ISO
};

export type AttemptStatus = "started" | "submitted" | "graded";

export type Attempt = {
  id: string;
  userId: string;
  moduleId: string;
  lessonId: string;
  activityId?: string;    // if a block has an implicit id, else derived index
  tryIndex: number;
  startedAt: string;
  submittedAt?: string;
  durationMs?: number;
  response: any;
  autograded?: boolean;
  score?: number;
  maxScore?: number;
  status: AttemptStatus;
  feedback?: any;
};
