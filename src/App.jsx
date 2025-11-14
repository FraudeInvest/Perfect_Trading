// src/App.jsx
import { useState, useMemo, useEffect } from "react";

import { useFoxxGoogleSheet } from "./hooks/useFoxxGoogleSheet";
import { aggregateFoxx } from "./utils/foxx";

import SourceSidebar from "./components/SourceSidebar";

import DailySalesChart from "./components/DailySalesChart";
import CumulativeSalesChart from "./components/CumulativeSalesChart";
import SalesByChallenge from "./components/SalesByChallenge";
import PaymentMethods from "./components/PaymentMethods";
import LastSalesTable from "./components/LastSalesTable";
import ReturningVsNew from "./components/ReturningVsNew";

// ---------------------
// petits utilitaires FOXX
// ---------------------
function toNumberFR(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Google Sheet → "11/10/2025" ou "2025-11-10"
function parseFoxxDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (s.includes("/")) {
    const [d, m, y] = s.split("/").map(Number);
    const dObj = new Date(y, m - 1, d);
    return isNaN(dObj) ? null : dObj;
  }
  const dObj = new Date(s);
  return isNaN(dObj) ? null : dObj;
}

// Date formatée en français : "Vendredi 14 novembre 2025"
function formatDateFr(date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Numéro de semaine ISO
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // lundi=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff =
    (date - firstThursday) / 86400000 + ((firstThursday.getUTCDay() + 6) % 7);
  return 1 + Math.floor(diff / 7);
}

export default function App() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // ------- Filtres Foxx -------
  const [foxxFilters, setFoxxFilters] = useState({
    startDate: "",
    endDate: "",
    challenge: "Tous",
    payment: "Tous",
  });

  // ------- Récupération des données Foxx -------
  const foxx = useFoxxGoogleSheet();

  // ------- Agrégations Foxx -------
  const foxxAgg = useMemo(() => {
    if (foxx.loading) return null;
    return aggregateFoxx(foxx.data || [], foxxFilters);
  }, [foxx.data, foxx.loading, foxxFilters]);

  // ------- Chargement -------
  const isLoading = foxx.loading;

  // =========================================================
  //             Dates courantes
  // =========================================================
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // =========================================================
  //   Clients Nouveaux vs Rachat (mois en cours, via Email)
  // =========================================================
  const returningVsNew = useMemo(() => {
    if (foxx.loading || !foxx.data) return null;

    const rows = Array.isArray(foxx.data) ? foxx.data : [];
    const byEmail = {};

    rows.forEach((r) => {
      const email = (r["Email"] || r["Client"] || r.client || "")
        .trim()
        .toLowerCase();
      if (!email) return;

      const d =
        parseFoxxDate(r["Date eu"]) ||
        parseFoxxDate(r["Date EU"]) ||
        parseFoxxDate(r["Date"]) ||
        parseFoxxDate(r.date);
      if (!d) return;

      const y = d.getFullYear();
      const m = d.getMonth();

      if (!byEmail[email]) {
        byEmail[email] = { hasBefore: false, hasCurrent: false };
      }

      if (y === currentYear && m === currentMonth) {
        byEmail[email].hasCurrent = true;
      }
      if (y < currentYear || (y === currentYear && m < currentMonth)) {
        byEmail[email].hasBefore = true;
      }
    });

    let newCount = 0;
    let returningCount = 0;

    Object.values(byEmail).forEach((info) => {
      if (!info.hasCurrent) return;
      if (info.hasBefore) returningCount++;
      else newCount++;
    });

    const total = newCount + returningCount;
    if (total === 0) {
      return {
        newCount: 0,
        returningCount: 0,
        pctNew: 0,
        pctReturning: 0,
        total: 0,
      };
    }

    return {
      newCount,
      returningCount,
      pctNew: (newCount / total) * 100,
      pctReturning: (returningCount / total) * 100,
      total,
    };
  }, [foxx.data, foxx.loading, currentMonth, currentYear]);

  // =========================================================
  //             KPI FOXX
  // =========================================================
  const foxxKpis = [
    {
      label: "Ventes Totales",
      value: foxxAgg
        ? foxxAgg.totalSales.toLocaleString("fr-FR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + " €"
        : "…",
      sub: foxxAgg ? `sur ${foxxAgg.countSales} transactions` : "",
      color: "blue",
    },
    {
      label: "Vente Moyenne",
      value: foxxAgg
        ? foxxAgg.avgSale.toLocaleString("fr-FR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + " €"
        : "…",
      sub: foxxAgg ? "période filtrée" : "",
      color: "green",
    },
    {
      label: "Meilleur affilié (mois en cours)",
      value: foxxAgg ? foxxAgg.bestAffiliateThisMonth.name : "—",
      sub: foxxAgg
        ? `${foxxAgg.bestAffiliateThisMonth.count} ventes • ${foxxAgg.bestAffiliateThisMonth.total.toLocaleString(
            "fr-FR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} €`
        : "",
      color: "orange",
    },
    {
      label: "Meilleur challenge",
      value: foxxAgg ? foxxAgg.bestChallenge.name : "—",
      sub: foxxAgg
        ? `${foxxAgg.bestChallenge.count} ventes • ${foxxAgg.bestChallenge.total.toLocaleString(
            "fr-FR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} €`
        : "",
      color: "yellow",
    },
    {
      label: "Clients (mois en cours)",
      value:
        returningVsNew && returningVsNew.total > 0
          ? `${returningVsNew.pctNew.toLocaleString("fr-FR", {
              maximumFractionDigits: 1,
            })} % nouveaux • ${returningVsNew.pctReturning.toLocaleString(
              "fr-FR",
              { maximumFractionDigits: 1 }
            )} % rachat`
          : "—",
      sub:
        returningVsNew && returningVsNew.total > 0
          ? `Nouveaux : ${returningVsNew.newCount} • Rachat : ${returningVsNew.returningCount}`
          : "Aucun client ce mois-ci",
      color: "red",
    },
  ];

  const kpis = foxxKpis;

  // ------- Handlers filtres -------
  const handleFoxxFiltersChange = (partial) => {
    if (partial.reset) {
      setFoxxFilters({
        startDate: "",
        endDate: "",
        challenge: "Tous",
        payment: "Tous",
      });
    } else {
      setFoxxFilters((prev) => ({ ...prev, ...partial }));
    }
  };

  return (
    <div className="app-shell-pro">
      <SourceSidebar
        foxxCount={foxxAgg ? foxxAgg.countSales : 0}
        foxxFilters={{
          ...foxxFilters,
          challengeOptions: foxxAgg?.challengeList || [],
          paymentOptions: foxxAgg?.paymentList || [],
        }}
        onFoxxFiltersChange={handleFoxxFiltersChange}
      />

      <div className="main-panel">
        {/* Barre du haut : bouton thème + date + semaine */}
        <div className="top-toolbar">
          <button className="mode-btn-top" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre"}
          </button>
          <div className="date-week">
            <span className="date-text">{formatDateFr(now)}</span>
            <span className="week-text">Semaine n° {getWeekNumber(now)}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="card">⏳ Chargement des données…</div>
        ) : (
          <>
            {/* KPI FOXX */}
            <div className="kpi-colored-row">
              {kpis.map((k) => (
                <div key={k.label} className={`kpi-card kpi-${k.color}`}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-sub">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Ventes quotidiennes + par challenge */}
            <div className="grid-2" style={{ marginTop: "1.2rem" }}>
              <DailySalesChart data={foxxAgg?.daily || []} />
              <SalesByChallenge data={foxxAgg?.byChallenge || {}} />
            </div>

            {/* Ventes cumulées */}
            <div style={{ marginTop: "1.2rem" }}>
              <CumulativeSalesChart data={foxxAgg?.cumulative || []} />
            </div>

            {/* CA par paiement + graphe Nouveaux vs Rachat */}
            <div className="grid-2" style={{ marginTop: "1.2rem" }}>
              <PaymentMethods data={foxxAgg?.byPayment || {}} height={320} />
              <ReturningVsNew rows={foxx.data || []} height={320} />
            </div>

            {/* Dernières ventes : on repasse les données brutes,
                et c'est le composant qui filtre sur le jour J */}
            <div style={{ marginTop: "1.2rem" }}>
              <LastSalesTable
                rows={foxx.data || []}
                limit={0}     // 0 = pas de limite de lignes
                mode="today"  // filtre "jour J" à l'intérieur du composant
                height={520}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
