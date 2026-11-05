import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "./use-organization";

export interface Member {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "sales" | "member";
  active: boolean;
  created_at: string;
  full_name: string | null;
  email: string | null;
}

export const ROLE_LABEL: Record<Member["role"], string> = { owner: "Proprietário", admin: "Administrador", sales: "Vendedor", member: "Funcionário" };

export function useMembers() {
  const { data: ctx } = useCurrentOrg();
  const orgId = ctx?.organization?.id;
  return useQuery({
    queryKey: ["members", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<Member[]> => {
      if (!orgId) return [];
      const { data: rows, error } = await supabase
        .from("organization_members")
        .select("id, user_id, role, active, created_at")
        .eq("organization_id", orgId)
        .order("created_at");
      if (error) throw error;
      if (!rows.length) return [];
      const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, full_name, email").in("id", rows.map((r) => r.user_id));
      if (profileError) throw profileError;
      return rows.map((r) => {
        const p = profiles?.find((x) => x.id === r.user_id);
        return { ...r, full_name: p?.full_name ?? null, email: p?.email ?? null };
      });
    },
  });
}

export const memberName = (members: Member[] | undefined, userId: string | null) => {
  if (!userId) return "—";
  const m = members?.find((x) => x.user_id === userId);
  return m?.full_name || m?.email || "—";
};
