// src/components/DashboardFoxx.jsx
import React from "react";

function toNumber(v) {
  if (v === null || v === undefined) return 0;
  const n = Number(
    typeof v === "string" ? v.replace(",", ".").replace("$", "") : v
  );
  return isNaN(n) ? 0 : n;
}

export default function DashboardFoxx({ data = [], filters = {}, theme }) {
  // filtrage ultra tolérant
  const filtered = data.filter((row) => {
    const d = row.date || row.Date || row["Date eu"] || row[0];
    const challenge = row.challenge || row.Challenge || row[3];
    const payment =
      row.payment_method || row["Payment Method"] || row.paiement || row[5];

    // date
    if (filters.startDate) {
      if (!d || new Date(d) < new Date(filters.startDate)) return false;
    }
    if (filters.endDate) {
      if (!d || new Date(d) > new Date(filters.endDate)) return false;
    }

    // challenge
    if (filters.challenge && filters.challenge !== "ALL") {
      if ((challenge || "").toString() !== filters.challenge) return false;
    }

    // paiement
    if (filters.payment && filters.payment !== "ALL") {
      if ((payment || "").toString() !== filters.payment) return false;
    }

    return true;
  });

  const totalSales = filtered.reduce((s, r) => {
    const v =
      r.amount ||
      r.Amount ||
      r["Amount formated"] ||
      r["Amount formatted"] ||
      r[4];
    return s + toNumber(v);
  }, 0);

  const avgSale =
    filtered.length > 0 ? totalSales / filtered.length : 0;

  // petit graphe texte
  return (
    <div className="dash-wrapper">
      <div className="cards-row">
        <div className="stat-card primary">
          <p className="stat-label">Ventes totales</p>
          <p className="stat-value">
            {totalSales.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            })}{" "}
            $US
          </p>
          <p className="stat-footer">
            sur {filtered.length} transactions
          </p>
        </div>

        <div className="stat-card success">
          <p className="stat-label">Vente moyenne</p>
          <p className="stat-value">
            {avgSale.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            })}{" "}
            $US
          </p>
          <p className="stat-footer">période filtrée</p>
        </div>

        <div className="stat-card warn">
          <p className="stat-label">Challenges distincts</p>
          <p className="stat-value">
            {
              new Set(
                filtered.map(
                  (r) =>
                    r.challenge ||
                    r.Challenge ||
                    r[3] ||
                    "(non renseigné)"
                )
              ).size
            }
          </p>
          <p className="stat-footer">parmi les lignes filtrées</p>
        </div>

        <div className="stat-card info">
          <p className="stat-label">Mode</p>
          <p className="stat-value">
            {theme === "dark" ? "Sombre" : "Clair"}
          </p>
          <p className="stat-footer">basculable en haut à droite</p>
        </div>
      </div>

      <div className="panel-like">
        <h3 style={{ marginBottom: ".7rem" }}>
          Aperçu rapide (Foxx SALES)
        </h3>
        <p style={{ fontSize: ".8rem", opacity: 0.7 }}>
          Tu peux brancher ici tes vrais graphiques (barres, courbe
          cumulée, pie chart…). Pour l’instant on affiche juste{" "}
          <b>{filtered.length}</b> lignes filtrées.
        </p>
      </div>
    </div>
  );
}
