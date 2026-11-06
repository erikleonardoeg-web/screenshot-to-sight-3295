import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { isOverdue } from "@/lib/contact";
import { useCurrentOrg } from "@/hooks/use-organization";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { useDeleteRow } from "@/lib/crm";
import { useState, type FormEvent } from "react";
import { CheckSquare, Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app/common";
import { EmptyState, Spinner, TableSkeleton } from "@/components/app/states";
import { MemberSelect, NONE } from "@/components/app/MemberSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TASK_STATUS, str, useOrgRows, useSaveRow, type Task } from "@/lib/crm";
import { useLeads } from "@/lib/leads";
import { memberName, useMembers } from "@/hooks/use-members";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas — LeadZap" }, { name: "description", content: "Lembretes, contatos e prazos." }, { property: "og:title", content: "Tarefas — LeadZap" }, { property: "og:description", content: "Lembretes, contatos e prazos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: TasksPage,
});

const fmt = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Sem prazo";

function TasksPage() {
  const { data: tasks, isLoading } = useOrgRows("tasks");
  const { data: members } = useMembers();
  const { data: leads = [] } = useLeads();
  const save = useSaveRow("tasks");
  const { data: clients = [] } = useOrgRows("clients");
  const [form, setForm] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const openNew = () => setForm({ open: true, task: null });
  const [filter, setFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const now = Date.now();
  return (
    <>
      <PageHeader title="Tarefas" description="Lembretes, próximos contatos e prazos da equipe." actions={<Button onClick={openNew}><Plus /> Nova tarefa</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-2"><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Filtrar tarefas"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as tarefas</SelectItem><SelectItem value="atrasadas">Atrasadas</SelectItem>{Object.entries(TASK_STATUS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><Select value={ownerFilter} onValueChange={setOwnerFilter}><SelectTrigger aria-label="Responsável das tarefas"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os responsáveis</SelectItem><SelectItem value="none">Sem responsável</SelectItem>{members?.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>)}</SelectContent></Select></div>
      {isLoading ? <TableSkeleton /> : !tasks?.length ? (
        <EmptyState icon={CheckSquare} title="Nenhuma tarefa" description="Crie lembretes e próximos contatos para não perder oportunidades." action={<Button onClick={openNew}><Plus /> Nova tarefa</Button>} />
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-card">
          {tasks.filter((t) => (filter === "all" || (filter === "atrasadas" ? isOverdue(t,now) : t.status === filter)) && (ownerFilter === "all" || (ownerFilter === "none" ? !t.assigned_to : t.assigned_to === ownerFilter))).map((t) => {
            const late = isOverdue(t,now);
            const client = clients.find((c) => c.id === t.client_id);
            const lead = leads.find((l) => l.id === t.lead_id);
            return (
              <li key={t.id} className="flex items-center gap-3 p-4">
                <Checkbox checked={t.status === "concluida"} aria-label="Concluir"
                  onCheckedChange={(c) => save.mutate({ id: t.id, values: { title: t.title, status: c ? "concluida" : "pendente" } })} />
                <Button variant="ghost" className="h-auto min-w-0 flex-1 flex-col items-start whitespace-normal text-left" onClick={() => setForm({ open: true, task: t })}>
                  <p className={cn("font-medium", t.status === "concluida" && "text-muted-foreground line-through")}>{t.title}</p>
                  <p className={cn("text-xs text-muted-foreground", late && "text-destructive")}>
                    {fmt(t.due_at)}{late && " · atrasada"} · {memberName(members, t.assigned_to)}{lead && ` · ${lead.name}`}{client && ` · ${client.name}`}
                  </p>
                </Button>
                <StatusBadge status={t.status} label={TASK_STATUS[t.status]} />
              </li>
            );
          })}
        </ul>
      )}
      {form.open && <TaskForm task={form.task} onClose={() => setForm({ open: false, task: null })} />}
    </>
  );
}

const toLocalInput = (d: string | null) => d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

function TaskForm({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const save = useSaveRow("tasks");
  const remove = useDeleteRow("tasks");
  const { data: ctx } = useCurrentOrg();
  const { data: clients = [] } = useOrgRows("clients");
  const [clientId,setClientId] = useState(task?.client_id ?? NONE);
  const { data: leads = [] } = useLeads();
  const [owner, setOwner] = useState(task?.assigned_to ?? NONE);
  const [leadId, setLeadId] = useState(task?.lead_id ?? NONE);
  const [status, setStatus] = useState<Task["status"]>(task?.status ?? "pendente");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const due = String(f.get("due_at"));
    if (!String(f.get("title")).trim()) { toast.error("Informe o título da tarefa."); return; }
    try {
    await save.mutateAsync({
      ...(task ? { id: task.id } : {}),
      values: { title: String(f.get("title")).trim(), description: str(f.get("description")), due_at: due ? new Date(due).toISOString() : null,
        client_id: clientId === NONE ? null : clientId, status, assigned_to: owner === NONE ? null : owner, lead_id: leadId === NONE ? null : leadId },
    });
    onClose();
    } catch { /* toast */ }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="space-y-1.5"><Label htmlFor="title">Título *</Label><Input id="title" name="title" required maxLength={200} defaultValue={task?.title ?? ""} placeholder="Ex.: Ligar para o cliente" /></div>
          <div className="space-y-1.5"><Label htmlFor="description">Descrição</Label><Textarea id="description" name="description" rows={2} defaultValue={task?.description ?? ""} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="due_at">Prazo</Label><Input id="due_at" name="due_at" type="datetime-local" defaultValue={toLocalInput(task?.due_at ?? null)} /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Task["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TASK_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Responsável</Label><MemberSelect value={owner} onChange={setOwner} /></div>
            <div className="space-y-1.5">
              <Label>Lead relacionado</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>Nenhum</SelectItem>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Cliente relacionado</Label><Select value={clientId} onValueChange={setClientId}><SelectTrigger aria-label="Cliente da tarefa"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Nenhum</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <DialogFooter>
            {task && (ctx?.role === "owner" || ctx?.role === "admin") && <ConfirmDelete label="Excluir tarefa" pending={remove.isPending} onConfirm={async () => { await remove.mutateAsync(task.id); onClose(); }} />}
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? <Spinner label="Salvando" /> : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
