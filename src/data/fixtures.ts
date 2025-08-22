import type { Subject, Module, Lesson } from "../types";

export const subjects: Subject[] = [
  { id: "sub_math", slug: "math", title: "Mathematics" },
  { id: "sub_eng",  slug: "english", title: "English" }
];

export const modules: Module[] = [
  {
    id: "m_fractions_101",
    subjectId: "sub_math",
    grade: 3,
    slug: "fractions-101",
    title: "Fractions 101",
    summary: "Basics of fractions: parts of a whole, equivalence.",
    lang: "en",
    order: 1
  },
  {
    id: "m_addition_review",
    subjectId: "sub_math",
    grade: 3,
    slug: "addition-review",
    title: "Addition Review",
    summary: "Fluency with addition to 1000.",
    lang: "en",
    order: 2
  }
];

export const lessons: Lesson[] = [
  {
    id: "l_frac_what",
    moduleId: "m_fractions_101",
    title: "What is a fraction?",
    order: 1,
    content: {
      blocks: [
        { type: "text", md: "A fraction represents equal parts of a whole." },
        { type: "example", md: "**1/2** means 1 part out of 2 equal parts." },
        {
          type: "mcq",
          stem: "Which equals 1/2?",
          choices: ["0.5", "2/4", "both A and B"],
          answer: 2
        }
      ]
    }
  },
  {
    id: "l_frac_equiv",
    moduleId: "m_fractions_101",
    title: "Equivalent Fractions",
    order: 2,
    content: {
      blocks: [
        { type: "text", md: "Fractions can be equivalent if they represent the same value." },
        { type: "example", md: "1/2 = 2/4 = 3/6" }
      ]
    }
  },
  {
    id: "l_addition_strategy",
    moduleId: "m_addition_review",
    title: "Addition Strategies",
    order: 1,
    content: {
      blocks: [
        { type: "text", md: "Use place value and regrouping to add efficiently." }
      ]
    }
  }
];
