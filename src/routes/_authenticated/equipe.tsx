import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, StatusBadge } from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-organization";

const ROLE: Record<string, string> = { owner: "Proprietário", admin: "Administrador", member: "Funcionário" };

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({ meta: [{ title: "Equipe — LeadZap" }, { name: "description", content: "Funcionários e permissões." }] }),
  component: TeamPage,
});

function TeamPage() {
  const { data: ctx } = useCurrentOrg();
  const orgId = ctx?.organization?.id;
  const { data: members = [] } = useQuery({
    queryKey: ["members", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: rows, error } = await supabase.from("organization_members").select("id, user_id, role, active").eq("organization_id", orgId!);
      if (error) throw error;
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", rows.map((r) => r.user_id));
      return rows.map((r) => ({ ...r, profile: profiles?.find((p) => p.id === r.user_id) }));
    },
  });
  const isAdmin = ctx?.role === "owner" || ctx?.role === "admin";
  return (
    <>
      <PageHeader title="Equipe" description="Gerencie quem tem acesso à sua empresa."
        actions={isAdmin && <Button onClick={() => toast.info("Convites por e-mail serão liberados na próxima fase.")}><UserPlus /> Convidar funcionário</Button>} />
      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Papel</TableHead><TableHead>Acesso</TableHead></TableRow></TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.profile?.full_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{m.profile?.email}</TableCell>
                <TableCell>{ROLE[m.role]}</TableCell>
                <TableCell><StatusBadge status={m.active ? "ativo" : "inativo"} label={m.active ? "Ativo" : "Inativo"} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Panel title="Permissões por papel" className="mt-6">
        <ul className="space-y-2 text-sm">
          <li><strong>Proprietário:</strong> acesso total, incluindo assinatura e equipe.</li>
          <li><strong>Administrador:</strong> gerencia equipe, dados e exclusões.</li>
          <li><strong>Funcionário:</strong> cria e edita leads, clientes, orçamentos e tarefas.</li>
        </ul>
      </Panel>
    </>
  );
}
