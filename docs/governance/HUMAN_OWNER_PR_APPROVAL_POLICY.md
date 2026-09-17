# HUMAN / OWNER Pull Request Approval Policy

Status: REQUIRED  
Effective from: 2026-08-11  
Updated: 2026-08-16  
Repository Owner: `SvenKulessa`

## Purpose

Pull requests targeting `main` remain human-visible. AI agents may prepare branches, commits, PRs, evidence and fixes. They MUST NOT self-approve or autonomously merge.

**Stand 2026-08-16 (Owner-Entscheidung):** Die frühere Pre-CI-Zeremonie mit PR-Body-Checkboxen und Current-Head-Review `💪`/`okay` ist **aufgehoben**. Der Merge-Prozess ist vereinfacht. Ab Development-Chain-Punkt **M10** wird die starke CI-/Autorisierungsbindung über **Passkey/WebAuthn** hergestellt (siehe `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`).

## Was entfällt (retired)

Die folgenden Mechanismen sind **nicht mehr** Voraussetzung für technische CI oder Merge-Bereitschaft:

1. PR-Body-Checkboxen  
   - `Human/Owner: vollständigen PR-Diff geprüft.`  
   - `Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`
2. Current-Head-Owner-Review mit exakt `💪` oder `okay`
3. Event-Snapshot-Regel, dass der letzte Checkbox-Edit teure CI auslöst
4. Maschinenlesbare IDs `CAPITAL_AI_OWNER_DIFF_ATTESTATION` / `CAPITAL_AI_OWNER_FILES_ATTESTATION` als CI-Gate

Diese Rituale dürfen in historischen PRs und Evidence referenziert bleiben, sind aber **nicht mehr normativ**.

## Vereinfachter Ablauf (aktuell, vor M10-Cutover)

```text
PR OPEN / UPDATE
→ Governance-Checks (Template-Contract, Workflow-Security, …)
→ technische CI (build-and-test gemäß Checkklasse D/C/R/M)
→ Human/Owner entscheidet über Merge
→ Human Merge (explizite Anweisung; Agenten mergen nicht)
```

Empfohlen (nicht CI-blockierend): Owner liest den Diff unter *Files changed* vor dem Merge. Das ist gute Praxis, kein fail-closed Gate mehr.

## Was bleibt verbindlich

1. **Human-/CODEOWNER-Merge-Freigabe:** Merge bleibt Human/Owner-only. Agenten und Connector-Clients dürfen CI-Erfolg **nicht** als Merge-Autorisierung interpretieren.
2. **Kanonischer PR-Template-Contract** (Version ≥ 1.4.0): Abschnitte und Baseline-Marker bleiben; verkürzte Free-Form-Bodies sind unzulässig.
3. **Required Checks** gemäß Ruleset (u. a. `build-and-test`) bleiben fail-closed.
4. **Externe Produktionsmutationen** brauchen weiterhin separate Owner Mutation Approval (Klasse M / REM).
5. **Ab M10:** Passkey/WebAuthn-Transaction für `AUTHORIZE_PR_CI` (und ggf. weitere privilegiierte Aktionen) laut M10-Runbook; bis dahin gilt der vereinfachte Ablauf oben.

## Verbindlicher PR-Template-Contract

Jeder PR gegen `main` MUSS `.github/pull_request_template.md` verwenden.

1. Kein verkürzter oder frei formulierter Body anstelle der Vorlage.
2. Nummerierte Abschnitte bleiben; nicht Zutreffendes mit `N/A`.
3. Produktions-Baseline-Marker (`CAPITAL_AI_PRODUCTION_BASELINE_*`) bleiben maschinenlesbar.
4. Owner-Attestation-IDs und Checkbox-Gate-Texte sind **entfernt** und dürfen nicht wieder als CI-Pflicht eingeführt werden, außer über einen eigenen ADR + Shadow → Cutover (M10-Pfad).
5. `Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja` bleibt im Contract.

## CI-Sequenz (vereinfacht)

- Teure Validierung startet bei normalen PR-Events (`opened` / `synchronize` / `reopened` / `ready_for_review`) gemäß Workflow.
- Kein `pull_request: edited`-only-Gate mehr für Owner-Checkboxen.
- Ein neuer Commit löst CI erneut aus; es gibt keine Head-gebundene Emoji-Review-Evidence mehr zu invalidieren.
- Erfolgreiche technische CI ist **keine** Merge-Autorisierung.

## Owner authentication assurance

GitHub-Account-Reviews beweisen keine Passkey-/Gerätebindung. Für privilegierte Übergänge (Produktion, Break-Glass, Capability-Elevation) und ab **M10** für PR-CI-Autorisierung gilt die CAPITAL-AI WebAuthn/Passkey-Architektur. Bis M10-Cutover darf kein Workflow behaupten, GitHub-Review-Text beweise Passkey-Authentisierung.

## AI-agent capability restriction

- AI agents MAY: READ, ANALYZE, PLAN, BRANCH, COMMIT, open/update PRs, inspect CI, propose fixes (gemäß aktivem Roadmap-Profil).
- AI agents MUST STOP before MERGE.
- Merge nur nach ausdrücklicher menschlicher Anweisung für den konkreten PR.
- Read-only Daily-Task-Agents: `AUTONOMOUS_AGENT_CONCEPT_GATE.md` (keine BRANCH/COMMIT/PR/MERGE-Capabilities).

## Evidence (vereinfacht)

1. kanonische Template-Struktur im PR-Body;
2. sichtbarer Diff unter *Files changed*;
3. aktueller PR-Head-SHA;
4. grüne Required Checks / `build-and-test` gemäß Klasse;
5. menschliche Merge-Entscheidung + Merge-Commit;
6. ab M10 zusätzlich: Passkey-Approval-/Consumption-Evidence laut M10-Runbook.

## Bezug

- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/adr/ADR-0069-human-owner-comment-gate-and-dispatched-pr-ci.md` (Übergang / Recovery; Checkbox-Gate retired)
- DevelopmentChain, Agent IAM, Merge-Governance
