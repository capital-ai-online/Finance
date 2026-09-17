# CAPITAL-AI Konsolidierte Gesamtroadmap

Status: ACTIVE — CANONICAL EXECUTION PORTFOLIO  
Stand: 2026-08-16  
Repository-Baseline: `main@0c07e1a43fde4dc0419f5f60ac74230608927393`  
Owner: SvenKulessa  
Authority: ADR-0071 + ESS-0023 + ROADMAP-INTEGRATED-DC-SA-0001

## 1. Zweck

Dieses Dokument ersetzt den bisherigen reinen Portfolio-Index durch eine vollständige, dokumentenbasierte Ausführungsroadmap. Es führt alle noch offenen Roadmaps, die DEVELOPMENT Chain M0–M10, die P0–P3-Prioritäten und begrenzte Systemadministrator-Prototypaufträge zusammen.

Es ersetzt keine restriktivere ADR-, ESS-, IAM-, REM-, Runbook-, Evidence- oder Human/Owner-Authority. Ein Status `DOCUMENTATION READY` oder `PROTOTYPE READY` erzeugt keine Mutationsberechtigung.

**Domain-Update 2026-08-15:** SEO Management und Marketing Agent sind in **SEO-GM-ROADMAP-0002** (`docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`) zu einem Single Point of Trust konsolidiert. Die früheren Dateien `docs/seo/SEO_MANAGEMENT_ROADMAP.md` und `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` sind SUPERSEDED.

**Portfolio-Sync SEO-GM 2026-08-16:** Die Portfolio-Zeile `SEO-GM` in §3 war auf dem Stand SEO-GM-ROADMAP-0002 v0002.1 stehengeblieben und nannte bereits erledigte Arbeitspakete als nächste Schritte. Sie ist auf **v0002.11** nachgezogen (WP-S1, Q3, WP-D1/D2/D3 und WP-S2 VERIFIED; WP-M0 durch Owner-ACCEPT erfuellt). Diese Synchronisation ist rein statusabbildend; Programmautorität und Statusfortschreibung liegen unverändert allein bei SEO-GM-ROADMAP-0002.

**Integration 2026-08-15:** Die DEVELOPMENT Chain und der Systemadmin-Agent sind in der kanonischen Ausführungsroadmap **ROADMAP-INTEGRATED-DC-SA-0001** (`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`) verbunden. Diese Integrated Roadmap ist die verbindende Ausführungsautorität für DC + SA Phasen (I0–I4).

## 2. Verbindliche Authority-Reihenfolge

1. verifizierte Runtime-, Code- und Produktions-Evidence;
2. ausdrückliche Human/Owner-Freigabe;
3. spezifische ADR/ESS/IAM/REM/Runbook-Authority;
4. `INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` (ROADMAP-INTEGRATED-DC-SA-0001) für DC+SA-Verbindung;
5. `DEVELOPMENT_CHAIN_ROADMAP.md` (Detail-Phasen);
6. diese Gesamtroadmap (Portfolio-Index);
7. Fachroadmaps (für SEO/Google Marketing: **SEO-GM-ROADMAP-0002**);
8. historische oder als Legacy/SUPERSEDED markierte Indizes.

Bei Widerspruch gilt die restriktivere, aktuellere und spezifischere Regel.

## 3. Konsolidiertes Portfolio

| ID | Programm | Quelle | Konsolidierter Status | Nächster zulässiger Schritt |
|---|---|---|---|---|
| **DC-SA** | **Integrated DC + SA** | **`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` (ROADMAP-INTEGRATED-DC-SA-0001)** | **ACTIVE — CANONICAL**; I0 VERIFIED PASS; I1 (M8) **VERIFIED PASS** (2026-08-16); I2 (M9) unblocked, not yet started | I2/M9-Vorbereitung nur auf separate, ausdrückliche Owner-Anweisung; einzelne Drills bleiben Owner-autorisiert |
| DC | DEVELOPMENT Chain | `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | M0–M8 VERIFIED PASS (M8 2026-08-16); M9 unblocked, not yet started; M10 blockiert | M9-Drill-Vorbereitung nur auf separate, ausdrückliche Owner-Anweisung; jeder einzelne Drill separat autorisiert |
| S1 | Security Hardening | `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | READY FOR OWNER REVIEW; S1.0–S1.6 nicht vollständig VERIFIED PASS | F-01–F-18 gegen aktuelles main revalidieren |
| DOC | Documentary/Event Value Chain | `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` | ACTIVE / PARTIAL | D0 read-only Baseline |
| SA | Systemadministrator-Agent | `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | SA0–SA4 VERIFIED PASS; SA5 blockiert | dokumentenbasierte Prototypen nach ESS-0023 |
| IAM-DIAG | Diagnostics IAM | `docs/roadmaps/AI_SYSTEM_ADMIN_DIAGNOSTICS_IAM_ROADMAP.md` | teilweise überholt, nicht vollständig evidenzgebunden | retained/superseded/migrated-Matrix |
| **SEO-GM** | **SEO + Google Marketing + Content Distribution** | **`docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` (SEO-GM-ROADMAP-0002, v0002.11)** | **ACTIVE — CANONICAL** (Stand 2026-08-16); Q1/Q4/Q5 DONE, **Q3 VERIFIED**, Q2 PARTIAL; **D1/D2/D3 VERIFIED** (PR #375, PR #360); **S1 VERIFIED** (ADR-0082); **S2 VERIFIED** (ADR-0084 Prerender); S3 DONE; S4 IN PROGRESS; **WP-M0 ERFÜLLT** (Owner-ACCEPT 2026-08-16: ESS-0024 + ADR-0080 accepted, **ohne** Runtime-Capability); D4/D5 offen; ADR-0035 Strict-CSP-DoD offen | **WP-N1** (`POST /api/social-media/generate`, Text-Packages ohne Publish) als naechstes Marketing-Paket; Q2-Restabschluss und WP-D4 als Code-Arbeit; WP-D5 optional (Credentials Owner-separat). Runtime-Enablement des Marketing-Agenten bleibt gesperrt: Execution Policy §18 unerfuellt. |
| MA | Marketing Agent (historisch) | `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` | **SUPERSEDED** → SEO-GM | keine parallele Fortschreibung |
| SEO | SEO Management (historisch) | `docs/seo/SEO_MANAGEMENT_ROADMAP.md` | **SUPERSEDED** → SEO-GM | keine parallele Fortschreibung |
| GOV | GitHub/CI/Branch Governance | DEVELOPMENT Policy + PR-Template | laufend | Kosten-, Gate- und Branch-Cleanup-Evidence pflegen |
| AI-T | AI-Transparenz/Provenance | ADR-0057/0059/0062 + Documentary Provenance; eigener Content-Transparency-Contract noch offen | teilweise nachgewiesen | P0-Vertrag für kundenwirksame Ausgaben erstellen und Ausgabe-/Auditpfade verifizieren |

Nicht als eigene offene Programme zählen: `docs/architecture/ROADMAP.md`, `AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md`, abgeschlossene Vocabulary-Migrationen, einzelne Work Packages und Work Claims.

Hinweis zur Nummerierung: Die vorhandene `.ai/skills/ESS-0020-Supabase-Native-MFA-AAL2-Hardening.md` ist ausschließlich MFA/AAL2-Authority. Sie darf nicht als AI-Content-Transparency-Contract zitiert werden. Ein eigener Transparenzvertrag bleibt Bestandteil von P0-1 und erhält erst nach Kollisionsprüfung eine freie ESS-ID.

## 4. Mutationsanfrage und Freigabe

Eine Mutation darf initiiert werden durch:

- den Owner im Chat, PR oder freigegebenen Mandat;
- den Systemadministrator-Agenten als formale Rückfrage mit Lösungsvorschlägen.

Eine Agentenanfrage ist keine Genehmigung. Vor jeder sicherheits-, datenintegritäts-, manipulations- oder produktionsrelevanten Mutation muss ein Mutation Proposal vorliegen (Felder unverändert wie zuvor dokumentiert).

Nur der Owner kann HIGH/CRITICAL-, Produktions-, IAM-, Billing-, Datenbank-, Deployment-, Secret-, DNS- oder externe Plattformmutation genehmigen. Provider- oder Modellidentität erzeugt keine Authority.

## 5–13. DEVELOPMENT Chain, Prioritäten, Prototyp-Vertrag, Abhängigkeiten

Der Inhalt der Abschnitte 5–13 aus dem Stand 2026-08-14 bleibt in Substanz gültig (M5/M5A/M6/M7 Evidence, P0–P3, SA-Prototypen, Branch-Lifecycle).

**Anpassung P3-2:** SEO/Marketing-Baseline ist nicht mehr „parallel read-only Q1–Q6/MA0“, sondern folgt **SEO-GM-ROADMAP-0002** (Single Point of Trust). SA-P11 bleibt read-only Revalidator gegen die neue kanonische Roadmap, ohne Publikation.

**Ausführungsbacklog Position 11:** „SEO/MA/Monetarisierung“ → Ausführung ausschließlich unter SEO-GM-ROADMAP-0002 und jeweiliger ADR/ESS-Authority.

## Abschlusskriterien (unverändert im Kern)

Die Roadmap ist erst abgeschlossen, wenn M0–M10 VERIFIED PASS, P0/P1 geschlossen oder akzeptiert, keine unowned HIGH/CRITICAL, produktive Mutationen Owner-genehmigt, Traceability vollständig, **offene Fachroadmaps abgeschlossen, superseded oder archiviert** (SEO+MA: durch SEO-GM-ROADMAP-0002 erfüllt sobald dessen DoD erreicht ist), und alle gemergten Arbeitsbranches gelöscht sind.
