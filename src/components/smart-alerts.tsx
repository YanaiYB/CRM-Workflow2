import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import type { EventRow, ClientRow } from "@/hooks/use-crm";
import { formatILS, formatDateIL } from "@/lib/format";
import { AlertTriangle, Clock, Users, Image as ImageIcon, ChevronLeft, CheckCircle2, Heart } from "lucide-react";

interface Alert {
  id: string;
  type: "deposit" | "team_debt" | "gallery" | "upcoming" | "anniversary";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  amount?: number;
  href: { to: string; params: Record<string, string> };
}

interface Props {
  events: EventRow[];
  clients: ClientRow[];
  unpaidTeamByEvent: Record<string, number>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function SmartAlerts({ events, clients, unpaidTeamByEvent }: Props) {
  const clientMap = useMemo(() => {
    const m: Record<string, ClientRow> = {};
    for (const c of clients) m[c.id] = c;
    return m;
  }, [clients]);

  const alerts = useMemo<Alert[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out: Alert[] = [];

    for (const e of events) {
      const ed = new Date(e.event_date);
      ed.setHours(0, 0, 0, 0);
      const daysFromEvent = Math.floor((today.getTime() - ed.getTime()) / DAY_MS);
      const total = Number(e.total_price || 0);
      const paid = Math.max(Number(e.paid_amount || 0), Number(e.deposit || 0));
      const remaining = Math.max(0, total - paid);
      const clientName = (e.client_id && clientMap[e.client_id]?.name) || e.event_name;

      // 1. Deposit not collected — upcoming event in less than 14 days, no payment
      if (
        e.status !== "finished" &&
        ed >= today &&
        daysFromEvent >= -14 &&
        paid === 0 &&
        total > 0
      ) {
        const daysLeft = -daysFromEvent;
        out.push({
          id: `deposit-${e.id}`,
          type: "deposit",
          severity: daysLeft <= 7 ? "high" : "medium",
          title: `אין מקדמה — ${clientName}`,
          detail: `האירוע בעוד ${daysLeft} ימים • ${formatDateIL(e.event_date)}`,
          amount: total,
          href: { to: "/event/$eventId", params: { eventId: e.id } },
        });
      }

      // 2. Outstanding balance — event passed 7+ days ago, still owed
      if (daysFromEvent >= 7 && remaining > 0) {
        out.push({
          id: `balance-${e.id}`,
          type: "deposit",
          severity: daysFromEvent >= 30 ? "high" : "medium",
          title: `יתרה לגבייה — ${clientName}`,
          detail: `${daysFromEvent} ימים אחרי האירוע (${formatDateIL(e.event_date)})`,
          amount: remaining,
          href: { to: "/event/$eventId", params: { eventId: e.id } },
        });
      }

      // 3. Team debt 30+ days after event
      const teamDebt = unpaidTeamByEvent[e.id] || 0;
      if (teamDebt > 0 && daysFromEvent >= 30) {
        out.push({
          id: `team-${e.id}`,
          type: "team_debt",
          severity: daysFromEvent >= 60 ? "high" : "medium",
          title: `חוב לצוות — ${clientName}`,
          detail: `${daysFromEvent} ימים אחרי האירוע — לא שולם לצוות`,
          amount: teamDebt,
          href: { to: "/event/$eventId", params: { eventId: e.id } },
        });
      }

      // 4. Gallery delay — wedding event 30+ days finished, photos not sent
      if (
        e.brand === "lore_weddings" &&
        daysFromEvent >= 30 &&
        e.status !== "finished" &&
        !e.album_photos_sent
      ) {
        out.push({
          id: `gallery-${e.id}`,
          type: "gallery",
          severity: daysFromEvent >= 60 ? "high" : "medium",
          title: `גלריה מתעכבת — ${clientName}`,
          detail: `${daysFromEvent} ימים אחרי האירוע — תמונות עדיין לא נשלחו`,
          href: { to: "/event/$eventId", params: { eventId: e.id } },
        });
      }

      // 5. Upcoming this week reminder
      if (daysFromEvent <= 0 && daysFromEvent >= -7 && e.status !== "finished") {
        const daysLeft = -daysFromEvent;
        out.push({
          id: `upcoming-${e.id}`,
          type: "upcoming",
          severity: "low",
          title: `אירוע ${daysLeft === 0 ? "היום" : `בעוד ${daysLeft} ימים`} — ${clientName}`,
          detail: `${e.event_name} • ${e.location || formatDateIL(e.event_date)}`,
          href: { to: "/event/$eventId", params: { eventId: e.id } },
        });
      }

      // 6. Anniversary reminder — LORE weddings, 1 year (or annual) since event date, ±7 days window
      if (
        e.brand === "lore_weddings" &&
        e.event_type !== "henna" &&
        e.client_id &&
        clientMap[e.client_id]?.phone
      ) {
        const eventYear = ed.getFullYear();
        const todayYear = today.getFullYear();
        const yearsSince = todayYear - eventYear;
        if (yearsSince >= 1) {
          const anniversaryThisYear = new Date(todayYear, ed.getMonth(), ed.getDate());
          anniversaryThisYear.setHours(0, 0, 0, 0);
          const diffDays = Math.round(
            (anniversaryThisYear.getTime() - today.getTime()) / DAY_MS,
          );
          if (diffDays >= -1 && diffDays <= 7) {
            const dayLabel =
              diffDays === 0
                ? "היום!"
                : diffDays > 0
                  ? `בעוד ${diffDays} ימים`
                  : "אתמול";
            out.push({
              id: `anniversary-${e.id}`,
              type: "anniversary",
              severity: "low",
              title: `${yearsSince} שנים יחד — ${clientName} 💕`,
              detail: `יום נישואין ${dayLabel} • שלח ברכה`,
              href: { to: "/client/$clientId", params: { clientId: e.client_id } },
            });
          }
        }
      }
    }

    // Sort by severity, then by amount desc
    const sevRank = { high: 0, medium: 1, low: 2 };
    return out.sort((a, b) => {
      if (sevRank[a.severity] !== sevRank[b.severity]) return sevRank[a.severity] - sevRank[b.severity];
      return (b.amount || 0) - (a.amount || 0);
    });
  }, [events, clientMap, unpaidTeamByEvent]);

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 flex items-center gap-3">
        <CheckCircle2 className="size-5 text-success shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-success">הכל תחת שליטה</span>
          <span className="text-muted-foreground"> — אין פעולות דחופות כרגע 🎉</span>
        </div>
      </div>
    );
  }

  const top = alerts.slice(0, 5);
  const highCount = alerts.filter((a) => a.severity === "high").length;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/5 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-warning/20 bg-warning/10 flex items-center gap-2">
        <AlertTriangle className="size-4 text-warning" />
        <div className="text-sm font-semibold text-warning">
          פעולות דחופות
          <span className="text-muted-foreground font-normal"> • {alerts.length} סה״כ</span>
          {highCount > 0 && (
            <span className="mr-2 text-[10px] px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground">
              {highCount} קריטי
            </span>
          )}
        </div>
      </div>
      <ul className="divide-y divide-warning/15">
        {top.map((a) => (
          <li key={a.id}>
            <Link
              to={a.href.to as "/event/$eventId"}
              params={a.href.params as { eventId: string }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-warning/10 transition-colors group"
            >
              <AlertIcon type={a.type} severity={a.severity} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{a.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{a.detail}</div>
              </div>
              {a.amount !== undefined && (
                <div className="text-sm font-bold stat-number text-warning shrink-0">
                  {formatILS(a.amount)}
                </div>
              )}
              <ChevronLeft className="size-4 text-muted-foreground group-hover:-translate-x-0.5 transition-transform shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
      {alerts.length > top.length && (
        <div className="px-4 py-2 text-[11px] text-muted-foreground border-t border-warning/15 bg-warning/5">
          ועוד {alerts.length - top.length} פעולות נוספות...
        </div>
      )}
    </div>
  );
}

function AlertIcon({ type, severity }: { type: Alert["type"]; severity: Alert["severity"] }) {
  const colorClass =
    type === "anniversary"
      ? "bg-pink-500/15 text-pink-500"
      : severity === "high"
        ? "bg-destructive/15 text-destructive"
        : severity === "medium"
          ? "bg-warning/20 text-warning"
          : "bg-info/15 text-info";
  const Icon =
    type === "anniversary"
      ? Heart
      : type === "team_debt"
        ? Users
        : type === "gallery"
          ? ImageIcon
          : type === "upcoming"
            ? Clock
            : Clock;
  return (
    <div className={`size-8 rounded-lg grid place-items-center shrink-0 ${colorClass}`}>
      <Icon className="size-4" />
    </div>
  );
}
