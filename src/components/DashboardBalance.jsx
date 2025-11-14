// src/components/DashboardBalance.jsx
import React from "react";

function toNumber(v) {
  if (v === null || v === undefined) return 0;
  const n = Number(
    typeof v === "string" ? v.replace(",", ".").replace("$", "") : v
  );
  return isNaN(n) ? 0 : n;
}

export default function DashboardBalance({ data = [], filters = {}, theme }) {
  // on filtre par dates si présentes
  const filtered = data.filter((row) => {
    const d =
      row.created_at ||
      row.date ||
      row["Payin Created Date"] ||
      row["Payment Received Date"];

    if (filters.startDate) {
      if (!d || new Date(d) < new Date(filters.startDate)) return false;
    }
    if (filters.endDate) {
      if (!d || new Date(d) > new Date(filters.endDate)) return false;
    }

    return true;
  });

  // crédit = lignes succeeded dans le brut ou operation_type = CREDIT
  let totalCredit = 0;
  let totalDebit = 0;

  filtered.forEach((r) => {
    // cas CSV brut
    if (r["Status"]) {
      const status = r["Status"].toLowerCase();
      const amt = toNumber(r["Balance Amount"] || 0);
      if (status === "succeeded") {
        totalCredit += amt;
      }
      // si plus tard tu as des refunds, tu pourras les mettre en débit ici
    } else {
      // cas ancien format
      const op = (r.operation_type || "").toString().toUpperCase();
      const impact = toNumber(r.net_balance_impact || r[5] || 0);
      if (op === "CREDIT") totalCredit += impact;
      if (op === "DEBIT") totalDebit += impact;
    }
  });

  return (
    <div className="dash-wrapper">
      <div className="cards-row">
        <div className="stat-card primary">
          <p className="stat-label">Crédits</p>
          <p className="stat-value">
            {totalCredit.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="stat-footer">
            {filtered.length} mouvements filtrés
          </p>
        </div>
        <div className="stat-card danger">
          <p className="stat-label">Débits</p>
          <p className="stat-value">
            {totalDebit.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="stat-footer">sur la période</p>
        </div>
        <div className="stat-card info">
          <p className="stat-label">Solde estimé</p>
          <p className="stat-value">
            {(totalCredit - totalDebit).toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="stat-footer">
            (crédits – débits)
          </p>
        </div>
      </div>
    </div>
  );
}
