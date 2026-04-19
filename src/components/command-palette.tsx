import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useClients, useEvents } from "@/hooks/use-crm";
import { BRANDS } from "@/lib/brand";
import { formatDateIL } from "@/lib/format";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  LayoutDashboard,
  User,
  CalendarDays,
  Heart,
  Camera,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { data: events } = useEvents();
  const [query, setQuery] = useState("");

  // Reset query when closing
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    setTimeout(fn, 50);
  };

  // Top results — limit to keep palette snappy
  const topClients = useMemo(() => clients.slice(0, 50), [clients]);
  const topEvents = useMemo(
    () =>
      [...events]
        .sort(
          (a, b) =>
            new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
        )
        .slice(0, 50),
    [events],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="חיפוש לקוחות, אירועים, או פעולות..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>לא נמצאו תוצאות.</CommandEmpty>

        <CommandGroup heading="ניווט">
          <CommandItem
            onSelect={() => run(() => navigate({ to: "/" }))}
            value="ראשי דשבורד home"
          >
            <LayoutDashboard className="size-4" />
            <span>דף ראשי</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate({ to: "/calendar" }))}
            value="לוח שנה calendar"
          >
            <CalendarIcon className="size-4" />
            <span>לוח שנה</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate({ to: "/clients" }))}
            value="לקוחות clients"
          >
            <Users className="size-4" />
            <span>לקוחות</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate({ to: "/insights" }))}
            value="תובנות insights"
          >
            <TrendingUp className="size-4" />
            <span>תובנות</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() =>
                navigate({
                  to: "/brand/$brandId",
                  params: { brandId: "lore_weddings" },
                }),
              )
            }
            value="lore weddings מותג חתונות"
          >
            <Heart className="size-4" style={{ color: "var(--brand-lore)" }} />
            <span>LORE WEDDINGS</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() =>
                navigate({
                  to: "/brand/$brandId",
                  params: { brandId: "depth_studios" },
                }),
              )
            }
            value="depth studios מותג"
          >
            <Camera
              className="size-4"
              style={{ color: "var(--brand-depth)" }}
            />
            <span>Depth Studios</span>
          </CommandItem>
        </CommandGroup>

        {topClients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="לקוחות">
              {topClients.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`לקוח ${c.name} ${c.phone || ""} ${c.email || ""}`}
                  onSelect={() =>
                    run(() =>
                      navigate({
                        to: "/client/$clientId",
                        params: { clientId: c.id },
                      }),
                    )
                  }
                >
                  <User className="size-4" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: `${BRANDS[c.brand].color}20`,
                      color: BRANDS[c.brand].color,
                    }}
                  >
                    {BRANDS[c.brand].name}
                  </span>
                  {c.phone && (
                    <span className="text-xs text-muted-foreground stat-number truncate hidden sm:inline">
                      {c.phone}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {topEvents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="אירועים">
              {topEvents.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`אירוע ${e.event_name} ${e.event_date} ${e.location || ""}`}
                  onSelect={() =>
                    run(() =>
                      navigate({
                        to: "/event/$eventId",
                        params: { eventId: e.id },
                      }),
                    )
                  }
                >
                  <CalendarDays className="size-4" />
                  <span className="flex-1 truncate">{e.event_name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: `${BRANDS[e.brand].color}20`,
                      color: BRANDS[e.brand].color,
                    }}
                  >
                    {BRANDS[e.brand].name}
                  </span>
                  <span className="text-xs text-muted-foreground stat-number whitespace-nowrap">
                    {formatDateIL(e.event_date)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
