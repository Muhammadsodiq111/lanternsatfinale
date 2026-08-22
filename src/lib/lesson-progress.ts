import { supabase } from "@/integrations/supabase/external";

export type LessonProgressMap = Record<string, boolean>;

export const lessonProgressQuery = () => ({
  queryKey: ["lesson-progress"],
  queryFn: async (): Promise<LessonProgressMap> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return {};

    const { data, error } = await supabase
      .from("lesson_progress")
      .select("slug, completed")
      .eq("user_id", userId);
    if (error) throw error;

    const map: LessonProgressMap = {};
    for (const row of data ?? []) map[row.slug] = row.completed;
    return map;
  },
});

export async function setLessonCompleted(slug: string, completed: boolean): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("You must be signed in to track lessons.");

  const { error } = await supabase
    .from("lesson_progress")
    .upsert({ user_id: userId, slug, completed }, { onConflict: "user_id,slug" });
  if (error) throw error;
}
