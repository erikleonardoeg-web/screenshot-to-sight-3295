import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, Kanban, UsersRound } from "lucide-react";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";
import { PLANS, TRIAL_DAYS, formatPlanPrice } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadZap — CRM para prestadores de serviços" },
      { name: "description", content: "Organize seus clientes, acompanhe seus orçamentos e transforme oportunidades em vendas." },
      { property: "og:title", content: "LeadZap — CRM para prestadores de serviços" },
      { property: "og:description", content: "Organize clientes, orçamentos e oportunidades vindas do WhatsApp." },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: UsersRound, title: "Leads organizados", text: "Todos os contatos em um só lugar, com origem e responsável." },
  { icon: Kanban, title: "Funil visual", text: "Acompanhe cada oportunidade do primeiro contato à venda." },
  { icon: FileText, title: "Orçamentos", text: "Saiba o que foi enviado, aprovado ou recusado." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Entrar</Link></Button>
          <Button asChild><Link to="/cadastro">Criar conta</Link></Button>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <p className="mb-4 inline-block rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">CRM para prestadores de serviços</p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Organize seus clientes e transforme oportunidades em vendas.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Para técnicos, instaladores e pequenas empresas que recebem contatos pelo WhatsApp e precisam acompanhar cada orçamento.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild><Link to="/cadastro">Começar agora</Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/auth">Já tenho conta</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card p-6 shadow-card">
            <Icon className="size-5 text-primary" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
      <section className="border-t bg-card py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Planos</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">{TRIAL_DAYS} dias de teste. Assinaturas disponíveis em breve.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PLANS.map((p) => (
              <div key={p.id} className="rounded-xl border bg-background p-6">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-2 text-3xl font-semibold">{formatPlanPrice(p.priceCents)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.features.map((f) => <li key={f} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="py-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} LeadZap</footer>
    </div>
  );
}
