---
skill:
  id: ESS-0006
  name: Security & Compliance
  version: 1.1.0
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
    src/platform/Security und src/platform/Compliance. Es erzeugt weder globale
    Security-/Compliance-Regeln noch eine zweite Compliance Requirement Registry,
    Audit-/Risk-Authority, Security-/Compliance-Runtime oder Projekt-Ownership.

authority:
  componentResponsibilities:
    - reusable Security implementation boundary
    - Security-specific adapters and enforcement helpers
    - repository-based Compliance scanner and evidence backend
    - internal Compliance reporting and evidence persistence
  cannot_modify:
    - Enterprise Specifications ausserhalb des eigenen ESS-Lebenszyklus
    - Architecture Decision Records
    - Enterprise Contracts
    - Governance Control Plane oder kanonische Registries ausserhalb ihrer Owner-Grenzen
    - IAM Regeln oder Berechtigungen ohne die jeweils zustaendige Authority
    - Legal Applicability, Zertifizierungsstatus oder Accepted Risk
    - produktive PVC-Ownership fremder Projekte

crossReference:
  dependsOn:
    - ESS-0001
    - ESS-0001-CONTRACTS
  relatedEss:
    - ESS-0005
    - ESS-0011
    - ESS-0012
    - ESS-0013
  relatedAdr:
    - ADR-0007
    - ADR-0012
    - ADR-0016
    - ADR-0096
  relatedComponents:
    - src/platform/Security
    - src/platform/Compliance
  relatedProjectSurfaces:
    - docs/projects/security/README.md
    - docs/projects/compliance/README.md
    - docs/compliance/CAPITAL-AI-COMP/

created: 2026-07-31
revalidated: 2026-09-05
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
Contracts, ADRs, Controls und dem Trust Root. ESS-0006 beschreibt nur die technische
Komponentengrenze und deren zulässige Evidence-Beziehung.

ADR-0007 ist in der kanonischen ADR Registry als `historical` / non-authorizing registriert. Seine
legacy Compliance Value Chain darf deshalb weder durch ESS-0006 noch durch Implementierungsdetails
reaktiviert werden.

---

## 2. Projekt- und Ownership-Grenzen

### CAPITAL-AI-SEC

`CAPITAL-AI-SEC` ist cross-cutting Security Requirements-, Findings-, Testing- und unabhängiger
Verification-Owner. Es besitzt keinen produktiven `PVC-*`-Stage allein aufgrund dieser Rolle.
Produktive Remediation bleibt beim Primary Owner des betroffenen PVC, ausser die Aenderung betrifft
inhärent wiederverwendbare Security-Infrastruktur innerhalb von `src/platform/Security`.

### CAPITAL-AI-COMP

`CAPITAL-AI-COMP` ist cross-cutting Owner fuer Applicability, Requirements Inventory,
Requirement/Control Mapping, evidence-basierte Compliance-Bewertung, Findings, regulatorische
Traceability, Remediation-Handoff und Legal-Review-Handoff. Es besitzt keinen produktiven
`PVC-*`-Stage allein aufgrund dieser Rolle.

Produktive Remediation bleibt beim Primary Owner des betroffenen PVC. Legal Applicability,
regulatorischer Status, Zertifizierung oder Accepted Risk werden nicht durch ESS-0006 entschieden.

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

## 4. Security-Komponente

`src/platform/Security` ist die bestehende wiederverwendbare technische Security-Grenze. Der aktuelle
Bestand umfasst insbesondere Security-/IAM-Helper und Adapter wie Auth-Middleware, native MFA/AAL,
Rate Limiting, Secret-Kryptographie und TOTP dort, wo aktuelle Contracts dies noch vorsehen.

ESS-0006 erzeugt **keine** zweite IAM-Authority, keinen neuen Secret Store, kein zentrales
Security-Orchestrator-System und keinen produktiven PVC-Owner.

Security-spezifische Anforderungen, Tests, Findings und unabhängige Verifikation bleiben bei
`CAPITAL-AI-SEC`; die konkrete produktive Behebung wird zum betroffenen Primary Owner geroutet.

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
Security requirement / test / finding
        -> Security evidence
        -> unabhängige Security verification

Compliance requirement / applicability
        -> Control-/Owner-Mapping
        -> Evidence aus Security, Runtime, Tests, Docs oder anderen Primary Ownern
        -> unabhängige Compliance assessment
```

Daraus folgen vier Invarianten:

1. Security Evidence ist Input fuer Compliance Assessment, aber kein automatischer Compliance-PASS.
2. Compliance Assessment ersetzt keine unabhängige Security Verification.
3. Fehlende oder stale Evidence darf weder von Security noch Compliance stillschweigend als PASS
   behandelt werden.
4. Ein Finding erzeugt keine Ownership-Uebernahme; technische Remediation bleibt beim betroffenen
   Primary Owner.

---

## 7. Audit, Risk und Traceability

Die v1.0.0-Komponentenbegriffe `AuditTrail` und `RiskRegister` werden **nicht** als neue zentrale
ESS-0006-Runtime vorgeschrieben. Aktuelle Audit-, Risk-, EventMesh-, Traceability- und
Evidence-Mechanismen bleiben bei ihren bestehenden Authorities und Primary Ownern.

ESS-0006 darf vorhandene Audit-/Risk-/Traceability-Evidence konsumieren oder technische Evidence
erzeugen, aber weder eine zweite Append-only Audit Authority noch ein zweites Risk Register oder eine
zweite EventMesh-/Traceability-Plane einfuehren.

---

## 8. Events und Integration

ESS-0006 verlangt keine eigene Event-Bus-Implementierung und keine feste Liste von
`Security*Event`-/`Compliance*Event`-Typen. Historische v1.0.0 Event-Listen sind keine
Implementierungsanforderung.

Wo Security- oder Compliance-Code Events publiziert oder konsumiert, gelten die aktuellen bestehenden
EventMesh-/Traceability-Contracts. Nicht implementierte historische Events duerfen nicht allein wegen
dieser ESS neu geschaffen werden.

Direkte Abhaengigkeiten oder Zusammenarbeit mit Supervisor, Platform Director, Version Manager,
Release Center oder Documentary Engine werden nur ueber die jeweils aktuellen Contracts/PVC-Owner-
Grenzen abgeleitet; ESS-0006 erzeugt keine separate Orchestrierungsbeziehung.

---

## 9. Nicht-Ziele

ESS-0006 autorisiert insbesondere **nicht**:

- eine zweite Compliance Requirement Registry;
- eine zentrale Security-/Compliance-Runtime oder einen zweiten Orchestrator;
- eine zweite IAM-, Audit-, Risk-, EventMesh- oder Traceability-Authority;
- eine gemeinsame Security/Compliance-Projekt-Ownership;
- fremde produktive PVC-Implementierung durch GOV, SEC oder COMP;
- automatische Compliance-, regulatorische oder Legal-Sufficiency-Aussagen;
- externe oder behoerdliche Zertifizierung aufgrund interner Scanner/Reports;
- Wiederbelebung der historischen ADR-0007 Compliance Value Chain.

---

## 10. Success Criteria

ESS-0006 ist semantisch konsistent, wenn:

- dieselbe stabile ESS-Identitaet als bounded Komponentenspezifikation erhalten bleibt;
- `src/platform/Security` und `src/platform/Compliance` die einzigen von ESS-0006 direkt
  spezifizierten technischen Komponenten sind;
- Security Requirements/Testing/Verification bei `CAPITAL-AI-SEC` bleiben;
- Compliance Requirements/Applicability/Assessment bei `CAPITAL-AI-COMP` bleiben;
- Compliance Requirements nur aus den kanonischen COMP-Surfaces bezogen werden;
- keine zweite Requirement Registry, Security-/Compliance-Runtime, Audit-/Risk-Plane oder
  EventMesh entsteht;
- interne Compliance-Evidence keine Zertifizierungs- oder Legal-Sufficiency-Behauptung erzeugt;
- produktive Remediation beim jeweils betroffenen Primary Owner verbleibt.

---

## Governance Statement

ESS-0006 v1.1.0 ersetzt innerhalb derselben ESS-Identitaet die stale Komponenten-, Registry-,
Event- und Collaboration-Annahmen von v1.0.0. Historische Texte/Evidence duerfen fuer Traceability
erhalten bleiben, sind aber keine zusaetzliche aktuelle Authority.

Aenderungen an der Architecture-/Authority-Grenze erfordern die nach aktueller Governance dafuer
zustaendige ADR-/ESS-Entscheidung. Laufende Security-Verifikation und Compliance-Bewertung bleiben
unabhaengig von Governance-Selbsteinschaetzung.

---

## Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Historical baseline | Initiale kombinierte Komponentenspezifikation mit heute stale Registry-/Audit-/Risk-/Event-/Collaboration-Annahmen |
| 1.1.0 | Revalidated | Bounded Security-/Compliance-Komponentengrenze; getrennte SEC/COMP-Assurance-Rollen; keine zweite Requirement Registry oder parallele Runtime |

---

# End of Document

ESS-0006  
CAPITAL-AI Security & Compliance  
Version 1.1.0
