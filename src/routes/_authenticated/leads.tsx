import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, UsersRound } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/common";
import { EmptyState, TableSkeleton } from "@/components/app/states";
import { LeadFormDialog } from "@/components/app/LeadFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STAGES, dateBR, stageName } from "@/lib/demo-data";
import { useLeads, type Lead } from "@/lib/leads";
import { memberName, useMembers } from "@/hooks/use-members";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — LeadZap" }, { name: "description", content: "Lista de leads da sua empresa." }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const { data: leads, isLoading } = useLeads();
  const { data: members } = useMembers();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [owner, setOwner] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });

  const rows = useMemo(
    () => (leads ?? []).filter((l) =>
      (stage === "all" || l.stage === stage) &&
      (owner === "all" || (owner === "none" ? !l.assigned_to : l.assigned_to === owner)) &&
      [l.name, l.phone ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())),
    [leads, q, stage, owner],
  );
  const openNew = () => setDialog({ open: true, lead: null });
  const hasFilters = q || stage !== "all" || owner !== "all";

  return (
    <>
      <PageHeader title="Leads" description="Contatos e oportunidades da sua empresa." actions={<Button onClick={openNew}><Plus /> Adicionar lead</Button>} />

      {isLoading ? <TableSkeleton /> : !leads?.length ? (
        <EmptyState icon={UsersRound} title="Nenhum lead cadastrado" description="Adicione seu primeiro contato para começar a acompanhar suas oportunidades." action={<Button onClick={openNew}><Plus /> Adicionar primeiro lead</Button>} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <div className="grid grid-cols-2 gap-2 md:flex">
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etapas</SelectItem>
                  {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os responsáveis</SelectItem>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {members?.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Celular: cartões */}
          <ul className="space-y-2 md:hidden">
            {rows.map((l) => (
              <li key={l.id}>
                <button onClick={() => setDialog({ open: true, lead: l })} className="w-full rounded-xl border bg-card p-4 text-left shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{l.name}</p>
                    <StatusBadge status={l.stage} label={stageName(l.stage)} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.phone || "Sem telefone"} · {l.source}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{memberName(members, l.assigned_to)} · {dateBR(l.created_at)}</p>
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop: tabela */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead><TableHead>Responsável</TableHead><TableHead>Cadastro</TableHead><TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => setDialog({ open: true, lead: l })}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.phone || "—"}</TableCell>
                    <TableCell>{l.source || "—"}</TableCell>
                    <TableCell><StatusBadge status={l.stage} label={stageName(l.stage)} /></TableCell>
                    <TableCell>{memberName(members, l.assigned_to)}</TableCell>
                    <TableCell className="text-muted-foreground">{dateBR(l.created_at)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" aria-label="Editar"><Pencil /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length === 0 && hasFilters && (
            <p className="mt-6 text-center text-sm text-muted-foreground">Nenhum lead corresponde aos filtros.</p>
          )}
        </>
      )}
      {dialog.open && <LeadFormDialog open onOpenChange={(o) => setDialog({ open: o, lead: o ? dialog.lead : null })} lead={dialog.lead} />}
    </>
  );
}
