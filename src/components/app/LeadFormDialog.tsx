import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGES } from "@/lib/format";
import { LEAD_SOURCES, useSaveLead, type Lead } from "@/lib/leads";
import { useMembers } from "@/hooks/use-members";
import { Spinner } from "./states";

const NONE = "__none";

export function LeadFormDialog({ open, onOpenChange, lead }: { open: boolean; onOpenChange: (o: boolean) => void; lead?: Lead | null }) {
  const save = useSaveLead();
  const { data: members = [] } = useMembers();
  const [stage, setStage] = useState<Lead["stage"]>(lead?.stage ?? "novo");
  const [source, setSource] = useState(lead?.source ?? "WhatsApp");
  const [owner, setOwner] = useState(lead?.assigned_to ?? NONE);
  const [nameError, setNameError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    if (!name) { setNameError("Informe o nome do lead."); return; }
    const value = String(f.get("estimated_value")).replace(",", ".");
    await save.mutateAsync({
      ...(lead ? { id: lead.id } : {}),
      values: {
        name,
        phone: String(f.get("phone")).trim() || null,
        email: String(f.get("email")).trim() || null,
        notes: String(f.get("notes")).trim() || null,
        estimated_value: value ? Number(value) : null,
        source, stage,
        assigned_to: owner === NONE ? null : owner,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" defaultValue={lead?.name} autoFocus maxLength={120} aria-invalid={!!nameError} onChange={() => setNameError(null)} />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="phone">Telefone / WhatsApp</Label><Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="(11) 99999-9999" defaultValue={lead?.phone ?? ""} /></div>
            <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Etapa</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as Lead["stage"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem responsável</SelectItem>
                  {members.filter((m) => m.active).map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="estimated_value">Valor potencial (R$)</Label><Input id="estimated_value" name="estimated_value" inputMode="decimal" placeholder="0,00" defaultValue={lead?.estimated_value ?? ""} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="notes">Observações</Label><Textarea id="notes" name="notes" rows={3} defaultValue={lead?.notes ?? ""} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? <Spinner label="Salvando" /> : lead ? "Salvar alterações" : "Adicionar lead"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
