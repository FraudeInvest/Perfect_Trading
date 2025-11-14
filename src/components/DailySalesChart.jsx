import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/**
 * <DailySalesChart data={[{date, amount}, ...]} height={360} />
 * Accepte aussi daily / dailyArray comme prop.
 */
export default function DailySalesChart(props) {
  const { height = 360 } = props;
  // réserve ~44px pour le titre
  const innerH = Math.max(120, height - 44);

  const raw = props.data || props.daily || props.dailyArray || [];
  const safeData = Array.isArray(raw)
    ? raw.map((d) => ({
        date: d.date,
        amount:
          typeof d.amount === "number"
            ? d.amount
            : Number(
                String(d.amount ?? "")
                  .replace(/\u00A0/g, " ")
                  .replace(/[^\d,\-\. ]+/g, "")
                  .replace(/\s+/g, "")
                  .replace(",", ".")
              ) || 0,
      }))
    : [];

  const theme =
    (typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme")) ||
    "dark";

  const palette =
    theme === "light"
      ? {
          bar: "#2563eb",
          barHover: "#1d4ed8",
          axis: "#334155",
          grid: "#e5e7eb",
          tooltipBg: "#ffffff",
          tooltipText: "#111827",
        }
      : {
          bar: "#60a5fa",
          barHover: "#93c5fd",
          axis: "#cbd5e1",
          grid: "#1f2937",
          tooltipBg: "#0b1220",
          tooltipText: "#e5e7eb",
        };

  return (
    <div className="card" style={{ height, display: "flex", flexDirection: "column" }}>
      <h3 style={{ textAlign: "center", fontWeight: 700, margin: "0 0 8px" }}>
        Ventes quotidiennes
      </h3>

      {safeData.length === 0 ? (
        <div
          style={{
            height: innerH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.6,
          }}
        >
          Aucune donnée à afficher
        </div>
      ) : (
        <div style={{ height: innerH }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
              <XAxis
                dataKey="date"
                tick={{ fill: palette.axis, fontSize: 12 }}
                tickMargin={8}
                axisLine={{ stroke: palette.axis }}
                tickLine={{ stroke: palette.axis }}
              />
              <YAxis
                width={64}
                tick={{ fill: palette.axis, fontSize: 12 }}
                axisLine={{ stroke: palette.axis }}
                tickLine={{ stroke: palette.axis }}
              />
              <Tooltip
  wrapperStyle={{ outline: "none" }}
  cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
  formatter={(value) => [
    `${value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €`,
    "Montant",
  ]}
  contentStyle={{
    backgroundColor: "#020617",
    borderRadius: 8,
    border: "1px solid #38bdf8",
    boxShadow: "0 10px 15px rgba(15,23,42,0.7)",
    color: "#e0f2fe",
  }}
  labelStyle={{ color: "#e0f2fe", fontWeight: 600 }}
  itemStyle={{ color: "#f9fafb" }}
/>

              <Bar
                dataKey="amount"
                fill={palette.bar}
                stroke={palette.bar}
                radius={[3, 3, 0, 0]}
                onMouseOver={(e) =>
                  e?.target?.setAttribute("fill", palette.barHover)
                }
                onMouseOut={(e) =>
                  e?.target?.setAttribute("fill", palette.bar)
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
