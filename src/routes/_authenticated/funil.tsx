import { createFileRoute } from "@tanstack/react-router";
import { useState, type DragEvent } from "react";
import { Calendar, Kanban, Phone, Plus, UserRound } from "lucide-react";
import { PageHeader } from "@/components/app/common";
import { EmptyState } from "@/components/app/states";
import { LeadFormDialog } from "@/components/app/LeadFormDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGES, brl, dateBR } from "@/lib/demo-data";
import { useLeads, useMoveLead, type Lead } from "@/lib/leads";
import { memberName, useMembers } from "@/hooks/use-members";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/funil")({
  head: () => ({ meta: [{ title: "Funil de vendas — LeadZap" }, { name: "description", content: "Quadro Kanban das etapas comerciais." }] }),
  component: FunnelPage,
});

function FunnelPage() {
  const { data: leads, isLoading } = useLeads();
  const { data: members } = useMembers();
  const move = useMoveLead();
  const [over, setOver] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });

  const onDrop = (e: DragEvent, stage: Lead["stage"]) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const lead = leads?.find((l) => l.id === id);
    if (lead && lead.stage !== stage) move.mutate({ id, stage });
  };

  return (
    <>
      <PageHeader title="Funil de vendas" description="Arraste os cartões entre as etapas ou altere a etapa no próprio cartão."
        actions={<Button onClick={() => setDialog({ open: true, lead: null })}><Plus /> Adicionar lead</Button>} />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">{STAGES.map((s) => <Skeleton key={s.key} className="h-72 w-72 shrink-0 rounded-xl" />)}</div>
      ) : !leads?.length ? (
        <EmptyState icon={Kanban} title="Seu funil está vazio" description="Adicione leads para visualizá-los por etapa comercial." action={<Button onClick={() => setDialog({ open: true, lead: null })}><Plus /> Adicionar lead</Button>} />
      ) : (
        <div className="-mx-4 snap-x overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          <div className="flex gap-4">
            {STAGES.map((s) => {
              const items = leads.filter((l) => l.stage === s.key);
              const total = items.reduce((a, l) => a + Number(l.estimated_value ?? 0), 0);
              return (
                <div key={s.key}
                  onDragOver={(e) => { e.preventDefault(); setOver(s.key); }}
                  onDragLeave={() => setOver(null)}
                  onDrop={(e) => onDrop(e, s.key)}
                  className={cn("flex w-[85vw] max-w-72 shrink-0 snap-start flex-col rounded-xl bg-muted p-3 transition-colors sm:w-72", over === s.key && "bg-accent ring-2 ring-primary/40")}>
                  <div className="mb-1 flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold">{s.name}</h3>
                    <span className="rounded-full bg-card px-2 text-xs font-medium text-muted-foreground">{items.length}</span>
                  </div>
                  <p className="mb-3 px-1 text-xs text-muted-foreground">{brl(total)}</p>
                  <div className="min-h-24 space-y-2">
                    {items.map((l) => (
                      <article key={l.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                        className="cursor-grab rounded-lg border bg-card p-3 shadow-card transition-shadow hover:shadow-md active:cursor-grabbing">
                        <button className="w-full text-left" onClick={() => setDialog({ open: true, lead: l })}>
                          <p className="text-sm font-medium">{l.name}</p>
                          <p className="mt-1.5 text-base font-semibold">{l.estimated_value != null ? brl(Number(l.estimated_value)) : <span className="text-sm font-normal text-muted-foreground">Sem valor</span>}</p>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1.5"><Phone className="size-3" />{l.phone || "—"}</p>
                            <p className="flex items-center gap-1.5"><UserRound className="size-3" />{memberName(members, l.assigned_to)}</p>
                            <p className="flex items-center gap-1.5"><Calendar className="size-3" />{dateBR(l.created_at)}</p>
                          </div>
                        </button>
                        <Select value={l.stage} onValueChange={(v) => move.mutate({ id: l.id, stage: v as Lead["stage"] })}>
                          <SelectTrigger className="mt-3 h-8 text-xs" aria-label="Mover para etapa"><SelectValue /></SelectTrigger>
                          <SelectContent>{STAGES.map((x) => <SelectItem key={x.key} value={x.key}>{x.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </article>
                    ))}
                    {items.length === 0 && <p className="rounded-lg border border-dashed px-1 py-6 text-center text-xs text-muted-foreground">Solte um cartão aqui</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {dialog.open && <LeadFormDialog open onOpenChange={(o) => setDialog({ open: o, lead: o ? dialog.lead : null })} lead={dialog.lead} />}
    </>
  );
}
