import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CheckCircle2, FileText, Percent, UserPlus, UsersRound } from "lucide-react";
import { DemoNotice, PageHeader, Panel, StatCard, StatusBadge } from "@/components/app/common";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { demoActivities, demoLeads, demoTasks, dateBR, stageName } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LeadZap" }, { name: "description", content: "Visão geral dos seus leads e vendas." }] }),
  component: Dashboard,
});

// Dados fictícios de evolução comercial
const evolution = [
  { mes: "Mai", leads: 18, vendas: 4 }, { mes: "Jun", leads: 24, vendas: 6 }, { mes: "Jul", leads: 21, vendas: 5 },
  { mes: "Ago", leads: 30, vendas: 9 }, { mes: "Set", leads: 34, vendas: 11 }, { mes: "Out", leads: 41, vendas: 13 },
];
const chartConfig = { leads: { label: "Leads", color: "var(--chart-1)" }, vendas: { label: "Vendas", color: "var(--chart-2)" } } satisfies ChartConfig;

function Dashboard() {
  const total = demoLeads.length;
  const won = demoLeads.filter((l) => l.stage === "venda_concluida").length;
  const sent = demoLeads.filter((l) => l.stage === "orcamento_enviado").length;
  const fresh = demoLeads.filter((l) => l.stage === "novo").length;
  const followUp = demoLeads.filter((l) => ["primeiro_contato", "negociacao", "orcamento_enviado"].includes(l.stage));
  return (
    <>
      <PageHeader title="Dashboard" description="Resumo das suas oportunidades comerciais." />
      <DemoNotice>Os números do dashboard são demonstrativos. Seus leads reais já ficam salvos em <Link to="/leads" className="underline">Leads</Link> e no Funil.</DemoNotice>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total de leads" value={String(total)} icon={UsersRound} />
        <StatCard label="Novos leads" value={String(fresh)} hint="Últimos 7 dias" icon={UserPlus} />
        <StatCard label="Orçamentos enviados" value={String(sent)} icon={FileText} />
        <StatCard label="Vendas concluídas" value={String(won)} icon={CheckCircle2} />
        <StatCard label="Taxa de conversão" value={`${Math.round((won / total) * 100)}%`} icon={Percent} />
      </div>
      <Panel title="Evolução comercial" className="mt-6">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={evolution} margin={{ left: -20, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="leads" type="monotone" stroke="var(--color-leads)" fill="var(--color-leads)" fillOpacity={0.12} strokeWidth={2} />
            <Area dataKey="vendas" type="monotone" stroke="var(--color-vendas)" fill="var(--color-vendas)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </Panel>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Precisam de acompanhamento">
          <ul className="divide-y">
            {followUp.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0">
                <div className="min-w-0"><p className="truncate font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.phone}</p></div>
                <StatusBadge status={l.stage} label={stageName(l.stage)} />
              </li>
            ))}
          </ul>
        </Panel>
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
