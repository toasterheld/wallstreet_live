# CodeClub Börse – Wall Street Live

Statische Web-App ohne Build-Schritt: `/presenter/` (Beamer, Taste **F** = Vollbild), `/admin/` (Laptop), `/terminal/` (Betreuer-Handys, 4 Stationen).

```
index.html  presenter/ admin/ terminal/   (je eine index.html in eigenem Ordner)
css/style.css
js/config.js     firebaseConfig, Würfel, Slippage/Spread, Patent-/Lizenzpreise, Markt-Events
js/core.js       Sync, Marktmathematik, Events, Crafting, Patente, Raids
js/presenter.js  admin.js (inkl. Sound)  terminal.js
```

## Firebase (Echtzeit + atomare Updates)
1. Firebase-Projekt → *Realtime Database* anlegen.
2. `databaseURL` (und die übrigen Werte der Web-App-Config) in `js/config.js` im Objekt `firebaseConfig` eintragen.
3. Regeln für den Eventtag: `{"rules":{"cc3":{".read":true,".write":true}}}` – danach wieder sperren.

Jede Aktion läuft als Firebase-**Transaktion** auf dem gesamten Spielstand (`cc3/state`): gleichzeitige Eingaben mehrerer Handys werden automatisch wiederholt statt überschrieben. Ohne `databaseURL` läuft der Lokal-Modus (Tabs auf einem Gerät).

## Teams (Admin → „B · Teams")
Name und Mitglieder sind frei editierbar (Speichern beim Verlassen des Feldes). Der Beamer zeigt den Namen groß und die Mitglieder dezent darunter; Terminals und Protokoll nutzen ebenfalls die Namen. „Neue Spielrunde" behält Namen und Mitglieder.

## Konten (CC-Coins)
Jedes Team hat ein digitales Konto (Startkapital 500 CC, im Admin änderbar; `startCap` in `js/config.js`). Das Guthaben fällt nie unter 0; ohne Deckung kommt „Nicht genügend CC-Coins!“ und es wird nichts verändert.
- **Hauptbörse (Terminal und Admin-Börsenschalter):** Kauf zieht die Kosten ab (aufgerundet), Verkauf schreibt den Erlös inkl. Slippage und 8 % Spread gut (abgerundet). Die Vorschau am Terminal zeigt beides samt Guthaben danach.
- **Patentamt:** Patentpreis wird abgebucht. **Hacker-Akademie:** Cybersecurity-Lizenz (300 CC) und Level-Ups (`levelCost` in `config.js`: 100/200/300/400 CC für Level 1–4) werden abgebucht.
- **Raid:** Gewinnt der Angreifer und das Opfer hat kein Cybersecurity-Schild, zahlt das Opfer 50 CC (`painMoney`) an den Angreifer (höchstens sein Guthaben). Mit Schild oder bei abgewehrtem Angriff gibt es keine Umbuchung.
- **Admin → „Team-Konten“:** Live-Kontostände, ±100 CC, Direkteingabe, Startkapital ändern, „Alle Konten auf Startkapital zurücksetzen“ und der Schalter „Beamer nach Gesamtkapital sortieren“ (Gesamtkapital = Guthaben + Lagerwert zum Marktpreis). „Neue Spielrunde“ setzt die Konten auf das Startkapital.
- Die Ware wird weiterhin physisch geprüft. Soll das System den Verkauf ohne Lagerbestand sperren, `requireStock:true` in `config.js` setzen.
- Alle Buchungen laufen als Firebase-Transaktion: gleichzeitige Käufe von mehreren Handys können das Konto nicht ins Minus oder falsch rechnen.

## Markt-Events (Admin → „C")
Die 10 Events (Laufzeit, Wirkung, Texte) stehen in `js/config.js` unter `events` und sind dort anpassbar (z. B. kürzere Laufzeiten zum Testen). Ablauf: Event starten → Countdown im Beamer-Ticker und im Admin → nach Ablauf wird genau der Event-Faktor wieder herausgerechnet (Handelsbewegungen währenddessen bleiben). Jedes Event ist pro Spielrunde nur **einmal** auslösbar (Button ausgegraut); „Neue Spielrunde" schaltet alle wieder frei. „⏹ beenden" bricht ein laufendes Event vorzeitig ab, die Sperre bleibt.

## Sound (Admin-Seite)
Schalter „🔊 Sound Effekte: AN/AUS" in der Kopfleiste (wird gespeichert), „🔔 Test" spielt alle Sounds. Browser erlauben Ton erst nach einem Klick auf die Seite – einmal irgendwo klicken. Börsen-Glocke bei Kauf/Verkauf, Sirene bei Eilmeldung/Event, Cyber-Glitch bei erfolgreichem Raid und Firewall, Ticking in den letzten 10 Sekunden eines Events. Die Töne kommen von der Admin-Seite (auch Aktionen von Terminals lösen sie dort aus) – Laptop also an die Raumlautsprecher anschließen.

## Hosting
GitHub → Settings → Pages → Branch `main`, Ordner `/ (root)`. Aufruf z. B. `https://<user>.github.io/<repo>/presenter/`. Netlify/Vercel: Ordner als statische Site deployen.
