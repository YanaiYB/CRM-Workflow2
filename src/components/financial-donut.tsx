import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatILS } from "@/lib/format";

interface Props {
  revenue: number;
  expenses: number;
  profit: number;
  size?: number;
}

export function FinancialDonut({ revenue, expenses, profit, size = 180 }: Props) {
  const data = [
    { name: "הכנסות", value: Math.max(revenue, 0), color: "var(--chart-1)" },
    { name: "הוצאות", value: Math.max(expenses, 0), color: "var(--chart-2)" },
    { name: "רווח", value: Math.max(profit, 0), color: "var(--chart-3)" },
  ];

  const empty = data.every((d) => d.value === 0);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {empty ? (
        <div className="size-full rounded-full border-[12px] border-muted/40" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={size * 0.32}
              outerRadius={size * 0.46}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatILS(Number(v))}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">רווח נטו</div>
          <div className="text-base font-bold stat-number">{formatILS(profit)}</div>
        </div>
      </div>
    </div>
  );
}
