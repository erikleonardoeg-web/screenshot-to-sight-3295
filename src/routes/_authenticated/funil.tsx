import { createFileRoute } from "@tanstack/react-router";
import { DemoNotice, PageHeader } from "@/components/app/common";
import { STAGES, brl, demoLeads } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/funil")({
  head: () => ({ meta: [{ title: "Funil de vendas — LeadZap" }, { name: "description", content: "Quadro Kanban das etapas comerciais." }] }),
  component: FunnelPage,
});

function FunnelPage() {
  return (
    <>
      <PageHeader title="Funil de vendas" description="Acompanhe cada oportunidade por etapa." />
      <DemoNotice>Os cards abaixo são exemplos. Arrastar entre etapas será liberado na próxima fase.</DemoNotice>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        <div className="flex gap-4">
          {STAGES.map((s) => {
            const items = demoLeads.filter((l) => l.stage === s.key);
            const total = items.reduce((a, l) => a + (l.value ?? 0), 0);
            return (
              <div key={s.key} className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/70 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold">{s.name}</h3>
                  <span className="rounded-full bg-card px-2 text-xs text-muted-foreground">{items.length}</span>
                </div>
                <p className="mb-3 px-1 text-xs text-muted-foreground">{brl(total)}</p>
                <div className="space-y-2">
                  {items.map((l) => (
                    <div key={l.id} className="rounded-lg border bg-card p-3 shadow-card">
                      <p className="text-sm font-medium">{l.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{l.source} · {l.owner}</p>
                      {l.value != null && <p className="mt-2 text-sm font-semibold">{brl(l.value)}</p>}
                    </div>
                  ))}
                  {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted-foreground">Sem oportunidades</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
