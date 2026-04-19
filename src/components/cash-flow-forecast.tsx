import { useMemo } from "react";
import type { EventRow } from "@/hooks/use-crm";
import { Card } from "@/components/ui/card";
import { formatILS } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface Props {
  events: EventRow[];
  unpaidTeamByEvent: Record<string, number>;
}

export function CashFlowForecast({ events, unpaidTeamByEvent }: Props) {
  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const months: { key: string; label: string; income: number; expense: number; net: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("he-IL", { month: "short", year: "2-digit" }),
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    const monthMap = new Map(months.map((m) => [m.key, m]));

    for (const e of events) {
      const ed = new Date(e.event_date);
      const key = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, "0")}`;
      const m = monthMap.get(key);
      if (!m) continue;
      if (e.status === "finished") continue;

      const total = Number(e.total_price || 0);
      const paid = Math.max(Number(e.paid_amount || 0), Number(e.deposit || 0));
      const remaining = Math.max(0, total - paid);
      m.income += remaining;
      m.expense += unpaidTeamByEvent[e.id] || 0;
    }

    for (const m of months) {
      m.net = m.income - m.expense;
    }
    return months;
  }, [events, unpaidTeamByEvent]);

  const totalIncome = data.reduce((s, m) => s + m.income, 0);
  const totalExpense = data.reduce((s, m) => s + m.expense, 0);
  const totalNet = totalIncome - totalExpense;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg grid place-items-center bg-info/10">
            <TrendingUp className="size-4 text-info" />
          </div>
          <h2 className="font-semibold">תזרים מזומנים — 3 חודשים קדימה</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Stat label="צפי הכנסות" value={formatILS(totalIncome)} color="text-success" />
          <Stat label="צפי הוצאות" value={formatILS(totalExpense)} color="text-destructive" />
          <Stat label="נטו" value={formatILS(totalNet)} color={totalNet >= 0 ? "text-info" : "text-destructive"} bold />
        </div>
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} reversed />
            <YAxis
              tick={{ fontSize: 11 }}
              orientation="right"
              tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              formatter={(v, name) => [formatILS(Number(v)), name]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <ReferenceLine y={0} stroke="var(--border)" />
            <Bar dataKey="income" fill="var(--chart-1)" name="הכנסות צפויות" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--chart-2)" name="הוצאות צפויות (צוות)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" fill="var(--chart-3)" name="נטו" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        מבוסס על אירועים פתוחים בלבד — יתרת תשלום לקוחות פחות חוב לצוות, לפי חודש האירוע
      </p>
    </Card>
  );
}

function Stat({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="text-left">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`stat-number ${bold ? "font-bold text-sm" : "font-semibold"} ${color}`}>{value}</div>
    </div>
  );
}
