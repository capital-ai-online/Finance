# Validators

## Enterprise Component

Status: Implemented Core Registry

Version: 1.0.0

Owner: CAPITAL-AI

---

## Purpose

`src/platform/Validators` stellt die zentrale, regelneutrale Validator Registry fuer das Quality Center bereit.

Die Registry besitzt **keine fachliche Rule-Authority**. Sie registriert und loest Validatoren nach Quality-Domaene auf. Fachregeln verbleiben in den jeweils zustaendigen Komponenten, insbesondere Governance/Documentary, Vocabulary, Release sowie Security & Compliance.

## Implemented

- `ValidatorRegistry.ts`
- deterministische Registrierung und Aufloesung je Quality-Domaene
- Duplicate-Domain-DENY
- kanonische Reihenfolge gemaess `REPOSITORY_QUALITY_REQUIRED_DOMAINS`
- Composition vorhandener Domain-Validatoren ohne Regelduplikation

Die derzeitige Registry-Abdeckung ist eine operative Teilmenge der in ESS-0001-CONTRACTS Chapter 12 vorgesehenen Pflichtvalidatoren. Nicht vorhandene Validator-Evidence darf nicht als PASS interpretiert werden.

## ESS Reference

- ESS-0001
- ESS-0001-CONTRACTS Chapter 12
- ESS-0005 — Quality Center
- ESS-0006 — Security & Compliance

## Dependencies

- `src/platform/Governance/Contracts/RepositoryQualityEvidence.ts`

## Authority Boundary

Die Registry darf weder Regeln, Severity-Stufen oder Schwellwerte definieren noch Merge, Release, Deployment oder Produktionsmutationen autorisieren.
