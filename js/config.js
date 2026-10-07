window.CC_CONFIG={
  // Leer lassen = Lokal-Modus (BroadcastChannel/localStorage, nur Tabs auf EINEM Gerät).
  // Für Smartphones/Laptop/Beamer: Firebase-Realtime-DB-URL eintragen, z.B.
  // "https://mein-projekt-default-rtdb.europe-west1.firebasedatabase.app"
  firebaseUrl:"https://wallstreet-live-default-rtdb.europe-west1.firebasedatabase.app/",
  dice:[2,4,6,8,12],   // Würfel pro Hacker-Level 0..4
  priceFactor:1        // % vom Basispreis pro gehandelter Einheit
};
