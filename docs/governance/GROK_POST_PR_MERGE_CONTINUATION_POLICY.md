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
- ADR-0039, ADR-0069 (Nachtrag 2026-08-16), ADR-0073  
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
4. Bei positivem Ergebnis **konkrete Vorschläge** gemacht werden, wie im Chat weitergearbeitet werden soll.
5. Bei negativem oder unklarem Ergebnis **Korrekturen** vorbereitet und als neues, scoped Workitem behandelt werden.
6. Evidence, Roadmap- und Traceability-Sync sowie Branch-Cleanup konsequent erfolgen.

**Hinweis 2026-08-16:** Owner-Checkboxen und Review `💪`/`okay` sind als CI-Gate **retired**. Ab M10 gilt Passkey-Autorisierung.

---

## 2. Geltungsbereich und Nicht-Ziele

### Gilt für
- Jeden von Grok erstellten oder maßgeblich betriebenen PR gegen `main`.
- Klassen D/C/R und PRs, die Klasse-M-Mutationen vorbereiten.
- Session-übergreifende Fortsetzung und Merge-Watch-Automations.

### Gilt nicht für
- Human-erstellte PRs (Beobachtung erlaubt, keine autorisierte Fortsetzungsinstanz).
- Direkte Produktionsmutationen ohne REM + Owner Mutation Approval.
- Self-Merge oder automatisierte Merge-Versuche.

---

## 3. Verbindliche Phasen-Sequenz

```text
PR CREATED im Chat (Template-Contract ≥ 1.4.0 + Claim + Baseline)
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
```

---

## 4. Phase A — Wait for Human Merge (Chat-Trigger)

### Regeln
1. Nach `create_pull_request` **stoppt** Grok mutierende Arbeit am selben Workitem.
2. Grok wartet auf die **explizite menschliche Merge-Entscheidung**.
3. Erlaubt während der Wartephase:
   - Read-only Status-Abfragen (PR-State, Checks, mergeable_state).
   - Berichte an den Owner.
   - Reparatur von CI-/Template-Contract-Fehlern **innerhalb des Work-Claim-Scopes** (kein Checkbox-/Emoji-Gate mehr).
4. **Verboten:** Merge ausführen; Force-Push auf geschützte Branches ohne Autorisierung; Scope-Erweiterung ohne neuen Claim; Druck-Aktionen („bitte mergen“).

### Trigger
1. Session-Kontinuität (User: „PR-Status prüfen“, „fahre fort“, …).
2. Optional: scheduled Grok Automation für Merge-Watch.
3. Bestehende stündliche Finance PR-Governance-Prüfung.

Sobald `merged == true` → Phase B.

---

## 5–7. Phase B/C/D

Unverändert in Substanz: Post-Merge-SHA/CI/Branch-Delete/Claim; Deploy/Health-Verifikation je Klasse; Chat-Fortsetzung oder Korrektur-Workitem. Korrektur-PRs durchlaufen den **vereinfachten** Zyklus (kein Owner-Checkbox-Gate).

---

## 8. Agenten-Grenzen

| Darf | Darf nicht |
|------|------------|
| PR erstellen | MERGE |
| CI/Deploy lesen | Self-Approve HIGH/CRITICAL |
| Evidence schreiben | Secrets in Evidence/PR-Body |
| Branch nach Merge löschen (Policy) | Alten Branch wiederverwenden |
| Next Steps im Chat vorschlagen | Ohne Claim Scope erweitern |
| Merge-Watch Automation | Automatisch mergen |

---

## 9–12. Automations, Exit Criteria, Änderungsprozess, Kurzreferenz

Automations dürfen nur berichten und planen, niemals mergen. Exit Criteria: Human merge, merge SHA, Required Checks, Branch-Delete, Claim released, Deploy-Verifikation (oder D-only), Evidence, Roadmap-Sync, Chat-Next-Step.

```
PR erstellt → STOP mutierend → warte Human Merge
Merge erkannt → Phase B/C → VERIFIED PASS → Evidence + Next Steps im Chat
             → FAILED → neuer Fix-Branch/PR
```

**Fail-closed.** Unklare Deployment-Lage = kein Fortschritt.

---

*Ende GOV-GROK-POST-MERGE-001 — ACTIVE 2026-08-16 (Owner-Gate ritual retired)*
