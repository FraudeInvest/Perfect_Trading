// src/hooks/useTazapayGoogleSheet.js
import { useEffect, useState } from "react";

const CSV_URL = import.meta.env.VITE_TAZAPAY_CSV_URL || "/data/All_payin_type_1762773333.csv";
const REFRESH_MS = Number(import.meta.env.VITE_TAZAPAY_REFRESH_MS || 0);

// petit parseur CSV basique
function csvToObjects(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const parse = (line) => {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const headers = parse(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = parse(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? "";
    });
    return obj;
  });
}

// transforme une ligne brute Tazapay (ton CSV) en ligne "dashboard"
function rawToDashboard(row) {
  const status = (row["Status"] || "").toLowerCase();
  const balanceAmount = Number(row["Balance Amount"] || 0);
  const balanceCurrency = row["Balance Currency"] || row["Invoice Currency"] || "";
  const isCredit = status === "succeeded";

  const created =
    row["Payment Received Date"] ||
    row["Payin Created Date"] ||
    ""; // on prend ce qu’il y a

  const invoiceAmount = Number(row["Invoice Amount"] || 0);
  const invoiceCurrency = row["Invoice Currency"] || balanceCurrency;

  return {
    created_at: created,
    event: status ? `checkout.${status}` : "",
    operation_type: isCredit ? "CREDIT" : "DEBIT",
    source_object: "Tazapay Payin",
    source_currency: balanceCurrency,
    net_balance_impact: isCredit ? balanceAmount : 0,
    amount_minor: Math.round(invoiceAmount * 100),
    amount_major: invoiceAmount,
    charge_currency: invoiceCurrency,
    payin_id: row["Payin ID"] || "",
    balance_transaction_id: row["Payin Attempt ID"] || "",
    payment_method_type: row["Payment Method"] || "",
    customer_email: row["Customer Email"] || "",
    customer_country: (row["Customer Country"] || "").toUpperCase(),
    raw: row,
  };
}

export function useTazapayGoogleSheet() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCsv() {
    const res = await fetch(CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const txt = await res.text();
    const rawRows = csvToObjects(txt);

    // on convertit toutes les lignes
    const converted = rawRows.map(rawToDashboard);

    // on recalcule le solde cumulatif ici
    let running = 0;
    const finalRows = converted.map((r) => {
      running += Number(r.net_balance_impact || 0);
      return { ...r, updated_balance: running };
    });

    setRows(finalRows);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadCsv();
        setError("");
      } catch (e) {
        console.error("[Tazapay] error loading CSV", e);
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // si tu veux recharger automatiquement (optionnel)
  useEffect(() => {
    if (!REFRESH_MS) return;
    const timer = setInterval(() => {
      loadCsv().catch((e) => console.warn(e));
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return { rows, loading, error };
}
