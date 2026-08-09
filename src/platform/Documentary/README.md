# Documentary

## Enterprise Component

Status: Partial Implementation

Version: 1.1.0

Owner: CAPITAL-AI

---

## Purpose

`manifest.json` beschreibt weiterhin die Zielarchitektur der Documentary Engine gemäß ESS-0010. Die vollständige Engine ist noch nicht implementiert.

Seit Phase 4 existiert jedoch ein erster ausführbarer Integrationskern: ein Bilingual-Contract-/Projection-Layer, der deutsche und englische Dokumentationsansichten aus derselben freigegebenen `VocabularyConcept.id` ableitet.

---

## Implemented Scope

- `Contracts/BilingualDocumentReference.ts`
- `Documentation/BilingualDocumentaryProjection.ts`
- Contract-Tests unter `tests/unit/bilingualDocumentaryProjection.test.ts`
- DE und EN teilen dieselbe Concept-ID und denselben `canonicalCodeTerm`
- ESS-/ADR-/Traceability-Referenzen bleiben sprachneutral identisch
- unbekannte, nicht freigegebene oder unvollständig übersetzte Concepts werden fail-closed abgewiesen

Dieser Scope implementiert nicht die vollständige Documentary Engine.

---

## ESS Reference

ESS-0001

ESS-0001-CONTRACTS

ESS-0010 — Documentary Engine

ESS-0012 — Documentation Governance

ESS-0017 / ESS-0017-CONTRACTS — Vocabulary Governance

---

## ADR References

ADR-0046 — Vocabulary Governance Authority and Namespace

---

## Dependencies

Der implementierte Bilingual-Layer hängt ausschließlich von der öffentlichen Vocabulary-Registry-Schnittstelle und dem `VocabularyConcept`-Contract ab.

Keine Abhängigkeit auf Supervisor, Platform Director, Version Manager, EventMesh Runtime oder produktive Datenquellen.

---

## Events

Phase 4 führt keine neuen Events ein. Fehlende Übersetzungen werden noch nicht als Events publiziert; diese Integration ist Bestandteil der nachfolgenden Event-Driven-Value-Chain-Phase.

Die bereits reservierten Documentary-Event-Namen bleiben unverändert und werden durch diesen Layer nicht ausgelöst.

---

## Notes

ARCH-AUDIT-0002 (J5, 2026-08-02) hatte die Documentary-Komponente korrekt als nicht implementiert markiert. Phase 4 ändert diesen Zustand auf `Partial Implementation`, ohne eine vollständige Engine vorzutäuschen.
