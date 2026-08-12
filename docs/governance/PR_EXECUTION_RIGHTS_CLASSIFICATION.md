# Pull Request Execution Rights Classification

Status: **REQUIRED**  
Date: 2026-08-12  
Authority: CAPITAL-AI DevelopmentChain

## Zweck

Die Checkklasse D/C/R/M sagt **was geprüft wird**. Das Execution Profile sagt **wer im aktuellen Arbeitsschritt was tun darf**. Beide Dimensionen sind unabhängig.

`CHECK CLASS != AUTHORITY`

Eine grüne CI, Klasse R oder Klasse M erweitert niemals automatisch die Berechtigungen eines Agenten.

## Profile

| Profil | Rolle in einfacher Sprache | Typische Rechte | Harte Grenze |
|---|---|---|---|
| **P1** | Roadmap/Dokumentation | READ, ANALYZE, PLAN, dokumentarische Branch/Commit/PR-Arbeit nach geltender PR-Autorisierung | keine Produktionsmutation |
| **P2** | Development | Repository-Code, Tests, Frontend, Runtime-/Workflow-Code; Commit/PR/CI im autorisierten Scope | keine direkte Supabase-/Stripe-/Render-Produktionsmutation |
| **P3** | Production Integration | Handoff/Integration und separat autorisierte externe Mutationen | Mutation nur mit konkreter Authority + Owner Approval |
| **P4** | Bounded Systemadmin/REM Executor | nur exakt REM-/Host-bound BRANCH/COMMIT/PR/CI bzw. ausdrücklich freigegebene Mutation | kein Scope-Wachstum, keine Self-Authority |
| **P0 HUMAN REQUIRED** | nicht delegierbare Entscheidung/Aktion | Human/Owner handelt selbst | nicht an Agenten delegierbar |

Automatische Default-Zuordnung:

- D → P1;
- C/R → P2;
- M ohne explizit gültiges P3/P4 → **P0 HUMAN REQUIRED** (fail-closed).

## Immer Human/Owner-reserviert

Mindestens folgende Aktionen bleiben P0:

- `MERGE`;
- Owner/Admin-IAM-Elevation;
- Owner MFA/Passkey/Break-Glass/Recovery;
- Secret Disclosure und unbeschränkte Credential Rotation;
- destruktive Produktionsdatenoperationen;
- Live Billing/Money/Entitlement;
- Produktionsressourcen-Löschung;
- DNS/TLS/Domain Ownership;
- Abschwächung von Security-, Audit-, RLS-, Consent-, Branch- oder Repository-Protection;
- Erweiterung der eigenen REM-/Policy-/Capability-Rechte.

## Lernregel im Pull Request

Jeder PR erklärt automatisch:

1. welche Feature-Bereiche betroffen sind;
2. welche Checkklasse daraus folgt;
3. welches Execution Profile gilt;
4. welche Checks deshalb nötig sind;
5. welche Checks bewusst nicht nötig sind;
6. welche Aktionen weiterhin Human/Owner-only sind.

So dient ein Pull Request nicht nur als Merge-Mechanismus, sondern als nachvollziehbares Lern- und Audit-Artefakt.

## Authority

- `AGENTS.md`
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md`
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`
- `docs/governance/PR_CHECK_CLASSIFICATION.md`
- `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`
- ESS-0021 / ADR-0065 für den Systemadmin Roadmap Executor
