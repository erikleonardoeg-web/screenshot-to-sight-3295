import { createFileRoute } from "@tanstack/react-router";
import { Bell, CalendarClock, Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import { DemoNotice, PageHeader, StatusBadge } from "@/components/app/common";
import { Button } from "@/components/ui/button";
import { demoTasks } from "@/lib/demo-data";

const LABEL: Record<string, string> = { pendente: "Pendente", em_andamento: "Em andamento", concluida: "Concluída" };
const ICON = { Lembrete: Bell, "Próximo contato": Phone, Prazo: CalendarClock } as const;

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas — LeadZap" }, { name: "description", content: "Lembretes, contatos e prazos." }] }),
  component: TasksPage,
});

function TasksPage() {
  return (
    <>
      <PageHeader title="Tarefas" description="Lembretes, próximos contatos e prazos da equipe."
        actions={<Button onClick={() => toast.info("A criação de tarefas será liberada na próxima fase.")}><Plus /> Nova tarefa</Button>} />
      <DemoNotice />
      <ul className="divide-y rounded-xl border bg-card shadow-card">
        {demoTasks.map((t) => {
          const Icon = ICON[t.type];
          return (
            <li key={t.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.type} · {t.owner} · {new Date(t.due.replace(" ", "T")).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
              <StatusBadge status={t.status} label={LABEL[t.status] ?? t.status} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
