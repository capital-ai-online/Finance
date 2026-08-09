# CAPITAL-AI Vocabulary Governance — Phase 1.5 Baseline

Status: Completed  
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
5. `ESS-0013`, `ESS-0014`, `ESS-0015` und `ESS-0016` sind anderweitig belegt.
6. Die frühere Vocabulary-Roadmap referenzierte `ESS-0012`, `ADR-0044` und `ADR-0045` als Vocabulary-Authorities; diese Zuordnung wurde verworfen, weil die IDs bereits belegt sind.
7. `ESS-0017-Vocabulary-Governance.md`, `ESS-0017-CONTRACTS` und `ADR-0046` sind angelegt.
8. Die Vocabulary-Roadmap ist auf die eindeutigen Authorities `ESS-0017`, `ESS-0017-CONTRACTS` und `ADR-0046` umgestellt.
9. Die ESS Registry führt `ESS-0017` und `ESS-0017-CONTRACTS` und setzt den nächsten freien Nummernraum auf `ESS-0018`.
10. Die Cross-Reference-Prüfung unterscheidet zwischen zulässiger Abhängigkeit zu `ESS-0012` (Documentation Governance) und unzulässiger Verwendung von `ESS-0012` als Vocabulary-Authority.

### Entscheidung für Phase 1.5

- `ESS-0012` bleibt unverändert **Documentation Governance**.
- Vocabulary Governance verwendet `ESS-0017`.
- Die zugehörigen Vocabulary Contracts verwenden `ESS-0017-CONTRACTS`; dieser Contract-Teil belegt keine zusätzliche ESS-Nummer.
- `ADR-0046` definiert die Trennung der Documentation- und Vocabulary-Authorities sowie die Nummernraumkorrektur.
- `ESS-0012`/`ESS-0012-CONTRACTS` dürfen im Vocabulary-Scope nur als Documentation-Governance-Abhängigkeit oder Related Authority referenziert werden.
- `ADR-0044` und `ADR-0045` dürfen nicht als Vocabulary-Entscheidungen verwendet werden; historische Hinweise auf die frühere Fehlzuordnung bleiben als Korrektur-Evidence zulässig.
- Phase 2 darf nach Merge dieser Phase auf der eindeutigen Authority-Baseline beginnen.

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

### Cross-Reference-Prüfung

Geprüft wurden die Phase-1.5-Dokumente, die Registry und repository-weite Suchtreffer für die früher kollidierenden IDs.

Ergebnis:

- `ESS-0017` ist die einzige neue Vocabulary-ESS im Phase-1.5-Scope.
- `ESS-0017-CONTRACTS` ist eindeutig `ESS-0017` zugeordnet.
- `ESS-0012` bleibt Documentation Governance und wird in ESS-0017 ausschließlich als Abhängigkeit/Related Authority referenziert.
- Für `ADR-0044 + Vocabulary` und `ADR-0045 + Vocabulary` bestehen keine aktiven repository-weiten Treffer als Vocabulary-Authority.
- Vorkommen von `ADR-0044`, `ADR-0045` oder der früheren `ESS-0012`-Vocabulary-Zuordnung innerhalb ADR-0046, Roadmap und Baseline sind ausschließlich historische Korrekturhinweise.
- Die Phase-1.5-Diffs führen keine alternative Vocabulary-Authority ein.

### Schutzregeln

- Code bleibt Englisch.
- Enterprise-Dokumentation wird Deutsch und Englisch geführt.
- Menschlich sichtbare Pull-Request-Informationen bleiben Deutsch.
- Kein aktiver Rename ohne Safe Rename Gate.
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
- [x] ESS-0017 und ESS-0017-CONTRACTS in `.ai/registry/ess-registry.json` registriert; nächster freier Nummernraum `ESS-0018`.
- [x] Cross-Reference-Prüfung bestätigt eine eindeutige Vocabulary-Authority unter ESS-0017/ADR-0046.

## English

### Purpose

Phase 1.5 establishes an unambiguous governance and namespace baseline before implementation of the Canonical Vocabulary Registry. It performs no active code renames and changes no runtime dependencies.

### Completed decision

`ESS-0012` remains Documentation Governance. Vocabulary Governance is defined by `ESS-0017` with `ESS-0017-CONTRACTS`; `ADR-0046` records the authority and namespace decision. The ESS Registry now allocates ESS-0017 to Vocabulary Governance and advances the next free number to ESS-0018.

Cross-reference validation confirms that ESS-0012 references in Vocabulary artifacts are dependency references to Documentation Governance, not Vocabulary authority assignments. ADR-0044 and ADR-0045 are not used as active Vocabulary decisions.

### Safety boundary

No imports, exports, APIs, schemas, environment keys, event names, or runtime identifiers are renamed during Phase 1.5. Legacy documentation classified by PR #142 is not a canonical terminology source without current code/authority revalidation.
