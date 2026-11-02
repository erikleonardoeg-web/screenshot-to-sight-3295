import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoNotice, PageHeader } from "@/components/app/common";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, dateBR, demoClients } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({ meta: [{ title: "Clientes — LeadZap" }, { name: "description", content: "Clientes convertidos e histórico." }] }),
  component: ClientsPage,
});

type Client = (typeof demoClients)[number];

function ClientsPage() {
  const [sel, setSel] = useState<Client | null>(null);
  return (
    <>
      <PageHeader title="Clientes" description="Leads convertidos e seu histórico comercial." />
      <DemoNotice />
      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nome</TableHead><TableHead>Contato</TableHead><TableHead>Responsável</TableHead>
            <TableHead>Conversão</TableHead><TableHead className="text-right">Total</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {demoClients.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setSel(c)}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><p>{c.phone}</p><p className="text-xs text-muted-foreground">{c.email}</p></TableCell>
                <TableCell>{c.owner}</TableCell>
                <TableCell className="text-muted-foreground">{dateBR(c.since)}</TableCell>
                <TableCell className="text-right font-medium">{brl(c.total)}</TableCell>
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
                <DialogTitle>{sel.name}</DialogTitle>
                <DialogDescription>Cliente desde {dateBR(sel.since)} · Responsável: {sel.owner}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground">Telefone</dt><dd>{sel.phone}</dd></div>
                <div><dt className="text-muted-foreground">E-mail</dt><dd className="truncate">{sel.email}</dd></div>
                <div><dt className="text-muted-foreground">Total faturado</dt><dd className="font-semibold text-success">{brl(sel.total)}</dd></div>
              </dl>
              <h3 className="mt-2 text-sm font-semibold">Histórico</h3>
              <ol className="space-y-3 border-l pl-4">
                {sel.history.map((h) => <li key={h} className="relative text-sm before:absolute before:-left-[21px] before:top-1.5 before:size-2.5 before:rounded-full before:bg-primary">{h}</li>)}
              </ol>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
