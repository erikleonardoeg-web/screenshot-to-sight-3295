import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { DemoNotice, PageHeader, StatusBadge } from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STAGES, dateBR, demoLeads, stageName } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — LeadZap" }, { name: "description", content: "Lista de leads da sua empresa." }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [source, setSource] = useState("all");
  const sources = [...new Set(demoLeads.map((l) => l.source))];
  const rows = useMemo(
    () => demoLeads.filter((l) =>
      (stage === "all" || l.stage === stage) &&
      (source === "all" || l.source === source) &&
      [l.name, l.email, l.phone].join(" ").toLowerCase().includes(q.toLowerCase())),
    [q, stage, source],
  );
  return (
    <>
      <PageHeader
        title="Leads"
        description="Contatos e oportunidades da sua empresa."
        actions={<Button onClick={() => toast.info("O cadastro de leads será liberado na próxima fase.")}><Plus /> Adicionar lead</Button>}
      />
      <DemoNotice />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, e-mail ou telefone" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>E-mail</TableHead>
              <TableHead>Origem</TableHead><TableHead>Etapa</TableHead><TableHead>Responsável</TableHead><TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell>{l.phone}</TableCell>
                <TableCell className="text-muted-foreground">{l.email}</TableCell>
                <TableCell>{l.source}</TableCell>
                <TableCell><StatusBadge status={l.stage} label={stageName(l.stage)} /></TableCell>
                <TableCell>{l.owner}</TableCell>
                <TableCell className="text-muted-foreground">{dateBR(l.createdAt)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum lead encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
