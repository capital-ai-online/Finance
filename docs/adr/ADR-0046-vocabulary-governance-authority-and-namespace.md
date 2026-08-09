# ADR-0046 — Vocabulary Governance Authority and Namespace

Status: Proposed  
Date: 2026-08-09  
Decision Owner: Platform Director  
Authority: ESS-0001-CONTRACTS

## Kontext / Context

Die Vocabulary-Governance-Roadmap referenzierte `ESS-0012`, `ADR-0044` und `ADR-0045` ursprünglich als eigene Vocabulary-Authorities. Der aktuelle Repository-Zustand zeigt jedoch:

- `ESS-0012` ist verbindlich als Documentation Governance registriert und implementiert;
- `ADR-0044` ist bereits Production Runtime Artifact Immutability;
- `ADR-0045` ist bereits Stripe Event Ownership / Durable Inbox;
- `ESS-0013` bis `ESS-0016` sind ebenfalls belegt;
- die ESS Registry wies vor dieser Entscheidung den freien Nummernraum ab `ESS-0017` aus.

Eine Wiederverwendung dieser IDs würde die Traceability, Registry-Auflösung und maschinelle Governance mehrdeutig machen.

## Entscheidung / Decision

1. `ESS-0012` bleibt dauerhaft Documentation Governance.
2. Vocabulary Governance wird als eigenständige Enterprise Specification unter `ESS-0017` geführt.
3. Vocabulary-spezifische Contracts werden unter `ESS-0017-CONTRACTS` geführt und besitzen ausschließlich Vocabulary-Geltung. Globale Naming- und Repository-Regeln verbleiben in `ESS-0001-CONTRACTS`.
4. Dieser ADR (`ADR-0046`) ist die Architekturentscheidung für die Trennung der Documentation- und Vocabulary-Authorities sowie die Nummernraumkorrektur.
5. `ESS-0012` und `ESS-0012-CONTRACTS` dürfen weiterhin als fachlich korrekte Abhängigkeit bzw. Related Authority referenziert werden; sie dürfen jedoch nicht als Vocabulary-Authority oder Vocabulary-Contract-Authority verwendet werden.
6. Die Canonical Vocabulary Registry darf erst nach Registrierung von ESS-0017 als normative Single Source of Truth implementiert werden.
7. Bestehende aktive Code-Namen werden durch diese Entscheidung nicht geändert. Renames benötigen den in der Roadmap vorgesehenen Safe Rename Gate.
8. Legacy-Dokumentation aus der Konsolidierung von PR #142 darf Vocabulary-Einträge nur nach Revalidierung gegen aktuellen Code, ESS/Contracts, ADRs und Traceability speisen.

## Konsequenzen / Consequences

Positive Konsequenzen:

- eindeutige ESS- und ADR-Auflösung;
- keine Kollision mit Documentation Governance;
- deterministische Traceability;
- klare Ownership zwischen Dokumentationsqualität und Terminologie;
- sichere Voraussetzung für Phase 2.

Kosten:

- Roadmap und Cross-References mussten von den kollidierenden Authority-IDs auf ESS-0017/ADR-0046 umgestellt werden;
- ESS-0017 und ESS-0017-CONTRACTS wurden formal angelegt und registriert.

## Runtime- und Deploy-Auswirkung

Keine unmittelbare Runtime-Auswirkung. Dieser ADR verändert keine Imports, Exports, Routen, Schemas, Environment Keys, Regex-Policies oder Deployment-Konfiguration. Die eigentliche Vocabulary-Runtime folgt erst in Phase 2 nach erfolgreichem Abschluss von Phase 1.5.

## Validation

Die Phase-1.5-Prüfung bestätigt:

- keine Vocabulary-Spezifikation verwendet `ESS-0012` oder `ESS-0012-CONTRACTS` als eigene Vocabulary-Authority;
- `ESS-0012`-Referenzen innerhalb des Vocabulary-Scope sind ausschließlich als Documentation-Governance-Abhängigkeit/Related Authority klassifiziert;
- keine aktive Vocabulary-Spezifikation verwendet `ADR-0044` oder `ADR-0045` als Vocabulary-Entscheidung;
- historische Hinweise auf die verworfenen Zuordnungen sind eindeutig als Historie/Korrektur markiert;
- `ESS-0017` ist genau einmal in der ESS Registry vergeben;
- `ESS-0017-CONTRACTS` ist eindeutig ESS-0017 zugeordnet;
- Documentation Governance bleibt vollständig unter ESS-0012/ESS-0012-CONTRACTS erhalten;
- der nächste freie ESS-Nummernraum ist `ESS-0018`.
