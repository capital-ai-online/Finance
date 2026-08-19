# PDF Branding Finalization Roadmap — P1/P2

- **Status:** ✅ COMPLETE / LANDED
- **Datum:** 2026-08-19
- **Owner:** CAPITAL-AI Owner
- **Implementation-Branch:** `agent/pdf-branding-p1-p2-final`
- **Post-Merge-Closure:** `agent/pdf-branding-post-merge-closure`
- **Landed via:** PR #436
- **Merge-Commit:** `f5d39288d3b854d5a84001ed0f4046f29e5cc840`
- **Parent:** ADR-0091 / ADR-0093 / PR #432
- **Ziel:** PDF-Branding nach P0 visuell, technisch und accessibility-seitig abschließen, ohne unbelegte Konformitätsclaims einzuführen.

## Ausgangslage

P0 hat aktive jsPDF-Reports auf einen gemeinsamen Brand-/Metadaten-Contract gehoben, Versionsdrift und instabile Report-IDs entfernt sowie Legacy-/Compliance-Claims bereinigt. Offen blieben bewusst:

1. echtes CAPITAL-AI Emblem/Wordmark im PDF,
2. einheitliche Typografie-Rollen,
3. NotebookLM-/WeasyPrint-Branding,
4. Accessibility-/Tagged-PDF-Strategie,
5. Render-/Regression-Gates.

Diese Punkte sind mit PR #436 implementiert und auf `main` gelandet.

## Enterprise-/State-of-the-Art-Leitplanken

- Produktfarben und Typografie stammen aus dem bestehenden Design-Token-Contract; PDF-Renderer dürfen keine parallelen Markenwerte etablieren.
- Ein PDF darf nur dann als PDF/UA bzw. tagged/accessibility-konform bezeichnet werden, wenn der Renderer die Struktur tatsächlich erzeugt und die Ausgabe verifiziert wird.
- WeasyPrint wird für semantische Documentation-as-Code-PDFs mit PDF/UA-1 und Tags betrieben.
- Client-jsPDF bleibt ein positionsbasierter Renderer. Er erhält Sprache, Metadaten und einen expliziten `metadata-only` Accessibility-Status, behauptet aber keine PDF/UA-Konformität.
- Visuelle Regression wird als Render-Smoke mit A4-, Text-, Seiten- und Brand-Pixel-Invarianten abgesichert; regulatorische Konformität wird davon getrennt behandelt.

## P1 — Brand Finalisierung

### P1.1 Design-Token Bridge

- [x] PDF-Brandwerte werden build-time aus `docs/frontend/design-tokens.json` abgeleitet.
- [x] Test stellt sicher, dass PDF- und CSS-Kernfarben nicht driften.
- [x] Keine neue unabhängige Farbpalette in Exportern.

### P1.2 Emblem und Wordmark

- [x] Gemeinsames Vektor-Emblem für jsPDF implementiert.
- [x] Gemeinsames CAPITAL-AI Wordmark implementiert.
- [x] Report-Header und Running-Header auf Emblem/Wordmark umgestellt.
- [x] `CapitalAiLogo` verwendet kanonische CSS-Tokens und keine veraltete Default-Version.

### P1.3 Typografie

- [x] Rollen für Display, Body und Mono dokumentiert.
- [x] Client-PDF verwendet deterministische PDF-safe Fallbacks statt nicht eingebettete Webfonts vorzutäuschen.
- [x] NotebookLM nutzt druckstabile lokale Fallbacks, aber dieselben Rollen und Farben.

### P1.4 NotebookLM Internal Brand

- [x] Navy-Sonderpalette entfernt.
- [x] Cover, TOC, Tabellen, Codeblöcke und Running Header an CAPITAL-AI Gold/Cyan/Purple ausgerichtet.
- [x] Semantisches HTML mit `header`, `nav`, `main`, `article` und sauberer Heading-Hierarchie.
- [x] Generator-Abhängigkeiten reproduzierbar dokumentiert/gepinnt.

## P2 — Accessibility und Qualitätsgates

### P2.1 Accessibility Profiles

- [x] Zentrale Renderer-Profile definiert:
  - `client-jsPDF`: language + metadata, **nicht** PDF/UA.
  - `documentation-weasyprint`: tagged PDF/UA-1 candidate.
- [x] Accessibility-Claims bleiben evidence-gated.

### P2.2 WeasyPrint PDF/UA

- [x] `pdf_variant="pdf/ua-1"` aktiviert.
- [x] `pdf_tags=True` aktiviert.
- [x] Dokument-Sprache, Titel, Autor und semantische Struktur gesetzt.
- [x] Smoke-Modus für kleinen deterministischen PDF/UA-Test hinzugefügt.

### P2.3 Client-jsPDF Accessibility Baseline

- [x] Dokument-Sprache `de-DE` gesetzt.
- [x] Accessibility-Profil in Metadaten/Contract abgebildet.
- [x] Keine PDF/UA-/BFSG-Zertifizierungsbehauptung.

### P2.4 Render-/Regression-Gates

- [x] jsPDF Brand-Smoke als echtes Test-PDF erzeugbar.
- [x] Poppler-basierter Verifier für `pdfinfo`, `pdftotext`, `pdftoppm` bereitgestellt.
- [x] A4/Page/Text/Brand-Render-Invarianten abgebildet.
- [x] PDF/UA-Smoke kann auf `Tagged: yes` geprüft werden.
- [x] Unit-Tests schützen Brand-, Token- und Accessibility-Contracts.

### P2.5 Governance-Abschluss

- [x] ADR-0093 dokumentiert Renderer-/Accessibility-Grenze; ADR-0092 bleibt der Privacy-Entscheidung aus PR #434 vorbehalten.
- [x] Dokument-Registry enthält ADR-0093 und die P1/P2-Artefakte.
- [x] Implementierungs-Evidence mit Vorher/Nachher-Matrix erstellt.
- [x] Kostenrelevante CI/Build-Läufe wurden nicht vor PR-Erstellung gestartet.
- [x] Implementierungsbranch mehrfach gegen fortgeschrittene Main-Stände synchronisiert.
- [x] PR #433/M10-Closure-Korrelation additiv übernommen.
- [x] PR #437/M10-Post-Merge-Traceability vor dem finalen #436-Merge ebenfalls über aktuellen Main aufgenommen.
- [x] PR #436 Human-gemerged; Merge-Commit `f5d39288d3b854d5a84001ed0f4046f29e5cc840`.
- [x] Finaler Governance Run #1239 (`32239637308`) auf Head `027c278815b465aca81b00d4435f35048b61498d`: PASS.
- [x] Finaler ordinary CI Run #1917 (`32239637176`) dokumentiert: M10-Autorisierung stoppte vor Checkout; keine falsche Test-/Build-PASS-Aussage.

## Parallel-PR-Korrelation und Merge-Race

Die P1/P2-Implementierung wurde während ihrer Laufzeit gegen parallele Änderungen korreliert:

- **PR #433:** M10 Closure; vor #436 gemerged. Direkter Overlap war ausschließlich `docs/governance/document-registry.json`; additiv reconciled.
- **PR #437:** M10 Post-Merge Traceability; vor dem finalen #436-Merge auf `main` gelandet und durch die letzte Branch-Synchronisierung übernommen.
- **PR #434:** kein direkter Dateioverlap mit dem PDF-Scope; `ADR-0092` bleibt Privacy vorbehalten.
- **PR #435:** direkter Overlap mit dem PDF-Scope ausschließlich über `docs/governance/document-registry.json`; kein Scoring-/Runtime-Code wurde von #436 überschrieben.

Der finale Merge von PR #436 basiert auf einem zuletzt gegen den fortgeschrittenen Main-Stand synchronisierten Head. Post-Merge ist `main@f5d39288d3b854d5a84001ed0f4046f29e5cc840` die kanonische P1/P2-Landing-Baseline.

## Definition of Done — Abschluss

P1/P2 sind abgeschlossen:

1. alle aktiven jsPDF-Reports beziehen Emblem, Wordmark, gemeinsame Tokens, Metadaten und Accessibility-Profil aus dem zentralen Contract;
2. NotebookLM-PDFs verwenden die CAPITAL-AI Internal Brand und sind auf tagged PDF/UA-1 konfiguriert;
3. kein aktiver PDF-Pfad enthält einen unbelegten Accessibility-/Compliance-Claim;
4. statische Regressionstests und Render-Smoke-Tools sind im Repository vorhanden;
5. Governance-/Dokumentationsartefakte sind aktualisiert;
6. der finale Branch-Main-Abgleich wurde ohne unbehandelte Korrelation abgeschlossen;
7. verfügbare CI-/Governance-Ergebnisse sind dokumentiert;
8. PR #436 ist Human-gemerged und der Scope ist auf `main` gelandet.

### Residualer Verifikationshinweis

Der finale ordinary CI-Lauf auf dem letzten PR-Head wurde vom M10-Autorisierungsgate **vor** Checkout/TypeScript/Tests/Build beendet. Deshalb existiert aus diesem Lauf kein technischer Test-/Build-PASS. Das ändert den gelandeten Implementierungsstatus nicht, begrenzt aber die belastbare technische Evidence. Formale PDF/UA-Konformität bleibt unabhängig davon weiterhin artefaktbezogen zu verifizieren und darf nicht aus der Renderer-Konfiguration allein abgeleitet werden.
