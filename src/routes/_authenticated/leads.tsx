import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, UsersRound } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/common";
import { EmptyState, TableSkeleton } from "@/components/app/states";
import { LeadDetailDialog } from "@/components/app/LeadDetailDialog";
import { usePipeline } from "@/lib/pipeline";
import { LeadFormDialog } from "@/components/app/LeadFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STAGES, dateBR, stageName } from "@/lib/format";
import { useLeads, type Lead } from "@/lib/leads";
import { memberName, useMembers } from "@/hooks/use-members";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — LeadZap" }, { name: "description", content: "Lista de leads da sua empresa." }, { property: "og:title", content: "Leads — LeadZap" }, { property: "og:description", content: "Lista de leads da sua empresa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const { data: leads, isLoading } = useLeads();
  const { data: members } = useMembers();
  const { data: stages = [] } = usePipeline();
  const [detail, setDetail] = useState<Lead | null>(null);
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("created_at");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [owner, setOwner] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });

  const rows = useMemo(
    () => (leads ?? []).filter((l) =>
      (stage === "all" || l.stage === stage) &&
      (owner === "all" || (owner === "none" ? !l.assigned_to : l.assigned_to === owner)) &&
      (source === "all" || l.source === source) &&
       [l.name, l.phone ?? "", l.email ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())).sort((a,b) => new Date(sort === "updated_at" ? b.updated_at : b.created_at).getTime() - new Date(sort === "updated_at" ? a.updated_at : a.created_at).getTime()),
    [leads, q, stage, owner, source, sort],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / 20));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * 20, currentPage * 20);
  const openNew = () => setDialog({ open: true, lead: null });
  const hasFilters = q || stage !== "all" || owner !== "all" || source !== "all";

  return (
    <>
      <PageHeader title="Leads" description="Contatos e oportunidades da sua empresa." actions={<Button onClick={openNew}><Plus /> Adicionar lead</Button>} />

      {isLoading ? <TableSkeleton /> : !leads?.length ? (
        <EmptyState icon={UsersRound} title="Nenhum lead cadastrado" description="Adicione seu primeiro contato para começar a acompanhar suas oportunidades." action={<Button onClick={openNew}><Plus /> Adicionar primeiro lead</Button>} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar nome, telefone ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={source} onValueChange={(v) => {setSource(v); setPage(1);}}><SelectTrigger aria-label="Filtrar origem"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as origens</SelectItem>{Array.from(new Set(leads.map((l) => l.source).filter((v): v is string => !!v))).map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
              <Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Ordenar leads"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="created_at">Cadastro recente</SelectItem><SelectItem value="updated_at">Atualização recente</SelectItem></SelectContent></Select>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etapas</SelectItem>
                  {stages.map((s) => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
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
            {pageRows.map((l) => (
              <li key={l.id}>
                <Button variant="outline" onClick={() => setDetail(l)} className="h-auto w-full flex-col items-stretch rounded-xl bg-card p-4 text-left shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{l.name}</p>
                    <StatusBadge status={l.stage} label={(stages.find((s) => s.key === l.stage)?.name ?? stageName(l.stage))} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.phone || "Sem telefone"} · {l.source}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{memberName(members, l.assigned_to)} · {dateBR(l.created_at)}</p>
                </Button>
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
                {pageRows.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => setDetail(l)}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.phone || "—"}</TableCell>
                    <TableCell>{l.source || "—"}</TableCell>
                    <TableCell><StatusBadge status={l.stage} label={(stages.find((s) => s.key === l.stage)?.name ?? stageName(l.stage))} /></TableCell>
                    <TableCell>{memberName(members, l.assigned_to)}</TableCell>
                    <TableCell className="text-muted-foreground">{dateBR(l.created_at)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" aria-label="Editar"><Pencil /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > 20 && <div className="mt-4 flex items-center justify-end gap-3"><Button variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage-1)}>Anterior</Button><span className="text-sm">{currentPage} / {pageCount}</span><Button variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage+1)}>Próxima</Button></div>}
          {rows.length === 0 && hasFilters && (
            <p className="mt-6 text-center text-sm text-muted-foreground">Nenhum lead corresponde aos filtros.</p>
          )}
        </>
      )}
      {detail && <LeadDetailDialog lead={detail} onClose={() => setDetail(null)} />}
      {dialog.open && <LeadFormDialog open onOpenChange={(o) => setDialog({ open: o, lead: o ? dialog.lead : null })} lead={dialog.lead} />}
    </>
  );
}
