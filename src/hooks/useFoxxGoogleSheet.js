// src/hooks/useFoxxGoogleSheet.js
import { useEffect, useState } from "react";

export function useFoxxGoogleSheet() {
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  const sheetId = import.meta.env.VITE_FOXX_SALES_SHEET_ID;
  const range = import.meta.env.VITE_FOXX_SALES_RANGE || "Feuille 1!A1:AD5000";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!apiKey || !sheetId) {
      console.warn("⚠️ API key ou Sheet ID manquant");
      setErr("API key ou Sheet ID manquant");
      setLoading(false);
      return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
      range
    )}?key=${apiKey}`;

    console.log("➡️ Fetch Google Sheet Foxx:", url);

    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        // structure attendue : { values: [ [col1, col2...], [ ... ], ... ] }
        if (!json.values || !Array.isArray(json.values)) {
          console.warn("⚠️ Google a répondu mais sans .values :", json);
          setData([]);
          setLoading(false);
          return;
        }

        const [headers, ...rows] = json.values;

        const mapped = rows.map((rowArr) => {
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = rowArr[idx] ?? "";
          });

          // ✅ forcer la date = colonne n°10 si présente
          // headers[9] = "Date eu" dans ton cas
          const dateEuHeader = headers[9]; // index 9 = 10e colonne
          const dateUsHeader = headers[0]; // index 0 = "Date"

          // si la colonne 10 existe et n'est pas vide → on l'utilise
          if (dateEuHeader && obj[dateEuHeader]) {
            obj.__date_forced = obj[dateEuHeader]; // ex: "16/04/2025"
          } else if (dateUsHeader && obj[dateUsHeader]) {
            // sinon on prend la 1re colonne (format US) mais on la laisse telle quelle
            obj.__date_forced = obj[dateUsHeader]; // ex: "4/16/2025"
          } else {
            obj.__date_forced = "";
          }

          return obj;
        });

        console.log(
          `✅ Google Sheet Foxx chargé : ${mapped.length} lignes`,
          mapped.slice(0, 3)
        );

        setData(mapped);
        setLoading(false);
      })
      .catch((e) => {
        console.error("❌ Erreur Google Sheet Foxx:", e);
        setErr(e);
        setLoading(false);
      });
  }, [apiKey, sheetId, range]);

  return { data, loading, err };
}
