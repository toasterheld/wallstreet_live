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
  patent:{si:100,cu:100,en:120,se:200,chip:300,coil:250,mb:500,gpu:600,ai:800},   // Patentpreise (8 Min Monopol)
  // Markt-Events. min = Laufzeit in Minuten. mul = Preisfaktor je Produkt ('*' = alle), fz = Preis eingefroren,
  // pat = alle Patente verfallen, inst = Einmal-Ereignis (Ticker-Meldung nur kurz, danach nichts zu normalisieren).
  // Jedes Event ist pro Spielrunde nur EINMAL auslösbar; nach Ablauf werden die Preise wieder normalisiert.
  events:[
    {id:'chip',  ic:'⚠️',n:'Chip-Krise',         min:5, mul:{chip:1.3},                          txt:'Microchip +30 %'},
    {id:'pow',   ic:'⚡',n:'Stromausfall',        min:3, fz:['en'],                              txt:'Energie-Preis eingefroren'},
    {id:'crash', ic:'📉',n:'Wall Street Crash',   min:5, mul:{'*':.75},                           txt:'Alle Preise −25 %'},
    {id:'ai',    ic:'🚀',n:'AI-Boom',             min:8, mul:{ai:1.5},                            txt:'AI-Supercomputer +50 %'},
    {id:'find',  ic:'⛏️',n:'Rohstoff-Fund',       min:4, mul:{si:.8,cu:.8},                       txt:'Silizium & Kupfer −20 %'},
    {id:'wave',  ic:'☠️',n:'Cyber-Angriff Welle', min:5, mul:{se:1.4,chip:1.4},                   txt:'Seltene Erden & Microchips +40 %'},
    {id:'pref',  ic:'📜',n:'Patent-Reform',       min:.5,inst:true,pat:true,                        txt:'Alle Patente verfallen sofort'},
    {id:'green', ic:'🌱',n:'Green Energy Hype',   min:6, mul:{en:1.35},                           txt:'Energie +35 %'},
    {id:'strike',ic:'🏭',n:'Fabrik-Streik',       min:4, mul:{chip:1.2,coil:1.2,mb:1.2,gpu:1.2,ai:1.2}, txt:'Zwischen- & Endprodukte +20 %'},
    {id:'rally', ic:'📈',n:'Börsen-Rally',        min:5, mul:{'*':1.15},                          txt:'Alle Preise +15 %'}
  ]
};
