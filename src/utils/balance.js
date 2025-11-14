// src/utils/balance.js
// Adapté pour ton export CSV Tazapay brut (colonnes 1..50)
// - ne cherche plus updated_balance
// - reconstruit le solde en lisant la colonne "Balance Amount" ou "Invoice Amount"

function toNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// parse "10/11/2025 09:48" ou ISO
function parseDateLoose(v) {
  if (!v) return null;

  if (typeof v === "string" && v.includes("/")) {
    const [datePart, timePart] = v.split(" ");
    const [d, m, y] = datePart.split("/").map(Number);
    const [hh = 0, mm = 0, ss = 0] = (timePart || "").split(":").map(Number);
    const dObj = new Date(y, m - 1, d, hh, mm, ss);
    if (!isNaN(dObj)) {
      return {
        dateObj: dObj,
        dateStr: dObj.toISOString().slice(0, 10),
      };
    }
  }

  const d = new Date(v);
  if (!isNaN(d)) {
    return {
      dateObj: d,
      dateStr: d.toISOString().slice(0, 10),
    };
  }

  return null;
}

// devine la devise dominante
export function guessCurrency(rows) {
  const map = {};
  (rows || []).forEach((r) => {
    const cur =
      r["Balance Currency"] ||
      r["Invoice Currency"] ||
      r.source_currency ||
      r.sourceCurrency;
    if (!cur) return;
    const key = String(cur).toUpperCase();
    map[key] = (map[key] || 0) + 1;
  });
  const entries = Object.entries(map);
  if (!entries.length) return "USD";
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

// =====================================================
// AGRÉGATEUR PRINCIPAL
// =====================================================
export function aggregateBalance(rows, filters = {}) {
  const {
    startDate,
    endDate,
    operationType = "Tous",
    sourceObject = "Tous",
    sourceCurrency = "Tous",
  } = filters;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const normalized = (rows || [])
    .map((raw) => {
      // on reconnaît ton CSV Tazapay
      const isCsv =
        raw["Payin ID"] ||
        raw["Invoice Amount"] ||
        raw["Payin Created Date"] ||
        raw["Status"];

      if (isCsv) {
        // date : reçu > créé
        const dInfo =
          parseDateLoose(raw["Payment Received Date"]) ||
          parseDateLoose(raw["Payin Created Date"]);
        if (!dInfo) return null;

        const status = (raw["Status"] || "").toLowerCase();

        const invoiceAmount = toNumber(raw["Invoice Amount"]);
        const balanceAmount = toNumber(raw["Balance Amount"]);
        const invCur = raw["Invoice Currency"] || "";
        const balCur = raw["Balance Currency"] || invCur;

        // règle d’impact : succeeded = crédit, refund/payout = débit
        let impact = 0;
        if (status === "succeeded") {
          impact = balanceAmount ? balanceAmount : invoiceAmount;
        } else if (
          status.includes("refund") ||
          status.includes("chargeback") ||
          status.includes("payout") ||
          status.includes("withdraw")
        ) {
          impact = -(balanceAmount ? balanceAmount : invoiceAmount);
        } else {
          impact = 0;
        }

        return {
          raw,
          dateObj: dInfo.dateObj,
          date: dInfo.dateStr,
          type: impact >= 0 ? "CREDIT" : "DEBIT",
          sourceObject: "Tazapay Payin",
          sourceCurrency: balCur,
          impact,
          bankName: raw["Bank Name"] || "",
          // certains exports écrivent "Customer country" avec un espace
          customerCountry:
            raw["Customer Country"] ||
            raw["Customer country"] ||
            raw["customer_country"] ||
            "",
        };
      }

      // ancien format (Feuille 1)
      const dInfo = parseDateLoose(raw.created_at || raw.date);
      if (!dInfo) return null;
      const impact =
        toNumber(raw.net_balance_impact) ||
        toNumber(raw.impact) ||
        toNumber(raw.netBalanceImpact);

      return {
        raw,
        dateObj: dInfo.dateObj,
        date: dInfo.dateStr,
        type:
          (raw.operation_type || "").toString().toUpperCase() ||
          (impact >= 0 ? "CREDIT" : "DEBIT"),
        sourceObject: raw.source_object || raw.sourceObject || "Tazapay",
        sourceCurrency: raw.source_currency || raw.sourceCurrency || "",
        impact,
        bankName: raw.bankName || "",
        customerCountry: raw.customer_country || raw.customerCountry || "",
      };
    })
    .filter(Boolean)
    .filter((row) => {
      if (start && row.dateObj < start) return false;
      if (end && row.dateObj > end) return false;
      if (operationType !== "Tous" && row.type !== operationType) return false;
      if (sourceObject !== "Tous" && row.sourceObject !== sourceObject)
        return false;
      if (sourceCurrency !== "Tous" && row.sourceCurrency !== sourceCurrency)
        return false;
      return true;
    })
    .sort((a, b) => a.dateObj - b.dateObj);

  if (!normalized.length) {
    return {
      timeline: [],
      daily: [],
      byType: {},
      cumulative: [],
      totalTx: 0,
      lastBalance: 0,
      operationTypeList: [],
      sourceObjectList: [],
      sourceCurrencyList: [],
      bankAgg: {},
      countryAgg: {},
    };
  }

  // solde
  let running = 0;
  const timeline = normalized.map((row) => {
    running += row.impact;
    return { ...row, balance: running };
  });

  const byDay = {};
  const byType = {};
  const cumulative = [];
  const opSet = new Set();
  const srcObjSet = new Set();
  const srcCurSet = new Set();
  const bankAgg = {};
  const countryAgg = {};

  timeline.forEach((row) => {
    opSet.add(row.type);
    srcObjSet.add(row.sourceObject);
    if (row.sourceCurrency) srcCurSet.add(row.sourceCurrency);

    byType[row.type] = (byType[row.type] || 0) + row.impact;
    byDay[row.date] = (byDay[row.date] || 0) + row.impact;
    cumulative.push({ date: row.date, balance: row.balance });

    if (row.bankName && row.impact !== 0) {
      bankAgg[row.bankName] = (bankAgg[row.bankName] || 0) + row.impact;
    }
    if (row.customerCountry && row.impact !== 0) {
      const cc = row.customerCountry.toString().toUpperCase();
      countryAgg[cc] = (countryAgg[cc] || 0) + row.impact;
    }
  });

  const daily = Object.entries(byDay)
    .map(([date, impact]) => ({ date, impact }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    timeline,
    daily,
    byType,
    cumulative,
    totalTx: timeline.length,
    lastBalance: timeline[timeline.length - 1].balance,
    operationTypeList: Array.from(opSet).sort(),
    sourceObjectList: Array.from(srcObjSet).sort(),
    sourceCurrencyList: Array.from(srcCurSet).sort(),
    bankAgg,
    countryAgg,
  };
}
