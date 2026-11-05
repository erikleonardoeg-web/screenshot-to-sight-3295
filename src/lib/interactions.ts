import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-organization";
import { toast } from "sonner";
export const INTERACTION_TYPES = { ligacao: "Ligação", mensagem: "Mensagem", reuniao: "Reunião", nota: "Anotação", outro: "Outro" };
export function useInteractions(leadId?: string, clientId?: string) {
  const { data: ctx } = useCurrentOrg();
  const org = ctx?.organization?.id;
  return useQuery({ queryKey: ["interactions", org, leadId, clientId], enabled: !!org && !!(leadId || clientId), queryFn: async () => {
    if (!org) return [];
    let query = supabase.from("interactions").select("*").eq("organization_id", org).order("created_at", { ascending: false });
    if (leadId) query = query.eq("lead_id", leadId);
    else if (clientId) query = query.eq("client_id", clientId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } });
}
export function useAddInteraction() {
  const { data: ctx } = useCurrentOrg();
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (values: { lead_id?: string; client_id?: string; type: string; content: string }) => {
    if (!ctx?.organization || !values.content.trim()) throw new Error("Preencha o conteúdo da interação.");
    const { error } = await supabase.from("interactions").insert({ ...values, content: values.content.trim(), organization_id: ctx.organization.id, created_by: ctx.user.id });
    if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["interactions"] }); toast.success("Interação registrada."); }, onError: (e: Error) => toast.error(e.message) });
}