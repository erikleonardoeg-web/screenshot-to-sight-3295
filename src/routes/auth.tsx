import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — LeadZap" },
      { name: "description", content: "Acesse sua conta LeadZap e gerencie leads, clientes e orçamentos." },
      { property: "og:title", content: "Entrar — LeadZap" },
      { property: "og:description", content: "Acesse sua conta LeadZap." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setLoading(false);
    if (error) { toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message); return; }
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Bem-vindo de volta ao LeadZap."
      footer={<>Ainda não tem conta? <Link to="/cadastro" className="font-medium text-primary hover:underline">Criar conta</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link to="/recuperar-senha" className="text-xs text-primary hover:underline">Esqueceu a senha?</Link>
          </div>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</Button>
      </form>
    </AuthLayout>
  );
}
