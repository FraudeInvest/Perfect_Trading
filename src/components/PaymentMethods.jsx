// src/components/PaymentMethods.jsx
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

function normalizeData(input) {
  // 1) si déjà un tableau -> on vérifie la forme
  if (Array.isArray(input)) {
    return input
      .map((it) => ({
        payment: it.payment ?? it.label ?? it.name ?? "N/A",
        total: Number(it.total ?? it.value ?? it.amount ?? 0) || 0,
      }))
      .filter((r) => r.payment && Number.isFinite(r.total));
  }

  // 2) si objet (dictionnaire) -> on convertit en tableau
  if (input && typeof input === "object") {
    return Object.entries(input)
      .map(([payment, total]) => ({
        payment: String(payment),
        total: Number(total) || 0,
      }))
      .filter((r) => Number.isFinite(r.total));
  }

  // 3) sinon -> tableau vide
  return [];
}

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#e11d48",
  "#a855f7",
  "#0ea5e9",
  "#14b8a6",
  "#facc15",
  "#6366f1",
  "#f43f5e",
  "#84cc16",
  "#06b6d4",
  "#f59e0b",
  "#7c3aed",
  "#10b981",
];

export default function PaymentMethods({ data, height = 420, title = "CA par moyen de paiement" }) {
  const rows = normalizeData(data)
    .sort((a, b) => b.total - a.total); // tri décroissant

  return (
    <div className="card" style={{ height, display: "flex", flexDirection: "column" }}>
      <h3 style={{ textAlign: "center", marginBottom: 8 }}>{title}</h3>

      <div style={{ flex: 1, minHeight: 0 }}>
        {rows.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
            }}
          >
            Aucune donnée à afficher.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                type="number"
                tick={{ fill: "#9ca3af" }}
                tickFormatter={(v) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
              />
              <YAxis dataKey="payment" type="category" tick={{ fill: "#e5e7eb" }} width={160} />
              <Tooltip
  wrapperStyle={{ outline: "none" }}
  cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
  formatter={(value, name) => [
    `${value.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €`,
    name,
  ]}
  contentStyle={{
    backgroundColor: "#020617",          // fond sombre
    borderRadius: 8,
    border: "1px solid #38bdf8",         // bord bleu ciel
    boxShadow: "0 10px 15px rgba(15,23,42,0.7)",
    color: "#e0f2fe",                     // texte principal bleu très clair
  }}
  labelStyle={{
    color: "#e0f2fe",
    fontWeight: 600,
  }}
  itemStyle={{
    color: "#f9fafb",                     // texte des valeurs en blanc
  }}
/>

              <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={26} background={{ fill: "rgba(255,255,255,0.05)" }}>
                {rows.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
