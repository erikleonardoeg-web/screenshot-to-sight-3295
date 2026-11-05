import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-organization";
import { useLeads, type Lead } from "@/lib/leads";
import { usePipeline } from "@/lib/pipeline";
import { brl, dateBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LeadFormDialog } from "./LeadFormDialog";
import { InteractionHistory } from "./InteractionHistory";
import { WhatsAppButton } from "./WhatsAppButton";
import { ConfirmDelete } from "./ConfirmDelete";
import { memberName, useMembers } from "@/hooks/use-members";
export function LeadDetailDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const { data: leads } = useLeads();
  const current = leads?.find((l) => l.id === lead.id) ?? lead;
  const { data: stages = [] } = usePipeline();
  const { data: members } = useMembers();
  const { data: ctx } = useCurrentOrg();
  const qc = useQueryClient();
  const convert = useMutation({ mutationFn: async () => {
    const { data, error } = await supabase.rpc("convert_lead_to_client", { _lead: lead.id });
    if (error) throw error;
    return data;
  }, onSuccess: () => { for (const key of ["leads","clients","tasks","budgets","interactions"]) qc.invalidateQueries({ queryKey: [key] }); toast.success("Lead convertido em cliente."); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: async () => {
    const { data, error } = await supabase.from("leads").delete().eq("id",lead.id).select("id");
    if (error) throw error;
    if (!data.length) throw new Error("Apenas administradores podem excluir.");
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success("Lead excluído."); onClose(); }, onError: (e: Error) => toast.error(e.message) });
  return <>
    <Dialog open={!editing} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{current.name}</DialogTitle><DialogDescription>{stages.find((s) => s.key === current.stage)?.name ?? current.stage} · {dateBR(current.created_at)}</DialogDescription></DialogHeader>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {[["Telefone",current.phone],["E-mail",current.email],["Origem",current.source],["Responsável",memberName(members,current.assigned_to)],["Valor potencial",current.estimated_value == null ? null : brl(Number(current.estimated_value))]].map(([label,value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value || "—"}</dd></div>)}
      </dl>
      {current.description && <p className="whitespace-pre-wrap break-words text-sm">{current.description}</p>}
      {current.notes && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{current.notes}</p>}
      <div className="flex flex-wrap gap-2"><WhatsAppButton phone={current.phone} /><Button variant="outline" onClick={() => setEditing(true)}>Editar lead</Button><Button disabled={convert.isPending} onClick={() => convert.mutate()}>Converter em cliente</Button>
      {(ctx?.role === "owner" || ctx?.role === "admin") && <ConfirmDelete label="Excluir lead" pending={remove.isPending} onConfirm={() => remove.mutateAsync()} />}</div>
      <InteractionHistory leadId={lead.id} />
    </DialogContent></Dialog>
    {editing && <LeadFormDialog open lead={current} onOpenChange={() => setEditing(false)} />}
  </>;
}