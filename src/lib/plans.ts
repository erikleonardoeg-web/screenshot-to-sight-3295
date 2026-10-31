// Planos de assinatura. A cobrança será feita pela Cakto em fase futura;
// nada aqui libera acesso ou simula pagamento.
export const TRIAL_DAYS = 7;

export const PLANS = [
  { id: "start", name: "Start", priceCents: 3990, features: ["Leads e funil", "Clientes e orçamentos", "Tarefas"] },
  { id: "pro", name: "Pro", priceCents: 5990, features: ["Tudo do Start", "Equipe com permissões", "Recursos avançados"] },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

export const formatPlanPrice = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
