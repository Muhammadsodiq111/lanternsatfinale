export type ImportedQuestion = {
  subject: string;
  module: string;
  subtopic: string;
  level: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string[];
  desmos: string[];
  desmos_note: string;
  sort_index: number;
};

const LEVELS = ["easy", "medium", "hard", "challenge"];

function splitLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value ?? "")
    .split(/\||\n/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function answerToIndex(value: unknown, choices: string[]): number {
  const raw = String(value ?? "0").trim();
  const letter = raw.toUpperCase();
  if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
  const num = Number(raw);
  if (Number.isFinite(num)) return num >= 1 && num <= choices.length && !raw.startsWith("0") ? num - 1 : num;
  const match = choices.findIndex((c) => c === raw);
  return match >= 0 ? match : 0;
}

/** Minimal RFC4180 CSV parser (handles quotes, escaped quotes, newlines in fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function normalizeRecord(record: Record<string, unknown>, fallbackSubject: string): ImportedQuestion | string {
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const found = Object.keys(record).find((k) => k.trim().toLowerCase() === key);
      if (found && record[found] !== undefined && record[found] !== null && String(record[found]).trim() !== "") {
        return record[found];
      }
    }
    return undefined;
  };

  const prompt = String(get("prompt", "question", "question text") ?? "").trim();
  if (!prompt) return "Row skipped: missing question prompt.";

  let choices = get("choices");
  let list: string[];
  if (Array.isArray(choices)) list = choices.map((c) => String(c).trim()).filter(Boolean);
  else if (typeof choices === "string" && choices.trim()) list = splitLines(choices);
  else
    list = ["a", "b", "c", "d"]
      .map((l) => get(`choice${l}`, `choice_${l}`, `option${l}`, l))
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);

  if (list.length < 2) return `Row skipped ("${prompt.slice(0, 40)}"): needs at least two answer choices.`;

  const level = String(get("level", "difficulty") ?? "medium").trim().toLowerCase();
  const answer = answerToIndex(get("answer", "correct", "correct answer"), list);
  if (answer < 0 || answer >= list.length)
    return `Row skipped ("${prompt.slice(0, 40)}"): correct answer is out of range.`;

  const subjectRaw = String(get("subject") ?? fallbackSubject).trim().toLowerCase();

  return {
    subject: subjectRaw === "english" || subjectRaw === "rw" ? "english" : "math",
    module: String(get("module", "module title", "topic module") ?? "").trim(),
    subtopic: String(get("subtopic", "sub topic") ?? "").trim(),
    level: LEVELS.includes(level) ? level : "medium",
    prompt,
    choices: list,
    answer,
    explanation: splitLines(get("explanation", "solution", "traditional solution")),
    desmos: splitLines(get("desmos", "desmos solution")),
    desmos_note: String(get("desmos_note", "desmos note") ?? "").trim(),
    sort_index: Number(get("sort_index", "order", "sort") ?? 0) || 0,
  };
}

export function parseQuestionImport(
  text: string,
  fallbackSubject: string,
): { questions: ImportedQuestion[]; errors: string[] } {
  const trimmed = text.trim();
  if (!trimmed) return { questions: [], errors: ["Nothing to import."] };

  let records: Record<string, unknown>[];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      return { questions: [], errors: [`Invalid JSON: ${(err as Error).message}`] };
    }
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { questions?: unknown }).questions)
        ? (parsed as { questions: unknown[] }).questions
        : [parsed];
    records = arr as Record<string, unknown>[];
  } else {
    const rows = parseCsv(trimmed);
    if (rows.length < 2) return { questions: [], errors: ["CSV needs a header row and at least one data row."] };
    const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
    records = rows.slice(1).map((row) => {
      const obj: Record<string, unknown> = {};
      header.forEach((key, i) => {
        obj[key] = row[i] ?? "";
      });
      return obj;
    });
  }

  const questions: ImportedQuestion[] = [];
  const errors: string[] = [];
  for (const record of records) {
    const result = normalizeRecord(record, fallbackSubject);
    if (typeof result === "string") errors.push(result);
    else questions.push(result);
  }
  return { questions, errors };
}

export const CSV_TEMPLATE = `subject,module,subtopic,level,prompt,choiceA,choiceB,choiceC,choiceD,answer,explanation,desmos,desmos_note,sort_index
math,Linear Equations in 1 Variable,Isolating for One Variable,medium,"If 4x + 9 = 33, what is x + 2?",6,8,10,12,B,"Subtract 9|4x = 24|x = 6|x + 2 = 8","4x_1 + 9 ~ 33|x_1 + 2 = 8","Regression solves for x_1 instantly.",0`;
