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
6. Die frühere Vocabulary-Roadmap referenzierte `ESS-0012`, `ADR-0044` und `ADR-0045`; diese IDs waren bereits belegt und wurden deshalb als Vocabulary-Authority verworfen.
7. `ESS-0017-Vocabulary-Governance.md`, `ESS-0017-CONTRACTS` und `ADR-0046` sind auf dem Phase-1.5-Branch angelegt.
8. Die Vocabulary-Roadmap ist auf die eindeutigen Authorities `ESS-0017`, `ESS-0017-CONTRACTS` und `ADR-0046` umgestellt.

### Entscheidung für Phase 1.5

- `ESS-0012` bleibt unverändert **Documentation Governance**. Bestehende Dokumente, Contracts, Validatoren und Implementierungspfade werden nicht umnummeriert.
- Vocabulary Governance verwendet `ESS-0017`.
- Die zugehörigen Vocabulary Contracts verwenden `ESS-0017-CONTRACTS`; dieser Contract-Teil belegt analog zu bestehenden `*-CONTRACTS`-Dokumenten keine zusätzliche ESS-Nummer.
- `ADR-0046` definiert die Trennung der Documentation- und Vocabulary-Authorities sowie die Nummernraumkorrektur.
- Bis `ESS-0017` und `ESS-0017-CONTRACTS` in der kanonischen `.ai/registry/ess-registry.json` registriert sind, bleibt Phase 2 **BLOCKED** für Runtime-Implementierung und aktive Renames.
- Dokumentations- und Inventarisierungsarbeiten dürfen fortgeführt werden, sofern sie keine bestehende Authority semantisch überschreiben.

### Integrationsgrenzen

```text
ESS-0001-CONTRACTS
  -> ESS-0012 Documentation Governance
  -> ESS-0017 Vocabulary Governance
  -> Canonical Vocabulary Registry
  -> Documentary / Knowledge / Traceability
  -> Enterprise Event Mesh
  -> Quality / Security / Compliance
  -> Supervisor / Platform Director
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
- Keine parallele EventMesh-, Knowledge- oder Traceability-Infrastruktur.
- Legacy-Dokumente aus PR #142 sind keine kanonische Vocabulary-Quelle, bis ihre Aussagen gegen aktuellen Code und aktuelle Authorities revalidiert wurden.

### Exit-Kriterien Phase 1.5

- [x] PR #142 als Baseline verifiziert.
- [x] ESS-0012-Authority gegen Registry, Skill und Contracts verifiziert.
- [x] belegte ESS-IDs und freier Nummernraum verifiziert.
- [x] kollidierende ADR-0044/ADR-0045-Referenzen identifiziert.
- [x] ESS-0017 Vocabulary Governance angelegt.
- [x] ESS-0017-CONTRACTS angelegt.
- [x] ADR-0046 angelegt.
- [x] Roadmap auf ESS-0017 / ESS-0017-CONTRACTS / ADR-0046 aktualisiert.
- [ ] ESS-0017 und ESS-0017-CONTRACTS in `.ai/registry/ess-registry.json` registriert und `freeNumberSpaceStartsAt` auf den nächsten freien Wert gesetzt.
- [ ] Repository-weite Referenzprüfung bestätigt, dass keine Vocabulary-Authority mehr fälschlich ESS-0012, ADR-0044 oder ADR-0045 verwendet.

## English

### Purpose

Phase 1.5 establishes an unambiguous governance and namespace baseline before implementation of the Canonical Vocabulary Registry. It performs no active code renames and changes no runtime dependencies.

### Current decision

`ESS-0012` remains Documentation Governance. Vocabulary Governance is defined by `ESS-0017` with `ESS-0017-CONTRACTS`; `ADR-0046` records the authority and namespace decision. Runtime Phase 2 remains blocked until the canonical ESS Registry is updated and a repository-wide reference scan confirms that the superseded Vocabulary references are gone.

### Safety boundary

No imports, exports, APIs, schemas, environment keys, event names, or runtime identifiers are renamed during Phase 1.5. Legacy documentation classified by PR #142 is not a canonical terminology source without current code/authority revalidation.
