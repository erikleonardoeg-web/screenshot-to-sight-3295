import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { FileText, Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/common";
import { EmptyState, Spinner, TableSkeleton } from "@/components/app/states";
import { MemberSelect, NONE } from "@/components/app/MemberSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, dateBR } from "@/lib/format";
import { BUDGET_STATUS, parseMoney, str, useOrgRows, useSaveRow, type Budget } from "@/lib/crm";
import { memberName, useMembers } from "@/hooks/use-members";

export const Route = createFileRoute("/_authenticated/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos — LeadZap" }, { name: "description", content: "Orçamentos enviados aos clientes." }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const { data: budgets, isLoading } = useOrgRows("budgets");
  const { data: members } = useMembers();
  const [form, setForm] = useState<{ open: boolean; budget: Budget | null }>({ open: false, budget: null });
  const openNew = () => setForm({ open: true, budget: null });
  return (
    <>
      <PageHeader title="Orçamentos" description="Propostas enviadas e seus status." actions={<Button onClick={openNew}><Plus /> Novo orçamento</Button>} />
      {isLoading ? <TableSkeleton /> : !budgets?.length ? (
        <EmptyState icon={FileText} title="Nenhum orçamento" description="Crie seu primeiro orçamento para acompanhar propostas enviadas." action={<Button onClick={openNew}><Plus /> Novo orçamento</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Cliente</TableHead><TableHead>Serviço</TableHead><TableHead className="text-right">Valor</TableHead>
              <TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead>Responsável</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {budgets.map((b) => (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => setForm({ open: true, budget: b })}>
                  <TableCell className="font-medium">{b.customer_name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{b.title || b.description || "—"}</TableCell>
                  <TableCell className="text-right font-medium">{brl(Number(b.amount))}</TableCell>
                  <TableCell>{dateBR(b.budget_date)}</TableCell>
                  <TableCell><StatusBadge status={b.status} label={BUDGET_STATUS[b.status]} /></TableCell>
                  <TableCell>{memberName(members, b.assigned_to)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {form.open && <BudgetForm budget={form.budget} onClose={() => setForm({ open: false, budget: null })} />}
    </>
  );
}

function BudgetForm({ budget, onClose }: { budget: Budget | null; onClose: () => void }) {
  const save = useSaveRow("budgets");
  const { data: clients = [] } = useOrgRows("clients");
  const [owner, setOwner] = useState(budget?.assigned_to ?? NONE);
  const [clientId, setClientId] = useState(budget?.client_id ?? NONE);
  const [status, setStatus] = useState<Budget["status"]>(budget?.status ?? "rascunho");
  const client = clients.find((c) => c.id === clientId);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await save.mutateAsync({
      ...(budget ? { id: budget.id } : {}),
      values: {
        customer_name: String(f.get("customer_name")).trim(), title: str(f.get("title")), description: str(f.get("description")),
        amount: parseMoney(f.get("amount")), budget_date: String(f.get("budget_date")), valid_until: str(f.get("valid_until")),
        status, assigned_to: owner === NONE ? null : owner, client_id: clientId === NONE ? null : clientId,
      },
    });
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{budget ? "Editar orçamento" : "Novo orçamento"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" key={clientId}>
          <div className="space-y-1.5">
            <Label>Cliente cadastrado (opcional)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={NONE}>Nenhum</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="customer_name">Nome do cliente *</Label><Input id="customer_name" name="customer_name" required defaultValue={budget?.customer_name ?? client?.name ?? ""} /></div>
          <div className="space-y-1.5"><Label htmlFor="title">Serviço *</Label><Input id="title" name="title" required maxLength={200} defaultValue={budget?.title ?? ""} placeholder="Ex.: Instalação de ar-condicionado" /></div>
          <div className="space-y-1.5"><Label htmlFor="description">Descrição</Label><Textarea id="description" name="description" rows={3} defaultValue={budget?.description ?? ""} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="amount">Valor (R$) *</Label><Input id="amount" name="amount" inputMode="decimal" required defaultValue={budget ? String(budget.amount).replace(".", ",") : ""} /></div>
            <div className="space-y-1.5"><Label htmlFor="budget_date">Data</Label><Input id="budget_date" name="budget_date" type="date" required defaultValue={budget?.budget_date ?? new Date().toISOString().slice(0, 10)} /></div>
            <div className="space-y-1.5"><Label htmlFor="valid_until">Validade</Label><Input id="valid_until" name="valid_until" type="date" defaultValue={budget?.valid_until ?? ""} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Budget["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(BUDGET_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Responsável</Label><MemberSelect value={owner} onChange={setOwner} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? <Spinner label="Salvando" /> : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
