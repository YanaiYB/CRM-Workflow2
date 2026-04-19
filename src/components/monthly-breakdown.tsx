import { useMemo, useState } from "react";
import type { EventRow } from "@/hooks/use-crm";
import { formatILS } from "@/lib/format";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Wallet, Clock, CalendarDays } from "lucide-react";

const HE_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

interface MonthRow {
  month: number; // 0-11
  revenue: number;
  expenses: number;
  unpaidTeam: number;
  profit: number;
  unpaid: number;
  count: number;
}

interface Props {
  events: EventRow[];
  teamCosts: Record<string, number>;
  unpaidTeamCosts?: Record<string, number>;
}

export function MonthlyBreakdown({ events, teamCosts, unpaidTeamCosts = {} }: Props) {
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const e of events) set.add(new Date(e.event_date).getFullYear());
    if (set.size === 0) set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [events]);

  const [year, setYear] = useState<number>(() => {
    const current = new Date().getFullYear();
    return years.includes(current) ? current : (years[0] ?? current);
  });

  const months = useMemo<MonthRow[]>(() => {
    const rows: MonthRow[] = HE_MONTHS.map((_, m) => ({
      month: m, revenue: 0, expenses: 0, unpaidTeam: 0, profit: 0, unpaid: 0, count: 0,
    }));

    for (const e of events) {
      const d = new Date(e.event_date);
      if (d.getFullYear() !== year) continue;
      const m = d.getMonth();
      const total = Number(e.total_price || 0);
      const paid = Number(e.paid_amount || 0);
      const isPaid = paid >= total && total > 0;
      const expense = teamCosts[e.id] || 0;
      const teamDebt = unpaidTeamCosts[e.id] || 0;

      rows[m].count++;
      rows[m].expenses += expense;
      rows[m].unpaidTeam += teamDebt;
      if (isPaid) rows[m].revenue += total;
      else rows[m].unpaid += Math.max(0, total - paid);
    }

    for (const r of rows) r.profit = r.revenue - r.expenses;
    return rows;
  }, [events, year, teamCosts, unpaidTeamCosts]);

  const yearTotals = useMemo(() => {
    return months.reduce(
      (acc, m) => ({
        revenue: acc.revenue + m.revenue,
        expenses: acc.expenses + m.expenses,
        profit: acc.profit + m.profit,
        unpaid: acc.unpaid + m.unpaid,
      }),
      { revenue: 0, expenses: 0, profit: 0, unpaid: 0 },
    );
  }, [months]);

  const visibleMonths = months.filter((m) => m.count > 0 || m.expenses > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">פירוט חודשי</h2>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year summary strip */}
      <div className="rounded-xl border bg-muted/30 px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <YearStat label="הכנסות (שולם)" value={formatILS(yearTotals.revenue)} color="text-success" />
        <YearStat label="הוצאות" value={formatILS(yearTotals.expenses)} color="text-destructive" />
        <YearStat label="רווח נטו" value={formatILS(yearTotals.profit)} color="text-info" />
        <YearStat label="ממתין לתשלום" value={formatILS(yearTotals.unpaid)} color="text-warning" />
      </div>

      {visibleMonths.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
          אין נתונים לשנת {year}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleMonths.map((m) => (
            <div key={m.month} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">{HE_MONTHS[m.month]} {year}</div>
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {m.count} {m.count === 1 ? "אירוע" : "אירועים"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-sm">
                <Cell
                  icon={<TrendingUp className="size-3.5 text-success" />}
                  label="הכנסות"
                  value={formatILS(m.revenue)}
                />
                <Cell
                  icon={<TrendingDown className="size-3.5 text-destructive" />}
                  label="הוצאות"
                  value={formatILS(m.expenses)}
                />
                <Cell
                  icon={<Wallet className="size-3.5 text-info" />}
                  label="רווח נטו"
                  value={formatILS(m.profit)}
                  bold
                />
                <Cell
                  icon={<Clock className="size-3.5 text-warning" />}
                  label="ממתין"
                  value={formatILS(m.unpaid)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function YearStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`font-bold stat-number ${color}`}>{value}</div>
    </div>
  );
}

function Cell({
  icon, label, value, bold,
}: { icon: React.ReactNode; label: string; value: string; bold?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`stat-number ${bold ? "font-bold" : "font-semibold"}`}>{value}</div>
    </div>
  );
}
