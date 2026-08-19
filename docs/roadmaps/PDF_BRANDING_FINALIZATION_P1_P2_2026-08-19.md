# PDF Branding Finalization Roadmap — P1/P2

- **Status:** IN PROGRESS
- **Datum:** 2026-08-19
- **Owner:** CAPITAL-AI Owner
- **Branch:** `agent/pdf-branding-p1-p2-final`
- **Parent:** ADR-0091 / PR #432
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

- [ ] PDF-Brandwerte werden build-time aus `docs/frontend/design-tokens.json` abgeleitet.
- [ ] Test stellt sicher, dass PDF- und CSS-Kernfarben nicht driften.
- [ ] Keine neue unabhängige Farbpalette in Exportern.

### P1.2 Emblem und Wordmark

- [ ] Gemeinsames Vektor-Emblem für jsPDF implementieren.
- [ ] Gemeinsames CAPITAL-AI Wordmark implementieren.
- [ ] Report-Header und Running-Header auf Emblem/Wordmark umstellen.
- [ ] `CapitalAiLogo` verwendet kanonische CSS-Tokens und keine veraltete Default-Version.

### P1.3 Typografie

- [ ] Rollen für Display, Body und Mono dokumentieren.
- [ ] Client-PDF verwendet deterministische PDF-safe Fallbacks statt nicht eingebettete Webfonts vorzutäuschen.
- [ ] NotebookLM nutzt druckstabile lokale Fallbacks, aber dieselben Rollen und Farben.

### P1.4 NotebookLM Internal Brand

- [ ] Navy-Sonderpalette entfernen.
- [ ] Cover, TOC, Tabellen, Codeblöcke und Running Header an CAPITAL-AI Gold/Cyan/Purple ausrichten.
- [ ] Semantisches HTML mit `header`, `nav`, `main`, `article` und sauberer Heading-Hierarchie.
- [ ] Generator-Abhängigkeiten reproduzierbar dokumentieren/pinnen.

## P2 — Accessibility und Qualitätsgates

### P2.1 Accessibility Profiles

- [ ] Zentrale Renderer-Profile definieren:
  - `client-jsPDF`: language + metadata, **nicht** PDF/UA.
  - `documentation-weasyprint`: tagged PDF/UA-1.
- [ ] Accessibility-Claims bleiben evidence-gated.

### P2.2 WeasyPrint PDF/UA

- [ ] `pdf_variant="pdf/ua-1"` aktivieren.
- [ ] `pdf_tags=True` aktivieren.
- [ ] Dokument-Sprache, Titel, Autor und semantische Struktur setzen.
- [ ] Smoke-Modus für kleinen deterministischen PDF/UA-Test hinzufügen.

### P2.3 Client-jsPDF Accessibility Baseline

- [ ] Dokument-Sprache `de-DE` setzen.
- [ ] Accessibility-Profil in Metadaten/Contract abbilden.
- [ ] Keine PDF/UA-/BFSG-Zertifizierungsbehauptung.

### P2.4 Render-/Regression-Gates

- [ ] jsPDF Brand-Smoke als deterministisches Test-PDF erzeugbar machen.
- [ ] Poppler-basierter Verifier für `pdfinfo`, `pdftotext`, `pdftoppm` bereitstellen.
- [ ] A4/Page/Text/Brand-Render-Invarianten prüfen.
- [ ] PDF/UA-Smoke muss als `Tagged: yes` erkannt werden.
- [ ] Unit-Tests schützen Brand-, Token- und Accessibility-Contracts.

### P2.5 Governance-Abschluss

- [ ] ADR-0092 dokumentiert Renderer-/Accessibility-Grenze.
- [ ] Dokument-Registry aktualisiert.
- [ ] Implementierungs-Evidence mit Vorher/Nachher-Matrix erstellen.
- [ ] Branch unmittelbar vor Abschluss gegen aktuelles `main` vergleichen.
- [ ] Erst nach PR-Erstellung kostenrelevante CI/Build-Läufe zulassen.

## Definition of Done

P1/P2 gelten als fachlich implementiert, wenn:

1. alle aktiven jsPDF-Reports Emblem, Wordmark, gemeinsame Tokens, Metadaten und Accessibility-Profil aus dem zentralen Contract beziehen;
2. NotebookLM-PDFs die CAPITAL-AI Internal Brand verwenden und standardmäßig tagged PDF/UA-1 erzeugen;
3. kein aktiver PDF-Pfad einen unbelegten Accessibility-/Compliance-Claim enthält;
4. statische Regressionstests und Render-Smoke-Tools im Repository vorhanden sind;
5. Governance-/Dokumentationsartefakte aktualisiert sind;
6. der finale Branch-Main-Abgleich ohne unbehandelte Korrelation abgeschlossen ist;
7. CI-Ergebnisse nach PR-Erstellung dokumentiert werden. Ein externes Human-/Passkey-Gate darf nicht durch Code umgangen werden.
