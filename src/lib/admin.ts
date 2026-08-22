import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/external";

/**
 * Admin check backed by the database `is_admin()` security-definer function.
 * The UI uses it to hide content-management screens; the real enforcement is
 * the RLS policies on the content tables.
 */
export const isAdminQuery = () => ({
  queryKey: ["is-admin"],
  queryFn: async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc("is_admin");
    if (error) throw error;
    return Boolean(data);
  },
  staleTime: 5 * 60_000,
});

export function useIsAdmin() {
  const { data, isPending, error } = useQuery(isAdminQuery());
  return { isAdmin: data === true, loading: isPending, error };
}
