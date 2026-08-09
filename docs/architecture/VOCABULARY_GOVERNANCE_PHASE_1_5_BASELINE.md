# CAPITAL-AI Vocabulary Governance — Phase 1.5 Baseline

Status: In Progress  
Datum / Date: 2026-08-09  
Authority: ESS-0001-CONTRACTS  
Scope: ESS namespace reconciliation and documentation baseline before Phase 2

## Deutsch

### Zweck

Phase 1.5 stellt vor der Implementierung der Canonical Vocabulary Registry einen eindeutigen Governance- und Nummernraumzustand her. Diese Phase nimmt keine aktiven Code-Renames vor und verändert keine Runtime-Abhängigkeiten.

### Verifizierter Ist-Zustand

1. PR #142 ist in `main` gemerged und die Legacy-Dokumentationsklassifizierung ist damit Teil der aktuellen Baseline.
2. Die verbindliche `.ai/registry/ess-registry.json` führt `ESS-0012` eindeutig als **Documentation Governance** und `ESS-0012-CONTRACTS` als zugehörigen Contract-Teil.
3. `.ai/skills/ESS-0012-Documentation-Governance.md` deklariert `skill.id: ESS-0012` und `ownContracts: ESS-0012-CONTRACTS`.
4. `.ai/skills/ESS-0012-Contracts.md` definiert ausschließlich Documentation Governance Contracts.
5. `ESS-0013`, `ESS-0014`, `ESS-0015` und `ESS-0016` sind bereits anderweitig belegt. Die Registry weist den freien Nummernraum ab `ESS-0017` aus.
6. Die Vocabulary-Roadmap referenziert derzeit `ESS-0012`, `ADR-0044` und `ADR-0045` für Vocabulary Governance. Diese Referenzen sind nicht verwendbar: `ESS-0012` gehört bereits Documentation Governance; ADR-0044 und ADR-0045 sind bereits anderen Architekturentscheidungen zugeordnet.
7. Im aktuellen Repository wurde keine eigenständige veröffentlichte Vocabulary-/Terminology-ESS gefunden. Phase 2 ist daher noch nicht durch eine eindeutige Vocabulary-ESS autorisiert.

### Entscheidung für Phase 1.5

- `ESS-0012` bleibt unverändert **Documentation Governance**. Bestehende Dokumente, Contracts, Validatoren und Implementierungspfade werden nicht umnummeriert.
- Vocabulary Governance erhält die nächste freie ESS-ID `ESS-0017`.
- Die zugehörigen Vocabulary Contracts erhalten `ESS-0017-CONTRACTS`; dieser Contract-Teil belegt analog zu bestehenden `*-CONTRACTS`-Dokumenten keine zusätzliche ESS-Nummer.
- Die Architekturentscheidungen für Vocabulary Governance dürfen nicht `ADR-0044` oder `ADR-0045` verwenden. Die nächste freie ADR-ID ist vor Anlage erneut gegen `main` zu validieren; zum Zeitpunkt dieser Baseline ist `ADR-0046` nicht belegt.
- Bis `ESS-0017` und der zugehörige ADR formal angelegt und registriert sind, bleibt Phase 2 **BLOCKED** für Runtime-Implementierung und aktive Renames.
- Dokumentations- und Inventarisierungsarbeiten dürfen fortgeführt werden, sofern sie keine bestehende Authority semantisch überschreiben.

### Integrationsgrenzen

Die Authority-Kette lautet künftig:

```text
ESS-0001-CONTRACTS
  -> ESS-0012 Documentation Governance
  -> ESS-0017 Vocabulary Governance
  -> Canonical Vocabulary Registry
  -> Documentary / Knowledge / Traceability
  -> Event Mesh
  -> Quality / Security / Compliance
  -> Version Manager / Release
```

`ESS-0012` validiert Dokumentations-Governance. `ESS-0017` definiert Terminologie, Naming und Vocabulary-spezifische Regeln. Globale Enterprise Contracts verbleiben in `ESS-0001-CONTRACTS`.

### Schutzregeln

- Code bleibt Englisch.
- Enterprise-Dokumentation wird Deutsch und Englisch geführt.
- Menschlich sichtbare Pull-Request-Informationen bleiben Deutsch.
- Kein aktiver Rename ohne späteren Safe Rename Gate.
- Keine Änderung von Import-/Export-Namen, API-Routen, Schemas, Environment Keys oder Event-Namen in Phase 1.5.
- Keine Big-Bang-Migration.
- Legacy-Dokumente aus PR #142 sind keine kanonische Vocabulary-Quelle, bis ihre Aussagen gegen aktuellen Code und aktuelle Authorities revalidiert wurden.

### Exit-Kriterien Phase 1.5

Phase 1.5 ist abgeschlossen, wenn:

- [x] PR #142 als Baseline verifiziert ist.
- [x] ESS-0012-Authority gegen Registry, Skill und Contracts verifiziert ist.
- [x] belegte ESS-IDs und freier Nummernraum verifiziert sind.
- [x] kollidierende ADR-0044/ADR-0045-Referenzen identifiziert sind.
- [ ] ESS-0017 Vocabulary Governance angelegt und in der ESS Registry registriert ist.
- [ ] ESS-0017-CONTRACTS angelegt ist.
- [ ] Vocabulary-ADR unter einer freien ADR-ID angelegt ist.
- [ ] Roadmap und Cross-References auf ESS-0017 und den neuen ADR aktualisiert sind.
- [ ] Repository-Suche bestätigt, dass keine Vocabulary-Authority mehr fälschlich ESS-0012, ADR-0044 oder ADR-0045 verwendet.

## English

### Purpose

Phase 1.5 establishes an unambiguous governance and namespace baseline before implementation of the Canonical Vocabulary Registry. It performs no active code renames and changes no runtime dependencies.

### Decision

`ESS-0012` remains Documentation Governance. Vocabulary Governance receives the next free identifier, `ESS-0017`, with `ESS-0017-CONTRACTS` as its scoped contract document. Existing ADR-0044 and ADR-0045 identifiers cannot be reused for Vocabulary Governance. Phase 2 runtime implementation remains blocked until the new Vocabulary authority and ADR are registered and all roadmap cross-references are reconciled.

### Safety boundary

No imports, exports, APIs, schemas, environment keys, event names, or runtime identifiers are renamed during Phase 1.5. Legacy documentation classified by PR #142 is not a canonical terminology source without current code/authority revalidation.
