import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CheckCircle2, FileText, Percent, UserPlus, UsersRound } from "lucide-react";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/app/common";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardMetrics } from "@/lib/dashboard";
import { usePipeline } from "@/lib/pipeline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/app/states";
import { brl, dateBR, stageName } from "@/lib/format";
import { useLeads } from "@/lib/leads";
import { useOrgRows } from "@/lib/crm";
import { memberName, useMembers } from "@/hooks/use-members";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LeadZap" }, { name: "description", content: "Visão geral dos seus leads e vendas." }] }),
  component: Dashboard,
});

const chartConfig = { leads: { label: "Novos leads", color: "var(--chart-1)" }, vendas: { label: "Vendas", color: "var(--chart-2)" } } satisfies ChartConfig;
const DAY = 86400000;

function Dashboard() {
  const { data: leads = [], isLoading } = useLeads();
  const { data: budgets = [] } = useOrgRows("budgets");
  const { data: tasks = [] } = useOrgRows("tasks");
  const { data: members } = useMembers();
  const { data: stages = [] } = usePipeline();
  const [period, setPeriod] = useState("0");
  const metrics = dashboardMetrics(leads,budgets,tasks,stages,Date.now(),Number(period));

  const stats = useMemo(() => {
    const now = Date.now();
    const isWon = (stage: string) => stages.some((s) => s.key === stage && s.is_won);
    const isLost = (stage: string) => stages.some((s) => s.key === stage && s.is_lost);
    const won = leads.filter((l) => isWon(l.stage)).length;
    const closed = won + leads.filter((l) => isLost(l.stage)).length;
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d; });
    const evolution = months.map((m) => {
      const same = (iso: string) => { const d = new Date(iso); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); };
      return {
        mes: m.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        leads: leads.filter((l) => same(l.created_at)).length,
        vendas: leads.filter((l) => isWon(l.stage) && same(l.updated_at)).length,
      };
    });
    return {
      total: leads.length,
      fresh: leads.filter((l) => now - new Date(l.created_at).getTime() < 7 * DAY).length,
      sent: budgets.filter((b) => b.status === "enviado").length,
      won,
      rate: closed ? Math.round((won / closed) * 100) : 0,
      evolution,
      followUp: leads.filter((l) => !isWon(l.stage) && !isLost(l.stage) && now - new Date(l.updated_at).getTime() > 3 * DAY).slice(0, 6),
      recent: leads.slice(0, 5),
      upcoming: tasks.filter((t) => t.status === "pendente" || t.status === "em_andamento").slice(0, 6),
    };
  }, [leads, budgets, tasks, stages]);

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  return (
    <>
      <PageHeader title="Dashboard" description="Resumo das suas oportunidades comerciais." actions={<Select value={period} onValueChange={setPeriod}><SelectTrigger aria-label="Período dos indicadores" className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Todo o período</SelectItem><SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="30">Últimos 30 dias</SelectItem><SelectItem value="90">Últimos 90 dias</SelectItem></SelectContent></Select>} />
      {!leads.length && <EmptyState icon={UserPlus} title="Nenhum lead cadastrado" description="Cadastre seu primeiro lead para acompanhar as oportunidades." action={<Link to="/leads" className="text-primary">Cadastrar primeiro lead</Link>} />}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de leads" value={String(metrics.total)} icon={UsersRound} />
        <StatCard label="Leads novos" value={String(metrics.fresh)} icon={UserPlus} />
        <StatCard label="Em negociação" value={String(metrics.negotiation)} icon={UsersRound} />
        <StatCard label="Orçamentos enviados" value={String(metrics.sent)} icon={FileText} />
        <StatCard label="Vendas concluídas" value={String(metrics.won)} icon={CheckCircle2} />
        <StatCard label="Vendas perdidas" value={String(metrics.lost)} icon={UsersRound} />
        <StatCard label="Tarefas pendentes" value={String(metrics.pending)} hint="Todos os prazos" icon={CheckCircle2} />
        <StatCard label="Tarefas atrasadas" value={String(metrics.overdue)} hint="Todos os prazos" icon={CheckCircle2} />
        <StatCard label="Valor dos orçamentos" value={brl(metrics.budgetValue)} icon={FileText} />
        <StatCard label="Valor potencial das vendas" value={metrics.saleValue === null ? "—" : brl(metrics.saleValue)} hint="Valores informados nos leads ganhos" icon={CheckCircle2} />
        <StatCard label="Taxa de conversão" value={`${metrics.rate}%`} hint="Sobre negócios encerrados" icon={Percent} />
      </div>
      <Panel title="Evolução comercial (6 meses)" className="mt-6">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={stats.evolution} margin={{ left: -20, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="leads" type="monotone" stroke="var(--color-leads)" fill="var(--color-leads)" fillOpacity={0.12} strokeWidth={2} />
            <Area dataKey="vendas" type="monotone" stroke="var(--color-vendas)" fill="var(--color-vendas)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </Panel>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Precisam de acompanhamento">
          {stats.followUp.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum lead parado há mais de 3 dias.</p> : (
            <ul className="divide-y">
              {stats.followUp.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0">
                  <div className="min-w-0"><p className="truncate font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.phone || "—"}</p></div>
                  <StatusBadge status={l.stage} label={stageName(l.stage)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Leads recentes" action={<Link to="/leads" className="text-xs text-primary hover:underline">Ver todos</Link>}>
          {stats.recent.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum lead cadastrado ainda.</p> : (
            <ul className="space-y-4">
              {stats.recent.map((l) => (
                <li key={l.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div><p>{l.name} <span className="text-muted-foreground">via {l.source || "—"}</span></p><p className="text-xs text-muted-foreground">{dateBR(l.created_at)}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Próximas tarefas" action={<Link to="/tarefas" className="text-xs text-primary hover:underline">Ver todas</Link>}>
          {stats.upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente.</p> : (
            <ul className="divide-y">
              {stats.upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                  <div className="min-w-0"><p className="truncate">{t.title}</p><p className="text-xs text-muted-foreground">{memberName(members, t.assigned_to)}</p></div>
                  <span className="shrink-0 text-xs text-muted-foreground">{t.due_at ? dateBR(t.due_at) : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
