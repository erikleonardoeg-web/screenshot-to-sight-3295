import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { contactError } from "@/lib/contact";
import { WhatsAppButton } from "@/components/app/WhatsAppButton";
import { InteractionHistory } from "@/components/app/InteractionHistory";
import { TASK_STATUS } from "@/lib/crm";
import { useState, type FormEvent } from "react";
import { Briefcase, Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/common";
import { EmptyState, Spinner, TableSkeleton } from "@/components/app/states";
import { MemberSelect, NONE } from "@/components/app/MemberSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, dateBR } from "@/lib/format";
import { BUDGET_STATUS, str, useOrgRows, useSaveRow, type Client } from "@/lib/crm";
import { useLeads } from "@/lib/leads";
import { memberName, useMembers } from "@/hooks/use-members";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({ meta: [{ title: "Clientes — LeadZap" }, { name: "description", content: "Clientes convertidos e histórico." }, { property: "og:title", content: "Clientes — LeadZap" }, { property: "og:description", content: "Clientes convertidos e histórico." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const { data: clients, isLoading } = useOrgRows("clients");
  const [search, setSearch] = useState("");
  const { data: tasks = [] } = useOrgRows("tasks");
  const { data: budgets = [] } = useOrgRows("budgets");
  const { data: members } = useMembers();
  const [form, setForm] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [detail, setDetail] = useState<Client | null>(null);
  const openNew = () => setForm({ open: true, client: null });
  const total = (id: string) => budgets.filter((b) => b.client_id === id && b.status === "aprovado").reduce((a, b) => a + Number(b.amount), 0);

  return (
    <>
      <PageHeader title="Clientes" description="Leads convertidos e seu histórico comercial." actions={<Button onClick={openNew}><Plus /> Novo cliente</Button>} />
      <Input className="mb-4" aria-label="Buscar clientes" placeholder="Buscar nome, telefone ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
      {isLoading ? <TableSkeleton /> : !clients?.length ? (
        <EmptyState icon={Briefcase} title="Nenhum cliente ainda" description="Converta um lead ou cadastre um cliente para acompanhar o histórico." action={<Button onClick={openNew}><Plus /> Novo cliente</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Contato</TableHead><TableHead>Responsável</TableHead>
              <TableHead>Conversão</TableHead><TableHead className="text-right">Aprovado</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {clients.filter((c) => [c.name,c.phone,c.email].join(" ").toLowerCase().includes(search.toLowerCase())).map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setDetail(c)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><p>{c.phone || "—"}</p><p className="text-xs text-muted-foreground">{c.email}</p></TableCell>
                  <TableCell>{memberName(members, c.assigned_to)}</TableCell>
                  <TableCell className="text-muted-foreground">{dateBR(c.created_at)}</TableCell>
                  <TableCell className="text-right font-medium">{brl(total(c.id))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {form.open && <ClientForm client={form.client} onClose={() => setForm({ open: false, client: null })} />}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>Cliente desde {dateBR(detail.created_at)} · Responsável: {memberName(members, detail.assigned_to)}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground">Telefone</dt><dd>{detail.phone || "—"}</dd></div>
                <div><dt className="text-muted-foreground">E-mail</dt><dd className="truncate">{detail.email || "—"}</dd></div>
              </dl>
              {detail.address && <p className="text-sm">{detail.address}</p>}
              <WhatsAppButton phone={detail.phone} />
              {detail.notes && <p className="text-sm text-muted-foreground">{detail.notes}</p>}
              <h3 className="text-sm font-semibold">Histórico de orçamentos</h3>
              {budgets.filter((b) => b.client_id === detail.id).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum orçamento vinculado.</p> : (
                <ul className="divide-y text-sm">
                  {budgets.filter((b) => b.client_id === detail.id).map((b) => (
                    <li key={b.id} className="flex items-center justify-between py-2">
                      <span>{b.title || b.description || "Orçamento"} · {dateBR(b.budget_date)}</span>
                      <span className="flex items-center gap-2">{brl(Number(b.amount))}<StatusBadge status={b.status} label={BUDGET_STATUS[b.status]} /></span>
                    </li>
                  ))}
                </ul>
              )}
              <h3 className="text-sm font-semibold">Tarefas relacionadas</h3>
              {tasks.filter((t) => t.client_id === detail.id).map((t) => <p className="text-sm" key={t.id}>{t.title} · {TASK_STATUS[t.status]} · {t.due_at ? new Date(t.due_at).toLocaleString("pt-BR") : "Sem prazo"}</p>)}
              {!tasks.some((t) => t.client_id === detail.id) && <p className="text-sm text-muted-foreground">Nenhuma tarefa vinculada.</p>}
              <InteractionHistory clientId={detail.id} />
              <DialogFooter><Button variant="outline" onClick={() => { setForm({ open: true, client: detail }); setDetail(null); }}>Editar</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClientForm({ client, onClose }: { client: Client | null; onClose: () => void }) {
  const save = useSaveRow("clients");
  const qc = useQueryClient();
  const [converting, setConverting] = useState(false);
  const { data: leads = [] } = useLeads();
  const [owner, setOwner] = useState(client?.assigned_to ?? NONE);
  const [leadId, setLeadId] = useState(client?.lead_id ?? NONE);
  const lead = leads.find((l) => l.id === leadId);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const invalid = contactError(str(f.get("phone")),str(f.get("email")));
    if (invalid) { toast.error(invalid); return; }
    if (!String(f.get("name")).trim()) { toast.error("Informe o nome do cliente."); return; }
    try {
    if (!client && leadId !== NONE) {
      setConverting(true);
      const { error } = await supabase.rpc("convert_lead_to_client", { _lead: leadId });
      if (error) { toast.error(error.message); return; }
      for (const key of ["clients","leads","tasks","budgets","interactions"]) qc.invalidateQueries({ queryKey: [key] });
      toast.success("Lead convertido em cliente.");
      onClose(); return;
    }
    await save.mutateAsync({
      ...(client ? { id: client.id } : {}),
      values: { name: String(f.get("name")).trim(), phone: str(f.get("phone")), email: str(f.get("email")), address: str(f.get("address")), notes: str(f.get("notes")),
        assigned_to: owner === NONE ? null : owner, lead_id: leadId === NONE ? null : leadId },
    });
    onClose();
    } catch { /* toast */ } finally { setConverting(false); }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" key={leadId}>
          {!client && (
            <div className="space-y-1.5">
              <Label>Converter a partir de um lead (opcional)</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum</SelectItem>
                  {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5"><Label htmlFor="name">Nome *</Label><Input id="name" name="name" required maxLength={200} defaultValue={client?.name ?? lead?.name ?? ""} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="phone">Telefone</Label><Input id="phone" name="phone" defaultValue={client?.phone ?? lead?.phone ?? ""} /></div>
            <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" defaultValue={client?.email ?? lead?.email ?? ""} /></div>
          </div>
          <div className="space-y-1.5"><Label>Responsável</Label><MemberSelect value={owner} onChange={setOwner} /></div>
          <div className="space-y-1.5"><Label htmlFor="address">Endereço</Label><Input id="address" name="address" defaultValue={client?.address ?? ""} /></div>
          <div className="space-y-1.5"><Label htmlFor="notes">Observações</Label><Textarea id="notes" name="notes" rows={3} defaultValue={client?.notes ?? ""} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending || converting}>{save.isPending || converting ? <Spinner label="Salvando" /> : !client && leadId !== NONE ? "Converter lead" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
