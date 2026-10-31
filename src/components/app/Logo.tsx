import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className={cn("flex size-7 items-center justify-center rounded-lg", inverted ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-primary text-primary-foreground")}>
        <Zap className="size-4" fill="currentColor" />
      </span>
      <span className="text-lg">LeadZap</span>
    </span>
  );
}
