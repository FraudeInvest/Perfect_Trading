// Agrégateur spécifique à ton Google Sheet Foxx SALES
// Colonnes utilisées :
// - "Date eu" (col. 10) -> date de la vente (format JJ/MM/AAAA ou JJ/MM/AAAA HH:mm)
// - "OrderId"           -> numéro de commande
// - "Email"             -> client
// - "Challenge"         -> produit
// - "Amount"            -> montant (peut contenir virgule, espace, etc.)
// - "Payment Method"    -> TazaPay / Paytiko ...

function parseFoxxDate(str) {
  if (!str) return null;

  if (typeof str === "string" && str.includes("/")) {
    const [datePart, timePart] = str.split(" ");
    const [d, m, y] = datePart.split("/").map(Number);
    const [hh = 0, mm = 0, ss = 0] = (timePart || "").split(":").map(Number);
    const dObj = new Date(y, m - 1, d, hh, mm, ss);
    if (!isNaN(dObj)) {
      return { dateObj: dObj, dateStr: dObj.toISOString().slice(0, 10) };
    }
  }

  const d = new Date(str);
  if (!isNaN(d)) {
    return { dateObj: d, dateStr: d.toISOString().slice(0, 10) };
  }
  return null;
}

function toNumberFr(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  // supprime les espaces y compris NBSP et tout ce qui n'est pas chiffre/virgule/point/signe
  const cleaned = String(v)
    .replace(/\u00A0/g, " ")
    .replace(/[^\d,\-\. ]+/g, "")
    .replace(/\s+/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function aggregateFoxx(rows = [], filters = {}) {
  const {
    startDate = "",
    endDate = "",
    challenge = "Tous",
    payment = "Tous",
  } = filters;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  // 1) Normalisation
  const normalised = (rows || [])
    .map((r) => {
      const dateRaw =
        r["Date eu"] || r["date eu"] || r["Date"] || r["DATE"] || r.date;
      const dInfo = parseFoxxDate(dateRaw);
      if (!dInfo) return null;

      return {
        raw: r,
        dateObj: dInfo.dateObj,
        date: dInfo.dateStr,
        amount: toNumberFr(r["Amount"]),
        challenge: r["Challenge"] || "—",
        payment: r["Payment Method"] || "—",
        orderId: r["OrderId"] || r["Order"] || "—",
        email: r["Email"] || r["Client"] || "—",
      };
    })
    .filter(Boolean)
    .filter((row) => {
      if (start && row.dateObj < start) return false;
      if (end && row.dateObj > end) return false;
      if (challenge !== "Tous" && row.challenge !== challenge) return false;
      if (payment !== "Tous" && row.payment !== payment) return false;
      return true;
    })
    .sort((a, b) => a.dateObj - b.dateObj);

  if (!normalised.length) {
    return {
      countSales: 0,
      totalSales: 0,
      avgSale: 0,
      dailyArray: [],
      daily: [],              // alias compat
      cumulative: [],
      byChallenge: {},
      byPayment: {},
      recent: [],
      challengeList: [],
      paymentList: [],
      bestAffiliateThisMonth: { name: "—", count: 0, total: 0 },
      bestChallenge: { name: "—", count: 0, total: 0 },
    };
  }

  // 2) Totaux
  const totalSales = normalised.reduce((s, r) => s + r.amount, 0);
  const countSales = normalised.length;
  const avgSale = countSales ? totalSales / countSales : 0;

  // 3) Ventes quotidiennes
  const byDay = {};
  normalised.forEach((r) => {
    byDay[r.date] = (byDay[r.date] || 0) + r.amount;
  });
  const dailyArray = Object.entries(byDay)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 4) Ventes cumulées
  const cumulative = [];
  let running = 0;
  dailyArray.forEach((d) => {
    running += d.amount;
    cumulative.push({ date: d.date, total: running });
  });

  // 5) Par challenge
  const byChallenge = {};
  normalised.forEach((r) => {
    byChallenge[r.challenge] = (byChallenge[r.challenge] || 0) + r.amount;
  });

  // 6) Par moyen de paiement
  const byPayment = {};
  normalised.forEach((r) => {
    byPayment[r.payment] = (byPayment[r.payment] || 0) + r.amount;
  });

  // 7) Dernières ventes (mois en cours)
  const now = new Date();
  const cm = now.getMonth();
  const cy = now.getFullYear();
  const currentMonthRows = normalised
    .filter((r) => r.dateObj.getFullYear() === cy && r.dateObj.getMonth() === cm)
    .sort((a, b) => b.dateObj - a.dateObj);

  const recent = currentMonthRows.slice(0, 10).map((r) => ({
    __display_date: r.date.split("-").reverse().join("/"),
    "Date eu": r.date,
    OrderId: r.orderId,
    Email: r.email,
    Challenge: r.challenge,
    Amount: r.amount,
    "Payment Method": r.payment,
  }));

  // 8) Listes filtres
  const challengeList = Array.from(new Set(normalised.map((r) => r.challenge))).sort();
  const paymentList = Array.from(new Set(normalised.map((r) => r.payment))).sort();

  // 9) “Meilleur affilié” (par email) sur le mois en cours
  const byEmailThisMonth = {};
  currentMonthRows.forEach((r) => {
    byEmailThisMonth[r.email] = (byEmailThisMonth[r.email] || 0) + r.amount;
  });
  let bestEmail = "—";
  let bestEmailTotal = 0;
  Object.entries(byEmailThisMonth).forEach(([mail, tot]) => {
    if (tot > bestEmailTotal) {
      bestEmailTotal = tot;
      bestEmail = mail;
    }
  });

  // 10) Meilleur challenge (global)
  let bestChallengeName = "—";
  let bestChallengeAmount = 0;
  let bestChallengeCount = 0;
  Object.entries(byChallenge).forEach(([ch, tot]) => {
    if (tot > bestChallengeAmount) {
      bestChallengeAmount = tot;
      bestChallengeName = ch;
      bestChallengeCount = normalised.filter((r) => r.challenge === ch).length;
    }
  });

  return {
    countSales,
    totalSales,
    avgSale,
    dailyArray,
    daily: dailyArray, // alias compat pour ton composant existant
    cumulative,
    byChallenge,
    byPayment,
    recent,
    challengeList,
    paymentList,
    bestAffiliateThisMonth: {
      name: bestEmail,
      count: bestEmail === "—" ? 0 : currentMonthRows.filter((r) => r.email === bestEmail).length,
      total: bestEmailTotal,
    },
    bestChallenge: {
      name: bestChallengeName,
      count: bestChallengeCount,
      total: bestChallengeAmount,
    },
  };
}
