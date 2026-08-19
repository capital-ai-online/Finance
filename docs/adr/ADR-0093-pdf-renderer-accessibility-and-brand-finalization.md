# ADR-0093: PDF Renderer Accessibility and Brand Finalization

- **Status:** ACCEPTED
- **Implementation-Status:** ✅ COMPLETE / LANDED
- **Datum:** 2026-08-19
- **Owner:** CAPITAL-AI Owner
- **Scope:** PDF Branding P1/P2, renderer capability boundaries, tagged PDF strategy, render regression
- **Parent:** ADR-0091
- **Landed via:** PR #436
- **Merge-Commit:** `f5d39288d3b854d5a84001ed0f4046f29e5cc840`

## Kontext

ADR-0091 hat P0 für PDF Brand-/Metadaten-Integrität definiert. Nach P0 verbleiben zwei technisch unterschiedliche Rendererpfade:

1. Clientseitige Reports mit `jsPDF` (`ComplianceExporter`, `BacktestEngine`, `PortfolioBacktester`).
2. Documentation-as-Code-PDFs mit WeasyPrint (`scripts/docs/export_notebooklm_pdfs.py`).

Die Renderer haben unterschiedliche Accessibility-Fähigkeiten. Eine einheitliche Behauptung wie „PDF/UA-konform“ für alle PDF-Ausgaben wäre deshalb technisch falsch.

Gleichzeitig soll die visuelle CAPITAL-AI Identität nicht erneut pro Renderer separat gepflegt werden. Farben, Typografie-Rollen, Emblem, Wordmark, Versions- und Report-Identität müssen aus einem kontrollierten Brand-Contract abgeleitet werden.

## Externer Benchmark

Für diese Entscheidung wurden aktuelle Primärquellen berücksichtigt:

- Design Tokens Community Group Format/Color 2025.10 als interoperabler Token-Referenzrahmen.
- WeasyPrint 69: `pdf_variant="pdf/ua-1"` und `pdf_tags=True` für tagged PDF/UA-Ausgabe; Validität bleibt vom semantisch korrekten HTML abhängig.
- jsPDF: Dokument-Sprache kann über `setLanguage` gesetzt werden; ein belastbarer PDF/UA-/Tagged-PDF-Contract wird für den bestehenden positionsbasierten Reportpfad nicht vorausgesetzt.
- W3C PDF Accessibility Techniques: logische Struktur, Überschriften, Lesereihenfolge, Artefaktbehandlung und semantische Tabellen sind eigenständige Accessibility-Anforderungen.

## Entscheidung

### 1. Zwei explizite Accessibility-Profile

Der zentrale PDF-Contract unterscheidet künftig:

#### `client-jsPDF`

- Sprache und Dokumentmetadaten werden gesetzt.
- Brand-/Report-Metadaten sind zentralisiert.
- Status: `metadata-only`.
- **Keine** PDF/UA-, Tagged-PDF-, WCAG- oder BFSG-Konformitätsbehauptung.

#### `documentation-weasyprint`

- semantisches HTML ist verpflichtend,
- WeasyPrint erzeugt standardmäßig `pdf/ua-1`,
- `pdf_tags=True` ist verpflichtend,
- Output wird mit strukturellem und Render-Smoke verifiziert,
- Status: `tagged-pdf-ua-1-candidate` bis Verifikation; erst nach erfolgreichem Gate darf das Artefakt als entsprechend verifiziert bezeichnet werden.

### 2. Brand-Tokens bleiben upstream

Die PDF-Schicht darf keine unabhängige Markenpalette entwickeln. PDF-Farben werden aus `docs/frontend/design-tokens.json` abgeleitet und gegen `src/index.css` regressionsgeprüft.

Das JSON-Artefakt bleibt für diesen Scope im bestehenden Format; eine vollständige Migration des gesamten Produkt-Tokenkatalogs auf DTCG 2025.10 ist ein separater Design-System-Change und wird nicht stillschweigend in einen PDF-PR gezogen.

### 3. Vektor-Emblem statt Font-/Raster-Abhängigkeit

Client-PDFs verwenden ein aus dem bestehenden CAPITAL-AI Network-Node-Logo abgeleitetes Vektor-Emblem aus jsPDF-Primitiven. Dadurch entstehen:

- keine externen Bildrequests,
- keine Rasterunschärfe,
- keine Fontdatei-Abhängigkeit für das Emblem,
- deterministische Druckausgabe.

Das Wordmark verwendet eine definierte PDF-safe Sans-Rolle. Webfont-Namen werden nur als Produktrollen dokumentiert, nicht als eingebettet vorgetäuscht.

### 4. NotebookLM Internal Brand

Der bisherige navy/blaue Sonderstil wird entfernt. Cover, Inhaltsverzeichnis, Tabellen, Codeblöcke und Running Header verwenden die CAPITAL-AI Kernfarben:

- Canvas `#18181b`,
- Gold `#F5C453`,
- Cyan `#0DDDDD`,
- Purple `#B026FF`,
- neutrale drucktaugliche Text-/Flächenwerte.

### 5. Reproduzierbare WeasyPrint-Toolchain

Die Python-Abhängigkeiten des NotebookLM-Exports werden in einer eigenen Requirements-Datei gepinnt. WeasyPrint wird auf eine Version festgelegt, deren PDF/UA-/Tagging-API dokumentiert und im Scope geprüft ist.

### 6. Render-Smoke statt unbelegter visueller Behauptung

P2 führt zwei Arten von Regression ein:

1. Unit-/Source-Contract-Tests für Tokens, Emblem, Accessibility-Profile und Rendereroptionen.
2. Poppler-basierter Render-Smoke (`pdfinfo`, `pdftotext`, `pdftoppm`) für erzeugte PDFs.

Der Render-Smoke prüft mindestens:

- gültig renderbares PDF,
- A4-Seitengröße,
- extrahierbaren Text,
- sichtbare Brand-Header-/Akzentbereiche,
- für WeasyPrint PDF/UA: `Tagged: yes`.

Ein Render-Smoke ist kein Ersatz für eine formale PDF/UA-Konformitätsprüfung; diese Trennung ist Teil des Contracts.

## Konsequenzen

### Positiv

- kein Accessibility-Overclaiming,
- echte Tagged-PDF-Fähigkeit im WeasyPrint-Pfad,
- konsistente visuelle Identität über Client- und Documentation-PDFs,
- reproduzierbare Toolchain,
- geringere Drift zwischen CSS-, Token- und PDF-Branding,
- testbare Renderergrenzen.

### Trade-offs

- Client-jsPDF bleibt nicht als PDF/UA klassifiziert.
- Eine spätere regulatorisch erforderliche PDF/UA-Migration der interaktiven Produktreports benötigt einen semantischen Rendererwechsel (z. B. server-/browserbasierte HTML-to-PDF-Pipeline) und ist kein kosmetischer jsPDF-Patch.
- WeasyPrint-PDF/UA bleibt von korrekter HTML-Semantik und externer Verifikation abhängig.

## Nicht-Ziele

- kein Puppeteer/Chromium-Produktionsservice in diesem PR,
- keine neue Server-Trust-Boundary,
- keine Änderung von Billing, Supabase, Stripe oder Render,
- keine vollständige Migration des gesamten Design-Token-Katalogs auf DTCG 2025.10,
- keine rechtliche oder behördliche Konformitätszertifizierung.

## Verifikation / Abschluss

ADR-0093 ist abgeschlossen. Die ursprünglich definierten Abschlusskriterien wurden erfüllt:

1. P1/P2-Roadmap fachlich abgearbeitet,
2. zentrale Emblem-/Wordmark-/Accessibility-Contracts umgesetzt,
3. NotebookLM standardmäßig auf tagged PDF/UA-1 konfiguriert,
4. Regressionstests und Render-Smoke-Tools vorhanden,
5. Dokument-Registry und Evidence aktualisiert,
6. Implementierungsbranch vor Merge wiederholt gegen den aktuellen `main` abgeglichen und synchronisiert,
7. verfügbare PR-CI-/Governance-Ergebnisse dokumentiert.

### Post-Merge-Nachweis

- PR #436 wurde am 2026-08-19 Human-gemerged.
- Merge-Commit auf `main`: `f5d39288d3b854d5a84001ed0f4046f29e5cc840`.
- Finaler PR-Head vor Merge: `027c278815b465aca81b00d4435f35048b61498d`.
- Governance Run #1239 (`32239637308`) auf diesem finalen Head: **PASS**.
- CI Run #1917 (`32239637176`) auf diesem finalen Head: **FAIL ausschließlich am vorgeschalteten M10-CI-Autorisierungsschritt**. Checkout, Repository-Klassifikation, Dependency-Installation, TypeScript, Unit-Tests, Build und Docker-Schritte wurden nicht ausgeführt.
- Daraus wird ausdrücklich **kein technisches Test-/Build-PASS** abgeleitet. Der Merge-/Implementierungsabschluss dokumentiert den gelandeten Code- und Governance-Zustand; formale PDF/UA-Verifikation bleibt weiterhin artefaktbezogen evidence-gated.
