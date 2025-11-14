export default function KpiGrid({ kpis }) {
  return (
    <div className="grid kpi-grid">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="card">
          <div className="card-title">{kpi.label}</div>
          <div className="big">{kpi.value}</div>
          {kpi.sub && <div className="card-sub">{kpi.sub}</div>}
        </div>
      ))}
    </div>
  );
}
