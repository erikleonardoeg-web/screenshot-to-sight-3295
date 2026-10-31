// DADOS FICTÍCIOS — usados apenas para demonstrar a interface na Fase 1.
// Serão substituídos por consultas reais ao banco na Fase 2.

export type LeadStage =
  | "novo"
  | "primeiro_contato"
  | "negociacao"
  | "orcamento_enviado"
  | "venda_concluida"
  | "venda_perdida";

export const STAGES: { key: LeadStage; name: string }[] = [
  { key: "novo", name: "Novo lead" },
  { key: "primeiro_contato", name: "Primeiro contato" },
  { key: "negociacao", name: "Em negociação" },
  { key: "orcamento_enviado", name: "Orçamento enviado" },
  { key: "venda_concluida", name: "Venda concluída" },
  { key: "venda_perdida", name: "Venda perdida" },
];

export const stageName = (k: LeadStage) => STAGES.find((s) => s.key === k)?.name ?? k;

export interface DemoLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  stage: LeadStage;
  owner: string;
  createdAt: string;
  value?: number;
}

export const demoLeads: DemoLead[] = [
  { id: "1", name: "Mariana Souza", phone: "(11) 98877-1020", email: "mariana@exemplo.com", source: "WhatsApp", stage: "novo", owner: "Carlos", createdAt: "2026-10-30", value: 450 },
  { id: "2", name: "João Pereira", phone: "(11) 97766-3344", email: "joao@exemplo.com", source: "Instagram", stage: "primeiro_contato", owner: "Ana", createdAt: "2026-10-29", value: 1200 },
  { id: "3", name: "Condomínio Vila Verde", phone: "(11) 3344-5566", email: "sindico@exemplo.com", source: "Indicação", stage: "negociacao", owner: "Carlos", createdAt: "2026-10-27", value: 5800 },
  { id: "4", name: "Ricardo Lima", phone: "(21) 99911-2233", email: "ricardo@exemplo.com", source: "Google", stage: "orcamento_enviado", owner: "Ana", createdAt: "2026-10-25", value: 890 },
  { id: "5", name: "Padaria Bom Dia", phone: "(11) 95544-7788", email: "contato@exemplo.com", source: "WhatsApp", stage: "venda_concluida", owner: "Carlos", createdAt: "2026-10-20", value: 2300 },
  { id: "6", name: "Fernanda Costa", phone: "(31) 98822-4455", email: "fernanda@exemplo.com", source: "Site", stage: "venda_perdida", owner: "Ana", createdAt: "2026-10-18", value: 650 },
  { id: "7", name: "Lucas Almeida", phone: "(11) 96633-9900", email: "lucas@exemplo.com", source: "WhatsApp", stage: "novo", owner: "Ana", createdAt: "2026-10-31", value: 300 },
  { id: "8", name: "Clínica Sorriso", phone: "(11) 3222-1100", email: "adm@exemplo.com", source: "Indicação", stage: "negociacao", owner: "Carlos", createdAt: "2026-10-26", value: 3400 },
];

export const demoBudgets = [
  { id: "1", customer: "Condomínio Vila Verde", service: "Manutenção preventiva de ar-condicionado (12 unidades)", amount: 5800, date: "2026-10-28", status: "enviado", owner: "Carlos" },
  { id: "2", customer: "Ricardo Lima", service: "Instalação de split 12.000 BTUs", amount: 890, date: "2026-10-25", status: "enviado", owner: "Ana" },
  { id: "3", customer: "Padaria Bom Dia", service: "Revisão elétrica completa", amount: 2300, date: "2026-10-20", status: "aprovado", owner: "Carlos" },
  { id: "4", customer: "Fernanda Costa", service: "Troca de chuveiro e disjuntor", amount: 650, date: "2026-10-18", status: "recusado", owner: "Ana" },
  { id: "5", customer: "Clínica Sorriso", service: "Instalação de câmeras (8 pontos)", amount: 3400, date: "2026-10-30", status: "rascunho", owner: "Carlos" },
] as const;

export const demoTasks = [
  { id: "1", title: "Ligar para Mariana Souza", type: "Próximo contato", due: "2026-11-01 09:00", owner: "Carlos", status: "pendente" },
  { id: "2", title: "Enviar orçamento revisado — Clínica Sorriso", type: "Prazo", due: "2026-11-02 14:00", owner: "Carlos", status: "em_andamento" },
  { id: "3", title: "Retornar mensagem de João Pereira", type: "Lembrete", due: "2026-11-01 11:30", owner: "Ana", status: "pendente" },
  { id: "4", title: "Visita técnica — Vila Verde", type: "Prazo", due: "2026-11-04 08:00", owner: "Carlos", status: "pendente" },
  { id: "5", title: "Pós-venda Padaria Bom Dia", type: "Próximo contato", due: "2026-10-30 16:00", owner: "Ana", status: "concluida" },
] as const;

export const demoClients = [
  { id: "1", name: "Padaria Bom Dia", phone: "(11) 95544-7788", email: "contato@exemplo.com", since: "2026-10-20", total: 2300, history: ["Revisão elétrica completa — R$ 2.300", "Primeiro contato via WhatsApp"] },
  { id: "2", name: "Auto Center Rápido", phone: "(11) 94411-2200", email: "auto@exemplo.com", since: "2026-08-14", total: 7150, history: ["Instalação elétrica oficina — R$ 4.900", "Manutenção trimestral — R$ 2.250"] },
  { id: "3", name: "Escola Aprender", phone: "(11) 3111-4455", email: "escola@exemplo.com", since: "2026-06-02", total: 12800, history: ["Climatização de 6 salas — R$ 12.800"] },
];

export const demoActivities = [
  { id: "1", text: "Novo lead Lucas Almeida via WhatsApp", when: "há 2 horas" },
  { id: "2", text: "Orçamento enviado para Condomínio Vila Verde", when: "há 1 dia" },
  { id: "3", text: "Clínica Sorriso movida para Em negociação", when: "há 2 dias" },
  { id: "4", text: "Venda concluída com Padaria Bom Dia", when: "há 4 dias" },
];

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dateBR = (d: string) => new Date(d.length === 10 ? d + "T12:00:00" : d.replace(" ", "T")).toLocaleDateString("pt-BR");
