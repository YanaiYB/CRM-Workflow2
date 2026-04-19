import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Camera,
  Heart,
  LogOut,
  TrendingUp,
  Search,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { to: "/", label: "ראשי", icon: LayoutDashboard },
  { to: "/calendar", label: "לוח שנה", icon: Calendar },
  { to: "/clients", label: "לקוחות", icon: Users },
  { to: "/insights", label: "תובנות", icon: TrendingUp },
];

const brandItems = [
  { to: "/brand/$brandId", brandId: "lore_weddings", label: "LORE WEDDINGS", icon: Heart, color: "var(--brand-lore)" },
  { to: "/brand/$brandId", brandId: "depth_studios", label: "Depth Studios", icon: Camera, color: "var(--brand-depth)" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full app-bg">
        <DesktopSidebar onOpenPalette={() => setPaletteOpen(true)} />

        <div className="flex-1 flex flex-col min-w-0">
          <DesktopHeader />
          <MobileTopBar onOpenPalette={() => setPaletteOpen(true)} />

          <main className="flex-1 pt-[56px] md:pt-0 pb-20 md:pb-8 min-w-0 w-full">
            {children}
          </main>
        </div>

        <MobileBottomNav />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </SidebarProvider>
  );
}

function DesktopHeader() {
  return (
    <header className="hidden md:flex sticky top-0 z-30 h-12 items-center gap-2 px-3 border-b border-border bg-background/70 backdrop-blur-md">
      <SidebarTrigger className="size-8" />
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  );
}

function DesktopSidebar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { logout, username } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar side="right" collapsible="icon" className="border-l border-border">
      <SidebarHeader className="border-b border-border">
        <div className={cn("flex items-center gap-2 px-1 py-1", collapsed && "justify-center px-0")}>
          <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-[var(--brand-lore)] grid place-items-center text-primary-foreground font-bold text-sm shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">Studio CRM</div>
              <div className="text-[11px] text-muted-foreground truncate">{username || "מנהל"}</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && (
          <div className="px-2 pt-2">
            <button
              type="button"
              onClick={onOpenPalette}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-border bg-background/50 text-xs text-muted-foreground hover:bg-accent transition-colors"
            >
              <Search className="size-3.5" />
              <span className="flex-1 text-right">חיפוש מהיר...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono">
                ⌘K
              </kbd>
            </button>
          </div>
        )}
        {collapsed && (
          <div className="px-2 pt-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 w-full"
              onClick={onOpenPalette}
              aria-label="חיפוש מהיר"
            >
              <Search className="size-4" />
            </Button>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>מותגים</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {brandItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(`/brand/${item.brandId}`);
                return (
                  <SidebarMenuItem key={item.brandId}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to} params={{ brandId: item.brandId }}>
                        <Icon className="size-4" style={{ color: item.color }} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Morning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith("/morning")}
                  tooltip="חשבוניות, קבלות והצעות מחיר"
                >
                  <Link to="/morning">
                    <FileText className="size-4" />
                    <span>חשבוניות וקבלות</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="התנתקות">
              <LogOut className="size-4" />
              <span>התנתקות</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileTopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { logout } = useAuth();
  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-3 h-14 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-[var(--brand-lore)] grid place-items-center text-primary-foreground font-bold text-xs shrink-0">
            S
          </div>
          <span className="font-semibold text-sm truncate">Studio CRM</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onOpenPalette}
            aria-label="חיפוש"
          >
            <Search className="size-4" />
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={logout}
            aria-label="התנתקות"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
