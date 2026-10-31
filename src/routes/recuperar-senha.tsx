import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — LeadZap" },
      { name: "description", content: "Receba um link para redefinir sua senha do LeadZap." },
      { property: "og:title", content: "Recuperar senha — LeadZap" },
      { property: "og:description", content: "Redefina sua senha do LeadZap." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) return toast.error(error.message);
    setSent(true);
  }
  return (
    <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para você criar uma nova senha." footer={<Link to="/auth" className="text-primary hover:underline">Voltar para o login</Link>}>
      {sent ? (
        <p className="rounded-xl border bg-card p-5 text-sm shadow-card">Se houver uma conta com esse e-mail, você receberá o link em instantes.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
          <Button type="submit" className="w-full">Enviar link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
