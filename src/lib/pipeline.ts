import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-organization";
export function usePipeline() {
  const { data: ctx } = useCurrentOrg();
  const id = ctx?.organization?.id;
  return useQuery({ queryKey: ["pipeline", id], enabled: !!id, queryFn: async () => {
    if (!id) return [];
    const { data, error } = await supabase.from("pipeline_stages").select("*").eq("organization_id", id).order("position");
    if (error) throw error;
    return data;
  } });
}