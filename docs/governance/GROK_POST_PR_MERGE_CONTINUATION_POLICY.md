# GROK Post-PR-Merge Continuation Policy

**Document ID:** GOV-GROK-POST-MERGE-001  
**Status:** ACTIVE  
**Date:** 2026-08-16  
**Previous:** PROPOSED 2026-08-15  
**Repository:** `SvenKulessa/Finance`  
**Authority:**  
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`  
- `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`  
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`  
- ADR-0039, ADR-0069, ADR-0073  
- CAPITAL-AI DevelopmentChain (fail-closed)

**Accountable Owner:** `SvenKulessa`  
**Applies to:** Grok (xAI) und vergleichbare Agenten mit Schreib-/PR-Capability im Finance-Repository

---

## 1. Zweck

Diese Richtlinie definiert das **verbindliche Verhalten von Grok nach Erstellung eines Pull Requests im Chat**.

Sie stellt sicher, dass:

1. Grok **niemals** selbst merged (MERGE bleibt Human/Owner-only).
2. Nach PR-Erstellung im Chat ein klarer **Wartezustand** eingenommen wird und auf den Merge **über Trigger / Automation / Session-Fortsetzung** gewartet wird.
3. Nach erfolgreichem Human-Merge die **codebasierte erfolgreiche Einsetzung** (CI, Deployment / Live-Status) geprüft wird.
4. Bei positivem Ergebnis **konkrete Vorschläge** gemacht werden, wie im Chat weitergearbeitet werden soll (nächste Roadmap-Schritte, Work-Packages, Evidence-Sync).
5. Bei negativem oder unklarem Ergebnis **Korrekturen** vorbereitet und als neues, scoped Workitem behandelt werden.
6. Evidence, Roadmap- und Traceability-Sync sowie Branch-Cleanup konsequent erfolgen.

Die Richtlinie schließt die Lücke zwischen „PR ist offen im Chat“ und „Roadmap-Phase ist VERIFIED PASS / NEXT PHASE“.

---

## 2. Geltungsbereich und Nicht-Ziele

### Gilt für
- Jeden von Grok erstellten oder maßgeblich betriebenen PR gegen `main`.
- Sowohl Repository-only Änderungen (Klassen D/C/R) als auch PRs, die spätere externe Mutation vorbereiten (Klasse M).
- Session-übergreifende Fortsetzung (Präferenz Session-Kontinuität).
- Explizite Chat-Trigger und Grok-Automations, die den Merge-Status überwachen.

### Gilt nicht für
- Human-erstellte PRs (Grok darf beobachten und berichten, aber nicht als autorisierte Fortsetzungsinstanz handeln).
- Direkte Produktionsmutationen ohne gültiges REM + Owner Mutation Approval.
- Self-Merge oder automatisierte Merge-Versuche.

---

## 3. Verbindliche Phasen-Sequenz

```text
PR CREATED im Chat (mit vollständiger Template-Contract 1.3.5 + Claim + Baseline)
    ↓
[PHASE A] WAIT FOR HUMAN MERGE (Chat-Wartezustand + Trigger/Automation)
    ↓
Human Merge auf main erfolgt
    ↓
[PHASE B] POST-MERGE TECHNICAL VERIFICATION
    ↓
[PHASE C] DEPLOYMENT / CODE-BASED SUCCESS CHECK
    ↓
[PHASE D] DECISION + CONTINUATION IM CHAT
    ├── VERIFIED PASS → Evidence + Roadmap-Sync + konkrete Next-Step-Vorschläge im Chat
    └── FAILED / INCONCLUSIVE → Diagnose + Correction Workitem (neuer Branch) + Chat-Bericht
```

Kein Schritt darf übersprungen werden, wenn der PR mutierende oder deploy-relevante Änderungen enthält.

---

## 4. Phase A — Wait for Human Merge (Chat-Trigger)

### Regeln
1. Nach `create_pull_request` (oder äquivalent) **stoppt** Grok jede mutierende Aktion am selben Workitem.
2. Grok tritt in den **Chat-Wartezustand** und wartet auf die **explizite menschliche Merge-Entscheidung**.
3. Erlaubt während der Wartephase:
   - Read-only Status-Abfragen (PR-State, Checks, Comments, mergeable_state).
   - Berichte an den Owner (z. B. via Automation oder Chat).
   - Reparatur von CI-/Template-Contract-Fehlern **nur solange** noch kein finaler Current-Head Owner-Review (`💪`/`okay` + Viewed) vorliegt und der Scope des Work-Claims nicht überschritten wird.
4. **Verboten**:
   - Merge ausführen oder Merge-Button simulieren.
   - Force-Push / Rebase nach finalem Owner-Review ohne neue Autorisierung.
   - Scope-Erweiterung nach finalem Review.
   - Druck auf den Owner („bitte mergen“ als Action).

### Trigger- und Monitoring-Mechanismen (verbindlich empfohlen)

Da GitHub-Event-Trigger (z. B. `pr_merged`) derzeit nicht für alle Accounts freigeschaltet sind, gilt folgende Priorität:

1. **Session-Kontinuität (bevorzugt)**  
   Bei der nächsten User-Nachricht im selben Chat prüft Grok zuerst den Status des offenen PRs.  
   Beispiel-User-Trigger: „PR-Status prüfen“, „Merge erfolgt?“, „fahre fort“, „check PR #N“.

2. **Grok Automations (scheduled)**  
   Nach PR-Erstellung darf Grok (mit Owner-Zustimmung) eine **zeitgesteuerte Automation** anlegen, z. B.:
   - Name: `finance-pr-N-merge-watch`
   - Cadence: `RRULE:FREQ=HOURLY` (oder engeres Fenster 08:00–22:00 Europe/Oslo)
   - Prompt: „Prüfe den Status von PR #N im Repo SvenKulessa/Finance. Wenn `merged == true`, führe Phase B–D der GROK_POST_PR_MERGE_CONTINUATION_POLICY aus und melde Ergebnis + nächste Chat-Vorschläge.“
   - Notification: `default` oder `app_only`

3. **Bestehende stündliche „Finance PR-Governance-Prüfung“**  
   Bleibt die primäre Beobachtungsquelle für offene PRs. Nach Merge kann die Session-Fortsetzung Phase B–D auslösen.

Sobald `merged == true` und `merge_commit_sha` bekannt → Phase B starten.

---

## 5. Phase B — Post-Merge Technical Verification

Sofort nach erkanntem Merge (oder bei nächster Session-Wiederaufnahme / Automation-Lauf):

| Prüfung | Erforderlich | Aktion bei Fehlschlag |
|---------|--------------|-----------------------|
| Merge-SHA auf `main` vorhanden und erreichbar | Ja | STOP + Owner informieren |
| Required Check `build-and-test` auf dem Merge-Commit grün | Ja (außer dokumentierte D-only Fast-Path-Ausnahme) | STOP + Diagnose |
| Remote-Arbeitsbranch gelöscht | Ja (Policy) | Branch löschen (wenn Capability) oder Owner auffordern |
| Work-Claim Status → `released` / `closed` | Ja | Claim aktualisieren |
| Keine offenen Konflikte / stale Reviews | Ja | dokumentieren |

**Evidence-Minimum (append-only):**
- finaler PR-Number + Titel
- `merge_commit_sha`
- Zeitstempel des Merges
- CI-Run-IDs / Check-Status
- Branch-Deletion-Status

---

## 6. Phase C — Code-based Deployment / „Erfolgreich eingesetzt“ Check

„Codebasiert erfolgreich eingesetzt“ bedeutet: Der Inhalt des gemergten Commits ist im **Ziel-Laufzeitkontext** (Production oder explizit benannter Environment) aktiv und verifizierbar.

### Pflichtprüfungen (je nach PR-Klasse)

| Klasse | Mindest-Verifikation |
|--------|----------------------|
| **D** (Docs/.ai) | Merge + Branch-Delete + Roadmap/Traceability-Sync genügt. Kein Deploy-Check. |
| **C** (App/Config/Tests) | `build-and-test` grün + (wenn Deploy-Trigger existiert) Deploy-Job Status + Health-Endpoint oder Version/SHA-Match in Production. |
| **R** (Docker/Deps/Server/CI) | Zusätzlich Image-Build/Attestation-Status, Container-Health, keine Regression in Required Checks. |
| **M** (External Mutation vorbereitet) | Repository-Seite VERIFIED → separate Pre-Mutation Check + Owner Mutation Approval erforderlich (siehe DevelopmentChain). Deployment-Verifikation folgt dem jeweiligen Runbook. |

### Konkrete Verifikationsquellen (Priorität)
1. GitHub Actions / Deploy-Workflow-Status am Merge-Commit.
2. Render (oder aktueller Host) Deploy-Status + Service Health.
3. Application Health-/Readiness-Endpoint (wenn vorhanden).
4. Eingebettete Version / Git-SHA in der laufenden Instanz (falls exponiert).
5. Logs / Error-Rate im relevanten Zeitfenster (keine Secrets).
6. Negative Checks: keine neuen CRITICAL Failures, die dem Merge zugeordnet werden können.

### Ergebniszustände
- `VERIFIED PASS`
- `FAILED`
- `INCONCLUSIVE` (fehlende Observability → fail-closed behandeln)

Bei `FAILED` oder `INCONCLUSIVE` darf **kein** Roadmap-Fortschritt erfolgen.

---

## 7. Phase D — Decision & Continuation **im Chat**

### 7.1 VERIFIED PASS
1. Evidence finalisieren und ablegen (`docs/evidence/...`).
2. Roadmap (`docs/architecture/ROADMAP.md` und betroffene Detail-Roadmaps, z. B. SC-MD-SPT) + Traceability aktualisieren.
3. Work-Claim freigeben.
4. Nächsten unblocked Roadmap-Schritt identifizieren.
5. **Im Chat konkret vorschlagen**, wie weitergearbeitet werden soll, z. B.:
   - „Nächster logischer Schritt: SC-X / WP-Y aus SC-MD-SPT-0001. Soll ich einen frischen Branch aus aktuellem main anlegen und starten?“
   - „Evidence + Roadmap-Sync sind erledigt. Empfohlene Fortsetzung: …“
   - „Optionaler Parallel-Schritt (kein Overlap): …“
6. Für den nächsten Schritt: **neuen** Branch aus aktuellem `main` erzeugen (niemals den alten Branch wiederverwenden).
7. Preflight (Overlap, Scope, Klasse, REM falls Systemadmin) durchführen und fortfahren, sobald Owner zustimmt.

### 7.2 FAILED / INCONCLUSIVE
1. Root-Cause so weit wie möglich eingrenzen (CI-Logs, Deploy-Logs, Health, Diff).
2. Korrektur als **neues, scoped Workitem** behandeln:
   - neuer Branch aus aktuellem `main`
   - neuer Work-Claim
   - klarer Bezug zum fehlgeschlagenen Merge-SHA
3. Korrektur-PR erstellen und den gesamten Zyklus (inkl. Owner-Gate) erneut durchlaufen.
4. Im Chat klar berichten und den nächsten Korrektur-Schritt vorschlagen.
5. Bis zur erfolgreichen Korrektur-Verifikation bleibt der ursprüngliche Roadmap-Punkt blockiert.

### 7.3 Rollback-Fall
Repository-Rollback erfolgt über einen **neuen** Revert-/Rollback-Branch aus aktuellem `main` (siehe Branch-Lifecycle-Policy). Keine Wiederbelebung des ursprünglichen Arbeitsbranchs.

---

## 8. Agenten-Grenzen (unverhandelbar)

| Darf | Darf nicht |
|------|------------|
| PR erstellen (nach Sync + Autorisierung) | MERGE |
| CI/Deploy-Status lesen und berichten | Self-Approve HIGH/CRITICAL |
| Post-Merge Evidence schreiben | Secrets in Evidence/Logs/PR-Body |
| Branch nach Merge löschen (wenn Capability + Policy) | Alten Branch für neues Workitem wiederverwenden |
| Nächsten Roadmap-Schritt vorbereiten + **im Chat vorschlagen** | Scope ohne neuen Claim/REM erweitern |
| Korrektur-Branch + PR bei Failure | Force-Push auf geschützte Branches |
| Scheduled Automation für Merge-Watch anlegen (mit Owner-Zustimmung) | Automatisch mergen |

Transport (Chat, Automation, MCP) ist **keine** Autorität.

---

## 9. Integration mit bestehenden Automationen

- Die stündliche „Finance PR-Governance-Prüfung“ bleibt die primäre Beobachtungsquelle für offene PRs.
- Nach Merge kann eine dedizierte Post-Merge-Automation (oder Session-Fortsetzung) Phase B–D auslösen.
- Jede Automation, die diese Policy implementiert, darf nur **berichten und planen**, niemals mergen oder ohne Owner-Gate mutieren.
- Empfohlene Automation-Prompt-Vorlage (anpassen an konkrete PR-Nummer):

```text
Prüfe den aktuellen Status von PR #<N> in SvenKulessa/Finance.
Wenn merged == true:
1. Führe Phase B (Technical Verification) und Phase C (Deployment/Success-Check) gemäß docs/governance/GROK_POST_PR_MERGE_CONTINUATION_POLICY.md aus.
2. Berichte Ergebnis (VERIFIED PASS / FAILED / INCONCLUSIVE) mit Evidence-Minimum.
3. Schlage im Chat konkrete nächste Schritte aus der SC-MD-SPT / aktuellen Roadmap vor.
Wenn noch nicht gemerged: kurzer Statusbericht und weiter warten.
```

---

## 10. Exit Criteria eines Workitems

Ein von Grok betreutes Workitem ist erst vollständig geschlossen, wenn:

- [ ] PR von Human gemerged
- [ ] finaler `merge_commit_sha` bekannt und auf `main`
- [ ] Required Checks am Merge-Commit grün (oder dokumentierte Ausnahme)
- [ ] Remote-Arbeitsbranch gelöscht
- [ ] Work-Claim released/closed
- [ ] Code-based Deployment-Verifikation = `VERIFIED PASS` (oder D-only)
- [ ] Evidence append-only persistiert
- [ ] Roadmap + Traceability synchronisiert
- [ ] Nächster Schritt klar im Chat vorgeschlagen oder bewusst geblockt

---

## 11. Änderungsprozess

Diese Policy darf nur durch Human/Owner-autorisierten PR geändert werden.  
Grok darf Verbesserungsvorschläge als D-Klasse-PR einbringen, aber nicht selbst freigeben.

---

## 12. Kurzreferenz für Grok (Chat-First)

```
PR im Chat erstellt?
  → STOP mutierende Arbeit am selben Item
  → Chat-Wartezustand + optional Automation-Trigger für Merge-Watch
  → warte auf Human Merge (keine Merge-Action)

Merge erkannt (via Chat-Trigger / Automation / Session)?
  → Phase B: SHA + CI + Branch-Delete + Claim
  → Phase C: Deploy/Health/SHA-Match prüfen
  → VERIFIED PASS → Evidence + Roadmap-Sync + **konkrete Next-Step-Vorschläge im Chat**
  → FAILED     → Diagnose + neuer Fix-Branch/PR + Chat-Bericht
```

**Fail-closed.** Unklare Deployment-Lage = kein Fortschritt.

---

*Ende GOV-GROK-POST-MERGE-001 — ACTIVE 2026-08-16*
