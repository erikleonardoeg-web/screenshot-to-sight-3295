import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell, Briefcase, CheckSquare, ChevronsLeft, ChevronsRight, FileText, Kanban, LayoutDashboard, LogOut, Menu, Settings, UserRound, Users, UsersRound,
} from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: UsersRound },
  { to: "/funil", label: "Funil de vendas", icon: Kanban },
  { to: "/clientes", label: "Clientes", icon: Briefcase },
  { to: "/orcamentos", label: "Orçamentos", icon: FileText },
  { to: "/tarefas", label: "Tarefas", icon: CheckSquare },
  { to: "/equipe", label: "Equipe", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const COLLAPSE_KEY = "leadzap:sidebar-collapsed";

function SidebarBody({ collapsed, onNavigate, onToggle }: { collapsed: boolean; onNavigate?: (() => void) | undefined; onToggle?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col bg-sidebar py-4">
      <div className={cn("mb-6 flex h-8 items-center", collapsed ? "justify-center" : "px-5")}>
        <Logo inverted iconOnly={collapsed} />
      </div>
      <nav className={cn("flex flex-col gap-0.5", collapsed ? "px-2" : "px-3")}>
        {NAV.map(({ to, label, icon: Icon }) => {
          const link = (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-md py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed ? "justify-center px-0" : "px-3",
              )}
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-sidebar-primary" }}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={to}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip>
          ) : link;
        })}
      </nav>
      {onToggle && (
        <button
          onClick={onToggle}
          className={cn("mt-auto flex items-center gap-2 rounded-md py-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground", collapsed ? "mx-auto px-2" : "mx-3 px-3")}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Recolher menu</>}
        </button>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data } = useCurrentOrg();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pageTitle = NAV.find((n) => pathname.startsWith(n.to))?.label ?? "";
  const name = data?.profile?.full_name || data?.user.email || "";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "U";

  useEffect(() => { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); }, []);
  const toggle = () => setCollapsed((c) => { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); return !c; });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-background">
        <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border transition-[width] duration-200 lg:block", collapsed ? "w-16" : "w-60")}>
          <SidebarBody collapsed={collapsed} onToggle={toggle} />
        </aside>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-64 border-sidebar-border p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarBody collapsed={false} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-60")}>
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
            <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Menu />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{pageTitle}</p>
              <p className="truncate text-xs text-muted-foreground">{data?.organization?.name ?? "…"}</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notificações"><Bell /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
                    <Bell className="size-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Você está em dia. Nenhuma notificação.</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted" aria-label="Menu do perfil">
                    <Avatar className="size-8"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback></Avatar>
                    <span className="hidden max-w-36 truncate text-sm sm:block">{name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="truncate">{name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{data?.user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/configuracoes"><UserRound /> Meu perfil</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/equipe"><Users /> Equipe</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive"><LogOut /> Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
