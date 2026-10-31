import { cn } from "@/lib/utils";

/** Símbolo LeadZap: balão de conversa (comunicação) com raio (velocidade). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 shrink-0", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M8 9.5A3.5 3.5 0 0 1 11.5 6h9A3.5 3.5 0 0 1 24 9.5v8a3.5 3.5 0 0 1-3.5 3.5H14l-4.5 4v-4.3A3.5 3.5 0 0 1 8 17.5z" className="fill-primary-foreground" />
      <path d="M17.2 8.5 12.5 14.6h3.3l-1 4.9 4.7-6.1h-3.3z" className="fill-primary" />
    </svg>
  );
}

export function Logo({ className, inverted, iconOnly }: { className?: string; inverted?: boolean; iconOnly?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", inverted ? "text-sidebar-accent-foreground" : "text-foreground", className)}>
      <LogoMark />
      {!iconOnly && <span className="text-lg">Lead<span className="text-primary">Zap</span></span>}
    </span>
  );
}
