---
skill:
  id: ESS-0012
  name: Enterprise Vocabulary & Terminology Governance
  version: 1.0.0
  status: Proposed
  owner: Platform Director
  category: Enterprise Governance
  priority: High

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  lifecycle: AI Native Development Lifecycle

classification:
  type: Component Specification
  contractAuthority: ESS-0001-CONTRACTS

references:
  - ESS-0001-CONTRACTS
  - ESS-0003
  - ESS-0009
  - ESS-0010
  - ESS-0011
  - ADR-0044
  - ADR-0045
---

# ESS-0012 — Enterprise Vocabulary & Terminology Governance

## Deutsch

### Zweck
ESS-0012 definiert die komponentenspezifische Governance für kanonische Begriffe, Naming Conventions, zweisprachige Dokumentation und die ereignisbasierte Weitergabe von Terminologieänderungen innerhalb der CAPITAL-AI Wertschöpfungskette. ESS-0001-CONTRACTS bleibt die übergeordnete Contract Authority.

### Verbindliche Regeln
- Produktiver Code, technische Identifier, Komponenten, Services, Typen, Interfaces, API-Felder, Events, Branch-Namen und Dateinamen werden in Englisch geführt.
- Enterprise-Dokumentation wird in Deutsch und Englisch bereitgestellt. Technische IDs, ADR-/ESS-Nummern und maschinenlesbare Schlüssel bleiben sprachneutral.
- Benutzerseitige Pull-Request-Informationen werden in deutscher Sprache geführt. Maschinenlesbare Marker, Platzhalter und stabile Schlüssel dürfen Englisch bleiben.
- Jeder kanonische Begriff besitzt eine eindeutige ID, englische Code-Bezeichnung, deutsche und englische Anzeigeform, Definition, zulässige Aliase, verbotene Varianten, Status und Traceability-Referenzen.
- Neue oder geänderte Begriffe erzeugen ein Domain Event und aktualisieren Knowledge, Documentary und Traceability.
- Renames im aktiven Code sind ohne vorangehende Impact-Analyse unzulässig.

### Safe-Rename Contract
Vor einem aktiven Rename sind mindestens zu prüfen:
1. statische Referenzen und Import-/Export-Graph,
2. dynamische Imports und Lazy Loading,
3. Route-, API- und Schema-Verwendungen,
4. Konfigurationen und Environment-Referenzen,
5. Regex- und Naming-Validatoren,
6. Dateisystem-Casing und Linux-Deploy-Kompatibilität,
7. TypeScript-/Lint-Prüfung,
8. Tests,
9. Production Build,
10. Deployment-Readiness.

Das Ergebnis wird als SAFE, CONDITIONAL oder BLOCKED klassifiziert. Nur SAFE darf autonom zur Implementierung vorbereitet werden. CONDITIONAL und BLOCKED erzeugen Evidence und benötigen eine explizite Entscheidung.

### Event Contract
Mindestens folgende Ereignisse sind vorgesehen:
- terminology.change.proposed
- terminology.change.approved
- terminology.updated
- component.rename.proposed
- component.rename.validated
- documentation.translation.required
- documentation.updated
- traceability.updated
- governance.validation.completed

### Integration
ESS-0012 arbeitet mit Platform Director, Supervisor, Enterprise Knowledge Platform, Documentary Engine, Traceability, Quality, Security, Compliance, Version Manager und Release Center zusammen. Die Verarbeitung darf autonom erfolgen; bestehende Human-Approval-Gates für Architektur, Security, geschützte Änderungen, PR-Erstellung und Release werden nicht umgangen.

## English

### Purpose
ESS-0012 defines component-level governance for canonical terminology, naming conventions, bilingual documentation, and event-driven propagation of terminology changes across the CAPITAL-AI value chain. ESS-0001-CONTRACTS remains the governing contract authority.

### Mandatory rules
- Production code, technical identifiers, components, services, types, interfaces, API fields, events, branch names, and file names use English.
- Enterprise documentation is provided in German and English. Technical IDs, ADR/ESS numbers, and machine-readable keys remain language-neutral.
- Human-facing pull request information is written in German. Machine-readable markers, placeholders, and stable keys may remain English.
- Every canonical concept has a stable ID, English code term, German and English display names, definition, allowed aliases, forbidden variants, lifecycle status, and traceability references.
- New or changed terminology emits a domain event and updates Knowledge, Documentary, and Traceability.
- Active-code renames are prohibited without prior impact analysis.

### Safe rename contract
Before an active rename, the system must inspect static references and dependencies, dynamic imports, routes/APIs/schemas, configuration and environment references, regex and naming validators, filesystem casing, type checking, tests, production build, and deployment readiness.

The result is classified as SAFE, CONDITIONAL, or BLOCKED. Only SAFE changes may be prepared autonomously for implementation. CONDITIONAL and BLOCKED changes produce evidence and require an explicit decision.

### Event integration
Vocabulary governance participates in the platform event lifecycle and integrates with Platform Director, Supervisor, Knowledge, Documentary, Traceability, Quality, Security, Compliance, Version Manager, and Release Center. Automation must never bypass human approval boundaries defined by higher-level contracts or ADRs.
