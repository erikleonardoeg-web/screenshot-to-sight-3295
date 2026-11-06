import { PipelineSettings } from "@/components/app/PipelineSettings";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { CreditCard, Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/app/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { currentOrgQuery, useCurrentOrg } from "@/hooks/use-organization";
import { PLANS, TRIAL_DAYS, formatPlanPrice } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — LeadZap" }, { name: "description", content: "Dados da empresa, perfil e conta." }, { property: "og:title", content: "Configurações — LeadZap" }, { property: "og:description", content: "Dados da empresa, perfil e conta." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data } = useCurrentOrg();
  const qc = useQueryClient();
  const org = data?.organization;
  const isAdmin = data?.role === "owner" || data?.role === "admin";

  async function saveOrg(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!org) return;
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("organizations").update({
      name: String(f.get("name")), phone: String(f.get("phone")) || null, document: String(f.get("document")) || null,
    }).eq("id", org.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Dados da empresa salvos.");
    qc.invalidateQueries({ queryKey: currentOrgQuery.queryKey });
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    const { error } = await supabase.from("profiles").update({ full_name: String(new FormData(e.currentTarget).get("full_name")) }).eq("id", data.user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil atualizado.");
    qc.invalidateQueries({ queryKey: currentOrgQuery.queryKey });
  }

  const { data: sub } = useQuery({
    queryKey: ["subscription", org?.id], enabled: !!org?.id && data?.role === "owner",
    queryFn: async () => { if (!org) return null; return (await supabase.from("subscriptions").select("plan, status, trial_ends_at").eq("organization_id", org.id).maybeSingle()).data; },
  });
  const SUB_LABEL: Record<string, string> = { trialing: "Em teste", active: "Ativa", past_due: "Pagamento pendente", suspended: "Suspensa", canceled: "Cancelada", expired: "Expirada" };
  if (!data) return null;
  return (
    <>
      <PageHeader title="Configurações" description="Empresa, perfil, preferências e conta." />
      <Tabs defaultValue="empresa">
        <TabsList className="mb-4 h-auto flex-wrap justify-start">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="funil">Funil</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          <TabsTrigger value="conta">Assinatura e plano</TabsTrigger>
        </TabsList>
        <TabsContent value="empresa">
          <Panel title="Dados da empresa">
            <form key={org?.id} onSubmit={saveOrg} className="grid max-w-xl gap-4">
              <div className="space-y-1.5"><Label htmlFor="name">Nome da empresa</Label><Input id="name" name="name" defaultValue={org?.name} required disabled={!isAdmin} /></div>
              <div className="space-y-1.5"><Label htmlFor="phone">Telefone / WhatsApp</Label><Input id="phone" name="phone" defaultValue={org?.phone ?? ""} disabled={!isAdmin} /></div>
              <div className="space-y-1.5"><Label htmlFor="document">CNPJ / CPF</Label><Input id="document" name="document" defaultValue={org?.document ?? ""} disabled={!isAdmin} /></div>
              {isAdmin && <Button type="submit" className="w-fit">Salvar</Button>}
            </form>
          </Panel>
        </TabsContent>
        <TabsContent value="perfil">
          <Panel title="Seu perfil">
            <form onSubmit={saveProfile} className="grid max-w-xl gap-4">
              <div className="space-y-1.5"><Label htmlFor="full_name">Nome completo</Label><Input id="full_name" name="full_name" defaultValue={data.profile?.full_name ?? ""} /></div>
              <div className="space-y-1.5"><Label>E-mail</Label><Input value={data.user.email ?? ""} disabled /></div>
              <Button type="submit" className="w-fit">Salvar</Button>
            </form>
          </Panel>
        </TabsContent>
        <TabsContent value="equipe">
          <Panel title="Gerenciamento de equipe">
            <p className="mb-4 text-sm text-muted-foreground">Veja funcionários, altere cargos e ative ou desative acessos.</p>
            <Button variant="outline" asChild><Link to="/equipe"><Users /> Abrir equipe</Link></Button>
          </Panel>
        </TabsContent>
        <TabsContent value="funil"><PipelineSettings /></TabsContent>
        <TabsContent value="preferencias">
          <Panel title="Preferências"><p className="text-sm text-muted-foreground">Notificações, idioma e fuso horário serão configuráveis na próxima fase.</p></Panel>
        </TabsContent>
        <TabsContent value="conta">
          <Panel title="Assinatura e plano" action={sub ? <Badge variant="outline">{SUB_LABEL[sub.status] ?? sub.status}</Badge> : null}>
            {data.role !== "owner" ? <p className="text-sm text-muted-foreground">Somente o proprietário da empresa pode ver e gerenciar a assinatura.</p> : <>
            {sub?.trial_ends_at && sub.status === "trialing" && <p className="mb-3 text-sm">Seu teste termina em <strong>{new Date(sub.trial_ends_at).toLocaleDateString("pt-BR")}</strong>.</p>}
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-muted p-4 text-sm">
              <CreditCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground">Teste grátis de {TRIAL_DAYS} dias. A contratação será feita por checkout seguro da Cakto, disponível em breve. Nenhuma cobrança é feita agora.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLANS.map((p) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPlanPrice(p.priceCents)}/mês</p>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{p.features.map((f) => <li key={f}>• {f}</li>)}</ul>
                  <Button className="mt-4 w-full" variant={p.id === "pro" ? "default" : "outline"} disabled>Assinar {p.name}</Button>
                </div>
              ))}
            </div>
            </>}
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}
