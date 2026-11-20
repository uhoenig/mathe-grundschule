# MatheFreunde · mathe-grundschule

Eine freundliche Mathe-Lernseite für ein Kind in Klasse 1–4. Link öffnen, Klasse und Tierwelt auswählen, loslernen. Ohne Anmeldung, Backend oder externe Laufzeitdienste.

Online: **https://uhoenig.github.io/mathe-grundschule/**

Dieses Projekt liegt im Ordner **Emilia** und gehört ausschließlich zum zusätzlichen Repository **uhoenig/mathe-grundschule**. Das Abi-Projekt im Ordner **Charlotte**, das Repository **uhoenig/mathe-abi** und dessen Veröffentlichung bleiben unabhängig erhalten.

## Lernen

- Vier frei auswählbare Klassen, sechs Themen je Klasse und 20 stabile Varianten je Thema: 480 Aufgabenvarianten insgesamt.
- Bauernhof, Pferdewiese, Safari und Dinoinsel; zwölf gezeichnete Tierfreunde für das eigene Album.
- Fünf Multiple-Choice-Aufgaben mit jeweils drei verschiedenen Antworten pro Runde.
- Bei Fehlern helfen Hinweise und ein weiterer Versuch. Ein Lösungsweg lässt sich jederzeit anzeigen.
- Mengenbilder, Formen, analoge Uhren, Bruchbilder und Rechtecke unterstützen das Verstehen.
- Geführtes Tagesabenteuer: bis zu drei fällige Wiederholungen aus verschiedenen Themen und passenden niedrigeren Klassen, ergänzt um neue Aufgaben aus der gewählten Klasse. Ohne neue Aufgaben sind bis zu fünf Wiederholungen möglich. Freie Themenwahl bleibt erhalten.
- Spaced Repetition nach 1, 3, 7, 14, 30 und 60 Tagen. Nach Fehlern oder Hilfebedarf wird am nächsten Tag wiederholt. Vorzeitiges Zusatzüben verlängert keine Fälligkeit.
- Hilfen in zwei Stufen, bebilderte Rechenschritte mit Zehnerfeldern und antippbare Zähltiere. Vorlesen von Aufgabe, Antwortmöglichkeiten und Erklärung über eine lokale deutsche Gerätestimme, falls verfügbar.
- Hilfenutzung beeinflusst die Wiederholungsplanung, kostet aber keine Sterne. Fortschrittslabels unterscheiden Kennenlernen, Üben und Festigen über mehrere Tage.
- Eine abgeschlossene Runde bringt ein Tier, auch wenn Tipps nötig waren. Nach zwölf Tieren werden Blumen, Bäume und weitere Dinge für einen dauerhaft wachsenden Tiergarten gesammelt. Sterne können durch weitere Runden verbessert werden. Keine Zeitlimits oder Ranglisten.
- Eine laufende Runde bleibt nach Neuladen erhalten. Klasse und Welt sind außerhalb der Runde wechselbar; die laufende Runde behält ihre ursprüngliche Welt.

Dies ist ein erstes Grundlagenpaket, keine vollständige Abbildung aller Grundschullehrpläne. Die Klassenstufen sind eine Orientierung; der Lernpfad kann frei gewählt werden.

## Lokal öffnen

`index.html` direkt in einem Browser öffnen. Alle Dateien müssen zusammenbleiben. Nach vollständigem Download funktioniert die Seite ohne Internet. Ein Service Worker ist nicht eingerichtet; die veröffentlichte Seite wird nicht automatisch für einen Offline-Neustart zwischengespeichert.

Alternativ:

```sh
python3 -m http.server 8080
```

Danach http://localhost:8080 öffnen. Die Website benötigt keinen Build-Schritt, keine Python-Pakete und keine installierten JavaScript-Pakete.

## Speicherung

Der Lernstand liegt unter `mathe-grundschule.progress.v1` im `localStorage`. Die App liest oder verändert keine Speicherplätze des Abi-Projekts. Geräte und Browser synchronisieren sich nicht automatisch. Datei-Aufrufe und die GitHub-Pages-Adresse können unterschiedliche lokale Lernstände haben.

Das Datenformat ist Version 2. Version-1-Stände einschließlich laufender Runden werden beim Laden im Arbeitsspeicher ergänzt; gespeichert wird erst bei der nächsten Aktion. Vorhandene Aufgaben-IDs und Antwortreihenfolgen bleiben gleich. Alte Lernverläufe erhalten einen ersten Termin einen Tag nach ihrem letzten Versuch; eine bisher nicht gemessene zeitliche Festigung wird nicht angenommen.

Unter **Für Erwachsene** lassen sich Sicherungen als JSON herunterladen und nach Prüfung und Bestätigung wiederherstellen. Browserdaten löschen und privates Surfen können den Lernstand entfernen. Sicherungsdateien enthalten Lerndaten und gehören nicht ins öffentliche Repository.

Beschädigte oder unbekannte Daten werden geschützt angezeigt und nicht automatisch überschrieben. Änderungen in anderen Tabs führen zu einer Aufforderung, den aktuellen Stand zu laden. Bei Schreibfehlern bleiben die Antworten in der Sitzung und können exportiert werden.

## Entwicklung und GitHub Pages

- **Repository:** `https://github.com/uhoenig/mathe-grundschule.git`
- **Entwicklung:** `develop`
- **Veröffentlichung:** `main`, GitHub Pages aus dem Wurzelordner `/`
- Assets und Navigation verwenden relative Pfade; die App läuft unter `/mathe-grundschule/`.
- `mathe-abi` ist kein Push-Ziel dieses Projekts.

Eine erste stabile Version kann auf `main` veröffentlicht werden. Weitere Änderungen entstehen auf `develop` und werden nach Prüfung auf `main` übernommen. Die App benötigt keine GitHub-Secrets oder `.env`-Dateien.

## Dateien und Prüfungen

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Seitengerüst und Navigation |
| `app.js` | Lernablauf, lokale Speicherung, Album und Sicherungen |
| `review.js` | Zeitplanung, Themenstatus, Tagesrunde und Gartenbelohnungen |
| `help.js` / `speech.js` | Rechenschritte und ausschließlich lokale deutsche Sprachausgabe |
| `learning.js` | 24 Themen und deterministisch erzeugte Aufgabenvarianten |
| `animals.js` | Vier Welten und eigene SVG-Tierfiguren |
| `style.css` | Gestaltung für Desktop, Tablet und Smartphone |
| `assets/learning-friends.webp` | Generierte Bilderbuchillustration, siehe `assets/ILLUSTRATION.md` |
| `tests/learning.cjs` | Unabhängiges Nachrechnen aller Aufgaben und Antwortprüfung |
| `tests/grundschule-browser.cjs` | Lernabläufe, Speicherung, mobile Ansichten und Offline-Dateistart |

```sh
node tests/learning.cjs
node tests/review.cjs
node tests/grundschule-browser.cjs
node tests/guided-browser.cjs
```

Die Browserprüfung benötigt Playwright mit Chromium. Auf dem Entwicklungsrechner kann sie den bereits installierten Brave-Browser verwenden. Screenshots liegen nach dem Testlauf im ignorierten Ordner `tests/`.

## Datenschutz

Keine Konten, eigenen Analyse- oder Trackingdienste, externen Schriftarten oder Übermittlung von Antworten. Die Website lädt ihre Bilder und Skripte vom selben Host. Beim Abruf über GitHub Pages verarbeitet GitHub Verbindungsdaten: [GitHubs Datenschutzerklärung](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
