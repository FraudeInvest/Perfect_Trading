// src/components/Sidebar.jsx
export default function Sidebar({ current, onSelect }) {
  const items = [
    { id: "global", label: "Vue globale", emoji: "📊" },
    { id: "sales", label: "Ventes Foxx", emoji: "🧾" },
    { id: "balance", label: "Transactions / Balance", emoji: "💰" }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-title">Foxx Dashboard</div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${current === item.id ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="icon">{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <small>All4Data · Malik</small>
      </div>
    </aside>
  );
}
