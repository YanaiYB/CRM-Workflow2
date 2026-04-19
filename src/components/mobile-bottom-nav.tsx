import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Calendar, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "ראשי", icon: LayoutDashboard },
  { to: "/calendar", label: "לוח", icon: Calendar },
  { to: "/clients", label: "לקוחות", icon: Users },
  { to: "/insights", label: "תובנות", icon: TrendingUp },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="ניווט ראשי"
    >
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors relative",
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full bg-primary" />
              )}
              <Icon className={cn("size-5", active && "scale-110 transition-transform")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
