// src/components/SourceSidebar.jsx
import FoxxFiltersPanel from "./FoxxFiltersPanel";

export default function SourceSidebar({
  foxxCount = 0,

  // filtres Foxx
  foxxFilters,
  onFoxxFiltersChange,
}) {
  return (
    <aside className="sidebar">
      {/* header */}
      <div className="sidebar-header">
        <div>
          <div className="app-name">Perfect Trading</div>
          <div className="app-sub">Dashboard Pro</div>
        </div>

        {/* Icône dashboard */}
        <div className="app-icon">📊</div>
      </div>

      {/* SOURCES */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Source de données</div>

        <div className="sidebar-source strong active">
          <span className="icon-badge orange">🟠</span>
          <div className="source-text">
            <div className="source-name">Foxx SALES</div>
            <div className="source-meta">{foxxCount} transactions</div>
          </div>
          <span className="pill">Actif</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Navigation</div>
        <div className="nav-btn active">Tableau de bord</div>
        <div className="nav-btn disabled">Prévisions</div>
      </div>

      {/* FILTRES FOXX */}
      <FoxxFiltersPanel
        startDate={foxxFilters.startDate}
        endDate={foxxFilters.endDate}
        challenge={foxxFilters.challenge}
        payment={foxxFilters.payment}
        onChange={onFoxxFiltersChange}
        challengeOptions={foxxFilters.challengeOptions || []}
        paymentOptions={foxxFilters.paymentOptions || []}
      />
    </aside>
  );
}
