# Documentary

## Enterprise Component

Status: Partial Implementation

Version: 1.1.0

Component Version Authority: `manifest.json#version`

Document Schema Version Authority: `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`

Platform Version Authority: repository `package.json#version` via the existing Version Manager / release-governance contract

Owner: CAPITAL-AI

---

## Purpose

`manifest.json` beschreibt weiterhin die Zielarchitektur der Documentary Engine gemäß ESS-0010. Die vollständige Engine ist noch nicht implementiert.

Seit Phase 4 existiert ein erster ausführbarer Integrationskern: ein Bilingual-Contract-/Projection-Layer, der deutsche und englische Dokumentationsansichten aus derselben freigegebenen `VocabularyConcept.id` ableitet.

D0 ergänzt eine belastbare Implementierungsbaseline und trennt drei verschiedene Versionsdimensionen ausdrücklich voneinander. Dadurch wird verhindert, dass Component-Version, Document-Schema-Version und Plattform-/Release-Version semantisch vermischt oder unabhängig in README, Manifest und generierten Dokumenten gepflegt werden.

---

## Implemented Scope

- `Contracts/BilingualDocumentReference.ts`
- `Documentation/BilingualDocumentaryProjection.ts`
- `Versioning/DocumentaryVersion.ts`
- `Architecture/documentary-baseline.json`
- Contract-Tests unter `tests/unit/bilingualDocumentaryProjection.test.ts`
- D0-Versionierungs-/Baseline-Tests unter `tests/unit/documentaryVersionAuthority.test.ts`
- DE und EN teilen dieselbe Concept-ID und denselben `canonicalCodeTerm`
- ESS-/ADR-/Traceability-Referenzen bleiben sprachneutral identisch
- unbekannte, nicht freigegebene oder unvollständig übersetzte Concepts werden fail-closed abgewiesen

Dieser Scope implementiert nicht die vollständige Documentary Engine.

---

## Version Model

### Component Version

Die Documentary-Komponentenversion beschreibt die Version der Documentary-Komponente selbst. Ihre einzige lokale Authority ist `src/platform/Documentary/manifest.json#version`.

### Document Schema Version

Die Document-Schema-Version beschreibt ausschließlich die Struktur zukünftiger Documentary Document Models. Sie wird unabhängig von Component- und Platform-Version in `DOCUMENTARY_DOCUMENT_SCHEMA_VERSION` geführt. Ein Component-Release muss daher nicht automatisch einen Breaking Schema Change bedeuten.

### Platform Version

Die Plattformversion bleibt Bestandteil der bestehenden zentralen Release-Governance. Repository-Authority ist `package.json#version`; Documentary liest diese Version read-only und erzeugt keine eigene Plattformversionsquelle.

---

## Implementation Baseline

`Architecture/documentary-baseline.json` trennt implementierte und geplante Bereiche. Das Vorhandensein eines Verzeichnisses allein darf nicht als Implementierungsnachweis gelten.

Aktuell implementiert:

- `Contracts`
- `Documentation`
- `Versioning`

Weiterhin geplant bzw. nicht als Runtime implementiert:

- `Architecture` (abgesehen von Baseline-/Architekturmetadaten)
- `Discovery`
- `Engine`
- `Events`
- `Generators`
- `Governance`
- `Interfaces`
- `Knowledge`
- `Mermaid`
- `Migration`
- `Models`
- `Plugins`

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

Der implementierte Bilingual-Layer hängt von der öffentlichen Vocabulary-Registry-Schnittstelle und dem `VocabularyConcept`-Contract ab.

D0 ergänzt die semantische Abhängigkeit auf die bestehende Version-Manager-/Release-Governance. Die Plattformversion wird dabei nicht im Documentary-Modul dupliziert, sondern aus der vorhandenen Repository-Version-Authority gelesen.

Keine Abhängigkeit auf Supervisor, Platform Director, EventMesh Runtime oder produktive Datenquellen wird durch D0 eingeführt.

---

## Events

D0 führt keine neuen Events ein. Documentary-Event-Integration folgt in der Event-Driven-Value-Chain-Roadmap über den bestehenden Enterprise Event Mesh.

Die bereits reservierten Documentary-Event-Namen bleiben unverändert und werden durch D0 nicht ausgelöst.

---

## Notes

ARCH-AUDIT-0002 (J5, 2026-08-02) hatte die Documentary-Komponente korrekt als nicht implementiert markiert. Phase 4 änderte diesen Zustand auf `Partial Implementation`; D0 macht diesen Teilzustand jetzt maschinenlesbar und versionierbar, ohne eine vollständige Engine vorzutäuschen.
