import { createFileRoute } from "@tanstack/react-router";
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
  head: () => ({ meta: [{ title: "Tarefas — LeadZap" }, { name: "description", content: "Lembretes, contatos e prazos." }] }),
  component: TasksPage,
});

const fmt = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Sem prazo";

function TasksPage() {
  const { data: tasks, isLoading } = useOrgRows("tasks");
  const { data: members } = useMembers();
  const { data: leads = [] } = useLeads();
  const save = useSaveRow("tasks");
  const [form, setForm] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const openNew = () => setForm({ open: true, task: null });
  const now = Date.now();
  return (
    <>
      <PageHeader title="Tarefas" description="Lembretes, próximos contatos e prazos da equipe." actions={<Button onClick={openNew}><Plus /> Nova tarefa</Button>} />
      {isLoading ? <TableSkeleton /> : !tasks?.length ? (
        <EmptyState icon={CheckSquare} title="Nenhuma tarefa" description="Crie lembretes e próximos contatos para não perder oportunidades." action={<Button onClick={openNew}><Plus /> Nova tarefa</Button>} />
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-card">
          {tasks.map((t) => {
            const late = t.due_at && t.status !== "concluida" && new Date(t.due_at).getTime() < now;
            const lead = leads.find((l) => l.id === t.lead_id);
            return (
              <li key={t.id} className="flex items-center gap-3 p-4">
                <Checkbox checked={t.status === "concluida"} aria-label="Concluir"
                  onCheckedChange={(c) => save.mutate({ id: t.id, values: { title: t.title, status: c ? "concluida" : "pendente" } })} />
                <button className="min-w-0 flex-1 text-left" onClick={() => setForm({ open: true, task: t })}>
                  <p className={cn("font-medium", t.status === "concluida" && "text-muted-foreground line-through")}>{t.title}</p>
                  <p className={cn("text-xs text-muted-foreground", late && "text-destructive")}>
                    {fmt(t.due_at)}{late && " · atrasada"} · {memberName(members, t.assigned_to)}{lead && ` · ${lead.name}`}
                  </p>
                </button>
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
  const { data: leads = [] } = useLeads();
  const [owner, setOwner] = useState(task?.assigned_to ?? NONE);
  const [leadId, setLeadId] = useState(task?.lead_id ?? NONE);
  const [status, setStatus] = useState<Task["status"]>(task?.status ?? "pendente");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const due = String(f.get("due_at"));
    await save.mutateAsync({
      ...(task ? { id: task.id } : {}),
      values: { title: String(f.get("title")).trim(), description: str(f.get("description")), due_at: due ? new Date(due).toISOString() : null,
        status, assigned_to: owner === NONE ? null : owner, lead_id: leadId === NONE ? null : leadId },
    });
    onClose();
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? <Spinner label="Salvando" /> : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
