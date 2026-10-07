// Firebase Realtime Database. databaseURL leer lassen = Lokal-Modus (nur Tabs auf EINEM Gerät).
window.firebaseConfig={
  apiKey:"",
  authDomain:"",
  databaseURL:"",   // z.B. "https://mein-projekt-default-rtdb.europe-west1.firebasedatabase.app"
  projectId:"",
  appId:""
};
window.CC_CONFIG={
  dice:[2,4,6,8,12],      // Würfel pro Hacker-Level 0..4
  slip:.015,              // Preisschritt pro gehandeltem Stück (1,5 %)
  spread:.08,             // Verkauf: 8 % unter Marktwert
  shieldCost:300,         // Cybersecurity-Lizenz (10 Min)
  patent:{si:100,cu:100,en:120,se:200,chip:300,coil:250,mb:500,gpu:600,ai:800}   // Patentpreise (8 Min Monopol)
};
