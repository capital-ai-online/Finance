# ADR-Ablage: Konvention für aktive vs. abgeschlossene Entscheidungen

**Zweck:** Verhindert, dass jeder neue Prüf-/Audit-Durchlauf (durch KI-Agenten oder
Menschen) bereits vollständig umgesetzte und verifizierte ADRs erneut komplett
gegenprüfen muss.

## Struktur

- **`docs/adr/*.md`** — aktive ADRs. Entscheidung getroffen (`Status: ACCEPTED`), aber
  Umsetzung noch nicht vollständig verifiziert, oder noch in Arbeit. **Diese sollten bei
  jedem Security-/Architektur-Review erneut geprüft werden.**
- **`docs/adr/resolved/*.md`** — ADRs, deren Umsetzung gegen den tatsächlichen Code
  **verifiziert** wurde (nicht nur behauptet). Diese müssen bei einem neuen Durchlauf
  **nicht automatisch erneut komplett auditiert werden** - außer es gibt einen konkreten
  Anlass (z.B. eine Änderung an der betroffenen Datei, ein neuer gemeldeter Vorfall, oder
  eine explizite Bitte um Re-Audit).

## Zwei getrennte Status-Felder pro ADR

- **`Status:`** — die ursprüngliche ADR-Entscheidung (`ACCEPTED`/`REJECTED`/`SUPERSEDED`).
  Ändert sich in der Regel nicht rückwirkend.
- **`Implementation-Status:`** — ob die Entscheidung tatsächlich im Code umgesetzt UND
  verifiziert ist. Werte: `✅ COMPLETE (verifiziert <Datum>)`, `🟡 IN PROGRESS`,
  `❌ NOT STARTED`. **Nur mit `✅ COMPLETE` markierte ADRs gehören nach `resolved/`.**

## Für KI-Agenten: Empfohlener Ablauf bei einem neuen Audit-/Review-Auftrag

1. Nur `docs/adr/*.md` (aktive ADRs, nicht `resolved/`) standardmäßig gegen den Code
   prüfen.
2. `docs/adr/resolved/*.md` nur lesen, wenn der Auftrag sich explizit auf eine dort
   dokumentierte Funktion bezieht, oder wenn eine Datei geändert wurde, die in einem
   `resolved`-ADR referenziert ist.
3. Wird eine Regression in einer als `resolved` markierten ADR gefunden: Datei zurück
   nach `docs/adr/` verschieben, `Implementation-Status` auf `🟡 IN PROGRESS` mit
   Begründung aktualisieren.

## Aktueller Stand (2026-07-30)

| ADR | Ablage | Implementation-Status |
|---|---|---|
| ADR-0001, 0002, 0003 | `docs/adr/` (nicht als eigene Datei vorhanden, nur in `adr_history.json`) | nicht durch mich verifiziert |
| ADR-0003.5 (Owner-IAM) | `resolved/` | ✅ COMPLETE |
| ADR-0004 (Branding) | `docs/adr/` | **nicht von mir verifiziert** - liegt außerhalb der Security-/IAM-Arbeit dieser Sitzungen |
| ADR-0005 (Frontend-Modul-Integration) | `docs/adr/` | **nicht von mir verifiziert** |
| ADR-0006 (Plattform-Direktor) | `docs/adr/` | **nicht von mir verifiziert** |
| ADR-0007 (Compliance-Wertschöpfungskette) | `docs/adr/` | **nicht von mir verifiziert** |
| ADR-0008 (Document-Hygiene-Lifecycle) | `resolved/` | ✅ COMPLETE |
| ADR-0009 (CORS-Hardening) | `resolved/` | ✅ COMPLETE |

**Wichtig:** ADR-0004 bis 0007 habe ich bewusst NICHT nach `resolved/` verschoben, auch
wenn ihr `Status: ACCEPTED` das nahelegen könnte - ich habe die zugehörigen Code-Bereiche
(Branding/UI, Module Federation, Plattform-Direktor-Governance-Schicht, Compliance-
Wertschöpfungskette) in dieser Sitzung nicht geprüft. Bitte einmal gezielt gegenprüfen
(oder mich beauftragen), bevor sie verschoben werden - sonst könnten unentdeckte Lücken
dauerhaft aus dem Prüf-Radius fallen.

`IAM_IMPLEMENTATION_LOG.md` war vor dieser Aktualisierung ausschließlich auf dem Stand von
"Prompt 1" (Entwicklungsumgebung, vor Migration) - siehe dort den neuen Abschnitt "Finaler
Stand (Runde 1-6)" für die tatsächliche aktuelle Umsetzung.
