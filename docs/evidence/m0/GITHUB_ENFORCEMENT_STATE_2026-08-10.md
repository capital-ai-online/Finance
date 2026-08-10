# GitHub Enforcement State — M0 Evidence

Stand: 2026-08-10
Repository: `SvenKulessa/Finance`
Baseline: `f615cf4062f60eff07772c948c461025729a89dd`

## Verifiziertes Ruleset

Aktiv ist das Repository-Ruleset `main-production-protection` (ID `20609723`). Es gilt für den Default-Branch und explizit `refs/heads/main`.

Aktive Regeln:

- Pull Request erforderlich.
- Required Status Check: `build-and-test`.
- Strict required status checks policy: aktiv.
- Non-fast-forward-Schutz: aktiv.
- Branch-Löschschutz: aktiv.
- Bypass Actors: keine.
- Current user can bypass: `never`.

## Verifizierte M1-Gaps

Das Ruleset verlangt derzeit **keine** approving review (`required_approving_review_count = 0`). Weiterhin fehlen:

- `required_review_thread_resolution`
- `require_code_owner_review`
- `require_last_push_approval`
- Stale-review dismissal

Diese Punkte sind keine M0-Evidence-Lücken mehr, sondern konkrete M1-Hardening-Aufgaben.

## GitHub Environments

Die Repository-API listet 15 Environments. Die sichtbaren Environments sind überwiegend historische/PR-bezogene Deployment-Environments. Sie besitzen keine Protection Rules und `can_admins_bypass=true`.

Ein kanonisches, geschütztes `production`-Environment mit Deployment-Approval wurde in der abgefragten Evidence nicht gefunden.

Folge: Definition eines dedizierten Production Environments ist M1/M7-Scope.

## Secret Metadata

Die GitHub-App besitzt für `GET /repos/SvenKulessa/Finance/actions/secrets` keine ausreichende Berechtigung (`403 Resource not accessible by integration`). Secret-Werte wurden und werden nicht abgefragt.

Damit kann M0 ausschließlich dokumentieren:

- Secret-Metadaten sind mit dem aktuellen Connector nicht evidence-grade inventarisierbar.
- Die fehlende Leseberechtigung ist sicherheitlich vorzuziehen gegenüber einer Ausweitung nur für Dokumentationszwecke.
- Secret-Scope und Rotation müssen später über einen minimal privilegierten Owner-/Admin-Evidence-Prozess bestätigt werden.

## M0 Entscheidung

`M0-B03 GitHub Enforcement State`: PASS.

`M0-B04 Secret Metadata`: PARTIAL / CONNECTOR-LIMITATION dokumentiert; keine Erweiterung der Connector-Rechte allein für M0 empfohlen.
