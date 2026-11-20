# Prüfung der ersten Grundschulversion · 19. November 2026

## Erfolgreich geprüft

- JavaScript-Syntax von `app.js`, `learning.js` und `animals.js`.
- Alle 480 Aufgabenvarianten unabhängig aus ihren Operanden nachgerechnet; drei verschiedene Antwortmöglichkeiten und genau eine richtige Antwort.
- Vier Klassen mit jeweils sechs Themen, vier Tierwelten und zwölf verschiedene Sammelfiguren.
- Auswahl von Klassen und Welten; eine laufende Runde behält beim Wechsel ihre ursprüngliche Klasse und Welt.
- Falsche Antwort, hilfreicher Hinweis, zweiter Versuch und angezeigter Lösungsweg.
- Antworten und Rundenposition nach Neuladen wiederhergestellt; bereits beantwortete Aufgaben bleiben gelöst.
- Pause und Wiederaufnahme, vollständige Runde, Sterne und genau eine Belohnung pro Abschluss; ein erneutes Laden vergibt keine zusätzliche Belohnung.
- Alle 24 Themen im Browser durchgespielt: 120 beantwortete Aufgaben, zwölf verschiedene Tiere gesammelt, alle Themenabschlüsse vorhanden.
- JSON-Download und bestätigte Wiederherstellung einschließlich laufender Runde; ungültige Sicherung abgewiesen.
- Reset-Abbruch erhält den Stand; bestätigter Reset entfernt nur den Grundschul-Lernstand.
- Beschädigte Speicherdaten unverändert geschützt; Wiederherstellung aus einer gültigen Sicherung.
- Schreibfehler: Fortschritt bleibt im Sitzungs-Export; erneutes Speichern nach Beheben des Fehlers.
- Zweiter Tab: fremde Änderungen lösen einen Konflikthinweis aus, statt überschrieben zu werden.
- Ein zusätzlich gespeicherter Abi-Lernstand unter `mathequest.v1` bleibt bei Antworten, Import und Reset unverändert.
- Startseite bei 1440, 768, 390 und 320 Pixeln Breite ohne horizontalen Überlauf; alle Aufgabenfamilien bei 320 und 768 Pixeln.
- GitHub-Pages-Projektpfad `/mathe-grundschule/`, ausschließlich lokale Ressourcen und direkter Offline-Dateistart.
- Keine JavaScript-Laufzeitfehler in den geprüften Abläufen.
- Startseite auf Desktop und Smartphone visuell anhand von Screenshots kontrolliert.

## Reproduktion

```sh
node tests/learning.cjs
node tests/grundschule-browser.cjs
```

Die Browserprüfung verwendet Playwright und Chromium beziehungsweise den vorhandenen Brave-Browser. Optional für einen neuen Entwicklungsrechner:

```sh
npm install --no-save --package-lock=false playwright@1.57.0
npx playwright install chromium
node tests/grundschule-browser.cjs
```

Die Website selbst hat keine npm-Abhängigkeiten. Die GitHub-Action prüft Aufgaben und Syntax bei Pushes auf `develop` und `main`; der umfassende Browsertest wird lokal ausgeführt.

## Grenzen

Die mobile Prüfung verwendet Chromium-Fenster mit angepasster Größe. Echte iOS-/Android-Geräte und andere Browser wurden nicht separat geprüft. Es gibt keine automatische Gerätesynchronisierung und keinen Service Worker. Der Aufgabenpool ist ein erstes Grundlagenpaket; eine vollständige Lehrplanabdeckung und unabhängige didaktische Abnahme sind nicht behauptet.

## Geführtes Lernen und Spaced Repetition · 20. November 2026

Das Speicherformat wurde auf Version 2 erweitert; der Speicherplatz bleibt gleich. Version 1 wird im Arbeitsspeicher übernommen und erst mit der nächsten Aktion gespeichert. Vorhandene Antworten, Aufgaben-IDs, Tiere und laufende Runden bleiben erhalten. Eine alte Sicherung erzeugt keine nachträglich erfundene zeitliche Festigung.

Zusätzlich geprüft:

- Exakte Fälligkeit nach 1/3/7/14/30/60 Tagen; Fehler und Hilfebedarf führen zu einem Termin am Folgetag. Ein erster sicherer Versuch nach Hilfebedarf beginnt wieder mit einem Tag.
- Vorzeitiges Üben erhöht weder Wiederholungsstufe noch die Zahl zeitlich verteilter Nachweise und verlängert keine Fälligkeit.
- Tagesrunde mit fälligen Aufgaben aus mehreren Themen; keine Aufgaben aus höheren als der gewählten Klasse. Neue Aufgaben bleiben in der gewählten Klasse.
- Übernahme eines alten vollständigen Lernstands und einer alten laufenden Runde, neue Zeitdaten im Sicherungsexport und Wiederherstellung; ungültige Zeitdaten werden abgewiesen.
- Persistente Zählmarkierungen, zwei Hilfestufen, Zehnerfelder, unveränderte Antwortoptionen und volle Sterne bei ausschließlich angeforderten Tipps.
- Vorlese-Interaktion mit nachgebildeter lokaler deutscher Stimme; mathematische Zeichen und Uhrzeiten werden passend umgeschrieben. Cloud-Stimmen werden nicht verwendet. Die tatsächliche Audioqualität hängt von den installierten Gerätestimmen ab und wurde nicht auf echten Mobilgeräten abgehört.
- Erste Gartenbelohnung nach Runde 13, Zähler und Garten nach Neuladen; fortgesetzte Belohnungen auch nach allen zwölf Tieren.
- Hilfen bei 320/390/768/1440 Pixeln ohne horizontalen Überlauf; Startknopf auf einem 320 × 700 großen Bildschirm sichtbar.

Zusätzliche Prüfungen: `node tests/review.cjs` und `node tests/guided-browser.cjs`. Die CI prüft die unabhängige Aufgabenrechnung sowie die Wiederholungslogik und JavaScript-Syntax.
