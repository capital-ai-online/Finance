# GROK PR Project-Context Tagging Policy

**Document ID:** GOV-GROK-PR-CONTEXT-001  
**Status:** PROPOSED  
**Date:** 2026-08-16  
**Repository:** `SvenKulessa/Finance`  
**Authority:**  
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`  
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`  
- `docs/governance/GROK_POST_PR_MERGE_CONTINUATION_POLICY.md` (GOV-GROK-POST-MERGE-001)  
- ADR-0039, ADR-0069  
- CAPITAL-AI DevelopmentChain (fail-closed)

**Accountable Owner:** `SvenKulessa`  
**Applies to:** Grok (xAI) und vergleichbare Agenten mit Schreib-/PR-Capability, die Pull Requests im Finance-Repository (oder parallel betriebenen Capital-AI-Repositories) erstellen

---

## 1. Zweck

Diese Richtlinie stellt sicher, dass **jeder von Grok erstellte Pull Request** den **Ursprungs-Kontext** (Grok-Projekt / Ordner / Chat-Session-Kontext) klar und maschinen- sowie menschenlesbar trägt.

Ziel:

1. Sofortige Identifizierbarkeit, aus welchem Grok-Projekt / welcher Chat-Session der PR stammt.
2. Vermeidung von Kontext-Vermischung bei parallelen Agent-Arbeiten (Grok, Claude, andere).
3. Bessere Traceability zwischen Chat-Auftrag, Work-Claim und PR.
4. Unterstützung der Multi-Projekt-/Multi-Folder-Arbeit (z. B. Finance-Core, SEO, Frontend, Governance).

Beispiel-Titel:

```
[Capital-AI SEO] docs(governance): add GROK PR Project-Context Tagging Policy
[CAPITAL-AI Governance] docs(governance): update document-registry
[Finance] feat(api): improve healthz response
```

---

## 2. Geltungsbereich

### Gilt für
- Jeden Pull Request, den Grok (oder ein vergleichbarer Agent unter Grok-Steuerung) **erstellt**.
- Alle Repositories, in denen Grok im Rahmen von Capital-AI / SvenKulessa-Projekten PRs öffnet (primär `SvenKulessa/Finance`).
- Sowohl Klasse-D- als auch C/R/M-PRs.

### Gilt nicht für
- Human-erstellte PRs (Empfehlung, aber keine Pflicht).
- PRs, die Grok nur kommentiert oder beobachtet, aber nicht selbst angelegt hat.
- Interne Draft-Branches ohne PR.

---

## 3. Verbindliche Regel (fail-closed)

**Jeder von Grok erstellte Pull-Request-Titel MUSS mit einem Project-Context-Tag in eckigen Klammern beginnen.**

### Format

```
[<Project-Context>] <conventional-type>(<scope>): <kurze Beschreibung>
```

- Der Tag steht **ganz am Anfang** des Titels.
- Der Tag ist in eckigen Klammern `[...]`.
- Der Tag-Inhalt ist der **Name des Grok-Projekts / Ordners / Chat-Kontexts**, in dem der Auftrag zur PR-Erstellung erteilt bzw. die Session geführt wurde.
- Keine Leerzeichen unmittelbar nach der öffnenden Klammer; nach der schließenden Klammer genau ein Leerzeichen vor dem Rest des Titels.
- Der Tag darf nicht leer sein und sollte stabil und wiedererkennbar sein (keine flüchtigen Session-IDs).

### Ableitung des Tags

Grok leitet den Tag aus dem **aktuellen Projektkontext** ab:

1. Primär: Name des Grok-Projekts, in dem der Chat geführt wird.
2. Alternativ / bei Mehrdeutigkeit: explizit vom Owner im Chat genannter Projekt- oder Ordnername.
3. Fallback (nur wenn kein klarer Projektname verfügbar): `[CAPITAL-AI]` oder `[Finance]`.

Beispiele gültiger Tags:

- `[Capital-AI SEO]`
- `[CAPITAL-AI Governance]`
- `[Finance]`
- `[capital-ai-frontend]`
- `[Systemadmin]`
- `[Marketing]`

### Verbotene Formen

- Fehlen des Tags
- Tag am Ende oder in der Mitte des Titels
- Runde Klammern, geschweifte Klammern oder andere Formate statt `[...]`
- Mehrere konkurrierende Tags ohne klare Primär-Zuordnung
- Generische Tags wie `[Grok]` oder `[PR]` ohne Projektbezug

---

## 4. Zusätzliche Empfehlungen (nicht blockierend)

1. **PR-Body – Abschnitt 1 (Arbeitsauftrag)**  
   Optional, aber erwünscht: den Project-Context-Tag auch im Body unter Zweck oder als eigene Zeile `**Project-Context:** [Capital-AI SEO]` aufführen.

2. **Work-Claim**  
   Wenn ein Work-Claim erstellt wird, sollte der Claim-Dateiname oder ein Metadaten-Feld den gleichen Kontext-Tag spiegeln.

3. **Commit-Messages**  
   Der Tag ist nur für den **PR-Titel** verpflichtend. Commit-Messages folgen weiterhin Conventional Commits ohne erzwungenen Projekt-Prefix.

4. **Automation / Governance-Checks**  
   Zukünftige Template-Contract- oder advisory Checks dürfen den Tag validieren (z. B. Regex `^\[[^\]]+\]\s`). Bis dahin gilt die Regel als Agenten-Verhaltenspflicht (fail-closed auf Agenten-Seite).

---

## 5. Integration in den PR-Erstellungsprozess

```text
1. Owner-Auftrag / Chat-Kontext klären
2. Aktuellen main-SHA holen + Branch sync (PR-Sync-Pflicht)
3. Project-Context-Tag aus Chat-/Projekt-Kontext ableiten
4. Branch anlegen
5. Änderungen committen
6. PR erstellen mit Titel = "[<Tag>] <restlicher Conventional-Titel>"
7. Vollständige Template 1.3.5 + Work-Claim + Baseline
8. Owner-Gate abwarten (GOV-GROK-POST-MERGE-001)
```

Grok darf **keinen** PR ohne den verpflichtenden Tag öffnen. Bei Unklarheit über den korrekten Tag muss Grok vor `create_pull_request` nachfragen oder den Fallback `[CAPITAL-AI]` verwenden und dies im Body dokumentieren.

---

## 6. Agenten-Grenzen

| Darf | Darf nicht |
|------|------------|
| Tag aus aktuellem Grok-Projekt-/Chat-Kontext ableiten | Tag weglassen oder „vergessen“ |
| Tag im Titel erzwingen | Human-PRs nachträglich umbenennen ohne Auftrag |
| Bei Unklarheit nachfragen oder dokumentierten Fallback nutzen | Beliebige / irreführende Tags erfinden |
| Policy in zukünftigen D-Klasse-PRs verfeinern | Self-Merge oder CI-Bypass |

---

## 7. Änderungsprozess

Diese Policy darf nur durch Human/Owner-autorisierten PR geändert werden.  
Grok darf Verbesserungsvorschläge als Klasse-D-PR einbringen, muss dabei selbst den Project-Context-Tag gemäß dieser Richtlinie verwenden.

---

## 8. Kurzreferenz für Grok

```
Vor create_pull_request:
  → Project-Context-Tag bestimmen (Grok-Projekt / Ordner / Chat-Name)
  → Titel MUSS beginnen mit: [Tag] 
  → Beispiel: [Capital-AI SEO] docs(governance): ...

Kein Tag → kein PR.
Fail-closed.
```

---

*Ende GOV-GROK-PR-CONTEXT-001 — 2026-08-16*
