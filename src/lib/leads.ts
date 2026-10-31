import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useCurrentOrg } from "@/hooks/use-organization";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInput = Pick<Lead, "name" | "phone" | "email" | "source" | "stage" | "assigned_to" | "notes" | "estimated_value">;

export const LEAD_SOURCES = ["WhatsApp", "Instagram", "Facebook", "Google", "Site", "Indicação", "Outro"];

export function useLeads() {
  const { data: ctx } = useCurrentOrg();
  const orgId = ctx?.organization?.id;
  return useQuery({
    queryKey: ["leads", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveLead() {
  const qc = useQueryClient();
  const { data: ctx } = useCurrentOrg();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: LeadInput }) => {
      const orgId = ctx?.organization?.id;
      if (!orgId) throw new Error("Empresa não encontrada.");
      const q = id
        ? supabase.from("leads").update(values).eq("id", id)
        : supabase.from("leads").insert({ ...values, organization_id: orgId });
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.id ? "Lead atualizado." : "Lead adicionado.");
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: Error) => toast.error(`Não foi possível salvar: ${e.message}`),
  });
}

export function useMoveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Lead["stage"] }) => {
      const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const snapshots = qc.getQueriesData<Lead[]>({ queryKey: ["leads"] });
      snapshots.forEach(([key, data]) => qc.setQueryData(key, data?.map((l) => (l.id === id ? { ...l, stage } : l))));
      return { snapshots };
    },
    onError: (e: Error, _v, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(`Não foi possível mover: ${e.message}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}
