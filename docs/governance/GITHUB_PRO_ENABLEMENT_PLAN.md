# GitHub-Plattform-Enablement-Plan — SvenKulessa/Finance

Status: **DRAFT / OWNER DECISION REQUIRED**  
Stand: 2026-08-12  
Repository: `SvenKulessa/Finance` (privat)

## 1. Zweck

Dieser Plan konsolidiert die in PR #193 vorbereitete GitHub-Kosten-/Funktionsanalyse. Er beschreibt, welche Plattformfunktionen für CAPITAL-AI sinnvoll sind, ohne aus einer technischen Möglichkeit automatisch eine Beschaffung oder Admin-Mutation abzuleiten.

## 2. Leitplanken

- Repository bleibt privat, solange keine eigene Migration/Lizenz-/Historienentscheidung getroffen wurde.
- `main` bleibt Human/Owner-geschützt.
- GitHub-Actions-Zusatzkosten bleiben auf **15 EUR/Monat** begrenzt.
- Billing, Planwechsel, Environments, Secrets und Rulesets sind Owner/Admin-Handoffs.
- CI-Erfolg autorisiert weder Merge noch Produktionsmutation.

## 3. Prioritäten

### P0 — Zustand verifizieren

Owner prüft Plan/Billing/Spending Limits und verfügbare Repository-Funktionen direkt in GitHub. Externe Preis- oder Featureangaben werden vor einer Entscheidung aktuell verifiziert.

### P1 — Geschütztes `production`-Environment vorbereiten

Ziel: Produktions-Deploy-Credential aus repositoryweitem Scope in ein `production`-Environment verschieben und nur `main` als Deployment-Branch zulassen.

Ausführung bleibt bis zum dafür vorgesehenen DevelopmentChain-Schritt und separater Owner-Freigabe blockiert. Runbook: `docs/runbooks/PRODUCTION_ENVIRONMENT_SETUP.md`.

### P2 — Deadlock-freie Repository-Härtung

Geeignete Maßnahmen ohne künstlichen Single-Owner-Deadlock prüfen, z. B. Conversation Resolution, sichere Agent-Branch-Regeln und deterministische Required Checks. Keine Einstellung wird durch dieses Dokument automatisch mutiert.

### P3 — Echtes Vier-Augen-Prinzip

Eine zweite unabhängige menschliche Reviewer-Identität ist der relevante organisatorische Schritt. Automatisierte Agenten ersetzen kein unabhängiges Human Review.

### P4 — Kosten- und Workflow-Effizienz

- genau ein `build-and-test` pro `(PR, Head-SHA)`;
- Docs-Fast-Path für reine Dokumentation;
- keine Mikro-Commits nur zum erneuten CI-Trigger;
- Dependabot/Updates nur so konfigurieren, dass die 15-EUR-Actions-Richtlinie eingehalten wird;
- optionale Plattformdienste nur nach Kosten-/Nutzenprüfung.

## 4. Nicht automatisch freigegeben

Dieser Plan autorisiert nicht:

- GitHub-Plan-/Billing-Änderungen;
- kostenpflichtige Marketplace-Apps;
- Environment-/Secret-Mutationen;
- Ruleset-/Protection-Abschwächung;
- Auto-Merge als Ersatz für Human-Merge;
- öffentliche Repository-Sichtbarkeit.

## 5. Lernziel

GitHub-Features werden bei CAPITAL-AI nicht nach „verfügbar = aktivieren“ ausgewählt, sondern nach **Threat Model, Single-Owner-Governance, Kosten, Auditierbarkeit und Rollback**. Das verhindert, dass Komfortfunktionen die Trust Boundary vergrößern.
