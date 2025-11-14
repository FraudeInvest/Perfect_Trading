// src/components/CumulativeSalesChart.jsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function CumulativeSalesChart({ data = [] }) {
  // on essaye de deviner le bon champ chiffré
  const first = data && data.length ? data[0] : null;
  const yKey =
    (first && (first.cumulative ?? first.total ?? first.amount ?? first.value)) !== undefined
      ? (first.cumulative
          ? "cumulative"
          : first.total
          ? "total"
          : first.amount
          ? "amount"
          : "value")
      : null;

  return (
    <div className="card card--stretch chart-card">
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          margin: "0 0 8px",
        }}
      >
        Ventes cumulées
      </div>

      {!yKey ? (
        <div style={{ padding: "1rem", opacity: 0.6 }}>
          Aucune donnée exploitable pour tracer le graphique.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.03)"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text, #fff)", fontSize: 10 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--text, #fff)", fontSize: 10 }}
              tickLine={false}
            />
            <Tooltip
  wrapperStyle={{ outline: "none" }}
  cursor={{ stroke: "rgba(148,163,184,0.5)", strokeWidth: 1 }}
  formatter={(value) => [
    `${value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €`,
    "Cumul",
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

            <Line
              type="monotone"
              dataKey={yKey}
              stroke="#0ea5e9"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
