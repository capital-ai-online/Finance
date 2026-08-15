# ADR-0069 — Human/Owner PR Gate ohne selbstreferenziellen Bootstrap

- **Status:** ACCEPTED — RECOVERY REVISION 2026-08-13 · **NACHTRAG 2026-08-16 (Owner-Gate-Ritual retired)**
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

Ein neuer Governance-Workflow darf nicht gleichzeitig den aktuell erforderlichen `build-and-test` ersetzen, seinen eigenen Aktivierungszustand erst nach Merge erhalten, und den Merge seiner eigenen Reparatur von genau diesem neuen Pfad abhängig machen. Diese Kombination ist verboten.

### 3. Neue Gate-Architektur nur als Shadow/Observation

Neue Human-Gate-, Dispatch-, Reporter- oder Auto-Status-Mechanismen werden zuerst parallel und **nicht merge-blockierend** ausgeführt.

### 4. Required-Check-Umstellung ist eine eigene Change-Klasse

Die Änderung eines GitHub-Rulesets oder der Identität eines Required Checks ist nicht Bestandteil eines normalen Workflow-PRs.

### 5. Human-Evidence / Merge (historisch bis 2026-08-16)

Bis zur Owner-Entscheidung 2026-08-16 galt transitional:

- vollständiger `Files changed` Review;
- alle Dateien Viewed;
- current-head Review exakt `💪` oder `okay`;
- Human/Owner-Attestation;
- neuer Commit invalidiert Head-Evidence;
- Merge bleibt separat Human/Owner-only.

### 6–10.

Unverändert: kein Kandidatencode mit privilegierten Schreibrechten; kein synthetischer PASS als alleinige Merge-Evidence; Recovery muss repository-normal möglich bleiben; Bypass ist kein normaler Recovery-Mechanismus; PR-Template-Automation darf keine Gate-Autorität tragen.

## Nachtrag 2026-08-15 — Shadow-Phase abgeschlossen

Die zeitlich begrenzte Parallelphase von `capital-ai-ci` und `build-and-test` ist abgeschlossen. Die Recovery-Invarianten dieser ADR bleiben bestehen.

## Nachtrag 2026-08-16 — Owner-Gate-Ritual retired

**Owner-Entscheidung:** Pre-CI-Autorisierung über PR-Body-Checkboxen und Review-Text `💪`/`okay` wird **nicht fortgeführt**.

Folgen:

1. `.github/workflows/ci.yml` startet PR-CI ohne Owner-Gate-Job (Events: opened/synchronize/reopened/ready_for_review).
2. PR-Template v1.4.0 und `HUMAN_OWNER_PR_APPROVAL_POLICY` dokumentieren den vereinfachten Ablauf.
3. **Merge bleibt Human/Owner-only** (Agenten mergen nicht).
4. Ab Development-Chain-Punkt **M10** wird die starke CI-Autorisierung über **Passkey/WebAuthn** (`AUTHORIZE_PR_CI`) gemäß `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` eingeführt.
5. Recovery-/Bootstrap-Invarianten (kein selbstreferenzieller Required-Check-Bootstrap, kein Kandidatencode mit Schreibrechten) bleiben **vollständig** in Kraft.
6. Ein Wieder-Einführen von Checkbox-/Emoji-CI-Gates ist nur über eigenen ADR + Shadow → Cutover zulässig und nicht der Default-Pfad.

## Rollback

Ein späterer ADR-0069-Nachfolger darf Recovery-Invarianten nur durch einen eigenen Human/Owner-reviewten ADR ersetzen. Ein Rückfall auf selbstreferenzielle Bootstrap-Required-Checks ist nicht zulässig. Ein Rückfall auf Checkbox-/Emoji-CI-Gates ist nicht der intendierte Rollback-Pfad; Rollback vor M10-Cutover bedeutet den vereinfachten CI-Pfad beizubehalten.
