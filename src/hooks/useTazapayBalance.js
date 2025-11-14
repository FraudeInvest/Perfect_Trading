import { useEffect, useState } from "react";

export function useTazapayBalance() {
  const id    = import.meta.env.VITE_TAZAPAY_SHEET_ID;
  const sheet = import.meta.env.VITE_TAZAPAY_SHEET_NAME || "Feuille 1";
  const range = import.meta.env.VITE_TAZAPAY_RANGE || "A:G";

  const [state, setState] = useState({ loading: true, data: [], err: null });

  useEffect(() => {
    if (!id) {
      setState({ loading: false, data: [], err: "Missing VITE_TAZAPAY_SHEET_ID" });
      return;
    }
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&range=${encodeURIComponent(range)}`;

    fetch(url)
      .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
      .then(text => {
        const rows = text.trim().split(/\r?\n/).map(l => l.split(","));
        if (!rows.length) return setState({ loading:false, data:[], err:null });

        const headers = rows[0].map(h => h.trim());
        const idx = h => headers.indexOf(h);

        const data = rows.slice(1).map(r => ({
          created_at: r[idx("created_at")] || "",
          event: r[idx("event")] || "",
          operation_type: r[idx("operation_type")] || "",
          source_object: r[idx("source_object")] || "",
          source_currency: r[idx("source_currency")] || "",
          net_balance_impact: parseFloat(String(r[idx("net_balance_impact")] || "0").replace(",", ".")) || 0,
          updated_balance: parseFloat(String(r[idx("updated_balance")] || "0").replace(",", ".")) || 0,
        }));

        setState({ loading:false, data, err:null });
      })
      .catch(err => setState({ loading:false, data:[], err:String(err) }));
  }, [id, sheet, range]);

  return state;
}
