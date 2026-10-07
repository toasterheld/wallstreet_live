# CodeClub Börse – Wall Street Live

Statische Web-App (kein Build-Schritt). Rollen: `/presenter/` (Beamer, Taste **F** = Vollbild), `/admin/` (Laptop), `/terminal/` (Betreuer-Smartphones).

## Struktur
```
index.html            Rollenwahl
presenter/ admin/ terminal/   je eine index.html (eigene URL)
css/style.css         gemeinsames Cyberpunk-Design
js/config.js          Firebase-URL, Würfel pro Level, Preisfaktor
js/core.js            Zustand, Sync, Börsen-/Raid-/Crafting-Logik
js/presenter.js admin.js terminal.js
```

## Betrieb
- **Ohne Konfiguration** (Lokal-Modus): alle Ansichten in Tabs/Fenstern auf *einem* Gerät (BroadcastChannel + localStorage).
- **Mit Smartphones (Echtzeit-Sync):** In Firebase ein Projekt mit *Realtime Database* anlegen, Regeln für den Eventtag auf `{".read":true,".write":true}` setzen, die DB-URL in `js/config.js` bei `firebaseUrl` eintragen. Kein SDK/API-Key nötig. Nach dem Event Regeln wieder sperren!

## Hosting
GitHub: Repo anlegen → Dateien hochladen → *Settings → Pages → Deploy from branch (main, / root)*. Aufruf: `https://<user>.github.io/<repo>/presenter/` usw. Netlify/Vercel: Ordner einfach als statische Site deployen.
