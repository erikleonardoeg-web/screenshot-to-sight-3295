import { isOverdue } from "./contact";
type Lead = { stage: string; created_at: string; updated_at: string; estimated_value: number | null };
type Budget = { status: string; amount: number; budget_date: string };
type Task = { status: string; due_at: string | null };
type Stage = { key: string; is_won: boolean; is_lost: boolean };
export function dashboardMetrics(leads: Lead[], budgets: Budget[], tasks: Task[], stages: Stage[], now: number, days: number) {
  const inPeriod = (date: string) => !days || new Date(date).getTime() >= now - days * 86400000;
  const selected = leads.filter((l) => inPeriod(l.created_at));
  const proposals = budgets.filter((b) => inPeriod(`${b.budget_date}T12:00:00`));
  const wonKeys = new Set(stages.filter((s) => s.is_won).map((s) => s.key));
  const lostKeys = new Set(stages.filter((s) => s.is_lost).map((s) => s.key));
  const won = leads.filter((l) => wonKeys.has(l.stage) && inPeriod(l.updated_at));
  const lost = leads.filter((l) => lostKeys.has(l.stage) && inPeriod(l.updated_at));
  return {
    total: selected.length,
    fresh: selected.filter((l) => l.stage === "novo").length,
    negotiation: selected.filter((l) => l.stage === "negociacao").length,
    sent: proposals.filter((b) => b.status === "enviado").length,
    won: won.length, lost: lost.length,
    pending: tasks.filter((t) => ["pendente","em_andamento"].includes(t.status)).length,
    overdue: tasks.filter((t) => isOverdue(t,now)).length,
    budgetValue: proposals.reduce((n,b) => n+Number(b.amount),0),
    saleValue: won.some((l) => l.estimated_value !== null) ? won.reduce((n,l) => n+Number(l.estimated_value ?? 0),0) : null,
    rate: won.length + lost.length ? Math.round(won.length / (won.length + lost.length)*100) : 0,
  };
}