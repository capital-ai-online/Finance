# PDF Branding Finalization Roadmap — P1/P2

- **Status:** IMPLEMENTATION COMPLETE / FINAL MAIN + PR VALIDATION PENDING
- **Datum:** 2026-08-19
- **Owner:** CAPITAL-AI Owner
- **Branch:** `agent/pdf-branding-p1-p2-final`
- **Parent:** ADR-0091 / ADR-0093 / PR #432
- **Ziel:** PDF-Branding nach P0 visuell, technisch und accessibility-seitig abschließen, ohne unbelegte Konformitätsclaims einzuführen.

## Ausgangslage

P0 hat aktive jsPDF-Reports auf einen gemeinsamen Brand-/Metadaten-Contract gehoben, Versionsdrift und instabile Report-IDs entfernt sowie Legacy-/Compliance-Claims bereinigt. Offen blieben bewusst:

1. echtes CAPITAL-AI Emblem/Wordmark im PDF,
2. einheitliche Typografie-Rollen,
3. NotebookLM-/WeasyPrint-Branding,
4. Accessibility-/Tagged-PDF-Strategie,
5. Render-/Regression-Gates.

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

- [x] ADR-0093 dokumentiert Renderer-/Accessibility-Grenze. Die zunächst reservierte 0092 wurde nach Erkennung der Parallel-PR-#434-Kollision verworfen.
- [x] Dokument-Registry aktualisiert; finale Nummernkorrektur auf ADR-0093 ist Bestandteil dieses Branches.
- [x] Implementierungs-Evidence mit Vorher/Nachher-Matrix erstellt.
- [ ] Branch unmittelbar vor PR-Erstellung gegen aktuelles `main` vergleichen und bei Main-Advance korrelieren.
- [x] Kostenrelevante CI/Build-Läufe werden erst nach PR-Erstellung zugelassen.

## Parallel-PR-Korrelation

Zum Implementierungsabschluss sind #433, #434 und #435 offen. Direkte fachliche PDF-/Runtime-Pfadüberschneidungen wurden nicht festgestellt. `docs/governance/document-registry.json` ist jedoch ein additiver Governance-Hotspot aller drei Parallel-PRs und muss bei einem vorherigen Merge erneut reconciled werden.

Besonderer Fund: PR #434 reserviert `ADR-0092` für Privacy-Hardening. Die PDF-Entscheidung verwendet deshalb `ADR-0093`.

## Definition of Done

P1/P2 gelten als fachlich implementiert, wenn:

1. alle aktiven jsPDF-Reports Emblem, Wordmark, gemeinsame Tokens, Metadaten und Accessibility-Profil aus dem zentralen Contract beziehen;
2. NotebookLM-PDFs die CAPITAL-AI Internal Brand verwenden und standardmäßig tagged PDF/UA-1 erzeugen;
3. kein aktiver PDF-Pfad einen unbelegten Accessibility-/Compliance-Claim enthält;
4. statische Regressionstests und Render-Smoke-Tools im Repository vorhanden sind;
5. Governance-/Dokumentationsartefakte aktualisiert sind;
6. der finale Branch-Main-Abgleich ohne unbehandelte Korrelation abgeschlossen ist;
7. CI-Ergebnisse nach PR-Erstellung dokumentiert werden. Ein externes Human-/Passkey-Gate darf nicht durch Code umgangen werden.
