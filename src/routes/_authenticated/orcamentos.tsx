import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DemoNotice, PageHeader, StatusBadge } from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, dateBR, demoBudgets } from "@/lib/demo-data";

const LABEL: Record<string, string> = { rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", recusado: "Recusado" };
type Budget = (typeof demoBudgets)[number];

export const Route = createFileRoute("/_authenticated/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos — LeadZap" }, { name: "description", content: "Orçamentos enviados aos clientes." }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const [sel, setSel] = useState<Budget | null>(null);
  return (
    <>
      <PageHeader title="Orçamentos" description="Propostas enviadas e seus status."
        actions={<Button onClick={() => toast.info("A criação de orçamentos será liberada na próxima fase.")}><Plus /> Novo orçamento</Button>} />
      <DemoNotice />
      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Cliente</TableHead><TableHead>Serviço</TableHead><TableHead className="text-right">Valor</TableHead>
            <TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead>Responsável</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {demoBudgets.map((b) => (
              <TableRow key={b.id} className="cursor-pointer" onClick={() => setSel(b)}>
                <TableCell className="font-medium">{b.customer}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{b.service}</TableCell>
                <TableCell className="text-right font-medium">{brl(b.amount)}</TableCell>
                <TableCell>{dateBR(b.date)}</TableCell>
                <TableCell><StatusBadge status={b.status} label={LABEL[b.status] ?? b.status} /></TableCell>
                <TableCell>{b.owner}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent>
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>Orçamento — {sel.customer}</DialogTitle>
                <DialogDescription>{dateBR(sel.date)} · Responsável: {sel.owner}</DialogDescription>
              </DialogHeader>
              <p className="text-sm">{sel.service}</p>
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <span className="text-2xl font-semibold">{brl(sel.amount)}</span>
                <StatusBadge status={sel.status} label={LABEL[sel.status] ?? sel.status} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
