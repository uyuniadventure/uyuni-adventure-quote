import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  AppSidebar,
  useSidebar,
  useCurrentSectionTitle,
} from "@/components/app-sidebar";
import { loadCurrentUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const auth = await loadCurrentUser();
    if (!auth) throw redirect({ to: "/login" });
    return { auth };
  },
  component: () => (
    <SidebarProvider>
      <AppLayout />
    </SidebarProvider>
  ),
});

function AppLayout() {
  const { collapsed, toggleCollapsed, toggleMobileOpen } = useSidebar();
  const sectionTitle = useCurrentSectionTitle();

  return (
    <div className="min-h-screen w-full bg-background">
      <AppSidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200 ease-out",
          collapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            onClick={toggleMobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{sectionTitle}</p>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
