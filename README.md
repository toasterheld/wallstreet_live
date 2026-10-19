# CodeClub Börse – Wall Street Live

Statische Web-App ohne Build-Schritt: `/presenter/` (Beamer, Taste **F** = Vollbild), `/admin/` (Laptop), `/terminal/` (Betreuer-Handys, 5 Stationen: Fabrik, Hacker-Akademie, Patentamt, Hauptbörse, Blueprint-Händler).

```
index.html  presenter/ admin/ terminal/   (je eine index.html in eigenem Ordner)
css/style.css
js/config.js     firebaseConfig, Würfel, Slippage/Spread, Patent-/Lizenzpreise, Markt-Events
js/core.js       Sync, Marktmathematik, Events, Crafting, Patente, Blueprints, Angriffs-Meldungen
js/presenter.js  admin.js (inkl. Sound)  terminal.js
```

## Firebase (Echtzeit + atomare Updates)
1. Firebase-Projekt → *Realtime Database* anlegen.
2. `databaseURL` (und die übrigen Werte der Web-App-Config) in `js/config.js` im Objekt `firebaseConfig` eintragen.
3. Regeln für den Eventtag: `{"rules":{"cc3":{".read":true,".write":true}}}` – danach wieder sperren.

Jede Aktion läuft als Firebase-**Transaktion** auf dem gesamten Spielstand (`cc3/state`): gleichzeitige Eingaben mehrerer Handys werden automatisch wiederholt statt überschrieben. Ohne `databaseURL` läuft der Lokal-Modus (Tabs auf einem Gerät).

## Teams (Admin → „B · Teams")
Die Team-Anzahl ist frei (1 bis 16, `maxTeams` in `js/config.js`; Start: 5 Teams).
- **„＋ Neues Team hinzufügen“** legt ein Team mit dem aktuellen Startkapital an (Standard 500 CC), Level 0, ohne Schild.
- **„🗑 Team löschen“** (mit Rückfrage) entfernt Team, Konto und Patente dieses Teams. Das letzte Team bleibt immer bestehen.
- Name und Mitglieder sind frei editierbar (Speichern beim Verlassen des Feldes).
- Alles synchronisiert sich in Echtzeit: Die Dropdowns auf den Terminals, der Börsenschalter im Admin und die Team-Liste auf dem Beamer ändern sich sofort. Wird ein Team gelöscht, während ein Betreuer es ausgewählt hat, springt dessen Terminal auf ein gültiges Team; eine zu spät abgeschickte Buchung wird abgelehnt („Dieses Team existiert nicht mehr“) und verändert nichts.
- Ab 9 Teams bekommt die Team-Spalte auf dem Beamer mehr Platz und zeigt zwei Spalten.
- „Neue Spielrunde“ behält Teams, Namen und Mitglieder und setzt die Konten auf das Startkapital.
- Bestehende Spielstände aus älteren Versionen (ohne Team-Liste, mit Inventar) werden beim ersten Laden automatisch umgestellt.

## Kein digitales Inventar
Die Ware wandert ausschließlich über physische Produktkarten; der Betreuer prüft sie vor Ort. Das System kennt nur Geld, Preise, Patente, Level, Schilde und Firewalls.
- **Hauptbörse:** Ein Verkauf wird immer direkt gutgeschrieben, ohne Bestandsprüfung.
- **Fabrik:** „Herstellen“ löst nur den Markteffekt aus (Produkt −3 %, Zutaten +2 %) und wird im Protokoll festgehalten. Ein Patent eines anderen Teams sperrt das Herstellen weiterhin.
- Beamer, Terminals und Admin zeigen keine Mengen, Lager oder Bestände.

## Konten (CC-Coins)
Jedes Team hat ein digitales Konto (Startkapital 500 CC, im Admin änderbar; `startCap` in `js/config.js`). Das Guthaben fällt nie unter 0; ohne Deckung kommt „Nicht genügend CC-Coins!“ und es wird nichts verändert.
- **Hauptbörse (Terminal und Admin-Börsenschalter):** Kauf zieht die Kosten ab (aufgerundet), Verkauf schreibt den Erlös inkl. Slippage und 8 % Spread gut (abgerundet). Die Vorschau am Terminal zeigt beides samt Guthaben danach.
- **Patentamt:** Patentpreis wird abgebucht. **Hacker-Akademie:** Cybersecurity-Lizenz (300 CC) und Level-Ups (`levelCost` in `config.js`: 100/200/300/400 CC für Level 1–4) werden abgebucht.
- **Blueprint-Händler (Station 5, „Outdoor-Händler“):** Betreuer wählt Käufer-Team und Bauplan: Level 2 (Mainboard & High-End GPU) 300 CC, Level 3 (AI-Supercomputer) 800 CC. Reicht das Guthaben nicht, kommt „Unzureichendes Guthaben!“. Sonst wird abgebucht, im Admin-Log protokolliert und der Betreuer händigt die physische Karte aus. Je Team nur 1× pro Level (Admin → Teams kann den Eintrag zurücknehmen). Preise: `blueprintCost` in `config.js` oder live im Admin („Blueprint-Preise“).
- **Angriffe sind rein manuell.** Gewürfelt wird mit echten Würfeln auf dem Feld, das System simuliert nichts und weiß nicht, wer wen angegriffen hat. In der **Hacker-Akademie → „Angriff melden“** wählt der Betreuer nur das geschädigte Team und bucht: Lösegeld in CC (Vorgabe `painMoney`: 50, änderbar, höchstens das Guthaben, das Geld verschwindet), optional Cybersecurity-Lizenz entziehen und optional 5-Min-Firewall. Level-Ups (W2–W12) und Lizenz-Kauf bleiben unverändert.
- **Admin → „Team-Konten“:** Live-Kontostände, ±100 CC, Direkteingabe, Startkapital ändern, „Alle Konten auf Startkapital zurücksetzen“ und der Schalter „Beamer: Rangliste nach Guthaben sortieren“ (Standard: an; Rang #1 = meistes Geld). „Neue Spielrunde“ setzt die Konten auf das Startkapital.
- Alle Buchungen laufen als Firebase-Transaktion: gleichzeitige Käufe von mehreren Handys können das Konto nicht ins Minus oder falsch rechnen.

## Markt-Events (Admin → „C")
Die 10 Events (Laufzeit, Wirkung, Texte) stehen in `js/config.js` unter `events` und sind dort anpassbar (z. B. kürzere Laufzeiten zum Testen). Ablauf: Event starten → Countdown im Beamer-Ticker und im Admin → nach Ablauf wird genau der Event-Faktor wieder herausgerechnet (Handelsbewegungen währenddessen bleiben). Jedes Event ist pro Spielrunde nur **einmal** auslösbar (Button ausgegraut); „Neue Spielrunde" schaltet alle wieder frei. „⏹ beenden" bricht ein laufendes Event vorzeitig ab, die Sperre bleibt.

## Sound (Admin-Seite)
Schalter „🔊 Sound Effekte: AN/AUS" in der Kopfleiste (wird gespeichert), „🔔 Test" spielt alle Sounds. Browser erlauben Ton erst nach einem Klick auf die Seite – einmal irgendwo klicken. Börsen-Glocke bei Kauf/Verkauf, Sirene bei Eilmeldung/Event, Cyber-Glitch bei erfolgreichem Raid und Firewall, Ticking in den letzten 10 Sekunden eines Events. Die Töne kommen von der Admin-Seite (auch Aktionen von Terminals lösen sie dort aus) – Laptop also an die Raumlautsprecher anschließen.

## Hosting
GitHub → Settings → Pages → Branch `main`, Ordner `/ (root)`. Aufruf z. B. `https://<user>.github.io/<repo>/presenter/`. Netlify/Vercel: Ordner als statische Site deployen.
