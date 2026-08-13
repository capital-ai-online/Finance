# ADR-0069 — Human/Owner PR Gate ohne selbstreferenziellen Bootstrap

- **Status:** ACCEPTED — RECOVERY REVISION 2026-08-13
- **Datum:** 2026-08-13
- **Scope:** Pull-Request-Governance, CI-Trust-Root, Required Checks
- **Incident Evidence:** `docs/evidence/ci/PR236_BOOTSTRAP_INCIDENT_2026-08-13.md`

## Kontext

Die ursprüngliche ADR-0069 führte ab PR #236 einen trusted-main Human/Owner-Kommentar-Gate-Pfad ein. Das Ziel war, Human-Evidence an den aktuellen PR-Head zu binden und Kandidatencode von schreibenden Jobs zu isolieren.

Die reale Bootstrapserie PR #236–#240 zeigte jedoch mehrere Fehlerklassen: API-Berechtigungsfehler, falsche Check-SHA-Bindung, Dispatch-/YAML-Fehler und schließlich einen fehlerhaften trusted Preflight. Weil das GitHub-Ruleset den Status `build-and-test` zwingend verlangte und dieser Status durch die neue Control-Plane selbst erzeugt wurde, konnte ein Defekt der Control-Plane ihre eigene Reparatur blockieren.

Diese Revision verwirft daher nicht Human-/Owner-Evidence oder fail-closed CI. Sie verwirft ausschließlich die selbstreferenzielle Bootstrap-Strategie.

## Entscheidung

### 1. Bestehender funktionierender Required Check bleibt Trust Root

Während einer Governance-/CI-Migration bleibt der zuletzt verifizierte, funktionierende Required Check aktiv. Ein Kandidaten-PR darf den alleinigen aktiven Trust Root nicht durch eine neue, erst nach Merge ausführbare Control-Plane ersetzen.

### 2. Kein Bootstrap darf den Required Check selbst erzeugen

Ein neuer Governance-Workflow darf nicht gleichzeitig:

- den aktuell erforderlichen `build-and-test` ersetzen,
- seinen eigenen Aktivierungszustand erst nach Merge erhalten,
- und den Merge seiner eigenen Reparatur von genau diesem neuen Pfad abhängig machen.

Diese Kombination ist verboten.

### 3. Neue Gate-Architektur nur als Shadow/Observation

Neue Human-Gate-, Dispatch-, Reporter- oder Auto-Status-Mechanismen werden zuerst parallel und **nicht merge-blockierend** ausgeführt.

Zulässige Reihenfolge:

```text
bestehender Required Check
→ neue Control-Plane im Shadow Mode
→ wiederholter Parallel-PASS auf realen PRs
→ Human/Owner Abnahme
→ serverseitige Ruleset-Umstellung
→ alter Check bleibt für definierte Übergangsfrist verfügbar
→ erst danach kontrollierte Stilllegung
```

### 4. Required-Check-Umstellung ist eine eigene Change-Klasse

Die Änderung eines GitHub-Rulesets oder der Identität eines Required Checks ist nicht Bestandteil eines normalen Workflow-PRs. Sie benötigt:

- eigenen dokumentierten Change;
- exakte vorher/nachher Check-Identität;
- Rollback-Plan;
- Human/Owner-Freigabe;
- Post-Change-Verifikation auf mindestens einem realen PR;
- Evidence in Roadmap/Traceability.

### 5. Human-Evidence bleibt current-head gebunden

Bis zu einer späteren M10-Passkey-Autorisierung gilt weiterhin:

- vollständiger `Files changed` Review;
- alle Dateien Viewed;
- current-head Review exakt `💪` oder `okay`;
- Human/Owner-Attestation;
- neuer Commit invalidiert Head-Evidence;
- Merge bleibt separat Human/Owner-only.

Die konkrete Event-Transportform darf geändert werden, solange sie diese Invarianten erfüllt und vorher im Shadow Mode bewiesen wurde.

### 6. Kein Kandidatencode mit privilegierten Schreibrechten

Weiterhin verbindlich:

- kein `pull_request_target` für Kandidatencode;
- Checkout exakt auf den geprüften Head;
- `persist-credentials: false`;
- schreibende Governance-/Reporter-Jobs führen keinen Kandidatencode aus;
- Kandidaten-Build/Test besitzt keine PR-/Issue-/Checks-Schreibrechte.

### 7. Kein synthetischer PASS als alleinige Merge-Evidence

Ein synthetischer Check darf technische Evidence aggregieren, aber nicht der einzige Beweis für einen Build sein, wenn seine eigene Control-Plane Gegenstand des PRs ist.

Für Änderungen an der CI-Trust-Root-Schicht muss mindestens ein unabhängiger, bereits auf `main` verifizierter Prüfpfad erhalten bleiben.

### 8. Recovery muss repository-normal möglich bleiben

Jede Governance-/CI-Architektur muss so gestaltet sein, dass ein Defekt durch:

```text
fresh branch from current main
→ scoped fix/revert
→ normal pull request
→ existing independent required check
→ Human merge
```

behebbar bleibt.

Ein Zustand, in dem zur Reparatur zuerst ein Bypass-Actor, Force-Push, Direct-Main-Push oder Abschalten des einzigen Required Checks nötig wäre, ist als Architekturfehler zu behandeln.

### 9. Bypass ist kein normaler Recovery-Mechanismus

Repository-Owner-Rechte oder GitHub-Ruleset-Bypass dürfen nicht als regulärer technischer Bestandteil der DevelopmentChain vorausgesetzt werden.

Break-glass kann später in M9 als eigener, auditierter Incident-Mechanismus existieren, ersetzt aber nicht die Pflicht, normale CI-Recovery ohne Bypass zu ermöglichen.

### 10. PR-Template-Automation darf keine Gate-Autorität tragen

PR-Body-Synchronisierung, Klassifikation und Lern-/Evidence-Darstellung sind sekundäre Automation. Ein Fehler dort darf:

- Human-Evidence nicht verfälschen;
- einen erfolgreichen realen Build nicht in `Human-Evidence=failure` umdeuten;
- keine Merge-Evidence selbst autorisieren.

Workflow-Identität ist über stabile Felder wie Workflow-Pfad/ID zu bestimmen, nicht über dynamische `run-name`-Anzeigenamen.

## Verbotene Bootstrap-Muster

Folgende Muster sind ab dieser Revision ausdrücklich verboten:

1. `workflow_dispatch --ref main` als alleiniger Required-Check-Executor für einen PR, der genau diesen Executor ändert;
2. synthetischer `build-and-test` Check als alleiniger Ruleset-Check ohne unabhängigen Recovery-Pfad;
3. Ersetzen des funktionierenden PR-CI-Pfads in einem einzigen Bootstrap-Merge;
4. Aktivierung einer neuen Required-Check-Identity vor realem Shadow-PASS;
5. PR-Body-/Auto-Status-Automation als Human-Autorisierungsquelle;
6. dauerhaft aktive Bootstrap-Work-Claims nach Abschluss des zugehörigen PRs.

## Recovery-Baseline 2026-08-13

Der verifizierte Stand unmittelbar vor PR #236 ist:

- Commit `5bd5f4d78b87a89258126d0453eaf5e4bc6b6125`
- Tree `5d95c7e21b7dcded2fb023047e01ca629b37b75d`

Dort erzeugt `.github/workflows/ci.yml` den echten `build-and-test` direkt auf dem PR-Head. Dieser Zustand wird als Recovery-Baseline verwendet.

## Konsequenzen

### Positiv

- keine selbstblockierende CI-Trust-Root-Reparatur;
- keine Notwendigkeit eines Owner-Bypass für normale Governance-Fehler;
- technische Migrationen werden beobachtbar und reversibel;
- Human-/Owner-Gate und Credential Isolation bleiben erhalten;
- Ruleset-Änderung und Workflow-Code werden als getrennte Trust-Boundaries behandelt.

### Trade-off

- Governance-Migrationen benötigen eine Parallel-/Shadow-Phase;
- für eine Zeit können alter und neuer Prüfpfad parallel laufen;
- Ruleset-Promotion erfordert explizite Human-Administration und Evidence.

## Verifikation

Diese ADR gilt als technisch umgesetzt, wenn:

1. der Recovery-PR den Pre-#236-CI-Pfad wiederherstellt;
2. ein PR-Head `build-and-test` ohne synthetischen trusted-main Reporter erfolgreich ausführt;
3. Main-CI nach Merge erfolgreich ist;
4. keine PR-#236–#240-Bootstrap-Control-Plane mehr Required-Check-Autorität besitzt;
5. zukünftige Gate-Weiterentwicklung ausschließlich Shadow → Parallel PASS → Promotion folgt;
6. Roadmap und Traceability diesen Incident und die neue Migrationsregel referenzieren.

## Rollback

Ein späterer ADR-0069-Nachfolger darf diese Recovery-Invarianten nur durch einen eigenen Human/Owner-reviewten ADR ersetzen. Ein Rückfall auf selbstreferenzielle Bootstrap-Required-Checks ist nicht zulässig.
