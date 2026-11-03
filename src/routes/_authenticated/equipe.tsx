import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  sales: { icon: UserRound, cls: "bg-success/10 text-success border-success/20" },
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
    mutationFn: async ({ id, patch }: { id: string; patch: { active?: boolean; role?: "admin" | "sales" | "member" } }) => {
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
                              {(["admin", "sales", "member"] as const).filter((r) => r !== m.role).map((r) => (
                                <DropdownMenuItem key={r} onClick={() => update.mutate({ id: m.id, patch: { role: r } })}>Tornar {ROLE_LABEL[r].toLowerCase()}</DropdownMenuItem>
                              ))}
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
        <ul className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <li className="space-y-2"><RoleBadge role="owner" /><p className="text-muted-foreground">Acesso total, incluindo assinatura e equipe. Não pode ser alterado.</p></li>
          <li className="space-y-2"><RoleBadge role="admin" /><p className="text-muted-foreground">Gerencia equipe, dados da empresa e exclusões.</p></li>
          <li className="space-y-2"><RoleBadge role="sales" /><p className="text-muted-foreground">Foco comercial: leads, funil, orçamentos e tarefas.</p></li>
          <li className="space-y-2"><RoleBadge role="member" /><p className="text-muted-foreground">Cria e edita leads, clientes, orçamentos e tarefas.</p></li>
        </ul>
      </Panel>
      {isAdmin && <InvitesPanel orgId={ctx?.organization?.id} open={invite} onOpenChange={setInvite} />}
    </>
  );
}

function InvitesPanel({ orgId, open, onOpenChange }: { orgId: string | undefined; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [role, setRole] = useState<"admin" | "sales" | "member">("member");
  const { data: invites = [] } = useQuery({
    queryKey: ["invites", orgId], enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("organization_invites").select("*").eq("organization_id", orgId!).eq("status", "pending").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async (email: string) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("organization_invites").insert({ organization_id: orgId!, email: email.toLowerCase(), role, invited_by: u.user!.id });
      if (error) throw new Error(error.code === "23505" ? "Já existe um convite pendente para este e-mail." : error.message);
    },
    onSuccess: () => { toast.success("Convite registrado."); qc.invalidateQueries({ queryKey: ["invites"] }); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("organization_invites").update({ status: "revoked" }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Convite cancelado."); qc.invalidateQueries({ queryKey: ["invites"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <>
      {invites.length > 0 && (
        <Panel title="Convites pendentes" className="mt-6">
          <ul className="divide-y text-sm">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">{i.email} · <span className="text-muted-foreground">{ROLE_LABEL[i.role]}</span></span>
                <Button variant="ghost" size="sm" onClick={() => revoke.mutate(i.id)}>Cancelar</Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar funcionário</DialogTitle>
            <DialogDescription>A pessoa entra na sua empresa ao criar a conta (ou entrar) com este e-mail confirmado.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); create.mutate(String(new FormData(e.currentTarget).get("email")).trim()); }}>
            <div className="space-y-1.5"><Label htmlFor="inv-email">E-mail</Label><Input id="inv-email" name="email" type="email" required placeholder="funcionario@empresa.com" /></div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["admin", "sales", "member"] as const).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={create.isPending}>Enviar convite</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
