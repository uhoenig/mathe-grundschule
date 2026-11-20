# Projektregeln

- Keine `.env`-Dateien öffnen.
- Dieser Ordner Emilia ist ausschließlich `mathe-grundschule` / MatheFreunde.
- Das Projekt Charlotte und das GitHub-Repository `uhoenig/mathe-abi` nicht verändern.
- Vor jedem Push prüfen, dass das Ziel `uhoenig/mathe-grundschule` ist.
- Auf `develop` entwickeln. `main` ist der veröffentlichte Stand für GitHub Pages.
- Die Website bleibt statisches HTML/CSS/JavaScript mit relativen Asset-Pfaden.
- Keine Konten, Trackingdienste oder externen Schriftarten hinzufügen.
- Aufgaben-IDs und die Bedeutung gespeicherter Antworten stabil halten. Bei inkompatiblen Änderungen die Datenversion bewusst erhöhen.
- Nach Inhaltsänderungen `node tests/learning.cjs` und `node tests/review.cjs`, nach Änderungen an Lernablauf oder Speicherung zusätzlich `node tests/grundschule-browser.cjs` und `node tests/guided-browser.cjs` ausführen.
- Keine Lernstandsicherungen oder Test-Screenshots committen.
