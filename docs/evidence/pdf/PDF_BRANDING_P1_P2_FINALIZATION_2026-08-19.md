# PDF Branding P1/P2 Finalization Evidence — 2026-08-19

- **Status:** IMPLEMENTATION COMPLETE / CI EVIDENCE PENDING
- **Owner:** CAPITAL-AI Owner
- **Branch:** `agent/pdf-branding-p1-p2-final`
- **Parent:** ADR-0091, ADR-0093
- **Roadmap:** `docs/roadmaps/PDF_BRANDING_FINALIZATION_P1_P2_2026-08-19.md`
- **Baseline:** `main` at PR #432 merge commit `3ed2b2e9c9421bc979ca2487610a6a49a655e888`

## Ziel

Nach P0 werden die verbleibenden PDF-Branding- und Renderer-Lücken geschlossen: konsistente visuelle Identität, gemeinsame Token-Herkunft, echte tagged-PDF-Fähigkeit im Documentation-as-Code-Pfad sowie ehrliche Capability-Grenzen für clientseitige jsPDF-Berichte.

## Enterprise-/State-of-the-Art-Benchmark

Geprüfte Primärquellen zum Umsetzungszeitpunkt:

1. W3C Design Tokens Community Group 2025.10 — stabiler, interoperabler Token-Referenzrahmen. Die bestehende Repository-Datei wird in diesem PDF-Scope bewusst **nicht** vollständig auf das neue `$value`/`$type`-Format migriert; die PDF-Bridge liest `value` und `$value`, um eine spätere Migration nicht zu blockieren.
   - https://www.designtokens.org/tr/2025.10/format/
2. WeasyPrint 69 — unterstützt `pdf_variant="pdf/ua-1"` und `pdf_tags=True`. Die Gültigkeit einer PDF/UA-Ausgabe hängt weiterhin von korrekter HTML-Semantik und Verifikation ab.
   - https://doc.courtbouillon.org/weasyprint/stable/api_reference.html
   - https://doc.courtbouillon.org/weasyprint/stable/common_use_cases.html
3. jsPDF — setzt mit `setLanguage` die Dokumentsprache; der bestehende positionsbasierte Client-Reportpfad wird nicht als PDF/UA-/Tagged-PDF-Renderer klassifiziert.
   - https://parallax.github.io/jsPDF/docs/module-setLanguage.html
4. W3C PDF Accessibility Techniques — logische Struktur, Lesereihenfolge, Überschriften, Artefakte und semantische Tabellen sind eigenständige Anforderungen und dürfen nicht aus rein visueller Gestaltung abgeleitet werden.
   - https://www.w3.org/WAI/WCAG22/Techniques/pdf/

## Parallel-PR-Korrelation

Zum Implementierungsabschluss sind PR #433, #434 und #435 parallel offen.

- **#433:** direkter Dateioverlap nur `docs/governance/document-registry.json`.
- **#435:** direkter Dateioverlap nur `docs/governance/document-registry.json`.
- **#434:** kein direkter Dateioverlap; der Branch reserviert aber `ADR-0092` für Privacy-Retention-Hardening.
- Die zunächst lokal verwendete PDF-ID `ADR-0092` wurde deshalb vor PR-Erstellung verworfen; die PDF-Entscheidung ist verbindlich **ADR-0093**.

Falls #433 oder #435 zuerst landen, ist die Registry additiv zu reconciliieren. Jeder weitere Main-Advance löst vor Merge erneut den vorgeschriebenen Gesamtvergleich des PDF-Branches gegen `main` aus.

## Umgesetzte Architektur

### 1. Design-Token Bridge

- `docs/frontend/design-tokens.json`
  - neue Print-Tokens für Text, Flächen, Border und Link,
  - Produktfarben Gold/Cyan/Purple bleiben upstream.
- `vite.config.ts`
  - liest `package.json` und Design-Tokens,
  - erzeugt den build-time Contract `__CAPITAL_AI_PDF_BRAND__`,
  - konvertiert Hex-Farben deterministisch in jsPDF-RGB-Tupel,
  - akzeptiert sowohl das bestehende `value` als auch `$value` für eine spätere Tokenformat-Migration.

### 2. Gemeinsame Brand-/Release-Identität

- `src/platform/Branding/runtimeBrand.ts`
  - zentrale Client-Version aus `package.json`/Vite.
- `src/components/CapitalAiLogo.tsx`
  - keine Default-Version `0.7.0` mehr,
  - Default ist die kanonische Runtime-Version,
  - Core-Farben werden aus CSS-Tokens bezogen.

### 3. jsPDF Brand Contract

`src/platform/PdfReporting/pdfBrand.ts` enthält nun:

- design-token-abgeleiteten PDF-Brand-Contract,
- gemeinsames Vektor-Network-Node-Emblem,
- gemeinsames CAPITAL-AI Wordmark,
- Emblem/Wordmark in Report- und Running-Headern,
- unveränderliche Report-ID aus sicherer Zufallsquelle,
- zentrale Metadaten und Sprache `de-DE`,
- Accessibility-Profil `client-jsPDF` / `metadata-only`.

Wichtig: `client-jsPDF` behauptet ausdrücklich **keine** PDF/UA-, Tagged-PDF-, WCAG- oder BFSG-Konformität.

### 4. NotebookLM / WeasyPrint

`scripts/docs/export_notebooklm_pdfs.py` wurde auf einen semantischen Documentation-as-Code-Contract gehoben:

- CAPITAL-AI Internal Brand statt navy/blaue Sonderpalette,
- Design-Tokens direkt aus `docs/frontend/design-tokens.json`,
- semantische Struktur mit `header`, `nav`, `main`, `article`,
- Dokument-Sprache und Metadaten,
- standardmäßig `pdf_variant="pdf/ua-1"`,
- standardmäßig `pdf_tags=True`,
- deterministischer `--smoke`-Pfad für ein kleines Testartefakt.

### 5. Reproduzierbare Toolchain

`scripts/docs/requirements-notebooklm-pdf.txt` pinnt:

- Markdown `3.10.2`,
- WeasyPrint `69.0`,
- Pygments `2.20.0`.

`PyMuPDF` wurde bewusst nicht als Render-Testdependency eingeführt, um keinen zusätzlichen AGPL-/Commercial-Lizenzpfad für diese Regression einzuführen. Stattdessen nutzt die Verifikation vorhandene Poppler-CLI-Werkzeuge.

### 6. Render-/Regression-Gates

- `tests/unit/pdfBrandGovernance.test.ts`
  - P0-Invarianten, aktualisiert auf gemeinsame Runtime-Version.
- `tests/unit/pdfBrandFinalization.test.ts`
  - Token↔CSS-Korrelation,
  - Token-Bridge,
  - Emblem/Wordmark,
  - Renderer-/Accessibility-Profile,
  - WeasyPrint PDF/UA-/Tagging-Optionen,
  - gepinnte Toolchain.
- `tests/unit/pdfBrandRendering.test.ts`
  - erzeugt ein echtes A4-jsPDF-Smoke-Artefakt,
  - prüft PDF-Header, Größe, Text und bei verfügbarem Poppler Raster/Text-Extraktion.
- `scripts/docs/verify_pdf_render.py`
  - `pdfinfo`, `pdftotext`, `pdftoppm`,
  - A4, Seitenzahl, Text, Tagged-Flag, Brand-Render-Pixel,
  - kennzeichnet explizit `formalPdfUaValidation: false`.

## Prozessinventar nach Finalisierung

| PDF-Pfad | Renderer | Brand | Accessibility-Profil |
|---|---|---|---|
| Compliance Report | jsPDF | zentraler PDF-Contract + Vektor-Emblem | `client-jsPDF` / metadata-only |
| Backtest Report | jsPDF | zentraler PDF-Contract + Vektor-Emblem | `client-jsPDF` / metadata-only |
| Portfolio Report | jsPDF | zentraler PDF-Contract + Vektor-Emblem | `client-jsPDF` / metadata-only |
| NotebookLM Bundles | WeasyPrint 69 | CAPITAL-AI Internal Brand aus Design-Tokens | `documentation-weasyprint` / tagged PDF/UA-1 candidate |
| archivierter VaR-Report | keiner | Runtime-Pfad entfernt | N/A |

## Vorher/Nachher-Matrix

| Dimension | Vor P1/P2 | Nach P1/P2 |
|---|---|---|
| PDF-Logo | Text-Wordmark / kein Emblem | gemeinsames Vektor-Network-Node-Emblem + Wordmark |
| Farbquelle | P0-TypeScript-Werte + eigener NotebookLM-Navy-Stil | Design-Token-SSOT + Print-Adapter |
| UI-Logo-Version | Default `0.7.0` | kanonische Runtime-/Package-Version |
| Typografie | implizite Helvetica/DejaVu-Nutzung | explizite Produktrollen + renderer-sichere Fallbacks |
| NotebookLM-Stil | Navy/Blue Sonderpalette | CAPITAL-AI Gold/Cyan/Purple Internal Brand |
| NotebookLM-Struktur | überwiegend generische Sections | semantisches `header/nav/main/article` |
| NotebookLM-PDF | normales WeasyPrint PDF | tagged PDF/UA-1 candidate |
| jsPDF Accessibility | kein explizites Profil | `metadata-only`, Sprache/Metadaten, kein Overclaim |
| Python Toolchain | unpinned `pip install ...` | gepinnte Requirements |
| Regression | P0 Source-Guards | Source + echtes jsPDF-Smoke + Poppler-Render-Verifier |
| Konformitätsaussage | Risiko visueller Ableitung | evidence-gated, Renderer-Capability explizit |

## Verifikationsstatus

Vor PR-Erstellung wurden **keine kostenrelevanten Build-/Volltest-Läufe** gestartet. Das entspricht der Repository-Kostenregel.

Bereits abgeschlossen:

- Quellpfad-Inventar: drei aktive jsPDF-Generatoren + ein WeasyPrint-Generator; kein weiterer produktiver PDF-Erzeuger gefunden.
- Architektur-/Capability-Abgleich gegen aktuelle Primärquellen.
- Branch-basierte Umsetzung gemäß P1/P2-Roadmap.
- Regressionstests und Render-Smoke-Tooling implementiert.
- Parallel-PR-ADR-Kollision erkannt und vor PR-Erstellung von ADR-0092 auf ADR-0093 korrigiert.
- Pre-PR-Main-Abgleich: `23 ahead / 0 behind`, Merge-Base `3ed2b2e9c9421bc979ca2487610a6a49a655e888`.

Noch nach PR-Erstellung zu erfassen:

- Governance-Workflow,
- TypeScript/Vitest/Build gemäß PR-Checkklasse, sofern das aktive M10-Human-Gate die Ausführung autorisiert,
- optionaler WeasyPrint/Poppler-Smoke in einer Umgebung mit den gepinnten Python-/OS-Abhängigkeiten.

Ein fehlender Human-/Passkey-Gate-Nachweis wird **nicht** durch Änderung oder Abschwächung des CI-Gates umgangen.
