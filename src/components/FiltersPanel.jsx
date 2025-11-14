// src/components/FiltersPanel.jsx
export default function FiltersPanel({
  startDate,
  endDate,
  challenge,
  payment,
  challengeOptions = [],
  paymentOptions = [],
  onChange
}) {
  return (
    <div className="filters-panel">
      <h4 className="filters-title">Filtres</h4>

      <label className="filter-block">
        <span>Date de début</span>
        <input
          type="date"
          value={startDate || ""}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </label>

      <label className="filter-block">
        <span>Date de fin</span>
        <input
          type="date"
          value={endDate || ""}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </label>

      <label className="filter-block">
        <span>Challenge</span>
        <select
          value={challenge || "Tous"}
          onChange={(e) => onChange({ challenge: e.target.value })}
        >
          <option value="Tous">Tous</option>
          {challengeOptions.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
      </label>

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

      <button className="btn-reset" onClick={() => onChange({ reset: true })}>
        Réinitialiser les filtres
      </button>
    </div>
  );
}
