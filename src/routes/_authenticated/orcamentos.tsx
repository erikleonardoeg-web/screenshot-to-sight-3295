import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DemoNotice, PageHeader, StatusBadge } from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, dateBR, demoBudgets } from "@/lib/demo-data";

const LABEL: Record<string, string> = { rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", recusado: "Recusado" };

export const Route = createFileRoute("/_authenticated/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos — LeadZap" }, { name: "description", content: "Orçamentos enviados aos clientes." }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
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
              <TableRow key={b.id}>
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
    </>
  );
}
