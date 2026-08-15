# CAPITAL-AI — Supervisor, Systemadministrator und Compliance in der AI-Wertschöpfungskette

**Document ID:** REPORT-SVC-AI-VC-0001  
**Version:** 1.0.0  
**Status:** ACTIVE — GOVERNANCE & ARCHITECTURE REPORT  
**Datum:** 2026-08-16  
**Repository:** SvenKulessa/Finance  
**Owner:** SvenKulessa  
**Authority:** ESS-0001 / ESS-0001-CONTRACTS, ESS-0002, ESS-0003, ESS-0018, ESS-0021, ESS-0023, ADR-0006, ADR-0012, ADR-0058–0074, DEVELOPMENT_CHAIN, SYSTEMADMIN_AGENT_ROADMAP, INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP (ROADMAP-INTEGRATED-DC-SA-0001), COMP-SOA-0001  

---

## 1. Executive Summary

Dieser Bericht beschreibt die Rollen, Verantwortlichkeiten, Implementierungsstände und das Zusammenspiel von **Supervisor**, **Systemadministrator** und **Compliance** innerhalb der normativen **CAPITAL-AI AI-Wertschöpfungskette**.

Die drei Instanzen erfüllen fundamental unterschiedliche Funktionen:

| Instanz | Kernfunktion | Entscheidungsrecht | Schreibzugriff |
|---------|--------------|--------------------|----------------|
| **Supervisor** | Beobachten, bewerten, eskalieren, blockieren empfehlen | **Keine** Entscheidung | Nur eigener Befundspeicher |
| **Systemadministrator** | Bounded, auditierte Repository- und (später) externe Ausführung unter REM | Nur innerhalb explizit genehmigter Capability-Ceiling | Nur über permit-before-side-effect + OIDC + Human Merge |
| **Compliance** | Normative und technische Konformität (ISO 27001, IAM, DSGVO, Governance) | Policy- und Control-Rahmen | Scanner, Policies, Evidence — keine Runtime-Mutation |

**Zentrale Aussage:**  
In der AI-Wertschöpfungskette sind Supervisor und Systemadministrator **keine austauschbaren Rollen**. Der Supervisor ist die Überwachungsinstanz der Plattform; der Systemadministrator ist ein kontrollierter, hochprivilegierter Ausführungsagent mit fail-closed Authority-Ringen. Compliance bildet den übergreifenden Regel- und Nachweisrahmen für beide.

Der Bericht spiegelt den Stand vom **16. August 2026** wider (nach Merge der Integrated Roadmap ROADMAP-INTEGRATED-DC-SA-0001 und dem aktuellen Entwicklungsstand von M0–M8 / SA0–SA4).

---

## 2. Die AI-Wertschöpfungskette (normativ)

Gemäß ESS-0001-CONTRACTS Chapter 17 und dem Report ARCH-CHAIN-0001 ist die kanonische Kette:

```text
Google AI Studio          (Development / Design)
        ↓
Claude Code               (Implementation / controlled Execution)
        ↓
Documentary Engine        (Knowledge, Dokumentation, Twin)
        ↓
Supervisor                (Observation, Bewertung, Eskalation)
        ↓
Platform Director         (Entscheidung)
        ↓
Version Manager           (Versionierung)
        ↓
Release                   (Auslieferung)
        ↓
Production                (Betrieb + Rückkopplung)
```

**Zusätzliche, inzwischen etablierte parallele Kontrollpfade (nicht in der Originalkette 2026-07, aber produktionsrelevant 2026-08):**

- **DEVELOPMENT Chain (M0–M10)** — sequentielle, evidence-basierte Phase-Gates für Agent-IAM, Audit, Supply-Chain, Deployment Identity, Agent Cutover, Assurance, Passkey-Owner-Authorization.
- **Systemadmin Agent (SA0–SA5)** — bounded autonomous repository execution über trusted GitHub Actions Host + OIDC + REM + append-only M5 Audit.
- **Integrated Roadmap (ROADMAP-INTEGRATED-DC-SA-0001)** — verbindet DEVELOPMENT Chain und Systemadmin zu den Ausführungsphasen I0–I4.

Der Supervisor bleibt in der klassischen Wertschöpfungskette die **Bewertungsstufe vor der Entscheidung**.  
Der Systemadministrator operiert **parallel** als genehmigter Ausführungsagent und ist dem Human/Owner und den REM-/IAM-Grenzen unterworfen — er ersetzt weder Supervisor noch Platform Director.

---

## 3. Supervisor

### 3.1 Architekturrolle (ESS-0002)

Der Supervisor ist die **Überwachungsinstanz** der CAPITAL-AI Plattform.

> Der Supervisor beobachtet.  
> Der Supervisor bewertet.  
> Der Supervisor eskaliert.  
> Der Supervisor entscheidet **niemals**.

Position in der Architektur (ESS-0001-CONTRACTS Chapter 6):

```text
Platform Director
        │
   Supervisor
        │
Version Manager / Documentary / Knowledge / …
```

**Philosophie:** „Beobachtung ersetzt Vertrauen.“  
Bewertungen basieren ausschließlich auf nachweisbaren Zuständen (Registry, Knowledge Graph, Digital Twin, Events, Telemetrie, Validierungsergebnisse) — niemals auf Zusicherungen von Komponenten, Entwicklern oder KI-Systemen.

### 3.2 Beobachtungsdomänen

Der Supervisor überwacht verbindlich u. a.:

- Repository-Struktur und -Drift  
- Komponenten-Health und Lifecycle  
- Events und Correlation-IDs  
- AI-Wertschöpfungskette (Vollständigkeit der Stufen und Übergaben)  
- Digital Twin (Drift blockiert Freigaben)  
- Qualität, Sicherheit, Compliance  
- Automatisierung und Legacy-Bestand  

### 3.3 Governance Enforcement

Modell:

```text
Beobachtung → Bewertung → Befund → Blockade oder Freigabeempfehlung → Eskalation an Platform Director
```

Blockierende Befunde (Auszug): fehlende Impact-Analyse, fehlende ADR bei Architekturänderung, Critical/High-Validator-Befunde, Digital Twin „Drifted“, unvollständige AI-Wertschöpfungskette, fehlende Rollback-Strategie.

Der Supervisor besitzt **keinen produktiven Schreibzugriff**. Er schreibt ausschließlich in seinen eigenen Befundspeicher.

### 3.4 Implementierungsstand (Stand 2026-08)

| Fähigkeit (laut ARCH-AUDIT / ESS-0002) | Status | Nachweis |
|----------------------------------------|--------|----------|
| Task Routing / Tool Selection (Anlageklasse → Scoring-Engine) | ✅ Implementiert | `src/platform/Supervisor/supervisor.ts` — `routeTask()` |
| Execution Control / Retry / Recovery / Self-Healing | ✅ Implementiert | `executeSupervised()` mit Retry-Backoff; Status über `GET /api/admin/supervisor/status` |
| Conflict Resolution | ❌ Bewusst nicht | Pro Anlageklasse genau eine autoritative Engine |
| Vollständige Observation-Domains (Registry, Twin, Chain, Events) | ⚠️ Teilweise | EventMesh-Integration deklariert; viele Beobachtungsbereiche noch nicht als Enterprise-Supervisor realisiert |
| Finding-/Escalation-Contracts | ⚠️ Teilweise | SupervisorAlertEvent vorhanden; vollständige Finding-Lifecycle-Persistenz noch nicht ESS-0002-konform |
| Read-only Contract (kein produktiver Schreibzugriff) | ✅ | Kein produktiver Write-Pfad |

**Manifest:** `src/platform/Supervisor/manifest.json` (Version 1.1.0, Status: implemented).  
**Frontend:** Capital-AI Supervisor Dashboard im Admin-Portal (Echtzeit-Überwachung).

**Wichtige Abgrenzung zum Systemadministrator:**  
Der Supervisor **führt keine Repository- oder Plattform-Mutationen aus**. Er bewertet und eskaliert. Der Systemadministrator **führt** (unter REM und Human Gate) aus.

---

## 4. Systemadministrator (Systemadmin Agent)

### 4.1 Architekturrolle

Der Systemadministrator ist **kein** klassischer Sysadmin und **kein** Supervisor.  
Er ist ein **bounded autonomous agent** mit:

- Roadmap Execution Mandate (REM)  
- Capability-Ceiling und Risk-Ceiling  
- Trusted Execution Host (GitHub Actions + OIDC)  
- Append-only Audit (M5)  
- Permit-before-side-effect  
- Human/Owner final review und Human-only Merge  

Authority-Quellen: ESS-0021, ESS-0023, ADR-0065, ADR-0067, ADR-0068, ADR-0071, ADR-0074, SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY, DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.

### 4.2 Stufenstatus (SA0–SA5)

| Stufe | Status | Kerninhalt |
|-------|--------|------------|
| SA0 Governance | COMPLETE | REM-Schema, Authority, Branch-Lifecycle |
| SA1 REM Validator / Control Plane | COMPLETE / VERIFIED PASS | Capability-Ceiling, Self-Authority-Schutz |
| SA2 Chat Execution Profile | COMPLETE / VERIFIED PASS | Policy-bound Envelopes; Mutation nur mit späterem Permit |
| SA3A Append-only Audit Adapter | COMPLETE / VERIFIED PASS | Authorization-Event → Permit → Outcome-Event |
| SA3B Execution Host | COMPLETE / VERIFIED PASS | Owner-Issue → Workflow → OIDC → Broker → Permit → Side-Effect → Outcome |
| SA4 First bounded autonomous Work Package | COMPLETE / VERIFIED PASS | Dokumentation-only Pilot; BRANCH → COMMIT → Draft-PR → Human Merge |
| SA5 Bounded external Mutation Design | **BLOCKED** | Erfordert M10 Passkey-only Owner PR Authorization VERIFIED PASS |

Zusätzlich (ADR-0074): generalisierter Work-Package-Catalog und Runner — gleiche Machinery, ohne neue SA-Stufe und ohne Authority-Expansion.

### 4.3 Kontrollkette (vereinfacht)

```text
Owner-approved REM
    → Owner Issue / Trigger
    → Trusted GitHub Actions Host (main)
    → GitHub OIDC
    → CAPITAL-AI Broker
    → SA1/SA2/SA3 (Authorization + Audit)
    → M5 durable Authorization Event
    → Audit-bound Permit
    → exact Side-Effect (BRANCH / COMMIT / PR …)
    → M5 Outcome Event
    → Human File Review + CI
    → Human Merge
    → Branch Delete
```

**Harte Verbote (Auswahl):**  
MERGE durch Agent, DEPLOY_REQUEST, PRODUCTION_MUTATION, Self-Authority-Expansion, Secret-Rotation, IAM/MFA/Break-Glass-Mutation, DNS/TLS, Billing-Mutation — bis zu expliziter, separater Owner-Freigabe und (für SA5) M10 VERIFIED PASS.

### 4.4 Position relativ zur AI-Wertschöpfungskette

Der Systemadministrator ist **kein Ersatz** für Documentary Engine, Supervisor oder Platform Director.  
Er ist ein **kontrollierter Ausführungsaktor**, der:

- Repository-Arbeitspakete unter REM ausführt,  
- Evidence und Traceability erzeugt,  
- und dem Human/Owner und den Development-Chain-Gates unterliegt.

In der Integrated Roadmap (I0–I4) ist der Systemadministrator der parallele Ausführungspfad zu den DEVELOPMENT-Chain-Phasen M8–M10 (I1–I4).

---

## 5. Compliance

### 5.1 Rahmen

Compliance in CAPITAL-AI umfasst:

1. **Technische Compliance** — IAM, Secrets, Logging, Rate-Limits, CORS, CSP, Supply-Chain, Scanner  
2. **Regulatorische / Normative Compliance** — DSGVO/Datenschutz, ISO/IEC 27001:2022 Vorbereitung  
3. **Governance-Compliance** — ADR/ESS-Registry, Documentation Hygiene, Branch Lifecycle, Human/Owner Gates  

### 5.2 ISO/IEC 27001:2022 Statement of Applicability (COMP-SOA-0001)

Stand der internen, codebasis-verifizierten Bewertung (Prüfstichtag 2026-08-01, 93 Controls):

| Kategorie | Anzahl | Anteil |
|-----------|--------|--------|
| ✅ Implementiert | 21 | 23 % |
| ⚠️ Teilweise | 28 | 30 % |
| ❌ Nicht implementiert | 12 | 13 % |
| ⬜ N/A / Unternehmensangabe | 32 | 34 % |

Von den 61 aus der Codebasis bewertbaren Controls haben 80 % mindestens teilweise Evidenz.  
**Wichtig:** Das SoA ist **kein Zertifizierungsnachweis**. ISO 27001 zertifiziert ein ISMS, nicht eine Codebasis.

Stärken (technisch): Access Control, Identity Management, Authentifizierung, Privileged Access, Logging, Monitoring, Secure Development Lifecycle, Change Management, Cryptography.  
Offene Bereiche: Information Classification, vollständige Incident-Response-Playbooks, Data Deletion/Retention, Independent Review, einige Supplier- und Continuity-Controls.

### 5.3 IAM und Rollenmodell

Technische Rollen (Auszug): `owner`, `admin`, `supervisor`, `user`.  

- Serverseitige Prüfung (`checkAdminAccess`, Zone-Rollen)  
- Step-Up / AAL2 (M5A Native MFA VERIFIED PASS)  
- Capability-Grants (ESS-0018 / ADR-0051) additiv zum Rollenmodell  
- Fail-closed, Least Privilege, Audit-Logs  

**Wichtiger Governance-Punkt (CLAUDE.md / AGENTS.md):**  
`admin`, `supervisor`, `user`, Subscription-Tiers, Repository-Write-Access oder Modell-Identität sind **niemals** äquivalent zu CAPITAL-AI OWNER. Service Accounts dürfen keine eigenen Rechte erweitern.

### 5.4 Compliance-Scanner und Evidence

- `server/compliance/scanners.ts` — automatisierte technische Checks mit ISO-Control-Zuordnung  
- Append-only Audit-Events (M5)  
- Evidence unter `docs/evidence/` (m0–m8, sa1–sa4, security, …)  
- Documentation Hygiene Policy + H5 Gate  
- ISO SoA als manuelle Momentaufnahme (spätere Automatisierung vorgesehen)

### 5.5 Bezug zu Supervisor und Systemadministrator

| Aspekt | Supervisor | Systemadministrator | Compliance |
|--------|------------|---------------------|------------|
| Beobachtet Konformität | Ja (ESS-0002) | Indirekt (REM/IAM/Audit) | Normativ + Scanner |
| Erzeugt Findings | Ja (Soll) | Audit-Events | Scanner-Befunde, SoA |
| Blockiert Änderungen | Empfiehlt / soll blockieren | Fail-closed durch Capability/REM | Policy + CI-Gates |
| Mutiert Produktion | Nein | Nur mit separater Owner-Freigabe (SA5 blockiert) | Nein |
| Nachweispflicht | Befund + Correlation | M5 Authorization + Outcome | SoA, Evidence, Logs |

---

## 6. Zusammenspiel in der AI-Wertschöpfungskette

### 6.1 Idealtypischer Durchlauf (normativ)

1. **Design** (Google AI Studio) → Artefakte / Vorschlag  
2. **Implementation** (Claude Code / andere Provider unter Control Plane) → Code + Tests  
3. **Documentary Engine** → Knowledge, Dokumentation, Twin-Update  
4. **Supervisor** → beobachtet Kette, Health, Contracts; erzeugt Findings; empfiehlt Blockade oder Weitergabe  
5. **Platform Director** → entscheidet (Freigabe / Ausnahme mit ADR)  
6. **Version Manager / Release** → versioniert und liefert aus  
7. **Production** → Betrieb; Rückkopplung in Telemetrie / Twin  

### 6.2 Parallelpfad Systemadministrator

Wenn der Owner ein bounded Work Package genehmigt:

- Systemadmin führt unter REM und OIDC nur die genehmigten Capabilities aus.  
- Jede Mutation erzeugt durable M5-Events.  
- Human Review + Human Merge bleiben zwingend.  
- Der Supervisor **sollte** (sobald Observation-Domains vollständig sind) diese Aktivitäten und ihre Evidence mitbewerten; heute ist die Integration noch unvollständig.

### 6.3 Compliance als Querschnitt

Compliance gilt für **alle** Stufen:

- IAM und Capability-Grenzen für Agenten und Menschen  
- Audit- und Traceability-Anforderungen  
- Supply-Chain (M6), Deployment Identity (M7)  
- Passkey-only Owner PR Authorization (M10) als starke Assurance für finale Gates  
- ISO-Controls und DSGVO-Anforderungen an Logging, Zugriff, Löschung, Incident Response  

---

## 7. Reifegrad-Matrix (Stand 2026-08-16)

| Dimension | Supervisor | Systemadministrator | Compliance |
|-----------|------------|---------------------|------------|
| Spezifikation (ESS/ADR) | Gold / Approved | SA0–SA4 VERIFIED; SA5 blockiert | SoA 1.0.0 + Policies vorhanden |
| Runtime-Implementierung | Teilweise (Routing + Supervised Execution) | Stark (REM, Host, Audit, Catalog) | Scanner + IAM + MFA + Evidence |
| Integration in AI-Wertschöpfungskette | Spezifiziert; Observation-Domains unvollständig | Parallel-Pfad etabliert; kein Ersatz der Kette | Querschnitt; SoA manuell |
| Fail-closed / Least Privilege | Read-only Contract | REM + Capability + Self-Authority-Ringe | IAM + CI + Policy |
| Human/Owner Gate | Eskalation an Platform Director | Human Review + Human Merge zwingend | Owner-Approval für HIGH/CRITICAL |
| Offene kritische Lücken | Vollständige Observation, Finding-Lifecycle, Chain-Blocking | SA5 + M10; realer Caller für alle Provider (M8) | Classification, IR-Playbooks, Independent Review, Retention |

---

## 8. Offene Lücken und Empfehlungen

### 8.1 Supervisor

1. Vollständige Observation-Domains (Registry, Twin, Chain, Events) gemäß ESS-0002 implementieren.  
2. Finding- und Escalation-Contracts inklusive unveränderbarer Befundhistorie.  
3. Wirksame Blockade nicht konformer Änderungen vor Platform-Director-Entscheidung.  
4. Klare Event-Integration (consume GovernanceViolation / produce SupervisorFinding*).  

### 8.2 Systemadministrator

1. M8 abschließen (reale Caller für Claude Code / Google AI Studio / NotebookLM; Cutover-Sequenz; Evidence-Sync) → I1 VERIFIED PASS.  
2. M9 Assurance + M10 Passkey-only Owner PR Authorization.  
3. Erst danach SA5 Bounded External Mutation Design (eigene ADR).  
4. Keine Authority-Expansion; Catalog-Einträge nur mit Owner-approved REM.  

### 8.3 Compliance

1. Information Classification und Labeling (A.5.12 / A.5.13).  
2. Incident-Response-Playbooks und Learning-from-Incidents (A.5.25–A.5.27).  
3. Retention / Deletion Policy (A.8.10).  
4. Unabhängige Review-Vorbereitung (A.5.35) und SoA-Automatisierung aus Scannern.  
5. Kontinuierliche Revalidation der S1-Security-Hardening- und DEVELOPMENT-Chain-Evidence.  

### 8.4 Kette gesamt

- Documentary Engine und Digital Twin bleiben kritische Engpässe für die **klassische** Wertschöpfungskette.  
- EventMesh und Correlation-ID-Durchgängigkeit sind Voraussetzung für Supervisor- und Compliance-Automatisierung.  
- Integrated Roadmap (I0–I4) als verbindende Ausführungsautorität für DC + SA beibehalten; restriktivere ADRs/ESS haben Vorrang.

---

## 9. Governance- und Authority-Hinweis

Dieser Bericht **erzeugt keine Authority**.  
Er fasst den Ist-Zustand und die spezifizierten Rollen zusammen.  
Bei Widerspruch gelten in dieser Reihenfolge:

1. Verifizierte Runtime-, Code- und Produktions-Evidence  
2. Ausdrückliche Human/Owner-Freigabe  
3. Spezifische ADR / ESS / IAM / REM / Runbook  
4. Integrated Roadmap (ROADMAP-INTEGRATED-DC-SA-0001)  
5. Fach- und Portfolio-Roadmaps  
6. Historische Reports (nur Evidence-Wert)

---

## 10. Related Documents

**Supervisor**  
- `.ai/skills/ESS-0002-Supervisor-Architect.md`  
- `src/platform/Supervisor/README.md`, `supervisor.ts`, `manifest.json`  
- ADR-0006, ADR-0018  

**Systemadministrator**  
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`  
- `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`  
- ADR-0065, ADR-0067, ADR-0068, ADR-0071, ADR-0074  
- ESS-0021, ESS-0023  
- `docs/governance/SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY.md`  

**Compliance**  
- `docs/compliance/ISO27001_STATEMENT_OF_APPLICABILITY.md` (COMP-SOA-0001)  
- `docs/reports/Security_IAM_Compliance_Status_Report_2026.md`  
- `docs/DATENSCHUTZ_PROTOKOLL.md`  
- ADR-0003.5, ADR-0012 (resolved), ESS-0018  

**Wertschöpfungskette & Governance**  
- `docs/architecture/AI_VALUE_CHAIN_VALIDATION.md` (ARCH-CHAIN-0001)  
- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`  
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`  
- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`  

---

## 11. Version History

| Version | Datum       | Beschreibung |
|---------|-------------|--------------|
| 1.0.0   | 2026-08-16  | Initialer umfangreicher Bericht: Supervisor, Systemadministrator, Compliance in der CAPITAL-AI AI-Wertschöpfungskette; Ist-Zustand nach Integrated Roadmap und SA0–SA4 / M0–M8 |

---

**End of Document**  
REPORT-SVC-AI-VC-0001  
CAPITAL-AI — Supervisor, Systemadministrator und Compliance in der AI-Wertschöpfungskette  
Version 1.0.0  
