// src/components/ReturningVsNew.jsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";

// même logique de parsing que le reste du dashboard
function parseFoxxDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (s.includes("/")) {
    // dd/mm/yyyy
    const [d, m, y] = s.split("/").map(Number);
    const dObj = new Date(y, m - 1, d);
    return isNaN(dObj) ? null : dObj;
  }
  const dObj = new Date(s);
  return isNaN(dObj) ? null : dObj;
}

const COLORS = ["#00C49F", "#0088FE"]; // Nouveaux / Rachat

export default function ReturningVsNew({ rows = [], height = 320 }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentKey = `${currentYear}-${currentMonth}`;

  const { chartData, totalClients } = useMemo(() => {
    if (!rows || !rows.length) {
      return {
        chartData: [
          { name: "Nouveaux", value: 0 },
          { name: "Rachat", value: 0 },
        ],
        totalClients: 0,
      };
    }

    const byEmail = new Map();

    rows.forEach((r) => {
      const email = (r["Email"] || r["Client"] || r.client || "").trim();
      if (!email) return;

      const d =
        parseFoxxDate(r["Date eu"]) ||
        parseFoxxDate(r["Date EU"]) ||
        parseFoxxDate(r["Date"]) ||
        parseFoxxDate(r.date);
      if (!d || isNaN(d)) return;

      const mk = `${d.getFullYear()}-${d.getMonth()}`;
      let info = byEmail.get(email);
      if (!info) {
        info = { months: new Set() };
        byEmail.set(email, info);
      }
      info.months.add(mk);
    });

    let newClients = 0;
    let returning = 0;

    byEmail.forEach((info) => {
      if (!info.months.has(currentKey)) return;

      const otherMonths = [...info.months].filter((mk) => mk !== currentKey);
      if (otherMonths.length > 0) returning++;
      else newClients++;
    });

    return {
      chartData: [
        { name: "Nouveaux", value: newClients },
        { name: "Rachat", value: returning },
      ],
      totalClients: newClients + returning,
    };
  }, [rows, currentKey]);

  return (
    <div className="card" style={{ height }}>
      <div
        style={{
          textAlign: "center",
          fontWeight: 600,
          fontSize: "1rem",
          marginBottom: 4,
        }}
      >
        Clients — Nouveaux vs Rachat
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: "0.8rem",
          opacity: 0.8,
          marginBottom: 12,
        }}
      >
        Mois en cours • Total clients uniques : {totalClients}
      </div>

      <div style={{ width: "100%", height: height - 50 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="55%"           // 👉 centre un peu plus bas pour laisser la place au titre
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="#0b1220"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index] || "#8884d8"} />
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
  labelStyle={{
    color: "#e0f2fe",
    fontWeight: 600,
  }}
  itemStyle={{
    color: "#f9fafb",
  }}
  formatter={(value, name) => {
    // on renomme proprement les séries
    const label =
      name?.toLowerCase().includes("new") || name === "new"
        ? "Nouveaux"
        : "Rachat";

    return [`${value}`, label];
  }}
/>

            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              wrapperStyle={{
                fontSize: "0.8rem",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
