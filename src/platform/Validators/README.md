# Validators

## Enterprise Component

Status: Implemented Core Registry

Version: 1.1.0

Owner: CAPITAL-AI

---

## Purpose

`src/platform/Validators` stellt die zentrale, regelneutrale Validator Registry und die maschinenlesbare Chapter-12-Pflichtvalidator-Abdeckung fuer das Quality Center bereit.

Die Komponente besitzt **keine fachliche Rule-Authority**. Sie registriert vorhandene Validatoren und weist aus, welche der exakt 16 Pflichtvalidatoren aus ESS-0001-CONTRACTS Chapter 12 bereits durch autoritative Codepfade abgedeckt sind. Fachregeln verbleiben insbesondere in Governance/Documentary, EventMesh, Release sowie Security & Compliance.

## Implemented

- `ValidatorRegistry.ts` — deterministische Registrierung und Aufloesung je Repository-Quality-Domaene;
- Duplicate-Domain-DENY;
- kanonische Reihenfolge gemaess `REPOSITORY_QUALITY_REQUIRED_DOMAINS`;
- `MandatoryValidatorCatalog.ts` — exakter Katalog der 16 Chapter-12-Pflichtvalidatoren;
- Status je Pflichtvalidator: `AVAILABLE`, `PARTIAL` oder `NOT_AVAILABLE`;
- Source- und Authority-Referenzen je Binding;
- fehlende fachliche Evidence wird niemals zu PASS oder AVAILABLE hochgestuft.

## Chapter-12 Coverage Baseline

Der aktuelle Code-Stand weist deterministisch aus:

- **5 AVAILABLE** — Naming, Documentation, Version, Security, Compliance;
- **3 PARTIAL** — Repository Structure, Manifest, Event;
- **8 NOT_AVAILABLE** — fehlende dedizierte/reusable Runtime-Evidence fuer die verbleibenden Pflichtvalidatoren.

`PARTIAL` bedeutet ausdruecklich nicht bestanden. Es bedeutet nur, dass bereits relevante autoritative Teil-Evidence existiert, aber noch kein vollstaendiger Pflichtvalidator-Vertrag erfuellt ist.

## ESS Reference

- ESS-0001
- ESS-0001-CONTRACTS Chapter 12
- ESS-0005 — Quality Center
- ESS-0006 — Security & Compliance
- ESS-0013 — Enterprise Event Mesh

## Dependencies

- `src/platform/Governance/Contracts/RepositoryQualityEvidence.ts`

## Authority Boundary

Die Registry und der Pflichtvalidator-Katalog duerfen weder Regeln, Severity-Stufen oder Schwellwerte definieren noch Merge, Release, Deployment oder Produktionsmutationen autorisieren. Neue fachliche Validator-Implementierungen werden nur in der jeweils zustaendigen Authority oder als duenne Adapter darauf angebunden.
