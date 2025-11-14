// Service Worker pour Foxx Dashboard PWA
const CACHE_NAME = "foxx-dashboard-v2"; // ⚠️ Incrémenté pour forcer la mise à jour
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  // Ajoutez ici vos autres assets statiques (CSS, JS, images, etc.)
];

// Assets qui changent fréquemment (données dynamiques)
const DYNAMIC_CACHE = "foxx-dashboard-dynamic-v1";

// Installation du Service Worker
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker: Installation en cours...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Service Worker: Assets mis en cache");
      return cache.addAll(ASSETS).catch((err) => {
        console.error("❌ Service Worker: Erreur lors du cache des assets", err);
      });
    })
  );
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log("🔄 Service Worker: Activation en cours...");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DYNAMIC_CACHE)
          .map((k) => {
            console.log(`🗑️ Service Worker: Suppression de l'ancien cache ${k}`);
            return caches.delete(k);
          })
      );
    })
  );
  // Prend le contrôle immédiatement
  return self.clients.claim();
});

// Stratégie de cache pour les requêtes
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Stratégie pour les données Google Sheets/CSV Tazapay (Network First)
  if (
    url.href.includes("docs.google.com/spreadsheets") ||
    url.href.includes("VITE_TAZAPAY_CSV_URL") ||
    url.href.includes("VITE_TAZAPAY_PING_URL") ||
    url.pathname.includes("/data/") ||
    url.pathname.endsWith(".csv")
  ) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Stratégie Cache First pour les assets statiques
  event.respondWith(cacheFirstStrategy(event.request));
});

// Stratégie Network First: essaie le réseau, puis le cache
async function networkFirstStrategy(request) {
  try {
    // Tente de récupérer depuis le réseau
    const networkResponse = await fetch(request);
    
    // Si succès, met en cache et retourne
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      // Clone la réponse car elle ne peut être lue qu'une fois
      cache.put(request, networkResponse.clone());
      console.log("🌐 Service Worker: Données récupérées du réseau et mises en cache");
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    // En cas d'erreur réseau, utilise le cache
    console.warn("⚠️ Service Worker: Réseau indisponible, utilisation du cache");
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si rien dans le cache, retourne une réponse offline
    return new Response(
      JSON.stringify({ 
        error: "Offline", 
        message: "Données non disponibles hors ligne" 
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// Stratégie Cache First: cherche dans le cache, puis le réseau
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    // Met en cache les nouvelles ressources
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response(
      "Offline - Ressource non disponible",
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/plain" }
      }
    );
  }
}

// Message du Service Worker (pour debug/communication avec l'app)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("⚡ Service Worker: Activation forcée");
    self.skipWaiting();
  }
  
  // Commande pour vider le cache
  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("🗑️ Service Worker: Nettoyage du cache demandé");
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
    );
  }
});

console.log("🚀 Service Worker chargé et prêt");