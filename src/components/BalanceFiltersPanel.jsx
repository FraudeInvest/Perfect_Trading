// src/components/BalanceFiltersPanel.jsx
export default function BalanceFiltersPanel({
  startDate,
  endDate,
  operationType,
  sourceObject,
  sourceCurrency,
  operationTypeOptions = [],
  sourceObjectOptions = [],
  sourceCurrencyOptions = [],
  onChange,
}) {
  return (
    <div className="filters-panel">
      <h4 className="filters-title">Filtres (Tazapay)</h4>

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

      {/* Operation Type (CREDIT / DEBIT) */}
      <label className="filter-block">
        <span>Operation Type</span>
        <select
          value={operationType || "Tous"}
          onChange={(e) => onChange({ operationType: e.target.value })}
        >
          <option value="Tous">Tous</option>
          {operationTypeOptions.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </label>

      {/* Source Object (Adjustment / Checkout / Settlement) */}
      <label className="filter-block">
        <span>Source Object</span>
        <select
          value={sourceObject || "Tous"}
          onChange={(e) => onChange({ sourceObject: e.target.value })}
        >
          <option value="Tous">Tous</option>
          {sourceObjectOptions.map((so) => (
            <option key={so} value={so}>
              {so}
            </option>
          ))}
        </select>
      </label>

      {/* Source Currency (CHF / USD / EUR / GBP) */}
      <label className="filter-block">
        <span>Source Currency</span>
        <select
          value={sourceCurrency || "Tous"}
          onChange={(e) => onChange({ sourceCurrency: e.target.value })}
        >
          <option value="Tous">Tous</option>
          {sourceCurrencyOptions.map((cur) => (
            <option key={cur} value={cur}>
              {cur}
            </option>
          ))}
        </select>
      </label>

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
