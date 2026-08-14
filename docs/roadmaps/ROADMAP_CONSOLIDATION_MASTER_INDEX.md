# CAPITAL-AI Konsolidierte Gesamtroadmap

Status: ACTIVE — CANONICAL EXECUTION PORTFOLIO  
Stand: 2026-08-14  
Repository-Baseline: `main@0efeb05e507698129ff1d72de4887554d3f32100` (PR #256 Merge)  
Owner: SvenKulessa  
PR: #257  
Authority: ADR-0071 + ESS-0023

## 1. Zweck

Dieses Dokument ersetzt den bisherigen reinen Portfolio-Index durch eine vollständige, dokumentenbasierte Ausführungsroadmap. Es führt alle noch offenen Roadmaps, die DEVELOPMENT Chain M0–M10, die P0–P3-Prioritäten und begrenzte Systemadministrator-Prototypaufträge zusammen.

Es ersetzt keine restriktivere ADR-, ESS-, IAM-, REM-, Runbook-, Evidence- oder Human/Owner-Authority. Ein Status `DOCUMENTATION READY` oder `PROTOTYPE READY` erzeugt keine Mutationsberechtigung.

## 2. Verbindliche Authority-Reihenfolge

1. verifizierte Runtime-, Code- und Produktions-Evidence;
2. ausdrückliche Human/Owner-Freigabe;
3. spezifische ADR/ESS/IAM/REM/Runbook-Authority;
4. `DEVELOPMENT_CHAIN_ROADMAP.md`;
5. diese Gesamtroadmap;
6. Fachroadmaps;
7. historische oder als Legacy markierte Indizes.

Bei Widerspruch gilt die restriktivere, aktuellere und spezifischere Regel.

## 3. Konsolidiertes Portfolio

| ID | Programm | Quelle | Konsolidierter Status | Nächster zulässiger Schritt |
|---|---|---|---|---|
| DC | DEVELOPMENT Chain | `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | M0–M5 **VERIFIED PASS**; **M5A VERIFIED PASS** (2026-08-14); M6 bereit zum Start, M7–M10 weiterhin sequenziell blockiert | M6-Arbeitspaket beauftragen |
| S1 | Security Hardening | `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | READY FOR OWNER REVIEW; S1.0–S1.6 nicht vollständig VERIFIED PASS | F-01–F-18 gegen aktuelles main revalidieren |
| DOC | Documentary/Event Value Chain | `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` | ACTIVE / PARTIAL | D0 read-only Baseline |
| SA | Systemadministrator-Agent | `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | SA0–SA4 VERIFIED PASS; SA5 blockiert | dokumentenbasierte Prototypen nach ESS-0023 |
| IAM-DIAG | Diagnostics IAM | `docs/roadmaps/AI_SYSTEM_ADMIN_DIAGNOSTICS_IAM_ROADMAP.md` | teilweise überholt, nicht vollständig evidenzgebunden | retained/superseded/migrated-Matrix |
| MA | Marketing Agent | `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` | DRAFT; MA0 offen | MA0 Dokumentation/Owner Review |
| SEO | SEO Management | `docs/seo/SEO_MANAGEMENT_ROADMAP.md` | ACTIVE, Baseline 2026-08-08 | Q1–Q6 read-only revalidieren |
| GOV | GitHub/CI/Branch Governance | DEVELOPMENT Policy + PR-Template | laufend | Kosten-, Gate- und Branch-Cleanup-Evidence pflegen |
| AI-T | AI-Transparenz/Provenance | ADR-0057/0059/0062 + Documentary Provenance; eigener Content-Transparency-Contract noch offen | teilweise nachgewiesen | P0-Vertrag für kundenwirksame Ausgaben erstellen und Ausgabe-/Auditpfade verifizieren |

Nicht als eigene offene Programme zählen: `docs/architecture/ROADMAP.md`, `AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md`, abgeschlossene Vocabulary-Migrationen, einzelne Work Packages und Work Claims.

Hinweis zur Nummerierung: Die vorhandene `.ai/skills/ESS-0020-Supabase-Native-MFA-AAL2-Hardening.md` ist ausschließlich MFA/AAL2-Authority. Sie darf nicht als AI-Content-Transparency-Contract zitiert werden. Ein eigener Transparenzvertrag bleibt Bestandteil von P0-1 und erhält erst nach Kollisionsprüfung eine freie ESS-ID.

## 4. Mutationsanfrage und Freigabe

Eine Mutation darf initiiert werden durch:

- den Owner im Chat, PR oder freigegebenen Mandat;
- den Systemadministrator-Agenten als formale Rückfrage mit Lösungsvorschlägen.

Eine Agentenanfrage ist keine Genehmigung. Vor jeder sicherheits-, datenintegritäts-, manipulations- oder produktionsrelevanten Mutation muss ein Mutation Proposal vorliegen:

| Feld | Pflichtinhalt |
|---|---|
| Requestor | Owner oder Systemadministrator-Agent |
| Ziel | exakter Dienst, Umgebung, Ressource und Tenant |
| Ist-Zustand | read-only Evidence mit Zeitpunkt und SHA/Version |
| Optionen | mindestens sichere Standardoption; bei echter Alternative 2–3 Varianten |
| Risiko | Security, Datenintegrität, Verfügbarkeit, Compliance, Kosten |
| Precheck | prüfbare Vorbedingungen |
| Operation | kleinste konkrete Mutation |
| Postcheck | erwartete positive und negative Nachweise |
| Rollback | ausführbarer Rücksetzweg und Trigger |
| Evidence | redigierter Zielpfad und Audit-Korrelation |
| Approval | ausdrückliche Owner-Freigabe für exakt diesen Zustand |

Nur der Owner kann HIGH/CRITICAL-, Produktions-, IAM-, Billing-, Datenbank-, Deployment-, Secret-, DNS- oder externe Plattformmutation genehmigen. Provider- oder Modellidentität erzeugt keine Authority.

## 5. Native MFA / M5A

**Update 2026-08-14 (nach Owner-Attestation):** Die read-only Verifikation aus Abschnitt „M5A
Exit" wurde durchgeführt — siehe `docs/evidence/m5a/M5A_VERIFIED_PASS_CLOSURE_EVIDENCE.md`.

Konsolidierter Status:

- Repository-Code aus PR #255/#256: `MERGED`;
- native MFA: **`VERIFIED PASS`** — beide Owner-Profile haben einen verifizierten nativen
  TOTP-Faktor (`auth.mfa_factors`, `status='verified'`) und eine read-only bestätigte `aal2`-Session
  (`auth.sessions`), beides direkt gegen Produktion geprüft, nicht nur Owner-Attestation;
- Security Advisor: das vormalige `auth_insufficient_mfa_options`-Finding ist nicht mehr vorhanden;
  keine neuen HIGH/CRITICAL-Findings;
- M5A ist damit `VERIFIED PASS`, nicht mehr `VERIFICATION PENDING`;
- keine erneute Aktivierung oder Faktoränderung ohne neues Proposal und Owner-Freigabe.

M5A Exit (alle Punkte erfüllt, siehe Closure-Evidence für Details je Punkt):

1. ✅ aktive Faktorart und Zielidentität redigiert belegt;
2. ✅ AAL2-Positivtest PASS;
3. ✅ AAL1-/fehlender-Faktor-Negativtest DENY (bestehende Testabdeckung, deployter Code);
4. ✅ Recovery/Reset Runbook geprüft;
5. ✅ privilegierter Auditinsert erfolgreich korreliert (authoritative Quelle direkt geprüft);
6. ✅ Advisor/Policy ohne unowned HIGH/CRITICAL;
7. ✅ Roadmap und Traceability synchronisiert (dieser Commit).

## 6. Prioritäten P0–P3

| Prio | Arbeitspaket | Roadmap-Bindung | Systemadministrator-Prototyp | Exit |
|---|---|---|---|---|
| P0-1 | AI-Transparenz aller produktiven AI-Ausgaben | DOC, M8, ESS-0023 | SA-P01 read-only Output-Inventar + Contract-Test-Skelett | alle kundenwirksamen Ausgaben klassifiziert |
| P0-2 | ADR-0059 Runtime-Auditstatus verifizieren | M5 | SA-P02 redigierter Audit-Probe-Plan (**abgeschlossen 2026-08-14**) | realer privilegierter Insert + Korrelation **PASS** — `docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md` |
| P0-3 | M5A Abschluss-Evidence | M5A | SA-P03 AAL2-/Recovery-Evidence Collector, read-only zuerst | M5A VERIFIED PASS |
| P1-1 | AI-Use-Case-Register | DOC/M8/M9 | SA-P04 Registry-Schema/Validator | Use Cases mit Materialität/Risiko/Owner |
| P1-2 | Provider-Failover/Modellwechsel | M8/M9 | SA-P05 Cutover-Simulator ohne Produktion | kontrollierter Cutover/Rollback PASS |
| P1-3 | S1 High-Severity Revalidierung | S1 vor M6 | SA-P06 Findings Normalizer | F-01–F-18 aktuell und ownergebunden |
| P2-1 | Datenqualitätsmetriken | DOC/M5/M9 | SA-P07 Provider Quality Contract | feldbezogene Qualität/Lineage messbar |
| P2-2 | Regulatorischer Roadmap-Checkpoint | DOC/M9 | SA-P08 Evidence-Mapping | Requirements→Code→Test→Evidence |
| P2-3 | IAM Diagnostics konsolidieren | M4/M9 | SA-P09 Status-Migrationsmatrix | retained/superseded/migrated vollständig |
| P3-1 | Explainability-Premium-Evidence | nach M9 | SA-P10 read-only Export Contract | kein Marketingclaim ohne Evidence |
| P3-2 | SEO/Marketing-Baseline | parallel read-only | SA-P11 Q1–Q6/MA0 Revalidator | aktuelle Baseline, keine Publikation |
| P3-3 | Documentary D0 | parallel read-only | SA-P12 Manifest/Version/Code Comparator | konsistente Documentary-Baseline |

## 7. DEVELOPMENT Chain M0–M10

| Phase | Status | Systemadministrator-Auftrag | Gate / Exit |
|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | Evidence nur erhalten/prüfen | unveränderte, redigierte Evidence |
| M1 Git Guardrails | COMPLETE | Branch-/Claim-/Cleanup-Prüfer | Human Merge; Branch danach löschen |
| M2 Architektur/Dokumentation | COMPLETE / laufende Pflege | ADR-/ESS-/Traceability-Linter | keine Authority-Lücke |
| M2G Freeze | COMPLETE | Drift-Erkennung | keine stillen Statusänderungen |
| M3 CI Hardening | COMPLETE / laufend | kostensensitiver Check-Plan | Owner Gate + erforderliche CI |
| M4 Agent IAM | COMPLETE | DENY-first Policy-Probes | keine Provider-Eskalation |
| M5 Audit/Telemetry | **VERIFIED PASS** | SA-P02 (abgeschlossen) | realer Auditinsert und OTEL-Korrelation — siehe `docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md` |
| M5A Native MFA/AAL2 | **VERIFIED PASS** | SA-P03 (abgeschlossen) | AAL2, DENY, Recovery, Advisor, Audit PASS — siehe `docs/evidence/m5a/M5A_VERIFIED_PASS_CLOSURE_EVIDENCE.md` |
| M6 Supply Chain | READY TO START | SBOM/Provenance-Prototyp | source→artifact attestation |
| M7 Deployment Identity | BLOCKED BY M6 | Mutation-Proposal Generator | Zielbindung, Approval, Postcheck, Rollback |
| M8 Agent Cutover | BLOCKED BY M7 | SA-P05 + Provider-Profile-Tests | semantisch äquivalente Policy |
| M9 Assurance | BLOCKED BY M8 | Angriffs-/Replay-/Kill-Switch-Drills | keine unowned CRITICAL Controls |
| M10 Passkey Owner Authorization | BLOCKED BY M9 | Shadow-Mode/WebAuthn-Prototyp | exact-state single-use Approval |

Keine blockierte Phase darf durch Dokumentationsreife übersprungen werden.

## 8. Systemadministrator-Prototyp-Vertrag

Jeder Prototyp besitzt:

1. eindeutige ID `SA-Pxx`;
2. Requirement- und ADR-/ESS-Verweise;
3. exakte current-main-Bindung;
4. erlaubte/verbotene Pfade;
5. Risiko- und Datenklassifikation;
6. positive und negative Tests;
7. keine Produktions-Secrets;
8. standardmäßig Mock/Sandbox/read-only;
9. Mutation Proposal statt stiller Mutation;
10. Human Review und deutscher PR;
11. Append-only Evidence;
12. Remote-Branch-Löschung nach Merge.

Der Agent darf eine Mutation aktiv beim Owner anfragen. Er muss stoppen, wenn Ziel, Approval, Precheck, Rollback oder Evidence-Pfad fehlen.

## 9. Programmabhängigkeiten

```text
M5 Audit Evidence
→ M5A Native MFA Abschlussverifikation
→ S1 High-Severity Gate
→ M6 Supply Chain
→ M7 Deployment Identity
→ M8 Provider-neutraler Cutover
→ M9 Assurance
→ M10 Passkey Owner Authorization
→ SA5 Neubewertung
```

Parallel nur read-only/dokumentarisch: Documentary D0, IAM-Diagnostics, SEO Q1–Q6, MA0 und AI-Use-Case-Register.

## 10. Dokumente pro Arbeitspaket

Pflicht, soweit anwendbar:

- Roadmap/Requirement;
- ADR für neue Architektur-, Trust-Boundary- oder Authority-Entscheidung;
- ESS/Contract für Agenten- oder Prozessverhalten;
- Threat/Risk Model;
- Runbook;
- Mutation Proposal;
- positive/negative Tests;
- redigierte Evidence;
- Traceability;
- PR-/CI-/Merge-/Branch-Cleanup-Nachweis.

## 11. Branch- und PR-Lifecycle

```text
current main
→ frischer scoped branch
→ deutscher Draft-PR
→ Human File Review
→ erforderliche CI
→ Human Merge
→ Remote-Branch löschen
→ Workspace bereinigen
→ Evidence/Status synchronisieren
```

Kein gemergter Branch wird wiederverwendet. PR #257 bleibt Documentation-only; Prototypcode folgt in separaten, phasenbezogenen PRs.

## 12. Konsolidiertes Ausführungsbacklog

| Reihenfolge | Paket | Modus | Startbedingung |
|---:|---|---|---|
| 1 | M5/M5A Evidence Sync | read-only/verifizierend | **erledigt** — M5 (`docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md`) und M5A (`docs/evidence/m5a/M5A_VERIFIED_PASS_CLOSURE_EVIDENCE.md`) beide VERIFIED PASS |
| 2 | P0 AI-Transparenz + Auditpfad | read-only/Testspezifikation | sofort |
| 3 | S1 Revalidierung | read-only | aktuelle main-Baseline |
| 4 | Documentary D0 | read-only | Single-Writer geklärt |
| 5 | IAM Diagnostics Matrix | Dokumentation | neuere Authority erfasst |
| 6 | M6 Prototyp | Repository-Code | **erfüllt (M5A VERIFIED PASS)** — Arbeitspaket noch zu beauftragen |
| 7 | M7 Proposal-Prototyp | Repository-Code, keine Produktion | M6 VERIFIED PASS |
| 8 | M8 Cutover-Simulator | Sandbox | M7 VERIFIED PASS |
| 9 | M9 Assurance Drills | kontrollierte Umgebung | M8 VERIFIED PASS |
| 10 | M10 Shadow Mode | keine Legacy-Abschaltung | M9 VERIFIED PASS |
| 11 | SEO/MA/Monetarisierung | getrennte Programme | jeweilige Authority |

## 13. Abschlusskriterien der Gesamtroadmap

Die Roadmap ist erst abgeschlossen, wenn:

- M0–M10 `VERIFIED PASS`;
- alle P0/P1-Pakete geschlossen oder explizit risikobegründet akzeptiert;
- keine unowned HIGH/CRITICAL Findings;
- produktive Mutationen Owner-genehmigt und post-verifiziert;
- Traceability vollständig;
- offene Fachroadmaps abgeschlossen, superseded oder archiviert;
- alle gemergten Arbeitsbranches gelöscht sind.
