export type Subject = "math" | "english" | "reading" | "desmos";

export type CourseGroup = { title: string; lessons: string[] };

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: "Math",
  english: "English",
  reading: "Reading",
  desmos: "Desmos",
};

export const COURSES: Record<Subject, CourseGroup[]> = {
  math: [
    { title: "Algebra", lessons: ["Prerequisites", "Systems of Linear Equations"] },
    {
      title: "Advanced Math",
      lessons: [
        "Equivalent Expressions",
        "Exponents",
        "Basic Quadratics",
        "Graphing Polynomial Functions",
        "Polynomials",
        "Graphing Quadratics",
        "Miscellaneous Functions",
      ],
    },
    {
      title: "Problem-Solving and Data Analysis",
      lessons: [
        "Probability",
        "Ratios and Proportions",
        "Rates",
        "Surveys and Sampling",
        "One Variable Data",
        "Two-Variable Data",
        "Statistics and Graphs",
      ],
    },
    {
      title: "Geometry and Trigonometry",
      lessons: ["Trigonometry", "Geometry", "Volume and Surface Area", "Shapes"],
    },
  ],
  english: [
    {
      title: "Clauses and Punctuation Fundamentals",
      lessons: [
        "Independent vs. Dependent Clauses",
        "Fragments, Run-Ons, and Comma Splices",
        "Periods and Semicolons",
        "Colons",
        "Commas (Pt. 1)",
        "Commas (Pt. 2)",
        "Commas (Pt. 3)",
        "Practice Problems",
      ],
    },
    {
      title: "Sentence Structure and Clarity",
      lessons: [
        "Lists",
        "Non-essential Information",
        "Relative Clauses",
        "Comma Rules",
        "Practice Problems",
      ],
    },
    {
      title: "Mastering Subject-Verb Agreement",
      lessons: [
        "Basic Subject-Verb Agreement",
        "Advanced Subject-Verb Agreement (Pt. 1)",
        "Advanced Subject-Verb Agreement (Pt. 2)",
        "Collective Nouns and Pronouns",
        "Practice Problems",
      ],
    },
    {
      title: "Verbs and Modifiers in Action",
      lessons: [
        "Verb Tense",
        "Gerunds and Infinitives",
        "Dangling Modifiers",
        "Practice Problems",
      ],
    },
  ],
  reading: [
    {
      title: "Craft and Structure",
      lessons: [
        "Prerequisites for Words in Context",
        "Words in Context",
        "Text Structure & Purpose",
        "Text Structure — Part 2",
        "Text Structure — Part 3",
        "Overall Text Structure",
        "Cross-Text Connections",
      ],
    },
    {
      title: "Information and Ideas",
      lessons: [
        "Central Ideas & Details",
        "Inferences",
        "Command of Evidence",
        "Command of Evidence (Quantitative)",
      ],
    },
    {
      title: "Expression of Ideas",
      lessons: ["Rhetorical Synthesis", "Mastering Transitions"],
    },
  ],
  desmos: [
    {
      title: "Foundations",
      lessons: [
        "Introduction to Desmos",
        "Sum of Solutions",
        "Equivalent Expressions",
        "Table Regression",
        "Table to Function",
        "Basic Regression",
        "Exactly One Solution / No Solutions",
      ],
    },
    {
      title: "Solve by Element List Regression",
      lessons: [
        "Equivalent Expressions",
        "Circle Geometry Keywords",
        "System of Linear Equations — Infinitely Many Solutions",
        "Finding Coefficients from an Equation",
        "No-Real-Solution Conditions",
        "Finding Quadratics from Given Conditions",
        "Determining Coefficients by Composition",
        "Mixture Problems",
        "Exponential Functions",
      ],
    },
    {
      title: "Solve by Table/Function Regression",
      lessons: [
        "Line Through Points",
        "Circle Equation",
        "Percent Relationships",
        "Percentage-Based Problems",
        "Exponential Functions",
        "Polynomial Multiplication",
      ],
    },
    {
      title: "Solve by Graphing",
      lessons: [
        "Exponential Inequalities",
        "Geometry Visualization",
        "Equations with Parameters",
        "Perpendicular Lines",
        "Ratio Partitioning",
        "Quadratic Vertex",
        "Quadratic Roots and Points",
        "Identifying Points on Equations",
        "System of Equations — One Solution",
      ],
    },
  ],
};

export function lessonSlug(subject: Subject, group: string, lesson: string): string {
  return `${subject}-${slugify(group)}-${slugify(lesson)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type LessonEntry = {
  slug: string;
  subject: Subject;
  group: string;
  title: string;
  index: number;
};

export const ALL_LESSONS: LessonEntry[] = (
  Object.keys(COURSES) as Subject[]
).flatMap((subject) =>
  COURSES[subject].flatMap((group) =>
    group.lessons.map((title, i) => ({
      slug: lessonSlug(subject, group.title, title),
      subject,
      group: group.title,
      title,
      index: i + 1,
    })),
  ),
);

export function findLesson(slug: string): LessonEntry | undefined {
  return ALL_LESSONS.find((l) => l.slug === slug);
}
