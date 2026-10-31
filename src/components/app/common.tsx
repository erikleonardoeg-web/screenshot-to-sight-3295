import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
      <FlaskConical className="mt-0.5 size-4 shrink-0" />
      <p>
        <strong>Dados fictícios.</strong>{" "}
        {children ?? "As informações abaixo são apenas demonstrativas e serão substituídas pelos dados reais da sua empresa na próxima fase."}
      </p>
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-card", className)}>
      {title && (
        <header className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const tone: Record<string, string> = {
  novo: "bg-info/10 text-info border-info/20",
  primeiro_contato: "bg-accent text-accent-foreground border-primary/20",
  negociacao: "bg-warning/15 text-warning-foreground border-warning/30",
  orcamento_enviado: "bg-info/10 text-info border-info/20",
  venda_concluida: "bg-success/10 text-success border-success/20",
  venda_perdida: "bg-destructive/10 text-destructive border-destructive/20",
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-info/10 text-info border-info/20",
  aprovado: "bg-success/10 text-success border-success/20",
  recusado: "bg-destructive/10 text-destructive border-destructive/20",
  pendente: "bg-warning/15 text-warning-foreground border-warning/30",
  em_andamento: "bg-info/10 text-info border-info/20",
  concluida: "bg-success/10 text-success border-success/20",
  ativo: "bg-success/10 text-success border-success/20",
  inativo: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", tone[status])}>
      {label}
    </Badge>
  );
}

export function ComingSoon({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
