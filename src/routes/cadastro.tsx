import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — LeadZap" },
      { name: "description", content: "Cadastre sua empresa no LeadZap e organize seus leads e orçamentos." },
      { property: "og:title", content: "Criar conta — LeadZap" },
      { property: "og:description", content: "Cadastre sua empresa no LeadZap." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: String(f.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: String(f.get("full_name")), company_name: String(f.get("company_name")) },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <AuthLayout title="Confirme seu e-mail">
        <div className="rounded-xl border bg-card p-6 text-sm shadow-card">
          <MailCheck className="mb-3 size-6 text-primary" />
          Enviamos um link de confirmação para <strong>{sentTo}</strong>. Clique nele para ativar sua conta e acessar o LeadZap.
        </div>
        <p className="mt-6 text-center text-sm"><Link to="/auth" className="text-primary hover:underline">Voltar para o login</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Comece a organizar suas oportunidades."
      footer={<>Já tem conta? <Link to="/auth" className="font-medium text-primary hover:underline">Entrar</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="full_name">Nome completo</Label><Input id="full_name" name="full_name" required maxLength={120} /></div>
        <div className="space-y-1.5"><Label htmlFor="company_name">Nome da empresa</Label><Input id="company_name" name="company_name" required maxLength={120} /></div>
        <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /></div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando…" : "Criar conta"}</Button>
      </form>
    </AuthLayout>
  );
}
