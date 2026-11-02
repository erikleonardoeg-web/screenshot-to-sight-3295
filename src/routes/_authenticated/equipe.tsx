import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Crown, MoreHorizontal, Shield, UserPlus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, StatusBadge } from "@/components/app/common";
import { TableSkeleton } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-organization";
import { ROLE_LABEL, useMembers, type Member } from "@/hooks/use-members";
import { dateBR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({ meta: [{ title: "Equipe — LeadZap" }, { name: "description", content: "Funcionários e permissões." }] }),
  component: TeamPage,
});

const ROLE_STYLE: Record<Member["role"], { icon: typeof Crown; cls: string }> = {
  owner: { icon: Crown, cls: "bg-navy text-primary-foreground border-transparent" },
  admin: { icon: Shield, cls: "bg-accent text-accent-foreground border-primary/20" },
  member: { icon: UserRound, cls: "bg-muted text-muted-foreground" },
};

function RoleBadge({ role }: { role: Member["role"] }) {
  const { icon: Icon, cls } = ROLE_STYLE[role];
  return <Badge variant="outline" className={cn("gap-1 font-medium", cls)}><Icon className="size-3" />{ROLE_LABEL[role]}</Badge>;
}

function TeamPage() {
  const { data: ctx } = useCurrentOrg();
  const { data: members, isLoading } = useMembers();
  const qc = useQueryClient();
  const [invite, setInvite] = useState(false);
  const isAdmin = ctx?.role === "owner" || ctx?.role === "admin";

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { active?: boolean; role?: "admin" | "member" } }) => {
      const { data, error } = await supabase.from("organization_members").update(patch).eq("id", id).select("id");
      if (error) throw error;
      if (!data.length) throw new Error("Você não tem permissão para esta ação.");
    },
    onSuccess: () => { toast.success("Membro atualizado."); qc.invalidateQueries({ queryKey: ["members"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Equipe" description="Gerencie quem tem acesso à sua empresa."
        actions={isAdmin && <Button onClick={() => setInvite(true)}><UserPlus /> Convidar funcionário</Button>} />
      {isLoading ? <TableSkeleton rows={3} /> : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead><TableHead>Entrada</TableHead>{isAdmin && <TableHead className="w-12" />}
            </TableRow></TableHeader>
            <TableBody>
              {members?.map((m) => {
                const editable = isAdmin && m.role !== "owner" && m.user_id !== ctx?.user.id;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name || "—"}{m.user_id === ctx?.user.id && <span className="ml-1 text-xs text-muted-foreground">(você)</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell><RoleBadge role={m.role} /></TableCell>
                    <TableCell><StatusBadge status={m.active ? "ativo" : "inativo"} label={m.active ? "Ativo" : "Inativo"} /></TableCell>
                    <TableCell className="text-muted-foreground">{dateBR(m.created_at)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {editable && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => update.mutate({ id: m.id, patch: { role: m.role === "admin" ? "member" : "admin" } })}>
                                {m.role === "admin" ? "Tornar funcionário" : "Tornar administrador"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className={m.active ? "text-destructive focus:text-destructive" : ""} onClick={() => update.mutate({ id: m.id, patch: { active: !m.active } })}>
                                {m.active ? "Desativar acesso" : "Reativar acesso"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Panel title="Permissões por cargo" className="mt-6">
        <ul className="grid gap-4 text-sm sm:grid-cols-3">
          <li className="space-y-2"><RoleBadge role="owner" /><p className="text-muted-foreground">Acesso total, incluindo assinatura e equipe. Não pode ser alterado.</p></li>
          <li className="space-y-2"><RoleBadge role="admin" /><p className="text-muted-foreground">Gerencia equipe, dados da empresa e exclusões.</p></li>
          <li className="space-y-2"><RoleBadge role="member" /><p className="text-muted-foreground">Cria e edita leads, clientes, orçamentos e tarefas.</p></li>
        </ul>
      </Panel>
      <Dialog open={invite} onOpenChange={setInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar funcionário</DialogTitle>
            <DialogDescription>O envio de convites por e-mail será liberado na próxima fase.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 opacity-60">
            <div className="space-y-1.5"><Label>E-mail</Label><Input disabled placeholder="funcionario@empresa.com" /></div>
            <div className="space-y-1.5"><Label>Cargo</Label><Input disabled value="Funcionário" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setInvite(false)}>Fechar</Button><Button disabled>Enviar convite</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
