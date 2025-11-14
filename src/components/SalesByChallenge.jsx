import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

/**
 * <SalesByChallenge data={{ "Challenge A": 1234, "Challenge B": 999 }} height={360} />
 * Accepte un objet {libellé: total} ou un tableau [{name, value}].
 */
export default function SalesByChallenge({ data = {}, height = 360 }) {
  const innerH = Math.max(120, height - 44);

  let entries = [];
  if (Array.isArray(data)) {
    entries = data.map((d) => ({ name: d.name, value: Number(d.value) || 0 }));
  } else {
    entries = Object.entries(data || {}).map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    }));
  }

  const COLORS = [
    "#3b82f6",
    "#22c55e",
    "#f97316",
    "#e11d48",
    "#6366f1",
    "#14b8a6",
    "#facc15",
    "#0ea5e9",
    "#a855f7",
    "#f43f5e",
  ];

  return (
    <div className="card" style={{ height, display: "flex", flexDirection: "column" }}>
      <h3 style={{ textAlign: "center", fontWeight: 700, margin: "0 0 8px" }}>
        Ventes par challenge
      </h3>

      <div style={{ height: innerH }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              label={false}
              labelLine={false}
            >
              {entries.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
  wrapperStyle={{ outline: "none" }}
  contentStyle={{
    backgroundColor: "#020617",
    borderRadius: 8,
    border: "1px solid #38bdf8",
    boxShadow: "0 10px 15px rgba(15,23,42,0.7)",
    color: "#e0f2fe",
  }}
  labelStyle={{ color: "#e0f2fe", fontWeight: 600 }}
  itemStyle={{ color: "#f9fafb" }}
  formatter={(value, name) => [
    `${value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €`,
    name,
  ]}
/>

          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
