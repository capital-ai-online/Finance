# DEVELOPMENT Chain Responsibility Matrix

Status: PROPOSED
Date: 2026-08-12

## Zweck

Diese Matrix trennt Entscheidung, Planung, Implementierung, Mutation, Verifikation und Merge-Autorität. Provider- oder Tool-Namen sind keine Sicherheitsautorität; sie beschreiben nur die vorgesehene operative Rolle.

## Rollen

| Rolle | Hauptaufgabe | Schreib-/Mutationsgrenze |
|---|---|---|
| Human / Owner `SvenKulessa` | Roadmap-/Security-Entscheid, File Review, externe Mutation Approval, Merge | finale Autorität für reservierte High-Impact-Aktionen |
| ChatGPT Roadmap / Architecture Plane | Deep/read-only Analyse, Gap, Roadmap, ESS/ADR, Contracts, Traceability, Evidence-Design | keine implizite externe Produktionsmutation |
| Google AI Studio Development Plane | Anwendungscode, Architektur, Frontend, Tests, production-ready Dev-Implementierung | Stripe/Supabase/Render nur als Code/Handoff, nicht als direkte Plattformmutation |
| Claude Production Integration Plane | Production Handoff, Staging/Integration, Backend-Konfiguration | Mutation nur mit demselben Owner-/Control-Plane-Gate |
| `capital-ai-systemadmin-roadmap-executor` | bounded Repository-/Mutation-Workitems unter gültigem REM/Execution Host | kein MERGE; keine Self-Authority; Reserved Actions bleiben Human-only |
| GitHub Actions | reproduzierbare CI, Security-/Build-/Evidence-Ausführung; ggf. gebundener Execution Host | nur explizite Workflow-Permissions; kein allgemeines Adminrecht |
| Supabase | DB/Auth/Persistence Platform | Mutation nur Roadmap/Approval/Handoff/Verification |
| Stripe | Billing/Webhooks/Payments | Live Money/Entitlement bleibt Human-reserviert; technische Mutation nur explizit freigegeben |
| Render | Hosting/Deployment Runtime | Deployment-/Config-Mutation nur M7/approved runbook |
| IONOS / DNS | Domain/TLS Ownership | Human/Owner-only, sofern kein späterer ADR gleichwertige Assurance einführt |

## RACI-ähnliche Zuordnung

Legende:

- **A** = Accountable / finale Autorität
- **R** = Responsible / führt aus
- **C** = Consulted / liefert Analyse/Design
- **V** = Verifier / unabhängige oder technische Prüfung
- **—** = keine Rolle

| Aktivität | Owner | ChatGPT Roadmap | Google AI Studio | Claude Prod | Mutation Executor | GitHub CI |
|---|---:|---:|---:|---:|---:|---:|
| Read-only Repo-/Produktionsbaseline | A | R | C | C | C | — |
| Gap-/Roadmap-Definition | A | R | C | C | C | — |
| ESS/ADR/Threat Model/Runbook | A | R | C | C | C | — |
| Development-Code | A | C | R | C | R unter REM | V |
| Frontend-Code | A | C | R | C | R unter REM | V |
| Production-Handoff vorbereiten | A | R | C | R | C | — |
| External Pre-Mutation Check | A | C | — | C | R/V abhängig vom Host | — |
| Externe Mutation freigeben | **A** | — | — | — | — | — |
| Externe Mutation ausführen | A | — | — | R falls autorisiert | R falls autorisiert | R nur als gebundener Host |
| Post-Mutation Verification | A | C | — | R/C | R/C | V soweit automatisierbar |
| Evidence/Traceability Sync | A | R | C | C | C | V |
| PR File Review / Viewed | **A/R** | — | — | — | — | — |
| Expensive CI Authorization | **A** | — | — | — | — | R nach gültigem Gate |
| PR Merge | **A/R** | — | — | — | **PROHIBITED** | **PROHIBITED** |
| Branch Cleanup nach Merge | A | R/C | R/C | R/C | R für eigenen Branch | — |

## Development-vs-Production Boundary

### Google AI Studio

Darf in der Development Plane:

- Anwendungscode und Architektur implementieren;
- Frontend entwickeln;
- Tests und production-ready Konfiguration im Repository vorbereiten;
- Kommentare/Runbooks/Handoffs für spätere Plattformkonfiguration erzeugen.

Darf nicht als Development-Aktion direkt:

- Supabase Produktionszustand verändern;
- Stripe Live-Zustand verändern;
- Render Produktionskonfiguration verändern.

### Claude / Production Integration

Darf Produktionsüberführung und Backend-Integration vorbereiten bzw. ausführen, sofern der konkrete Schritt durch die DevelopmentChain autorisiert ist. Claude selbst ersetzt weder Human/Owner Approval noch REM/IAM/Audit/Execution-Host-Enforcement.

### Mutation Executor

Der autonome Executor ist der bevorzugte bounded Ausführungspfad für Roadmap-Mutationen, sobald sein eigener Systemadmin Exit Gate `VERIFIED PASS` erreicht. Bis dahin ist seine Existenz oder ein offener Implementierungs-PR keine Mutationsautorität.

## Human-reservierte Aktionen

Mindestens folgende Aktionen werden nicht durch eine DevelopmentChain Work Order delegiert:

- `MERGE`;
- Branch-/Repository-Protection abschwächen;
- Owner/Admin-Elevation;
- Owner MFA/Passkey/Break-Glass Recovery;
- Secret Disclosure;
- unbeschränkte Credential Rotation;
- destruktive Produktionsdatenoperationen;
- Live Billing/Money/Entitlement;
- Produktionsressourcen-Löschung;
- DNS/TLS/Domain Ownership;
- Security/Audit/RLS/Consent deaktivieren;
- REM-/Policy-/Capability-Self-Expansion.

## Concurrent Agent Rule

Mehrere AI Apps/Agents dürfen parallel arbeiten, wenn:

1. jede Schreibaufgabe einen eigenen neuen Branch besitzt;
2. Changed-File-Scopes vor Beginn und vor PR-Erstellung verglichen werden;
3. keine nicht gemergte Datei eines anderen PRs als normative Voraussetzung angenommen wird;
4. bei Überschneidung sequenziert oder rescopet wird;
5. der Human/Owner die finale Merge-Reihenfolge bestimmt.

## Evidence Responsibility

Der Ausführende erzeugt technische Evidence; der Roadmap/Documentation Plane synchronisiert die kanonischen Dokumente; der Owner akzeptiert keine Phase als abgeschlossen, bevor Mutation/Test/Evidence `VERIFIED PASS` und konsistent sind.