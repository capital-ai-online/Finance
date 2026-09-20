# ADR-0007 — Compliance Value Chain — HISTORICAL / NON-AUTHORIZING

- **Authority ID:** `AUTH-ADR-COMPLIANCE-VALUE-CHAIN-0007`
- **Lifecycle:** `HISTORICAL — NON-AUTHORIZING`
- **Original Status:** `ACCEPTED`
- **Original Date:** `2026-07-10`
- **Decision owner:** Sven Kulessa
- **Registry state:** `historical` in `docs/adr/registry.json` and `docs/governance/authority-registry.json`
- **Current disposition:** Preserved for audit and traceability only. This artifact does not authorize current Compliance, Data, Privacy, Scoring, Traceability, Documentary, Legal, merge, release, deployment or production behavior.

> The historical decision record below preserves the 2026-07-10 architecture context. Its former `ACCEPTED` status is historical metadata, not current authority. Current work resolves through `/AGENTS.md`, the Project Value Chain, the affected project Roadmap and applicable current ADR/ESS authorities.

## Current semantic boundary — 2026-09-05

Human-merged PR #755 established the immutable Authority ID `AUTH-ADR-COMPLIANCE-VALUE-CHAIN-0007` and registered ADR-0007 as `historical` / non-authorizing. This file therefore carries the same lifecycle at the same registered path; no second Authority ID, global `supersedes` edge or parallel Compliance Value Chain is introduced.

The historical five-stage model spans concerns that now resolve through separate current owners and authorities:

1. **Data ingestion / validation:** `CAPITAL-AI-FINTECH / PVC-09..PVC-11` and applicable current FinTech/Evidence authorities.
2. **Privacy / PII:** applicable current Privacy authorities; legal conclusions remain Human/Legal determinations rather than engineering inference.
3. **Deterministic scoring / financial computation:** `CAPITAL-AI-FINTECH / PVC-12..PVC-17` and the current canonical Scoring authority. Together with the ingestion/validation stages above, FINTECH owns the current productive `PVC-09..PVC-17` range.
4. **Audit / traceability:** current Traceability/Event authorities and mapped Primary Owners, including `PVC-18` where applicable.
5. **Documents / exports:** `CAPITAL-AI-DOC / PVC-03` and applicable Documentary authorities.

The former wording about complete PII protection, legally sufficient or tamper-proof evidence, automated conformity certification, liability reduction, regulator readiness, or cryptographic PDF authenticity is historical decision text only. It is **not** a current technical guarantee, legal conclusion, certification, regulatory-status statement or implementation authority. `CAPITAL-AI-COMP` remains a cross-cutting assessor and acquires no productive PVC stage from this historical ADR.

## Historical decision record

### Original title

**ADR-0007: Bereitstellung einer vollen Capital-AI Compliance Wertschöpfungskette**

- **Original Status:** `ACCEPTED`
- **Datum:** 2026-07-10
- **Autor:** Sven Kulessa

### Kontext

Im modernen FinTech- und Kapitalmarktregulierungs-Umfeld (z.B. MiFID II, BaFin, DSGVO) ist die bloße Anzeige von statischen Berichten unzureichend. Um eine revisionssichere, automatisierte und lückenlose Compliance-Prüfung zu garantieren, muss die gesamte Wertschöpfungskette der Datenströme, Score-Berechnungen, Audit-Loggings und Export-Zertifizierungen digital abgebildet werden. Dieses Dokument definierte die Schritte zur Bereitstellung einer durchgängigen **Capital-AI Compliance Wertschöpfungskette**.

### Entscheidung

Die damalige Entscheidung etablierte eine 5-stufige, integrierte Compliance-Wertschöpfungskette (Compliance Value Chain) innerhalb der Plattform-Architektur:

#### Stufe 1: Daten-Ingestion & Validierungs-Gateway (Datenintegrität)
- **Maßnahme:** Jede in das System einfließende Markt- oder Asset-Information sollte über ein strikt typisiertes Gateway validiert werden.
- **Historischer Zweck:** Ausschluss von manipulierten Daten oder Fake-Werten unter der damaligen "No-Mock-Data-Policy"; unvollständige Abfragen sollten isoliert und im Audit-Log vermerkt werden.

#### Stufe 2: Anonymisierung & PII-Maskierung (Datenschutz-by-Design)
- **Maßnahme:** Einfließende Nutzerabfragen sollten vor der Weiterleitung an externe Analysedienste bereinigt werden.
- **Historischer Zweck:** Der frühere Text beanspruchte vollständigen Schutz personenbezogener Daten und ein RAM-Bypassing-Verfahren. Diese Aussagen sind keine aktuelle technische oder rechtliche Garantie.

#### Stufe 3: Deterministische Berechnungs-Engines & Sentiment-Verifizierung
- **Maßnahme:** Berechnungsformeln sollten deterministisch auf dem Server laufen; KI-gestützte Sentiment-Analysen sollten nachvollziehbares Grounding und Quellenangaben verwenden.
- **Historischer Zweck:** Nachvollziehbarkeit von Berechnung und Evidenz. Aktuelle Scoring- und FinTech-Autorität folgt den heutigen FinTech-/Scoring-Verträgen, nicht ADR-0007.

#### Stufe 4: Unveränderbares Event-Logging (Immutable Audit Trail)
- **Maßnahme:** Kritische Transaktionen, PDF-Exporte und Administrator-Eingriffe sollten strukturiert mit Zeitstempel protokolliert werden.
- **Historischer Zweck:** Der frühere Text sprach von manipulationssicheren und rechtssicheren Nachweisen gegenüber Aufsichtsstellen. Diese Formulierungen sind keine aktuelle Garantie; heutige Traceability-/Event-Verträge und deren Primary Owner sind maßgeblich.

#### Stufe 5: Automatisierte Konformitäts-Zertifizierung & PDF-Export
- **Maßnahme:** Die damalige Export-Architektur sah Compliance-Zertifikate als PDFs mit kryptografischem Hash-Präfix vor.
- **Historischer Zweck:** Der frühere Text beanspruchte fälschungssichere Echtheitsbestätigung und direkt verwertbare Konformitätsberichte. Ein PDF oder Hash ist heute nur Evidenz-/Dokumentverpackung und keine automatische rechtliche Zertifizierung.

### Historische Konsequenzen

Die ursprüngliche Entscheidung erwartete einen nahtlosen Übergang von quantitativer Rohdatenanalyse zu auditierter Berichterstattung, geringeres Haftungsrisiko und höheres institutionelles Kundenvertrauen. Sie benannte zugleich Performance-Aufwand für PDF-/Logging-Engines und laufende regulatorische Anpassungen als Herausforderungen.
