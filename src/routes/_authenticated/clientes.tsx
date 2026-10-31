import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoNotice, PageHeader, Panel } from "@/components/app/common";
import { brl, dateBR, demoClients } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({ meta: [{ title: "Clientes — LeadZap" }, { name: "description", content: "Clientes convertidos e histórico." }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [sel, setSel] = useState(demoClients[0].id);
  const c = demoClients.find((x) => x.id === sel)!;
  return (
    <>
      <PageHeader title="Clientes" description="Leads convertidos e seu histórico comercial." />
      <DemoNotice />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {demoClients.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)}
              className={cn("w-full rounded-xl border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/40", sel === x.id && "border-primary ring-1 ring-primary")}>
              <p className="font-medium">{x.name}</p>
              <p className="text-xs text-muted-foreground">Cliente desde {dateBR(x.since)}</p>
            </button>
          ))}
        </div>
        <Panel title={c.name}>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div><dt className="text-muted-foreground">Telefone</dt><dd>{c.phone}</dd></div>
            <div><dt className="text-muted-foreground">E-mail</dt><dd>{c.email}</dd></div>
            <div><dt className="text-muted-foreground">Total faturado</dt><dd className="font-semibold">{brl(c.total)}</dd></div>
          </dl>
          <h3 className="mb-3 mt-6 text-sm font-semibold">Histórico</h3>
          <ol className="space-y-3 border-l pl-4">
            {c.history.map((h) => <li key={h} className="relative text-sm before:absolute before:-left-[21px] before:top-1.5 before:size-2.5 before:rounded-full before:bg-primary">{h}</li>)}
          </ol>
        </Panel>
      </div>
    </>
  );
}
