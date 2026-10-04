import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_GROUPS } from "@/components/section";

const SidebarContext = createContext<{
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  toggleMobileOpen: () => void;
  closeMobile: () => void;
} | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleCollapsed: () => setCollapsed((v) => !v),
        mobileOpen,
        toggleMobileOpen: () => setMobileOpen((v) => !v),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function useCurrentSectionTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  for (const group of SECTION_GROUPS) {
    for (const item of group.items) {
      if (item.path === pathname) return item.title;
    }
  }
  return "Cotizador Uyuni Adventure";
}

export function AppSidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-all duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:shadow-none",
          collapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary">
            <Compass className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-white">
                Uyuni Adventure
              </p>
              <p className="truncate text-[11px] leading-tight text-sidebar-foreground/60">
                Cotizador DMC
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={closeMobile}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {SECTION_GROUPS.map((group, gi) => (
            <div key={group.label ?? `g-${gi}`} className="mb-1">
              {group.label && !collapsed && (
                <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {group.label}
                </p>
              )}
              {group.label && collapsed && (
                <div className="mx-3 my-2 border-t border-sidebar-border" />
              )}
              <ul>
                {group.items.map((item) => {
                  const active = pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={closeMobile}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          collapsed && "lg:justify-center lg:px-0",
                          active
                            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                          <item.icon className="h-[18px] w-[18px]" />
                          {active && (
                            <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-brand-orange" />
                          )}
                        </span>
                        {!collapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <div
            className={cn(
              "flex items-center gap-2.5",
              collapsed && "lg:justify-center",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              UA
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  Admin Uyuni
                </p>
                <p className="truncate text-[11px] text-sidebar-foreground/60">
                  Sesión de diseño
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
