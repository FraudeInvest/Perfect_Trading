// src/components/LastSalesTable.jsx
import React, { useMemo } from "react";

// Parse une date Foxx : "11/10/2025" ou "2025-10-11"
function parseFoxxDate(value) {
  if (!value) return null;
  const s = String(value).trim();

  // format dd/mm/yyyy
  if (s.includes("/")) {
    const [d, m, y] = s.split("/").map(Number);
    const dObj = new Date(y, m - 1, d);
    return isNaN(dObj) ? null : dObj;
  }

  const dObj = new Date(s);
  return isNaN(dObj) ? null : dObj;
}

// "329,4" -> 329.4
function toNumberFR(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function LastSalesTable({
  rows = [],
  mode = "today",          // "today" ou "month"
  height = 520,
  limit,                   // ignoré pour "today"
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { displayRows, totalAmount } = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { displayRows: [], totalAmount: 0 };
    }

    const mapped = rows
      .map((r) => {
        const dObj =
          parseFoxxDate(r["Date eu"]) ||
          parseFoxxDate(r["Date EU"]) ||
          parseFoxxDate(r["Date"]) ||
          parseFoxxDate(r.date);

        if (!dObj) return null;

        const order =
          r["Order ID"] ||
          r["OrderId"] ||
          r["Order Id"] ||
          r["Order"] ||
          r["Order#"] ||
          r.order ||
          "";

        const client = r["Email"] || r["Client"] || r.client || "";
        const challenge = r["Challenge"] || r.challenge || "";
        const amount = toNumberFR(
          r["Amount"] || r["Montant"] || r.amount || r["Amount formated"]
        );
        const payment =
          r["Payment Method"] ||
          r["Payment"] ||
          r["Paiement"] ||
          r.payment ||
          "";

        return {
          dateObj: dObj,
          dateLabel: dObj.toLocaleDateString("fr-FR"),
          order,
          client,
          challenge,
          amount,
          payment,
        };
      })
      .filter(Boolean);

    if (mapped.length === 0) {
      return { displayRows: [], totalAmount: 0 };
    }

    // Filtre par jour ou par mois
    let filtered = mapped;
    if (mode === "today") {
      const y = today.getFullYear();
      const m = today.getMonth();
      const d = today.getDate();
      filtered = mapped.filter((row) => {
        const r = row.dateObj;
        return (
          r.getFullYear() === y &&
          r.getMonth() === m &&
          r.getDate() === d
        );
      });
    } else if (mode === "month") {
      const y = today.getFullYear();
      const m = today.getMonth();
      filtered = mapped.filter((row) => {
        const r = row.dateObj;
        return r.getFullYear() === y && r.getMonth() === m;
      });
    }

    // Tri décroissant
    filtered.sort((a, b) => b.dateObj - a.dateObj);

    // 👉 Pas de limite si mode === "today"
    if (mode !== "today" && typeof limit === "number" && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0);

    return { displayRows: filtered, totalAmount: total };
  }, [rows, mode, today, limit]);

  const subtitle =
    mode === "today"
      ? `Aujourd'hui : ${today.toLocaleDateString("fr-FR")} • ${
          displayRows.length
        } ligne(s)`
      : `Mois en cours : ${today.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        })} • ${displayRows.length} ligne(s)`;

  return (
    <div className="card card-table" style={{ height }}>
      <div className="card-table-header">
        <h3>Dernières ventes</h3>
        <div className="card-table-subtitle">{subtitle}</div>
      </div>

      <div className="table-wrapper">
        <table className="last-sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Order</th>
              <th>Client</th>
              <th>Challenge</th>
              <th>Montant</th>
              <th>Paiement</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "0.8rem" }}>
                  Aucune vente trouvée pour la période.
                </td>
              </tr>
            ) : (
              <>
                {displayRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.dateLabel}</td>
                    <td>{row.order || "—"}</td>
                    <td>{row.client}</td>
                    <td>{row.challenge}</td>
                    <td style={{ textAlign: "right" }}>
                      {row.amount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      €
                    </td>
                    <td>{row.payment}</td>
                  </tr>
                ))}

                {/* Ligne TOTAL DU JOUR */}
                <tr className="last-sales-total-row">
                  <td colSpan={4} style={{ fontWeight: 600 }}>
                    Total du jour
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {totalAmount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </td>
                  <td />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
