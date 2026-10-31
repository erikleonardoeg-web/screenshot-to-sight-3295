import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileText, Percent, UserPlus, UsersRound } from "lucide-react";
import { DemoNotice, PageHeader, Panel, StatCard } from "@/components/app/common";
import { demoActivities, demoLeads, demoTasks, dateBR } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LeadZap" }, { name: "description", content: "Visão geral dos seus leads e vendas." }] }),
  component: Dashboard,
});

function Dashboard() {
  const total = demoLeads.length;
  const won = demoLeads.filter((l) => l.stage === "venda_concluida").length;
  const sent = demoLeads.filter((l) => l.stage === "orcamento_enviado").length;
  const fresh = demoLeads.filter((l) => l.stage === "novo").length;
  return (
    <>
      <PageHeader title="Dashboard" description="Resumo das suas oportunidades comerciais." />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total de leads" value={String(total)} icon={UsersRound} />
        <StatCard label="Novos contatos" value={String(fresh)} hint="Últimos 7 dias" icon={UserPlus} />
        <StatCard label="Orçamentos enviados" value={String(sent)} icon={FileText} />
        <StatCard label="Vendas concluídas" value={String(won)} icon={CheckCircle2} />
        <StatCard label="Taxa de conversão" value={`${Math.round((won / total) * 100)}%`} icon={Percent} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Atividades recentes">
          <ul className="space-y-4">
            {demoActivities.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                <div><p>{a.text}</p><p className="text-xs text-muted-foreground">{a.when}</p></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Próximas tarefas">
          <ul className="divide-y">
            {demoTasks.filter((t) => t.status !== "concluida").map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                <div className="min-w-0"><p className="truncate">{t.title}</p><p className="text-xs text-muted-foreground">{t.owner}</p></div>
                <span className="shrink-0 text-xs text-muted-foreground">{dateBR(t.due)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
