---
skill:
  id: ESS-0006
  name: Security & Compliance
  version: 1.2.0
  status: Enterprise Approved
  maturity: Revalidated
  owner: Platform Director
  category: Enterprise Architecture
  priority: Critical

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  architecture: Enterprise
  lifecycle: AI Native Development Lifecycle

classification:
  type: Component Specification
  role: Komponentenspezifikation der bestehenden Security- und Compliance-Komponenten
  contractAuthority: ESS-0001-CONTRACTS
  note: >
    Dieses Dokument spezifiziert ausschliesslich die bestehenden technischen Grenzen
    src/platform/Security und src/platform/Compliance sowie deren zulässige Einbindung
    in die bounded Security-Remediation nach CTRL-SEC-BOUNDED-REMEDIATION-001. Es erzeugt
    weder globale Security-/Compliance-Regeln noch eine zweite Compliance Requirement
    Registry, Audit-/Risk-Authority, Security-/Compliance-Runtime oder Projekt-Ownership.

authority:
  componentResponsibilities:
    - reusable Security implementation boundary
    - Security-specific adapters and enforcement helpers
    - bounded Security-primary repository remediation under CTRL-SEC-BOUNDED-REMEDIATION-001
    - repository-based Compliance scanner and evidence backend
    - internal Compliance reporting and evidence persistence
  cannot_modify:
    - Enterprise Specifications ausserhalb des eigenen ESS-Lebenszyklus
    - Architecture Decision Records
    - Enterprise Contracts
    - Governance Control Plane oder kanonische Registries ausserhalb ihrer Owner-Grenzen
    - IAM Regeln oder Berechtigungen ausserhalb bereits akzeptierter IAM-/Policy-Vertraege
    - Legal Applicability, Zertifizierungsstatus oder Accepted Risk
    - produktive PVC-Ownership fremder Projekte
    - fachliche Business-Authority oder Produktlogik ausserhalb minimal notwendiger Security-Haertung
    - geschuetzte externe Production-/IAM-/Billing-/Secret-/DNS-/Daten-Mutationen ohne separate Authority

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  instructionTrustRoot: AUTH-GOV-AGENT-TRUST-ROOT
  executionControl: CTRL-SEC-BOUNDED-REMEDIATION-001
  projectDirection: SECURITY_FOUNDATION_FIRST
  correlationProjection:
    requiredFields:
      - correlation_id
      - current_main_sha
      - branch_or_pr_head_sha
      - security_requirement_or_finding
      - affected_primary_project
      - affected_primary_owner
      - affected_pvc_relationship
      - before_state
      - intended_delta
      - after_state
      - validation_state
      - independent_security_verification
      - evidence_references
      - handover_state
  relatedEss:
    - ESS-0005
    - ESS-0011
    - ESS-0012
    - ESS-0013
    - ESS-0019
  relatedAdr:
    - ADR-0007
    - ADR-0012
    - ADR-0016
    - ADR-0058
    - ADR-0059
    - ADR-0060
    - ADR-0096
  relatedComponents:
    - src/platform/Security
    - src/platform/Compliance
  relatedProjectSurfaces:
    - docs/projects/security/README.md
    - docs/projects/compliance/README.md
    - docs/compliance/CAPITAL-AI-COMP/

created: 2026-07-31
revalidated: 2026-09-16
---

# Security & Compliance

## 1. Zweck und aktuelle Authority-Grenze

ESS-0006 bleibt die unter ADR-0016 reservierte **Komponentenspezifikation** fuer zwei getrennte,
bereits vorhandene technische Komponenten:

- `src/platform/Security`
- `src/platform/Compliance`

Die gemeinsame ESS-Nummer bedeutet **keine gemeinsame produktive Security-/Compliance-Runtime**
und keine gemeinsame Projekt-Ownership. Security und Compliance bleiben fachlich und organisatorisch
getrennte cross-cutting Assurance-Domaenen.

Verbindliche globale Security-/Compliance-Regeln stammen weiterhin aus den jeweils aktuellen
Contracts, ADRs, Controls und dem Trust Root. ESS-0006 beschreibt die technische Komponentengrenze,
die zulässige Evidence-Beziehung und die Einbindung des Security-Komponentenmodells in die durch
`AUTH-GOV-AGENT-TRUST-ROOT` und `CTRL-SEC-BOUNDED-REMEDIATION-001` korrelierte bounded
Security-Remediation. `/AGENTS.md@CURRENT_MAIN` bleibt dabei die einzige repository-weite
AI-/Development-Instruktionsquelle; ESS-0006 ist ausschliesslich eine subject-matter
Komponentenspezifikation und erzeugt keine parallele Entwicklungsrichtlinie.

ADR-0007 ist in der kanonischen ADR Registry als `historical` / non-authorizing registriert. Seine
legacy Compliance Value Chain darf deshalb weder durch ESS-0006 noch durch Implementierungsdetails
reaktiviert werden.

---

## 2. Projekt- und Ownership-Grenzen

### CAPITAL-AI-SEC

`CAPITAL-AI-SEC` ist cross-cutting Security Requirements-, Findings-, Testing- und unabhängiger
Verification-Owner. Es besitzt keinen produktiven `PVC-*`-Stage allein aufgrund dieser Rolle und
erwirbt durch eine Remediation weder die langfristige Datei- noch Domain-/PVC-Ownership.

Unter `CTRL-SEC-BOUNDED-REMEDIATION-001` darf `CAPITAL-AI-SEC` jedoch die kleinste ausreichende
Security-spezifische Repository-Remediation selbst implementieren, wenn der primaere und unmittelbare
Zweck die Behebung, Praevention oder technische Haertung eines bestaetigten Security-Findings ist,
bestehende Domain-Semantik und accepted ADR/ESS-Vertraege unveraendert bleiben und keine geschuetzte
externe Mutation oder parallele Control Plane entsteht.

Die physische Dateiposition ist dafuer kein Ownership- oder DENY-Kriterium. Eine verwundbare
Implementierung darf dort behoben werden, wo sie liegt, einschliesslich `server/**`,
`scripts/security/**`, `scripts/automation/**`, `.github/workflows/**`, `package.json`, Lockfiles,
Docker-/Runtime-Security-Konfiguration und Security-relevanten Tests. `src/platform/Security` bleibt
die bevorzugte wiederverwendbare Security-Komponente, aber keine kuenstliche Ablagepflicht fuer
fremde Domain-Logik.

Sobald ein Fix fachliche Produktsemantik, neue Architecture Authority oder fremde Domain-
Implementierung jenseits der trennbaren Security-Haertung erfordert, endet die Delegation. Security
setzt nur den sauber trennbaren Security-Anteil um und dokumentiert/routet den verbleibenden Anteil
an den kanonischen Primary Owner.

Die Security-Richtung bleibt `SECURITY_FOUNDATION_FIRST`: Schutzbedarf, Threat Model, Trust Boundary
und Security Controls bestimmen die Remediation-Grenze. Nutzerwirksame oder Frontend-Prioritaet darf
diese Security-Authority weder umkehren noch abschwaechen.

### CAPITAL-AI-COMP

`CAPITAL-AI-COMP` ist cross-cutting Owner fuer Applicability, Requirements Inventory,
Requirement/Control Mapping, evidence-basierte Compliance-Bewertung, Findings, regulatorische
Traceability, Remediation-Handoff und Legal-Review-Handoff. Es besitzt keinen produktiven
`PVC-*`-Stage allein aufgrund dieser Rolle.

Produktive Remediation bleibt beim Primary Owner des betroffenen PVC. Legal Applicability,
regulatorischer Status, Zertifizierung oder Accepted Risk werden nicht durch ESS-0006 entschieden.
Die Security-spezifische Delegation aus `CTRL-SEC-BOUNDED-REMEDIATION-001` wird dadurch nicht auf
`CAPITAL-AI-COMP` erweitert.

### Platform Director / Governance

`CAPITAL-AI-GOV / PVC-05` pflegt den ESS-Lifecycle und die Architecture-/Authority-Grenze. Governance
uebernimmt dadurch weder Security-Verifikation noch Compliance-Bewertung oder fremde produktive
Implementierung.

---

## 3. Keine zweite Requirement Registry

Die historische v1.0.0-Bezeichnung `ComplianceRequirementRegistry` ist **keine aktuelle
Implementierungsanforderung** und darf nicht als neue Runtime- oder Governance-Registry materialisiert
werden.

Die kanonischen Compliance-Requirements- und Applicability-Surfaces liegen unter:

- `docs/compliance/CAPITAL-AI-COMP/inventory/COMPLIANCE_REQUIREMENTS_INVENTORY.md`
- `docs/compliance/CAPITAL-AI-COMP/inventory/APPLICABILITY_MATRIX.md`
- `docs/compliance/CAPITAL-AI-COMP/mappings/REQUIREMENT_CONTROL_EVIDENCE_MATRIX.md`
- `docs/compliance/CAPITAL-AI-COMP/traceability/`

Diese Surfaces sind Compliance-owned Assessment-/Traceability-Projektionen und erzeugen keine zweite
Governance Control Plane. `src/platform/Compliance` darf sie technisch konsumieren oder Evidence fuer
sie liefern, wird aber nicht selbst zur normativen Requirements Registry.

---

## 4. Security-Komponente und Remediation-Ausfuehrung

`src/platform/Security` ist die bestehende wiederverwendbare technische Security-Grenze. Der aktuelle
Bestand umfasst insbesondere Security-/IAM-Helper und Adapter wie Auth-Middleware, native MFA/AAL,
Rate Limiting, Secret-Kryptographie und TOTP dort, wo aktuelle Contracts dies noch vorsehen.

ESS-0006 erzeugt **keine** zweite IAM-Authority, keinen neuen Secret Store, kein zentrales
Security-Orchestrator-System und keinen produktiven PVC-Owner. Bestehende Security-Komponenten und
Contracts werden erweitert, bevor duplizierte Security-Infrastruktur geschaffen wird.

Innerhalb eines zulaessigen bounded Security-Slices kann Security insbesondere umsetzen:

- Input-Validation und Sanitization;
- AuthN-/AuthZ-Haertung innerhalb bereits akzeptierter IAM-/Policy-Vertraege;
- Secret-Schutz und Secret-Leak-Prevention;
- Security-Headers, CSP-Guardrails und sichere Defaults;
- Dependency-/Supply-Chain-Remediation und semantisch sichere Library-Upgrades;
- fail-closed Guards sowie Rate-/Size-/Resource-Limits;
- Upload-, Parser-, Mail-, URL-, Redirect- und SSRF-Haertung;
- Security-spezifische Negative Tests und Audit-/Evidence-Instrumentierung;
- Workflow-Security sowie SBOM-/Provenance-/Artifact-Verifikationskontrollen;
- Entfernung eindeutig unsicherer oder nicht mehr benoetigter Security-relevanter Komponenten.

Die Security-Remediation darf eine fremd platzierte Datei aendern, ohne deren langfristige Domain-
Ownership zu uebernehmen. Reine Security-Remediation verwendet die `CAPITAL-AI-SEC` Projektidentitaet
und einen frischen `security`-Branch/PR; der betroffene Primary Owner/PVC und seine Contracts bleiben
in Correlation/Evidence sichtbar.

Jede Security-Remediation wird mit derselben `correlation_id` ueber Requirement/Finding, Current-Main-
Baseline, Branch-/PR-Head, betroffenen Primary Project/Owner/PVC, Before-State, intended Delta,
read-back After-State, Validation, unabhaengige Security-Verifikation, Evidence-Referenzen und
Handover-State verbunden. Diese Korrelation uebertraegt weder Ownership noch Approval- oder
Merge-Authority.

---

## 5. Compliance-Komponente

`src/platform/Compliance` ist das bestehende technische Backend des SecurityComplianceAuditor unter
ADR-0012. Der aktuelle Bestand umfasst insbesondere:

- `scanners.ts` fuer repository-basierte technische Scanner;
- `router.ts` fuer die autorisierten `/api/compliance/*`-Routen;
- `store.ts` fuer zweckgebundene Run-/Evidence-/Certificate-Persistenz;
- `types.ts` fuer gemeinsame technische Typen.

Die vorhandenen Begriffe `certify`, `certificate` oder ISO-Control-Zuordnungen sind **interne
technische Evidence-/Reporting-Semantik**. Sie beweisen keine behoerdliche, rechtliche oder externe
Zertifizierung und begruenden keine Legal-Sufficiency-Aussage.

`src/platform/Compliance` ist keine zweite Compliance-Projektarchitektur und keine normative
Requirements Registry. Evidence aus dieser Komponente wird von `CAPITAL-AI-COMP` innerhalb des
jeweils aktuellen Requirement-/Applicability-Kontexts bewertet.

---

## 6. Evidence- und Assurance-Beziehung

Security- und Compliance-Evidence duerfen korreliert werden, aber die Rollen bleiben getrennt:

```text
correlation_id
        -> Security requirement / test / finding
        -> bounded Security remediation OR owner-routed domain remainder
        -> observed Before -> intended delta -> read-back After
        -> implementation evidence
        -> EVIDENCE_READY
        -> separate Security re-test / verification evidence
        -> VERIFIED / CLOSED only when all required gates are satisfied

same correlation_id
        -> Compliance requirement / applicability
        -> Control-/Owner-Mapping
        -> Evidence aus Security, Runtime, Tests, Docs oder anderen Primary Ownern
        -> unabhaengige Compliance assessment
```

Daraus folgen sechs Invarianten:

1. Security Evidence ist Input fuer Compliance Assessment, aber kein automatischer Compliance-PASS.
2. Compliance Assessment ersetzt keine getrennte Security Verification.
3. Fehlende oder stale Evidence darf weder von Security noch Compliance stillschweigend als PASS
   behandelt werden.
4. Ein Finding und eine Security-Remediation erzeugen keine Ownership-Uebernahme; nur der bounded
   Security-Teil darf unter `CTRL-SEC-BOUNDED-REMEDIATION-001` durch Security implementiert werden.
5. Implementierungsnachweis allein ist nie `VERIFIED/CLOSED`; `EVIDENCE_READY != VERIFIED`.
   Reproduzierbare positive und negative Tests sowie, wo relevant, Hosted-/Runtime-Evidence sind
   erforderlich. Human/CODEOWNER- oder betroffene Owner-Verifikation bleibt zusaetzlich erforderlich,
   wenn Risiko oder bestehende Contracts dies verlangen.
6. Eine `correlation_id` verbindet Evidence und Handover, ist aber niemals Approval-, Ownership-,
   Merge-, Deployment- oder Risk-Acceptance-Credential.

---

## 7. Audit, Risk und Traceability

Die v1.0.0-Komponentenbegriffe `AuditTrail` und `RiskRegister` werden **nicht** als neue zentrale
ESS-0006-Runtime vorgeschrieben. Aktuelle Audit-, Risk-, EventMesh-, Traceability- und
Evidence-Mechanismen bleiben bei ihren bestehenden Authorities und Primary Ownern.

ESS-0006 darf vorhandene Audit-/Risk-/Traceability-Evidence konsumieren oder technische Evidence
erzeugen, aber weder eine zweite Append-only Audit Authority noch ein zweites Risk Register oder eine
zweite EventMesh-/Traceability-Plane einfuehren.

Security-Korrelation verwendet die vorhandene read-only EventMesh-/Traceability-Projektion fuer
`correlation_id`, State, Evidence und Handover. Die Projektion darf keine fehlende Security Evidence
erfinden, keinen Finding-Status autonom schliessen und keine Authority erzeugen.

---

## 8. Events und Integration

ESS-0006 verlangt keine eigene Event-Bus-Implementierung und keine feste Liste von
`Security*Event`-/`Compliance*Event`-Typen. Historische v1.0.0 Event-Listen sind keine
Implementierungsanforderung.

Wo Security- oder Compliance-Code Events publiziert oder konsumiert, gelten die aktuellen bestehenden
EventMesh-/Traceability-Contracts. Nicht implementierte historische Events duerfen nicht allein wegen
dieser ESS neu geschaffen werden.

Security-Events oder Evidence-Projektionen muessen, sofern ein bestehender Contract dies unterstuetzt,
die bestehende `correlation_id` fortfuehren statt eine parallele Security-Korrelations- oder
Orchestrierungsplane zu erzeugen. EventMesh bleibt read-only hinsichtlich Approval, Merge,
Deployment und Governance Authority.

Direkte Abhaengigkeiten oder Zusammenarbeit mit Supervisor, Platform Director, Version Manager,
Release Center oder Documentary Engine werden nur ueber die jeweils aktuellen Contracts/PVC-Owner-
Grenzen abgeleitet; ESS-0006 erzeugt keine separate Orchestrierungsbeziehung.

---

## 9. Nicht-Ziele und harte Grenzen

ESS-0006 autorisiert insbesondere **nicht**:

- eine zweite Compliance Requirement Registry;
- eine zentrale Security-/Compliance-Runtime oder einen zweiten Orchestrator;
- eine zweite IAM-, Policy-, Audit-, Risk-, Release-, Deployment-, Governance-, EventMesh- oder
  Traceability-Authority;
- eine gemeinsame Security/Compliance-Projekt-Ownership;
- fremde fachliche Produkt-/Business-Implementierung oder dauerhafte PVC-Ownership durch SEC;
- Security-Gate-Abschwaechung, Finding-Unterdrueckung oder niedrigere Audit-Thresholds;
- geschuetzte Production-, IAM-Admin-, Billing-/Money-, Entitlement-, Secret-, DNS-, Datenloeschungs-
  oder Resource-Mutationen ohne die separate zuständige Authority;
- automatische Compliance-, regulatorische oder Legal-Sufficiency-Aussagen;
- externe oder behoerdliche Zertifizierung aufgrund interner Scanner/Reports;
- Wiederbelebung der historischen ADR-0007 Compliance Value Chain.

Die bounded Security-Remediation aus `CTRL-SEC-BOUNDED-REMEDIATION-001` ist ausdruecklich **keine**
Ausnahme von diesen Grenzen.

---

## 10. P0/P1- und Dependency-Referenzfall

Ein bestaetigtes `CRITICAL`/`HIGH` Finding darf auf einem frischen Security-Branch unmittelbar bounded
remediert werden, wenn die technische Korrektur eindeutig ist, Domain-Semantik nicht erweitert wird,
keine geschuetzte externe Mutation erforderlich ist und die current-main-/Writer-Korrelation
konfliktfrei oder explizit sequenziert ist. PR-Creation-, Hosted-CI-, Human/CODEOWNER-Merge-, Release-
und Production-Gates bleiben unveraendert.

Vor Mutation und erneut vor PR-Readiness wird dieselbe Security-Korrelation gegen aktuellen `main`,
Branch-/PR-Head, offene Writer, affected Primary Owner/PVC und bestehende Security Controls erneuert.
Bewegt sich ein relevanter Head oder aendert sich eine Security-/Authority-Grenze, ist die vorherige
Korrelation stale und muss vor Fortsetzung neu gelesen werden.

Bei einer bestaetigten High/Critical npm-Schwachstelle darf Security insbesondere die tatsaechlich
betroffene Dependency und sichere Mindestversion bestimmen, `package.json`/`package-lock.json`
aktualisieren, Runtime-Haertung/Defense-in-Depth und Negative Tests ergaenzen sowie verfuegbare
`npm audit`-, TypeScript-, Unit-, Build- und Security-Checks ausfuehren. Der Fix wird nicht allein
deshalb blockiert, weil Manifest, Lockfile oder verwundbare Implementierung organisatorisch einem
produktiven Projektpfad zugeordnet sind.

Erfordert das Upgrade fachliche Semantik, eine neue fremde Architecture Authority oder geschuetzte
externe Mutation, endet die Delegation an dieser Grenze und der nicht trennbare Rest wird an den
zustaendigen Owner geroutet.

---

## 11. Success Criteria

ESS-0006 ist semantisch konsistent, wenn:

- dieselbe stabile ESS-Identitaet als bounded Komponentenspezifikation erhalten bleibt;
- `/AGENTS.md@CURRENT_MAIN` die einzige AI-/Development-Instruktionsquelle bleibt und ESS-0006 nur
  subject-matter Security-/Compliance-Grenzen beschreibt;
- `src/platform/Security` und `src/platform/Compliance` die einzigen von ESS-0006 direkt
  spezifizierten technischen Komponenten sind;
- Security Requirements/Testing/Verification bei `CAPITAL-AI-SEC` bleiben;
- `SECURITY_FOUNDATION_FIRST` als Security-Projektrichtung erhalten bleibt;
- reine bounded Security-Remediation nach `CTRL-SEC-BOUNDED-REMEDIATION-001` durch
  `CAPITAL-AI-SEC` implementierbar ist, auch in fremd platzierten Dateien;
- Security-Remediation, Primary Project/Owner/PVC, Before/After, Validation, Verification, Evidence und
  Handover ueber dieselbe `correlation_id` verbunden werden, ohne Authority zu uebertragen;
- diese Ausfuehrung keine fachliche Authority/PVC-Ownership uebertraegt und an Business-/Architecture-
  oder Protected-Mutation-Grenzen stoppt;
- `EVIDENCE_READY != VERIFIED` und Closure einen getrennten Re-Test/Evidence-Schritt erfordert;
- Compliance Requirements/Applicability/Assessment bei `CAPITAL-AI-COMP` bleiben;
- Compliance Requirements nur aus den kanonischen COMP-Surfaces bezogen werden;
- keine zweite Requirement Registry, Security-/Compliance-Runtime, IAM-/Audit-/Risk-/Release-/
  Deployment-/Governance-Plane oder EventMesh entsteht;
- interne Compliance-Evidence keine Zertifizierungs- oder Legal-Sufficiency-Behauptung erzeugt.

---

## Governance Statement

ESS-0006 v1.2.0 ersetzt innerhalb derselben ESS-Identitaet die v1.1.0-Einschraenkung, nach der
fremd platzierte produktive Security-Remediation grundsaetzlich beim Primary Owner verbleiben musste.
Die aktuelle Semantik ist eng: `CAPITAL-AI-SEC` darf nur bounded Security-primaere Repository-
Remediation nach `AUTH-GOV-AGENT-TRUST-ROOT` / `CTRL-SEC-BOUNDED-REMEDIATION-001` implementieren.
`AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` ist nur noch eine historische Identity-Alias in der
maschinenlesbaren Registry und keine eigenstaendige Security- oder Development-Authority.
Datei- oder PVC-Zuordnung allein ist kein DENY-Kriterium und erzeugt keinen Ownership-Transfer.

Die Korrelation zu `/AGENTS.md@CURRENT_MAIN` verbindet Scope-/Owner-/PVC-Aufloesung, bounded
Self-Healing, Branch-/PR-State, Validation, Evidence/EventMesh und Handover mit der Security-
Assurance-Kette. Sie veraendert weder die unabhaengige SEC-Verifikation noch Human/CODEOWNER-Merge-
oder geschuetzte External-Mutation-Gates.

Historische Texte/Evidence duerfen fuer Traceability erhalten bleiben, sind aber keine zusaetzliche
aktuelle Authority. Laufende Security-Verifikation und Compliance-Bewertung bleiben von der
Implementierung als getrennte Evidence-/Review-Schritte erhalten.

---

## Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Historical baseline | Initiale kombinierte Komponentenspezifikation mit heute stale Registry-/Audit-/Risk-/Event-/Collaboration-Annahmen |
| 1.1.0 | Revalidated | Bounded Security-/Compliance-Komponentengrenze; getrennte SEC/COMP-Assurance-Rollen; keine zweite Requirement Registry oder parallele Runtime |
| 1.2.0 | Revalidated 2026-09-16 | Delegated bounded Security-Remediation auch in fremd platzierten Repository-Dateien; keine PVC-/Domain-Ownership-Uebertragung; Verification bleibt getrennt; Korrelation auf `AUTH-GOV-AGENT-TRUST-ROOT`, `CTRL-SEC-BOUNDED-REMEDIATION-001`, `SECURITY_FOUNDATION_FIRST` und correlation-ID-basierte Evidence-/Handover-Projektion konsolidiert |

---

# End of Document

ESS-0006  
CAPITAL-AI Security & Compliance  
Version 1.2.0