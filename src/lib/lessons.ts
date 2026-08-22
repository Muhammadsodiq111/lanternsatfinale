import { supabase } from "@/integrations/supabase/external";

export type LessonBlockType = "heading" | "text" | "list" | "math";

export type LessonBlock = {
  type: LessonBlockType;
  /** Heading/text: one string. List: one item per line. Math: one equation per line. */
  value: string;
};

export type LessonContent = {
  slug: string;
  videoUrl: string;
  blocks: LessonBlock[];
};

export const EMPTY_LESSON_CONTENT = (slug: string): LessonContent => ({
  slug,
  videoUrl: "",
  blocks: [],
});

function parseBlocks(raw: unknown): LessonBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b): b is LessonBlock => !!b && typeof b === "object" && "type" in b)
    .map((b) => ({ type: (b.type ?? "text") as LessonBlockType, value: String(b.value ?? "") }));
}

export const lessonContentQuery = (slug: string) => ({
  queryKey: ["lesson-content", slug],
  queryFn: async (): Promise<LessonContent> => {
    const { data, error } = await supabase
      .from("lesson_content")
      .select("slug, video_url, blocks")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return EMPTY_LESSON_CONTENT(slug);
    return {
      slug: data.slug,
      videoUrl: data.video_url ?? "",
      blocks: parseBlocks(data.blocks),
    };
  },
});

/** Turns a YouTube / Vimeo / direct link into an embeddable iframe URL. */
export function toEmbedUrl(url: string): string | null {
  const value = url.trim();
  if (!value) return null;

  const yt = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  if (/^https?:\/\//.test(value)) return value;
  return null;
}
