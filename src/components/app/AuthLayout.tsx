import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-accent-foreground lg:flex">
        <Link to="/"><Logo inverted /></Link>
        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            Organize seus clientes, acompanhe seus orçamentos e transforme oportunidades em vendas.
          </p>
          <p className="mt-4 text-sm text-sidebar-foreground">CRM simples para prestadores de serviços e pequenas empresas.</p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">© {new Date().getFullYear()} LeadZap</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
