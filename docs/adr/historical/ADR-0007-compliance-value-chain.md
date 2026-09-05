# ADR-0007 — Compliance Value Chain

**Authority ID:** `AUTH-ADR-LEGACY-COMPLIANCE-VALUE-CHAIN-0007`  
**Version:** `1.0.0`  
**Lifecycle:** `HISTORICAL — NON-AUTHORIZING`  
**Original status:** `ACCEPTED`  
**Original date:** `2026-07-10`  
**Archived by:** `CAPITAL-AI-GOV / PVC-05` through `COMP-GAP-002 / GOV-CHAT-062`  
**Archive date:** `2026-09-05`

> This file preserves the substantive historical ADR-0007 decision. It is retained for audit and traceability only. It does not authorize current Compliance, Data, Privacy, Scoring, Traceability, Documentary, Legal, merge, release, deployment or production behavior.

## Historical decision

### Kontext
Im modernen FinTech- und Kapitalmarktregulierungs-Umfeld (z.B. MiFID II, BaFin, DSGVO) ist die bloße Anzeige von statischen Berichten unzureichend. Um eine revisionssichere, automatisierte und lückenlose Compliance-Prüfung zu garantieren, muss die gesamte Wertschöpfungskette der Datenströme, Score-Berechnungen, Audit-Loggings und Export-Zertifizierungen digital abgebildet werden. Dieses Dokument definiert die Schritte zur Bereitstellung einer durchgängigen **Capital-AI Compliance Wertschöpfungskette**.

### Entscheidung
Wir etablieren eine 5-stufige, integrierte Compliance-Wertschöpfungskette (Compliance Value Chain) innerhalb der Plattform-Architektur:

#### Stufe 1: Daten-Ingestion & Validierungs-Gateway (Datenintegrität)
- **Maßnahme**: Jede in das System einfließende Markt- oder Asset-Information wird über ein strikt typisiertes Gateway validiert.
- **Zweck**: Ausschluss von manipulierten Daten oder Fake-Werten (Einhaltung der "No-Mock-Data-Policy"). Unvollständige Abfragen werden sofort isoliert und im Audit-Log vermerkt.

#### Stufe 2: Anonymisierung & PII-Maskierung (Datenschutz-by-Design)
- **Maßnahme**: Alle einfließenden Abfragen von Nutzern werden vor der Weiterleitung an externe Analysedienste (z.B. Google GenAI / LLM API-Schnittstellen) bereinigt.
- **Zweck**: Vollständiger Schutz personenbezogener Daten (Art. 32 DSGVO). Personenbezogene Verbindungsdaten werden im RAM-Bypassing-Verfahren gefiltert, sodass IP-Adressen oder Nutzeridentitäten niemals externe Server erreichen.

#### Stufe 3: Deterministische Berechnungs-Engines & Sentiment-Verifizierung
- **Maßnahme**: Berechnungsformeln (wie Graham-DCF oder Risikokoeffizienten) laufen deterministisch auf dem Server. KI-gestützte Sentiment-Analysen müssen über nachvollziehbares Grounding (wie Google Search Grounding) mit genauer Quellenangabe belegt werden.
- **Zweck**: Einhaltung der finanzrechtlichen Offenlegungspflichten und Gewährleistung einer lückenlos nachvollziehbaren Berechnungs-Historie.

#### Stufe 4: Unveränderbares Event-Logging (Immutable Audit Trail)
- **Maßnahme**: Jede kritische Transaktion, jeder PDF-Export und jeder Administrator-Eingriff wird in einem manipulationssicheren, strukturierten Protokoll mit Zeitstempel aufgezeichnet (z.B. in der `AuditLogs` Tabelle/Komponente).
- **Zweck**: Erbringung rechtssicherer Nachweise gegenüber Regulierungsbehörden (BaFin, DSGVO-Aufsicht).

#### Stufe 5: Automatisierte Konformitäts-Zertifizierung & PDF-Export
- **Maßnahme**: Die Export-Engine generiert interaktive Compliance-Zertifikate (PDFs) mit einem eindeutigen kryptografischen Hash-Präfix, das die Echtheit des Berichts fälschungssicher bestätigt.
- **Zweck**: Bereitstellung direkt verwertbarer Konformitätsberichte für Anleiheemittenten, Fondsmanager und institutionelle Mandanten.

### Konsequenzen

**Vorteile**
- Nahtloser Übergang von quantitativer Rohdatenanalyse zu einer auditierten, rechtlich defensiblen Berichterstattung.
- Deutlich reduziertes Haftungsrisiko für den Plattformbetreiber durch präventive Offenlegungsausschlüsse.
- Steigerung des Kundenvertrauens im institutionellen Enterprise-Segment durch verifizierte, quellengestützte KI-Auswertungen.

**Herausforderungen**
- Erhöhte Anforderungen an die Performance der PDF-Generierungs- und Logging-Engines.
- Kontinuierliche Abstimmung der Systemgrenzen auf sich wandelnde europäische Regulierungsentwürfe.

## 2026-09-05 lifecycle / semantic reconciliation

ADR-0007 is archived rather than migrated as an active ADR because its historical five-stage omnibus scope no longer matches the current repository ownership and authority model. No single current authority replaces the whole ADR.

Current responsibility is split as follows:

1. **Data ingestion / validation:** Data ownership under `PVC-09..PVC-11`; current data/evidence architecture includes ADR-0032 and ADR-0041 / ESS-0016 where applicable.
2. **Privacy / PII:** current privacy governance is anchored by ADR-0095, with ADR-0092 retention/lifecycle and ADR-0086 vendor/privacy evidence where applicable. Legal applicability remains Human/Legal work; engineering evidence alone does not prove legal compliance.
3. **Deterministic scoring / financial computation:** FinTech ownership under `PVC-12..PVC-17`; canonical scoring remains ADR-0087 / `SC-MD-SPT-0001`. Compliance is an assessor/consumer, not scoring authority.
4. **Audit / traceability:** traceability and event transport remain under their current ESS/ADR/runtime contracts and mapped Primary Owners, including ESS-0011 and `PVC-18` where applicable. The historical phrase "immutable" is not a blanket current guarantee.
5. **Documents / exports / certification language:** Documentary ownership remains `PVC-03` and current Documentary contracts (including ESS-0010/ESS-0012 and applicable ADRs). A generated PDF/hash is evidence packaging, not legal certification by itself.

Compliance remains cross-cutting and owns no productive PVC stage merely by assessing these concerns. Unsupported statements such as "full compliance", "legally defensible", "regulator-ready", or automatic certification are not restored as current repository claims.

This archive action does not edit foreign productive runtime. Existing UI/source references to display ID `ADR-0007` are compatibility references only after this lifecycle change and require owner-scoped cleanup if they are presented as current authority.
