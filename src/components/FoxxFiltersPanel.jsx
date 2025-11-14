// src/components/FoxxFiltersPanel.jsx
export default function FoxxFiltersPanel({
  startDate,
  endDate,
  challenge,
  payment,
  challengeOptions = [],
  paymentOptions = [],
  onChange,
}) {
  return (
    <div className="filters-panel">
      <h4 className="filters-title">Filtres (Foxx)</h4>

      {/* Date début */}
      <label className="filter-block">
        <span>Date de début</span>
        <input
          type="date"
          value={startDate || ""}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </label>

      {/* Date fin */}
      <label className="filter-block">
        <span>Date de fin</span>
        <input
          type="date"
          value={endDate || ""}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </label>

      {/* Challenge */}
      <label className="filter-block">
        <span>Challenge</span>
        <select
          value={challenge || "Tous"}
          onChange={(e) => onChange({ challenge: e.target.value })}
        >
          <option value="Tous">Tous</option>
          {challengeOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* Moyen de paiement */}
      <label className="filter-block">
        <span>Paiement</span>
        <select
          value={payment || "Tous"}
          onChange={(e) => onChange({ payment: e.target.value })}
        >
          <option value="Tous">Tous</option>
          {paymentOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      {/* reset */}
      <button
        type="button"
        className="btn-reset"
        onClick={() => onChange({ reset: true })}
      >
        Réinitialiser
      </button>
    </div>
  );
}
