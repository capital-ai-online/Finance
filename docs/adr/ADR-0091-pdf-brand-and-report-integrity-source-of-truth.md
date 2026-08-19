# ADR-0091: PDF Brand and Report Integrity Source of Truth

- **Status:** ACCEPTED
- **Implementation-Status:** 🟡 IN PROGRESS
- **Datum:** 2026-08-19
- **Owner:** CAPITAL-AI Owner
- **Scope:** PDF branding, report metadata, report identifiers and compliance wording

## Kontext

CAPITAL-AI erzeugt mehrere PDF-Artefakte aus unterschiedlichen Frontend- und Dokumentationspfaden. Vor dieser Entscheidung definierten die aktiven jsPDF-Exporter Farben, Header, Footer, Versionsangaben, Dateinamen und Compliance-Texte jeweils separat. Dadurch entstanden unter anderem:

- unterschiedliche Markenfarben und Layout-Grundlagen,
- widersprüchliche Versionsangaben (`0.5.4`, `0.6.0`, `0.7.0`),
- eine pro Seitenkopf neu erzeugte zufällige Report-ID im Compliance-Export,
- Legacy-Bezeichnungen wie `AIF-Capital`,
- pauschale DSGVO-/BFSG-/Compliance-Aussagen ohne zugehörige prüfbare PDF-Evidence.

Das bestehende Produkt-Designsystem dokumentiert die kanonischen Design Tokens in `docs/frontend/design-tokens.json`. Für PDF-Ausgaben fehlte jedoch bislang ein expliziter Runtime-Adapter und ein Governance-Contract.

## Entscheidung

### 1. Kanonische PDF-Brand-Schicht

`src/platform/PdfReporting/pdfBrand.ts` ist der zentrale Runtime-Contract für alle aktiven jsPDF-Berichte.

Er übernimmt mindestens:

- PDF-sichere Brand-Farben und Typografie-Fallbacks,
- Report-Metadaten,
- standardisierte Header und Footer,
- standardisierte neutrale Hinweise/Disclaimer,
- Erzeugung einer unveränderlichen Report-ID pro Dokument.

Aktive jsPDF-Komponenten dürfen Markenfarben, Versionslogik oder Report-ID-Logik nicht als eigene parallele Source of Truth implementieren.

### 2. Design Tokens bleiben übergeordnet

`docs/frontend/design-tokens.json` bleibt die formale Produkt-Design-Source-of-Truth. Die PDF-Schicht bildet die für PDF benötigten Tokens druck-/renderer-sicher ab. Visuelle Erweiterungen müssen zuerst gegen die kanonischen Produkt-Tokens geprüft werden.

### 3. Version aus `package.json`

Die Plattformversion eines generierten Client-PDFs wird nicht hartkodiert. `vite.config.ts` liest die Version aus `package.json` und injiziert sie als `__CAPITAL_AI_VERSION__` in die PDF-Schicht.

Damit gilt für aktive Client-PDFs dieselbe Release-Version wie für das Paket-/Release-Artefakt.

### 4. Immutable Report Identifier

Jeder PDF-Bericht erhält genau eine Report-ID bei Beginn der Dokumenterzeugung. Diese ID wird anschließend unverändert in Dokumentmetadaten, Headern und/oder Footern wiederverwendet.

Die ID wird über eine kryptographisch geeignete Zufallsquelle (`crypto.randomUUID()` oder `crypto.getRandomValues()`) erzeugt. `Math.random()` ist für Report-Identitäten nicht zulässig.

### 5. Compliance- und Accessibility-Claims sind evidence-gated

PDF-Ausgaben dürfen keine pauschale externe Zertifizierung oder Rechtskonformität behaupten, wenn dafür keine aktuelle, dokumentierte und dem Artefakt zuordenbare Evidence vorliegt.

Insbesondere sind Formulierungen wie die folgenden in generierten Reports nicht zulässig, solange keine belastbare Evidence-Chain existiert:

- „DSGVO-konform“ als pauschale Zertifizierung,
- „Compliant with Art. 30 GDPR“,
- „BFSG Accessibility Standards compliant“,
- „verifiziert“ oder vergleichbare externe Prüfbehauptungen ohne benannten Prüfkontext.

Zulässig sind klar begrenzte Aussagen wie „interner Selbstcheck“, „interne Prüf-Referenz“ oder neutrale Informations-/Haftungshinweise.

### 6. Legacy-Branding wird nicht weiter ausgeführt

Neue oder aktive PDF-Dateinamen und Report-Inhalte verwenden ausschließlich `CAPITAL-AI`/`CAPITAL_AI` als Produktidentität.

Der archivierte `RealTimeRiskAssessment`-Runtimepfad wird als Null-Stub gehalten. Seine frühere `AIF-Capital`-PDF-Implementierung bleibt über die Git-Historie rekonstruierbar, ist aber nicht mehr ausführbar. Eine Reaktivierung benötigt eine eigene Architekturentscheidung und muss die kanonische PDF-Schicht verwenden.

### 7. NotebookLM-/WeasyPrint-Export bleibt P1

`scripts/docs/export_notebooklm_pdfs.py` ist ein separater Documentation-as-Code-Exportpfad. Seine visuelle Migration auf eine CAPITAL-AI Internal-Brand-Variante gehört zum nachgelagerten P1-Scope und wird durch diese P0-Entscheidung nicht stillschweigend verändert.

### 8. Tagged-PDF / PDF Accessibility bleibt P2

Diese Entscheidung behauptet keine vollständige PDF/UA-, WCAG- oder BFSG-Konformität. Strukturierte bzw. Tagged-PDF-Ausgabe, Lesereihenfolge, semantische Tabellen-/Heading-Struktur und entsprechende Verifikation sind ein eigener P2-Scope.

## Betroffene aktive Pfade

- `src/platform/PdfReporting/pdfBrand.ts`
- `src/components/ComplianceExporter.tsx`
- `src/components/BacktestEngine.tsx`
- `src/components/PortfolioBacktester.tsx`
- `vite.config.ts`
- `tests/unit/pdfBrandGovernance.test.ts`

Archiv-/Deaktivierungsbezug:

- `src/components/RealTimeRiskAssessment.tsx`
- `docs/backlog/04-deactivated-modules.md`

## Alternativen

### Alternative A: Branding in jedem Component separat pflegen

**Abgelehnt.** Führt zu wiederkehrendem Token-, Versions-, Claim- und Metadaten-Drift und erhöht Audit- und Wartungskosten.

### Alternative B: Vollständigen PDF-Service sofort serverseitig zentralisieren

**Zurückgestellt.** Eine serverseitige Report-Pipeline kann langfristig sinnvoll sein, ist für P0 jedoch eine deutlich größere Architektur- und Betriebsänderung. Der aktuelle Schritt zentralisiert zunächst die fachlich identischen Client-PDF-Invarianten.

### Alternative C: Nur sichtbare Farben vereinheitlichen

**Abgelehnt.** Das Kernrisiko betrifft neben der Optik auch Versionswahrheit, Report-Identität und unbelegte Compliance-Aussagen.

## Konsequenzen

### Positiv

- eine definierte PDF-Brand- und Metadatenquelle,
- keine voneinander abweichenden Versionsstrings in aktiven PDF-Exportern,
- stabile Report-IDs innerhalb eines Dokuments,
- geringeres Risiko unbelegter regulatorischer Aussagen,
- weniger tote Legacy-PDF-Oberfläche,
- automatisierbare Regressionserkennung.

### Trade-offs

- Änderungen am gemeinsamen PDF-Contract können mehrere Reports gleichzeitig betreffen und benötigen deshalb gezielte Regressionstests,
- die aktuelle PDF-Typografie verwendet weiterhin PDF-sichere Fallbacks; vollständige Corporate-Font-Einbettung ist P1,
- NotebookLM-Branding und Tagged-PDF-Accessibility sind bewusst noch nicht abgeschlossen.

## Verifikation

P0 gilt als implementiert, wenn:

1. alle aktiven jsPDF-Reportpfade den zentralen Contract verwenden,
2. die bekannten Legacy-/Compliance-Strings durch `tests/unit/pdfBrandGovernance.test.ts` ausgeschlossen werden,
3. die Versionsquelle aus `package.json` stammt,
4. der archivierte Risk-Pfad keinen ausführbaren PDF-Code mehr enthält,
5. der Branch unmittelbar vor Abschluss erneut gegen den aktuellen `main` abgeglichen wurde,
6. die nach PR-Erstellung zulässigen CI-/Build-Prüfungen erfolgreich abgeschlossen wurden oder verbleibende Fehler transparent dokumentiert sind.

Nach erfolgreicher Verifikation kann `Implementation-Status` auf `✅ COMPLETE` gesetzt und die ADR gemäß ADR-Ablagekonvention nach `docs/adr/resolved/` überführt werden.
