# CodeClub Börse – Wall Street Live

Statische Web-App ohne Build-Schritt: `/presenter/` (Beamer, Taste **F** = Vollbild), `/admin/` (Laptop), `/terminal/` (Betreuer-Handys, 4 Stationen).

```
index.html  presenter/ admin/ terminal/   (je index.html)
css/style.css
js/config.js     firebaseConfig, Würfel, Slippage/Spread, Patent- und Lizenzpreise
js/core.js       Sync, Marktmathematik, Crafting, Patente, Raids
js/presenter.js  admin.js  terminal.js
```

## Firebase (Echtzeit + atomare Updates)
1. Firebase-Projekt → *Realtime Database* anlegen.
2. `databaseURL` (und die übrigen Werte der Web-App-Config) in `js/config.js` im Objekt `firebaseConfig` eintragen.
3. Regeln für den Eventtag: `{"rules":{"cc3":{".read":true,".write":true}}}` – danach wieder sperren.

Jede Aktion läuft als Firebase-**Transaktion** auf dem gesamten Spielstand (`cc3/state`): gleichzeitige Eingaben mehrerer Handys werden automatisch wiederholt statt überschrieben. Ohne `databaseURL` läuft der Lokal-Modus (Tabs auf einem Gerät).

## Hosting
GitHub → Settings → Pages → Branch `main`, Ordner `/ (root)`. Aufruf z. B. `https://<user>.github.io/<repo>/presenter/`. Netlify/Vercel: Ordner als statische Site deployen.
