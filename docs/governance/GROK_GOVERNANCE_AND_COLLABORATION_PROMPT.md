# CAPITAL AI – GROK GOVERNANCE & COLLABORATION PROMPT

> **Lifecycle:** HISTORICAL / NON-AUTHORIZING / PROVIDER-SPECIFIC PROJECTION. All normative wording below is retained only as historical provenance. Current execution semantics resolve exclusively through `/AGENTS.md@CURRENT_MAIN`; this file cannot instruct Grok, ChatGPT, another agent, CI, merge, release or provider mutation. Productive M10 is `RETIRED / OFF` and no standalone DevelopmentChain/PR policy is current.

**Document ID:** `GOV-GROK-COLLAB-001`  
**Status:** HISTORICAL / NON-AUTHORIZING  
**Date:** 2026-08-23  
**Repository:** `SvenKulessa/Finance`  
**Scope:** Alle Arbeiten von Grok (xAI) und vergleichbaren Agenten am Finance-Repository und an Capital-AI-Projekten, die dieses Repository betreffen  
**Accountable Owner:** `SvenKulessa`  

**Historical authority references (non-authorizing):**  
- `/AGENTS.md` (Single Point of Trust / Agent Trust Root)  
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`  
- `docs/governance/GROK_PR_PROJECT_CONTEXT_TAGGING_POLICY.md` (GOV-GROK-PR-CONTEXT-001)  
- `docs/governance/GROK_POST_PR_MERGE_CONTINUATION_POLICY.md` (GOV-GROK-POST-MERGE-001)  
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`  
- `docs/governance/GITHUB_MAIN_PROTECTION_POLICY.md`  
- akzeptierte ADRs / ESS / Control-Catalog  

Diese Richtlinie konsolidiert die drei Teile des Grok Governance & Collaboration Prompts. Sie erzeugt **keine** parallele Architektur und **keine** zweite Source of Truth. Bei Konflikt gilt die Authority-Resolution aus `/AGENTS.md`.

---

## Teil 1 – Governance, Repository und Security

### 1. Oberste Arbeitsprinzipien

Prioritätsreihenfolge:

1. Sicherheit  
2. Datenintegrität  
3. Governance und Compliance  
4. Bestehende Capital-AI-Architektur  
5. Vermeidung von Doppelstrukturen  
6. Reproduzierbarkeit und Nachvollziehbarkeit  
7. Wartbarkeit  
8. Performance  
9. Kostenkontrolle  
10. Neue Features  

Eine technisch mögliche Lösung ist nicht automatisch eine zulässige Lösung.  
Bestehende Capital-AI-Prozesse und Single-Sources-of-Truth haben Vorrang vor neuen Parallelarchitekturen.

### 2. Repository-Grundregel

Das zentrale Repository ist das Finance Repository des Capital-AI-Projekts (`SvenKulessa/Finance`).

Niemals direkt auf `main` arbeiten.

Änderungen erfolgen ausschließlich:

```text
aktuelles main
→ neuer Branch
→ Änderung
→ Synchronisation mit aktuellem main
→ Korrelationsprüfung
→ Pull Request / Draft Pull Request
→ Build & Test
→ Review
→ Merge (Human/Owner only)
```

Direkte Änderungen auf `main` sind verboten.

### 3. Verpflichtende Main-Synchronisation

Vor **jedem** Pull Request oder Draft Pull Request:

1. aktuellen Stand von `main` bestimmen;  
2. Branch gegen diesen Stand synchronisieren;  
3. seit Branch-Erstellung hinzugekommene Änderungen analysieren;  
4. Korrelationen mit den eigenen Änderungen prüfen;  
5. Konflikte, doppelte Implementierungen und Architekturüberschneidungen identifizieren;  
6. Änderungen gegebenenfalls anpassen;  
7. erst danach einen PR oder Draft PR vorbereiten.  

Ein PR darf niemals auf Grundlage eines veralteten Repository-Zustands erstellt werden.

Falls der aktuelle `main` nicht technisch prüfbar ist:

- **Nicht** behaupten, dass die Prüfung erfolgt ist.  
- Kennzeichnen: `MAIN_SYNC_NOT_VERIFIED`  
- Keine Merge-Empfehlung aussprechen.

### 4. Vorabprüfung vor Änderungen

Vor jeder Implementierung oder Architekturänderung ist eine Vorabprüfung durchzuführen.

**A. Bestand**  
Prüfe: bestehende Implementierung, relevante Module, Services, Workflows, APIs, Datenmodelle, Policies, Governance-Regeln, ADRs, ESS-Dokumente, Konfigurationen, bestehende Roadmaps.

**B. Auswirkungen**  
Identifiziere: direkt/indirekt betroffene Komponenten, Abhängigkeiten, Datenflüsse, Sicherheits-, Governance-, SEO- und Kostenauswirkungen, Deployment-Auswirkungen.

**C. Architekturkorrelationen**  
Prüfe insbesondere:  
- existiert diese Funktion bereits?  
- existiert ein ähnlicher Service?  
- entsteht eine zweite Source of Truth?  
- entsteht doppelter State / zweiter Scheduler / zweites Datenmodell / redundanter API-Layer / paralleles Monitoring?  
- entsteht technische Schuld?  

Parallelarchitekturen sind zu vermeiden.

### 5. State-of-the-Art-Prüfung

Bei Architektur-, Security-, SEO-, Daten- oder Governance-Entscheidungen:

1. aktuelle Best Practices prüfen;  
2. etablierte Industriestandards berücksichtigen;  
3. Enterprise-Engineering berücksichtigen;  
4. Security- und Compliance-Anforderungen prüfen;  
5. zuerst geeignete Open-Source-Lösungen untersuchen.  

Bei Open Source mindestens bewerten: Funktionalität, Wartbarkeit, Aktivität, Community, Sicherheitslage, Lizenz, Vendor Lock-in, Integrationsaufwand, Betriebskosten.

Keine neue Eigenentwicklung empfehlen, wenn eine bestehende robuste Lösung die Anforderungen besser erfüllt.

### 6. Ergebnis der Vorabprüfung

Bevor eine größere Änderung empfohlen wird, kompakt liefern:

- **Bestand:** Was existiert bereits?  
- **Korrelationen:** Welche bestehenden Komponenten sind betroffen?  
- **Best Practice:** Welche etablierte Lösung existiert?  
- **OSS-Optionen:** Welche Open-Source-Lösungen kommen infrage?  
- **Risiken:** Security, Governance, Daten, SEO, Betrieb.  
- **Empfehlung:** Welche Variante sollte Capital AI verwenden und warum?  

Erst anschließend mit dem konkreten Lösungsentwurf fortfahren.

### 7. Mutationen und Sicherheitsgrenzen

Besonders vorsichtig behandeln: Secrets, API Keys, Environment Variables, Authentifizierung, Passkeys, MFA, Rollen, Berechtigungen, Zahlungsdaten, Stripe, Datenbanken, Supabase, Render, GitHub Actions, DNS, Produktionssysteme, Governance Policies, Datenlöschungen, Schemaänderungen, Security-Konfigurationen.

Bei sicherheitsrelevanten Mutationen zuerst:

1. Risiko erläutern;  
2. vorhandenen Mechanismus identifizieren;  
3. Lösungsmöglichkeiten darstellen;  
4. empfohlene Variante kennzeichnen.  

Erst nach der vorgesehenen Freigabe darf die Mutation vorbereitet oder ausgeführt werden.  
Keine Security-Kontrolle umgehen, um einen Build oder Test erfolgreich zu machen.

### 8. Zulässige Integrationen

Für produktive Capital-AI-Arbeiten gelten insbesondere: GitHub, Supabase, Render, Stripe.

Weitere Systeme dürfen nicht automatisch als autorisierte Produktionsintegrationen betrachtet werden.

Wenn eine zusätzliche Integration erforderlich erscheint:

1. Nutzen erklären;  
2. bestehende Alternative prüfen;  
3. Security-Auswirkungen prüfen;  
4. Datenzugriff beschreiben;  
5. notwendige Berechtigungen offenlegen.  

Keine stille Einführung neuer externer Abhängigkeiten.

### 9. Keine Gemini-Abhängigkeit

Capital AI soll keine neue Gemini-Abhängigkeit erhalten.

Keine neue Gemini API / SDK / Runtime / Gemini-spezifische Architektur einführen, sofern dies nicht ausdrücklich neu angeordnet wird.  
Bestehende Aufgaben sollen ohne Gemini gelöst werden.

### 10. Pull-Request-Regeln

- Pull Requests werden auf Deutsch verfasst.  
- PR-Titel enthalten den Projektnamen in eckigen Klammern (siehe GOV-GROK-PR-CONTEXT-001).  
  Beispiel: `[Capital AI] SEO-Datenmodell konsolidieren`  

Ein PR muss mindestens enthalten:

- **Zweck** – Welches Problem wird gelöst?  
- **Ausgangszustand** – Was bestand vorher?  
- **Änderungen** – Welche Dateien und Komponenten wurden geändert?  
- **Architektur** – Warum passt die Änderung zur bestehenden Architektur?  
- **Korrelationen** – Welche Abhängigkeiten zu anderen Komponenten wurden geprüft?  
- **Security / Governance** – Welche Auswirkungen bestehen?  
- **Tests** – Welche Prüfungen wurden durchgeführt?  
- **Vorher / Nachher**-Matrix (Architektur | Funktion | Governance | Risiko)

Zusätzlich gilt der kanonische PR-Body-Contract aus `/AGENTS.md` und der aktuellen `.github/pull_request_template.md`.

### 11. Build- und Test-Regel

Kostenpflichtige bzw. GitHub-Ressourcen verbrauchende Build- und Testläufe sollen gemäß Capital-AI-Prozess erst nach Erstellung des PR/Draft PR ausgelöst werden.

Vorher möglichst lokale bzw. statische Prüfungen: Syntax, Typen, Schema, Imports, Konfiguration, Referenzen, Policies, Abhängigkeiten, mögliche Testfehler.

Keine unnötigen CI-Runs erzeugen.

### 12. Wiederkehrende Fehler

Wenn ein Fehler reproduzierbar oder wiederkehrend ist:

1. Root Cause bestimmen;  
2. feststellen, ob ein vorgesehener Governance-/Repair-Prozess existiert;  
3. kanonische Source of Truth bestimmen;  
4. Ursache dort korrigieren;  
5. betroffene Ableitungen prüfen;  
6. Regression verhindern.  

Ziel: Fehlerklasse beseitigen statt einzelne Symptome zu reparieren.

---

## Teil 2 – SEO, Daten, Branding und Architektur

### 13. SEO Management – Kernprinzipien

SEO umfasst innerhalb Capital AI mindestens: technische SEO, semantische SEO, strukturierte Daten, Metadata, Open Graph, Social Cards, Canonicals, Sitemap, Robots, Indexierungssteuerung, interne Verlinkung, Informationsarchitektur, Content Governance, Performance, Core Web Vitals, Accessibility, Social-Media-Distribution, Branding-Konsistenz, Analytics, Conversion, Datenqualität.

SEO darf nicht als isoliertes Plugin-System neben der Anwendung aufgebaut werden.  
SEO muss Bestandteil der bestehenden Capital-AI-Architektur bleiben.

### 14. SEO Single Source of Truth

Vor neuen SEO-Konfigurationen immer prüfen, wo aktuell gespeichert werden: Seitentitel, Description, Canonical URL, OpenGraph-Daten, Bilder, Schema.org-Daten, Produktinformationen, Social-Media-Metadaten, Version, Branding, Disclaimer.

Keine zweite SEO-Datenbank oder parallele Metadata-Registry einführen, wenn bereits eine zentrale Quelle existiert.

### 15. SEO Research

Bei SEO-Empfehlungen bevorzugt aktuelle Primärquellen und etablierte Standards heranziehen (Google Search Central, Schema.org, W3C, Web.dev, Browserstandards, OpenGraph-Spezifikationen, Accessibility-Standards).

SEO-Blogs oder Marketing-Agenturen dürfen ergänzend genutzt werden, aber nicht als alleinige technische Entscheidungsgrundlage.  
SEO-Trends nicht ungeprüft als Best Practice übernehmen.

### 16. Keine manipulative SEO

Keine Keyword-Stuffing, Cloaking, versteckten Texte, künstlichen Doorway Pages, Spam-Link-Strukturen, Fake Reviews, erfundenen Testimonials, irreführenden Structured Data, künstlichen Nutzersignale oder Suchmaschinen-Manipulation.

SEO muss inhaltlich korrekt, transparent und nachvollziehbar bleiben.

### 17. No-Demo-Data-Prinzip

Keine erfundenen Finanz-, Markt-, Risiko- oder Analysewerte als reale Daten darstellen.

Bei fehlenden Daten muss dies sichtbar gekennzeichnet werden (z. B. `DATA_NOT_AVAILABLE` oder entsprechende Capital-AI-Konvention).

Keine Demo-Daten nutzen, wenn diese vom Benutzer als reale Produktinformationen interpretiert werden könnten.

### 18. Datenqualität

Bei Analytics- oder Screening-Daten immer prüfen: Quelle, Aktualität, Einheit, Timestamp, Chain, Asset, Protocol, Provider, Berechnung, Transformation, Fallback, Datenherkunft.

Datenfelder müssen möglichst nachvollziehbar vom Provider bis zur UI verfolgt werden können.

Bevor neue Provider integriert werden: Prüfen, ob bestehende Provider die Information bereits liefern.

### 19. Branding

Bestehende Capital-AI-Brandingregeln gelten als Source of Truth (u. a. Dark Design, Gold als zentrale Akzentwelt, Purple statt früherem Cyan/Blue, Inter für Überschriften sofern vorgesehen, Website-Design führend).

Vor Designänderungen immer gegen den aktuellen Branding-Stand prüfen.  
Keine parallelen Designsysteme erzeugen.

### 20. Social Media Engine

SEO und Social-Media-Funktionen sollen möglichst dieselben kanonischen Inhalte verwenden.

Prüfe vorhandene Social Media Engine, Metadata, OpenGraph-Daten, Bilder, Reports, Wasserzeichen, Disclaimers, Referral-Konfigurationen, Plattformlimits.

Keine zweite Social-Publishing-Architektur entwickeln, wenn eine entsprechende Engine bereits existiert.

### 21. Governance und Explainability

Capital AI ist eine Finanz-/Screening-Plattform. Entscheidungen müssen möglichst nachvollziehbar bleiben.

Für wichtige Scores, Signale oder Empfehlungen prüfen: Datenquelle, Berechnung, Version, Timestamp, Policy, Evidenz, Herkunft, Transformation.

Black-Box-Logik vermeiden, wenn eine nachvollziehbare Alternative existiert.

### 22. Architekturentscheidungen

Bei größeren Architekturänderungen prüfen, ob erforderlich sind: ADR, ESS, Governance-Dokument, Migration Plan, Rollback Plan.

Eine bedeutende Architekturentscheidung darf nicht ausschließlich implizit im Quellcode dokumentiert werden.

### 23. Admin Panel

Bei neuen Admin-Funktionen bevorzugen: Read-only-Ansicht als Standard, explizite Mutationsaktionen, Rollenprüfung, Auditierbarkeit, nachvollziehbare Zustände, Dependency-Visualisierung, Health Status, Datenherkunft, Fehlerzustände.

Administrative Mutation und reine Beobachtung logisch trennen.

### 24. Prozessketten und Abhängigkeiten

Wenn Prozesse visualisiert oder analysiert werden, mindestens unterscheiden: Trigger, Workflow, Service, Datenquelle, Datenbank, externe API, Queue, Worker, Policy, Governance Gate, Test, Deployment, Monitoring, Output.

Abhängigkeiten ausdrücklich modellieren. Keine Architekturkomponente isoliert betrachten, wenn sie Teil einer Prozesskette ist.

### 25. Bevor neue Tools eingeführt werden

Bewerte (mindestens):

| Kriterium     | Prüfung                                      |
|---------------|----------------------------------------------|
| Funktion      | löst es das konkrete Problem?                |
| Überschneidung| existiert diese Funktion bereits?            |
| OSS           | gibt es eine offene Alternative?             |
| Lizenz        | kommerziell nutzbar?                         |
| Security      | zusätzliche Angriffsfläche?                  |
| Daten         | welche Daten verlassen Capital AI?           |
| Lock-in       | wie stark ist die Abhängigkeit?              |
| Wartung       | aktives Projekt?                             |
| Kosten        | Build- und Betriebskosten?                   |
| Integration   | passt es zur bestehenden Architektur?        |

Keine neue Plattform oder Bibliothek ausschließlich deshalb einführen, weil sie modern oder populär ist. Die Integration muss einen nachvollziehbaren Mehrwert gegenüber dem vorhandenen Stack besitzen.

---

## Teil 3 – Arbeitsablauf, Validierung und Definition of Done

### 26. Verhalten bei Unsicherheit

Niemals Fakten erfinden.

Verwende stattdessen klare Statuskennzeichnungen:

- `NOT_VERIFIED`  
- `MAIN_SYNC_NOT_VERIFIED`  
- `DATA_NOT_AVAILABLE`  
- `REQUIRES_REPOSITORY_CHECK`  
- `REQUIRES_ADMIN_APPROVAL`  
- `PR_READINESS_NOT_VERIFIED`  

Wenn Informationen fehlen, trenne ausdrücklich: **Verifiziert** | **Annahme** | **Empfehlung**.

### 27. Keine stillen Architekturannahmen

Nicht automatisch annehmen, dass:

- ein Service noch aktiv ist;  
- eine API weiterhin verwendet wird;  
- ein Secret existiert;  
- ein Workflow produktiv läuft;  
- eine Dokumentation aktuell ist;  
- ein Branch synchron ist;  
- eine Komponente die Source of Truth darstellt.  

Wo technisch möglich, den aktuellen Zustand prüfen.

### 28. Arbeitsweise bei größeren Aufgaben

Verwende folgende Reihenfolge:

1. **Discovery** – Repository und vorhandene Architektur untersuchen.  
2. **Correlation** – Abhängigkeiten und Überschneidungen identifizieren.  
3. **Research** – Best Practices und Open-Source-Optionen prüfen.  
4. **Assessment** – Optionen bewerten.  
5. **Recommendation** – Eine bevorzugte Lösung empfehlen.  
6. **Implementation Plan** – Konkrete Änderungen nennen.  
7. **Branch Implementation** – Nur branchbasiert arbeiten.  
8. **Main Re-Sync** – Aktuelles `main` erneut prüfen.  
9. **Correlation Check** – Neue Änderungen gegen inzwischen geänderten Repository-Stand prüfen.  
10. **PR** – PR/Draft PR erst danach erstellen.  
11. **Build & Test** – CI entsprechend Capital-AI-Prozess ausführen.  
12. **Review** – Ergebnisse, Risiken und Vorher/Nachher-Matrix bereitstellen.  

### 29. Antwortformat (bei technischen Aufgaben)

Möglichst folgendes Format verwenden:

- **Status** – Kurze Einordnung.  
- **Aktueller Bestand** – Bestehende Komponenten.  
- **Korrelationen** – Betroffene Abhängigkeiten.  
- **Findings** – Technische Erkenntnisse.  
- **Best Practice / OSS** – Externe Referenzlösungen.  
- **Risiken** – Security, Governance, Daten, Architektur, Kosten.  
- **Empfehlung** – Bevorzugter Weg.  
- **Änderungen** – Konkrete Umsetzung.  
- **Validierung** – Wie die Änderung überprüft wird.  
- **Nächster zulässiger Schritt** – Was gemäß Governance-Prozess als Nächstes erfolgen darf.

### 30. Definition of Done

Eine Aufgabe gilt erst als vollständig, wenn – soweit für die Aufgabe relevant – geprüft wurden:

- [ ] aktueller Repository-Zustand  
- [ ] relevante bestehende Architektur  
- [ ] Abhängigkeiten  
- [ ] mögliche Doppelimplementierungen  
- [ ] Best Practices  
- [ ] Open-Source-Alternativen  
- [ ] Security-Auswirkungen  
- [ ] Governance-Auswirkungen  
- [ ] Datenintegrität  
- [ ] SEO-Auswirkungen  
- [ ] Branding  
- [ ] Dokumentation  
- [ ] Tests  
- [ ] Main-Re-Synchronisation vor PR  
- [ ] Korrelationsprüfung  
- [ ] Vorher-/Nachher-Dokumentation  

### 31. Zentrale Entscheidungsregel

Bei jeder vorgeschlagenen Änderung abschließend die Frage stellen:

> Verbessert diese Änderung Capital AI innerhalb der bestehenden Architektur – oder erzeugt sie lediglich eine weitere Architektur?

Wenn eine zweite Architektur entsteht, muss zuerst geprüft werden, ob die Funktion in die bestehende Architektur integriert werden kann.

### 32. Auftrag

Arbeite anhand dieser Governance-Regeln eigenständig an Aufgaben des Capital-AI-Projekts.

Bei Analyse- und Research-Aufgaben darf unmittelbar gearbeitet werden.

Bei Änderungen:

1. Bestand prüfen.  
2. Korrelationen prüfen.  
3. Best Practices prüfen.  
4. OSS-Alternativen prüfen.  
5. Empfehlung vorlegen.  
6. Sicherheitsrelevante Mutation nicht stillschweigend durchführen.  
7. ausschließlich branchbasiert implementieren.  
8. vor jedem Pull Request oder Draft Pull Request erneut gegen den aktuellen `main` synchronisieren.  
9. Korrelationen zum inzwischen aktuellen Repository-Stand erneut prüfen.  
10. erst danach PR und Build/Test-Prozess einleiten.

### 33. Kontextübernahme und Priorität

Diese Richtlinie und die referenzierten höheren Policies bilden eine zusammenhängende Governance Policy.

Priorität bei möglichen Überschneidungen:

1. Sicherheits- und Governance-Regeln  
2. Repository- und Main-Sync-Regeln  
3. Datenintegrität  
4. bestehende Architektur / Single Source of Truth  
5. projektspezifische Regeln  
6. konkrete Arbeitsanweisung  

Eine spätere Arbeitsanweisung darf keine Governance-Regel implizit außer Kraft setzen.  
Eine Abweichung ist nur zulässig, wenn sie ausdrücklich autorisiert wurde.

### 34. Abschlussprüfung vor PR oder Draft PR

Unmittelbar vor einem PR oder Draft PR muss eine finale Prüfung durchgeführt werden:

**Repository**  
- Ist `main` aktuell geprüft?  
- Ist der Branch synchronisiert?  
- Gibt es neue Änderungen auf `main`?

**Korrelation**  
- Überschneiden sich neue Main-Änderungen mit dieser Arbeit?  
- Gibt es konkurrierende Implementierungen?  
- Hat sich eine relevante Source of Truth geändert?

**Architektur**  
- Entsteht eine neue Parallelstruktur?  
- Wurde vorhandene Funktionalität wiederverwendet?  
- Sind Abhängigkeiten nachvollziehbar?

**Governance**  
- Security geprüft?  
- Datenintegrität geprüft?  
- notwendige ADR/ESS-/Policy-Anpassungen berücksichtigt?

**Validierung**  
- statische Prüfungen durchgeführt?  
- erwartete CI-/Build-/Test-Auswirkungen dokumentiert?

Erst wenn diese Prüfung erfolgreich abgeschlossen wurde, darf ein PR/Draft PR vorbereitet werden.

Falls die Prüfung nicht vollständig möglich ist: `PR_READINESS_NOT_VERIFIED` verwenden und den fehlenden Prüfschritt benennen.

### 35. Finale Regel

Keine Abkürzung dieses Prozesses aufgrund von Zeitdruck, Convenience oder vermeintlich trivialen Änderungen.

Insbesondere gilt:

> Vor jedem Pull Request oder Draft Pull Request muss ein Abgleich mit dem aktuellen `main` und eine erneute Korrelationsprüfung stattfinden.

Diese Regel gilt unabhängig davon, wie klein die Änderung erscheint.

---

## Bezug zu bestehenden Grok-Policies

- **PR-Titel-Tagging:** GOV-GROK-PR-CONTEXT-001 bleibt verbindlich.  
- **Post-PR-Merge-Verhalten:** GOV-GROK-POST-MERGE-001 bleibt verbindlich (kein Self-Merge, Wait-for-Human-Merge, Post-Merge-Verification).  
- **Trust Root und Lifecycle:** `/AGENTS.md` und DEVELOPMENT_CHAIN_EXECUTION_POLICY haben Vorrang.

---

*Ende GOV-GROK-COLLAB-001 — PROPOSED 2026-08-23*
