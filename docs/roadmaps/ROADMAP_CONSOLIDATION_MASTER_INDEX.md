# CAPITAL-AI Roadmap Consolidation Master Index

Status: ACTIVE — CANONICAL PORTFOLIO INDEX  
Stand: 2026-08-14  
Repository-Baseline: `main@66da35b80ba23e4f216318a9cd9f9b4e7b787679` (PR #255 Merge)  
Owner: SvenKulessa  
Master-Ausführungsroadmap: `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`

## 1. Zweck und Authority

Dieses Dokument konsolidiert alle aktiven CAPITAL-AI-Roadmaps in einem Portfolio-Index. Es ersetzt keine ESS-, ADR-, Runbook-, Evidence-, IAM- oder Human-/Owner-Authority und erzeugt keine Mutationsberechtigung.

Bei Statuswidersprüchen gilt:

1. verifizierte Code-/Produktions-Evidence auf dem aktuellen `main`;
2. neueste spezifische ESS-/ADR-/Governance-Authority;
3. `DEVELOPMENT_CHAIN_ROADMAP.md` als operative Phasensteuerung;
4. dieses Dokument als Portfolio- und Abhängigkeitsindex;
5. Fachroadmaps;
6. historische oder ausdrücklich als Legacy gekennzeichnete Statusindizes.

Ein Eintrag `DOCUMENTATION READY` autorisiert keine Implementierung oder externe Mutation.

## 2. Kanonisches Portfolio

| ID | Programm | Kanonisches Dokument | Konsolidierter Zustand | Ausführbarer nächster Schritt | DEVELOPMENT-Chain-Gate |
|---|---|---|---|---|---|
| DC | DEVELOPMENT Chain | `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | M0–M4 COMPLETE; M5 Verifikation offen; M5A Code gemergt, Produktionsverifikation offen; M6–M10 blockiert | M5/M5A Post-Merge- und Produktions-Evidence aktualisieren | Master |
| S1 | Security Hardening | `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | READY FOR OWNER REVIEW; S1.0–S1.6 nicht als VERIFIED PASS belegt | S1.0 Befunde F-01–F-18 gegen aktuelles `main` revalidieren | vor M6 High-Severity Gate |
| DOC | Documentary / Event Value Chain | `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` | ACTIVE / PARTIAL IMPLEMENTATION | D0 Manifest-, Versions- und Code-Baseline | normaler Branch/PR-Zyklus; geschützte Änderungen nach DC-Gate |
| SA | Systemadmin Agent | `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | SA0–SA4 VERIFIED PASS; SA5 BLOCKED | Statuskorrektur des überholten M5A/SA4-Handoffs; SA5 nicht ausführen | SA5 erst nach M10 VERIFIED PASS |
| IAM-DIAG | Diagnostics IAM | `docs/roadmaps/AI_SYSTEM_ADMIN_DIAGNOSTICS_IAM_ROADMAP.md` | nicht phasenweise evidenzgebunden; teilweise durch neuere SA/DC-Authority überholt | Ist-Abgleich und Aufteilung in `retained / superseded / migrated` | keine eigenständige Mutationsauthority |
| MA | Marketing Agent | `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` | DRAFT; MA0 IN PROGRESS; MA1–MA7 blockiert | MA0-Dokumentationspaket konsolidieren und Owner Review | keine Runtime-/Publishing-Mutation |
| SEO | SEO Management | `docs/seo/SEO_MANAGEMENT_ROADMAP.md` | ACTIVE, aber Baseline 2026-08-08; Q–J nicht aktuell evidenzgebunden | Q1–Q6 gegen aktuelles `main` revalidieren | Code/Plattformschritte nach DC/S1 und separater Authority |

## 3. Nicht doppelt als eigenständige Roadmap zählen

| Dokument | Klassifizierung | Behandlung |
|---|---|---|
| `docs/architecture/ROADMAP.md` | DEVELOPMENT-Chain-Statusindex | mit DC synchronisieren; kein zusätzliches Programm |
| `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` | Legacy-Dateiname / paralleler DC-Index | stabile Referenzen erhalten; Status aus DC ableiten |
| `docs/architecture/VOCABULARY_GOVERNANCE_MIGRATION_ROADMAP.md` | COMPLETE / OPERATIONAL | aus offenem Portfolio entfernen; nur Betriebsgovernance |
| `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md` | umgesetztes Code-Slice-Arbeitspaket | nicht als Roadmap zählen; M5A bleibt bis Produktions-Evidence offen |
| `.ai/work-claims/*ROADMAP*` | Arbeitsclaims | keine Roadmap-Authority |

## 4. Konsolidierte Abhängigkeiten

```text
M5 Audit-Verifikation
→ M5A Native MFA/AAL2 Produktionsverifikation
→ S1 High-Severity Gate
→ M6 Supply Chain
→ M7 Deployment Identity
→ M8 Agent Cutover
→ M9 Assurance
→ M10 Passkey-only Owner Authorization
→ SA5 darf erst danach neu bewertet werden
```

Parallel dokumentierbar, aber nicht autorisierend:

- DOC D0 und read-only Discovery;
- IAM-DIAG Ist-Abgleich;
- SEO Revalidierung;
- MA0 Dokumentationsabschluss.

Parallel laufende Arbeit darf keine gemeinsamen Dateien ohne explizite Single-Writer-Abstimmung verändern.

## 5. Erkannte Statuswidersprüche und verbindliche Auflösung

### C-01 — M5A Repository-Code

PR #255 ist in `main@66da35b8` gemergt. Ältere Roadmaps mit `CI PENDING MERGE`, `REQUIRED / PLANNED` oder einer noch ausstehenden Codeimplementierung sind veraltet.

Konsolidierter Zustand:

- Repository-Code: `MERGED`;
- Produktions-/Owner-Faktor-Mutation: nicht aus dem Merge ableitbar;
- M5A Gesamtphase: bis Post-Merge-, AAL2-, Recovery- und Advisor-Evidence `IN PROGRESS`.

### C-02 — SA4 als M5A-Executor

Der SA4-Pfad ist ein Ein-Zweck-Host für `REM-SA4-PILOT-001` und kann `REM-M5A-REPOSITORY-001` nicht ausführen. Aussagen in der SA-Roadmap, M5A solle über den verifizierten SA4-Host ausgeführt werden, sind durch die neuere Development-Chain-Korrektur und die direkte Owner-instruierte PR-#255-Implementierung überholt.

Konsolidierte Regel: SA4 bleibt als historisch verifizierter Pilot erhalten, wird aber nicht nachträglich als generischer M5A-Ausführungshost dargestellt.

### C-03 — M5/SA3B-Statusdrift

Ältere Enterprise-/AI-Agent-Indizes nennen SA3B `VERIFICATION PENDING`; die neuere SA-Roadmap führt SA3B als `COMPLETE / VERIFIED PASS`. Vor weiterer externer Mutationsabhängigkeit muss die aktuelle Evidence-Kette gegen das reale M5-Audit-Backend bestätigt und anschließend in allen DC-Indizes synchronisiert werden.

### C-04 — SEO- und Diagnostics-Baselines

SEO basiert auf 2026-08-08; Diagnostics IAM besitzt keine verlässlichen Phase-Statusmarker. Keine Maßnahme wird allein aufgrund fehlender Abschlussmarker neu implementiert. Zuerst erfolgt ein read-only Code-/Evidence-Abgleich.

## 6. Priorisierte Konsolidierungs-Backlog

| Reihenfolge | Arbeitspaket | Änderungsart | Exit |
|---:|---|---|---|
| 1 | DC/M5/M5A nach PR #255 synchronisieren | Dokumentation/Evidence | alle DC-Indizes nennen denselben SHA und Status |
| 2 | S1.0 gegen `main@66da35b8` revalidieren | Diagnose/Dokumentation | F-01–F-18 mit Owner, Status und Evidence |
| 3 | SA-Roadmap M5A/SA4-Widerspruch korrigieren | Dokumentation | kein falscher Executor-Handoff |
| 4 | Documentary D0 ausführen | read-only Analyse + später separater PR | Manifest/Version/Code konsistent |
| 5 | Diagnostics IAM konsolidieren | Dokumentation | retained/superseded/migrated je Phase |
| 6 | SEO Q1–Q6 revalidieren | Diagnose/Dokumentation | aktueller Ist-Status statt 08.08.-Annahme |
| 7 | Marketing MA0 Owner-Review vorbereiten | Dokumentation | MA0 angenommen oder ausdrücklich zurückgestellt |

Jedes Paket verwendet einen frischen Branch vom dann aktuellen `main`, einen eigenen Claim, einen deutschen PR nach vollständiger Vorlage, Human File Review, erforderliche CI, Human Merge und anschließende Remote-Branch-Löschung.

## 7. Mutations- und Sicherheitsgrenze

Diese Konsolidierung:

- verändert keinen Anwendungscode;
- verändert keine Workflows, Rulesets oder Required Checks;
- verändert keine Secrets oder Credentials;
- mutiert weder Supabase noch Render, Stripe, IONOS oder andere Produktionssysteme;
- autorisiert weder Deployment noch autonome Agentenmutation;
- ändert keine bestehenden ESS-/ADR-Entscheidungen.

Jede spätere sicherheits-, datenintegritäts-, manipulations- oder mutationsrelevante Änderung benötigt vor Branch-Vorbereitung konkrete Lösungsoptionen für den Owner sowie die jeweils geltenden Approval-, Precheck-, Rollback- und Evidence-Gates.

## 8. Pflegevertrag

Nach jedem Roadmap-relevanten Merge werden aktualisiert:

1. aktuelle `main`-SHA;
2. betroffene Portfoliozeile;
3. Status und Evidence;
4. nächster zulässiger Schritt;
5. Blocker/Abhängigkeit;
6. veraltete parallele Statusindizes;
7. Branch-Cleanup-Evidence.

Ein Programm wird erst aus dem offenen Portfolio entfernt, wenn seine kanonische Roadmap `COMPLETE / VERIFIED PASS` oder `SUPERSEDED / ARCHIVED` ausweist und die Abschluss-Evidence referenziert.
