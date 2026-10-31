import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — LeadZap" },
      { name: "description", content: "Defina uma nova senha para sua conta LeadZap." },
      { property: "og:title", content: "Nova senha — LeadZap" },
      { property: "og:description", content: "Defina uma nova senha." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada.");
    navigate({ to: "/dashboard" });
  }
  return (
    <AuthLayout title="Criar nova senha">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="password">Nova senha</Label><Input id="password" name="password" type="password" minLength={8} required /></div>
        <Button type="submit" className="w-full">Salvar senha</Button>
      </form>
    </AuthLayout>
  );
}
