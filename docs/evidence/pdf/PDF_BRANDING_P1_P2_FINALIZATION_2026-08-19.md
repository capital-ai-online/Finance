# PDF Branding P1/P2 Finalization Evidence — 2026-08-19

- **Status:** ✅ LANDED / GOVERNANCE VERIFIED
- **Owner:** CAPITAL-AI Owner
- **Implementation-Branch:** `agent/pdf-branding-p1-p2-final`
- **Post-Merge-Closure:** `agent/pdf-branding-post-merge-closure`
- **Parent:** ADR-0091, ADR-0093
- **Roadmap:** `docs/roadmaps/PDF_BRANDING_FINALIZATION_P1_P2_2026-08-19.md`
- **PR:** #436
- **Final PR Head:** `027c278815b465aca81b00d4435f35048b61498d`
- **Merge-Commit:** `f5d39288d3b854d5a84001ed0f4046f29e5cc840`
- **Landing-Baseline:** `main@f5d39288d3b854d5a84001ed0f4046f29e5cc840`

## Ziel

Nach P0 wurden die verbleibenden PDF-Branding- und Renderer-Lücken geschlossen: konsistente visuelle Identität, gemeinsame Token-Herkunft, tagged-PDF-Fähigkeit im Documentation-as-Code-Pfad sowie ehrliche Capability-Grenzen für clientseitige jsPDF-Berichte.

## Enterprise-/State-of-the-Art-Benchmark

Geprüfte Primärquellen zum Umsetzungszeitpunkt:

1. W3C Design Tokens Community Group 2025.10 — interoperabler Token-Referenzrahmen. Die bestehende Repository-Datei wurde in diesem PDF-Scope bewusst **nicht** vollständig auf das neue `$value`/`$type`-Format migriert; die PDF-Bridge liest `value` und `$value`, um eine spätere Migration nicht zu blockieren.
   - https://www.designtokens.org/tr/2025.10/format/
2. WeasyPrint 69 — unterstützt `pdf_variant="pdf/ua-1"` und `pdf_tags=True`. Die Gültigkeit einer PDF/UA-Ausgabe hängt weiterhin von korrekter HTML-Semantik und Verifikation ab.
   - https://doc.courtbouillon.org/weasyprint/stable/api_reference.html
   - https://doc.courtbouillon.org/weasyprint/stable/common_use_cases.html
3. jsPDF — setzt mit `setLanguage` die Dokumentsprache; der bestehende positionsbasierte Client-Reportpfad wird nicht als PDF/UA-/Tagged-PDF-Renderer klassifiziert.
   - https://parallax.github.io/jsPDF/docs/module-setLanguage.html
4. W3C PDF Accessibility Techniques — logische Struktur, Lesereihenfolge, Überschriften, Artefakte und semantische Tabellen sind eigenständige Anforderungen und dürfen nicht aus rein visueller Gestaltung abgeleitet werden.
   - https://www.w3.org/WAI/WCAG22/Techniques/pdf/

## Umgesetzte Architektur

### 1. Design-Token Bridge

- `docs/frontend/design-tokens.json`
  - Print-Tokens für Text, Flächen, Border und Link,
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

`src/platform/PdfReporting/pdfBrand.ts` enthält:

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

## Parallel-PR- und Main-Korrelation

Während der Implementierung wurden fortlaufende Main-Änderungen nach Projektregel korreliert und in den Branch aufgenommen:

- PR #433 M10 Closure landete vor #436. Direkter PDF-Overlap: nur `docs/governance/document-registry.json`; additive Reconciliation durchgeführt.
- PR #437 M10 Post-Merge Traceability landete ebenfalls vor dem finalen #436-Merge. Der PDF-Branch wurde danach erneut mit `main` synchronisiert.
- PR #434 hatte keinen direkten PDF-Dateioverlap; `ADR-0092` blieb Privacy vorbehalten und PDF nutzt `ADR-0093`.
- PR #435 hatte nur `docs/governance/document-registry.json` als direkten Overlap; kein Scoring-/Runtime-Pfad wurde durch #436 verändert.

Die finale #436-Landing-Baseline ist `main@f5d39288d3b854d5a84001ed0f4046f29e5cc840`.

## PR-/CI-/Governance-Evidence

### Merge

- PR #436: **Human-gemerged** am 2026-08-19.
- Finaler PR-Head: `027c278815b465aca81b00d4435f35048b61498d`.
- Merge-Commit: `f5d39288d3b854d5a84001ed0f4046f29e5cc840`.

### Governance

- PR Governance Run #1239, Run ID `32239637308`.
- Head: `027c278815b465aca81b00d4435f35048b61498d`.
- Ergebnis: **SUCCESS / PASS**.

### CI

- CI Run #1917, Run ID `32239637176`.
- Head: `027c278815b465aca81b00d4435f35048b61498d`.
- Ergebnis: **FAIL am Schritt `M10 CI-Autorisierung vor teuren Schritten prüfen`**.
- Danach wurden Checkout, Prüfumfang-Klassifikation, Repository-Integrität, Node-Setup, Dependency-Installation, TypeScript, Unit-Tests, Production Build, CSP, Deployment Readiness und Docker-Schritte **skipped**.

Daraus folgt:

- Es existiert auf dem finalen #436-Head ein belastbarer Governance-PASS.
- Es existiert aus CI #1917 **kein** TypeScript-/Unit-/Build-PASS und auch **kein beobachteter technischer Fehler** in diesen Schritten, weil sie nicht ausgeführt wurden.
- Dieser Abschlussdatensatz darf deshalb nicht als Ersatz für technische CI-Evidence oder formale PDF/UA-Konformitätsprüfung verwendet werden.

## Abschlussbewertung

**P1/P2 ist implementiert und auf `main` gelandet.** Die Dokumentations- und Governance-Evidence ist geschlossen, ohne das M10-Gate oder die Capability-Grenzen nachträglich umzudeuten.

Verbleibende fachliche Grenze:

- `client-jsPDF` bleibt `metadata-only` und nicht PDF/UA.
- `documentation-weasyprint` bleibt ein `tagged-pdf-ua-1-candidate`, bis ein konkretes erzeugtes Artefakt erfolgreich verifiziert wurde.
- Render-Smoke ist keine formale PDF/UA-Zertifizierung.

Damit ist ADR-0093 auf `✅ COMPLETE / LANDED` gesetzt; weitere PDF/UA- oder regulatorische Claims benötigen einen separaten verifizierten Evidence-Pfad.
