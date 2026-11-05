import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useCurrentOrg } from "@/hooks/use-organization";
import { moneyValue } from "@/lib/contact";

type Tables = Database["public"]["Tables"];
export type Client = Tables["clients"]["Row"];
export type Budget = Tables["budgets"]["Row"];
export type Task = Tables["tasks"]["Row"];
type OrgTable = "clients" | "budgets" | "tasks";

const ORDER: Record<OrgTable, string> = { clients: "created_at", budgets: "budget_date", tasks: "due_at" };

export function useOrgRows<T extends OrgTable>(table: T) {
  const { data: ctx } = useCurrentOrg();
  const orgId = ctx?.organization?.id;
  return useQuery({
    queryKey: [table, orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as Tables[T]["Row"][];
      const { data, error } = await supabase.from(table as "clients").select("*").eq("organization_id", orgId)
        .order(ORDER[table], { ascending: table === "tasks", nullsFirst: false });
      if (error) throw error;
      return data as unknown as Tables[T]["Row"][];
    },
  });
}

const MSG: Record<OrgTable, string> = { clients: "Cliente", budgets: "Orçamento", tasks: "Tarefa" };

export function useSaveRow<T extends OrgTable>(table: T) {
  const qc = useQueryClient();
  const { data: ctx } = useCurrentOrg();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Omit<Tables[T]["Insert"], "organization_id"> }) => {
      const orgId = ctx?.organization?.id;
      if (!orgId) throw new Error("Empresa não encontrada.");
      // organization_id vem da associação validada no servidor; o banco rejeita qualquer outra empresa
      const { data, error } = id
        ? await supabase.from(table as "clients").update(values as never).eq("id", id).eq("organization_id", orgId).select("id")
        : await supabase.from(table as "clients").insert({ ...values, organization_id: orgId } as never).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Registro não encontrado ou acesso negado.");
    },
    onSuccess: (_d, v) => {
      toast.success(`${MSG[table]} ${v.id ? "atualizado" : "salvo"}.`);
      qc.invalidateQueries({ queryKey: [table] });
    },
    onError: (e: Error) => toast.error(`Não foi possível salvar: ${e.message}`),
  });
}

export function useDeleteRow(table: OrgTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from(table as "clients").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data.length) throw new Error("Apenas administradores podem excluir.");
    },
    onSuccess: () => { toast.success(`${MSG[table]} excluído.`); qc.invalidateQueries({ queryKey: [table] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const BUDGET_STATUS = { rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", recusado: "Recusado" } as const;
export const TASK_STATUS = { pendente: "Pendente", em_andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" } as const;

export const parseMoney = (v: FormDataEntryValue | null) => {
  return moneyValue(String(v ?? ""));
};
export const str = (v: FormDataEntryValue | null) => String(v ?? "").trim() || null;
