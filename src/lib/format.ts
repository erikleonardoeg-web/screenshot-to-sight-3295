// Constantes e formatadores do CRM.

import type { Database } from "@/integrations/supabase/types";
export type LeadStage = Database["public"]["Enums"]["lead_stage"];

export const STAGES: { key: LeadStage; name: string }[] = [
  { key: "novo", name: "Novo lead" },
  { key: "primeiro_contato", name: "Primeiro contato" },
  { key: "negociacao", name: "Em negociação" },
  { key: "orcamento_enviado", name: "Orçamento enviado" },
  { key: "venda_concluida", name: "Venda concluída" },
  { key: "venda_perdida", name: "Venda perdida" },
];

export const stageName = (k: LeadStage) => STAGES.find((s) => s.key === k)?.name ?? k;

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dateBR = (d: string) => new Date(d.length === 10 ? d + "T12:00:00" : d.replace(" ", "T")).toLocaleDateString("pt-BR");
