import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const currentOrgQuery = queryOptions({
  queryKey: ["current-organization"],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return null;
    // Aceita convites pendentes para o e-mail confirmado (validado no servidor)
    await supabase.rpc("accept_pending_invites");
    const [{ data: membership }, { data: profile }] = await Promise.all([
      supabase
        .from("organization_members")
        .select("role, organization:organizations(id, name, phone, document)")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("created_at")
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    ]);
    return {
      user,
      profile,
      role: membership?.role ?? null,
      organization: membership?.organization ?? null,
    };
  },
});

export const useCurrentOrg = () => useQuery(currentOrgQuery);
