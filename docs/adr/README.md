# ADR-Ablage: Konvention für aktive vs. abgeschlossene Entscheidungen

**Zweck:** Verhindert, dass jeder neue Prüf-/Audit-Durchlauf (durch KI-Agenten oder
Menschen) bereits vollständig umgesetzte und verifizierte ADRs erneut komplett
gegenprüfen muss.

## Fester Ort (Invariante ab 2026-08-16)

- **Formale ADRs** werden ausschließlich unter `docs/adr/` angelegt und nummeriert.
- Dateien unter `docs/architecture/` dürfen den Präfix `ADR-XXXX` **nicht** als
  primäre ID oder Dateiname für neue Entscheidungsdokumente verwenden.
- Phase-/Work-Package-Notizen: `PHASE-…` oder beschreibende Namen; Parent-Verweis
  auf ein ADR unter `docs/adr/`.
- Begründung: einheitliche Architektur, einheitliche Nummerierung, keine parallelen
  ADR-Räume (siehe ADR-0083, GOV-XREF-UNIFIED-LOC-2026-08-16).

## Struktur

- **`docs/adr/*.md`** — aktive ADRs. Entscheidung getroffen (`Status: ACCEPTED`), aber
  Umsetzung noch nicht vollständig verifiziert, oder noch in Arbeit. **Diese sollten bei
  jedem Security-/Architektur-Review erneut geprüft werden.**
- **`docs/adr/resolved/*.md`** — ADRs, deren Umsetzung gegen den tatsächlichen Code
  **verifiziert** wurde (nicht nur behauptet). Diese müssen bei einem neuen Durchlauf
  **nicht automatisch erneut komplett auditiert werden** - außer es gibt einen konkreten
  Anlass (z.B. eine Änderung an der betroffenen Datei, ein neuer gemeldeter Vorfall, oder
  eine explizite Bitte um Re-Audit).

## Zwei getrennte Status-Felder pro ADR

- **`Status:`** — die ursprüngliche ADR-Entscheidung (`ACCEPTED`/`REJECTED`/`SUPERSEDED`).
  Ändert sich in der Regel nicht rückwirkend.
- **`Implementation-Status:`** — ob die Entscheidung tatsächlich im Code umgesetzt UND
  verifiziert ist. Werte: `✅ COMPLETE (verifiziert <Datum>)`, `🟡 IN PROGRESS`,
  `❌ NOT STARTED`. **Nur mit `✅ COMPLETE` markierte ADRs gehören nach `resolved/`.**

## Für KI-Agenten: Empfohlener Ablauf bei einem neuen Audit-/Review-Auftrag

1. Nur `docs/adr/*.md` (aktive ADRs, nicht `resolved/`) standardmäßig gegen den Code
   prüfen.
2. `docs/adr/resolved/*.md` nur lesen, wenn der Auftrag sich explizit auf eine dort
   dokumentierte Funktion bezieht, oder wenn eine Datei geändert wurde, die in einem
   `resolved`-ADR referenziert ist.
3. Wird eine Regression in einer als `resolved` markierten ADR gefunden: Datei zurück
   nach `docs/adr/` verschieben, `Implementation-Status` auf `🟡 IN PROGRESS` mit
   Begründung aktualisieren.

## Historischer Stand (2026-07-30)

| ADR | Ablage | Implementation-Status |
|---|---|---|
| ADR-0001, 0002, 0003 | `docs/adr/` (nicht als eigene Datei vorhanden, nur in `adr_history.json`) | nicht durch mich verifiziert |
| ADR-0003.5 (Owner-IAM) | `resolved/` | ✅ COMPLETE |
| ADR-0004 (Branding) | `docs/adr/` | **nicht verifiziert** |
| ADR-0005 (Frontend-Modul-Integration) | `docs/adr/` | **nicht verifiziert** |
| ADR-0006 (Plattform-Direktor) | `docs/adr/` | **nicht verifiziert** |
| ADR-0007 (Compliance-Wertschöpfungskette) | `docs/adr/` | **nicht verifiziert** |
| ADR-0008 (Document-Hygiene-Lifecycle) | `resolved/` | ✅ COMPLETE |
| ADR-0009 (CORS-Hardening) | `resolved/` | ✅ COMPLETE |

Dieser historische Snapshot bleibt erhalten, ist aber **nicht** der aktuelle Arbeitsstand.

## Verifizierter Nachtrag (2026-08-02)

Die aktuelle ADR-Bearbeitung folgt strikt der obigen Ablagekonvention. Folgende Entscheidungen
wurden code- und CI-basiert abgeschlossen:

| ADR | Ergebnis | Evidence |
|---|---|---|
| ADR-0012 — SecurityComplianceAuditor Integration | `resolved/` / ✅ COMPLETE | Compliance UI + autorisierte `/api/compliance/*`-Routen, `src/platform/Compliance`, Scanner-/Persistenz-Tests |
| ADR-0018 — Enterprise Event Mesh | `resolved/` / ✅ COMPLETE | EventMesh Stufe 1–4, Manifest-Nachpflege, SystemAudit-Bridge, Event-Tests |
| ADR-0030 — Platform Version and Release Lifecycle | `resolved/` / ✅ COMPLETE | `release-version-gate/1.0.0`, PR #57, vollständige CI PASS |
| ADR-0032 — Asset Catalog / Market Evidence Separation | `resolved/` / ✅ COMPLETE | PR #54, 6×100 Asset-Expansion, Catalog-Integrity-Tests, CI PASS |
| ADR-0033 — Index / Commodity / Sovereign Evidence Scoring | `resolved/` / ✅ COMPLETE | PR #56, Provider-Mapping- und Evidence-Scoring-Tests, CI PASS |

Bekannte Entscheidungen, die **bewusst nicht** als erledigt klassifiziert werden:

| ADR | Aktueller Grund |
|---|---|
| ADR-0011 | Time-Limited Exceptions `server/` und `server.ts` bestehen weiterhin; Zielmigration ist nicht abgeschlossen. |
| ADR-0015 | Traceability Stufe 1–2 und Stufe 4 sind umgesetzt, Stufe 3 nur teilweise; vollständige Consume-/State-Transition-Integration sowie Teile der Knowledge-/Twin-Zielarchitektur bleiben offen. |
| ADR-0017 | **Revalidierung 2026-08-02: offen.** Supabase-Migrationen `user_quota`, Service-Role-RLS-Härtung, `handle_new_user`-search_path und `compliance_runs` sind live angewendet; der Security Advisor zeigt für diesen Scope keine neue DB-Warnung. Der Stripe-Code nutzt korrekterweise separate `STRIPE_PRICE_ID_*_YEARLY` ohne serverseitige Rabattberechnung. Die aktuelle Live-Stripe-Konfiguration widerspricht jedoch der dokumentierten 10%-Jahresregel für PRO: 29,00 EUR/Monat = 348,00 EUR/Jahr; 10% rabattiert = 313,20 EUR, der aktive PRO-Jahrespreis beträgt 248,00 EUR. Bis die Preis-/Business-Rule-Abweichung bewusst entschieden und dokumentiert ist, darf ADR-0017 nicht nach `resolved/`. |
| ADR-0022 | Allgemeines Individual-Bond-Scoring bleibt evidence-gated und gesperrt. |
| ADR-0029 | Bond-Scoring-Gewichte sind weiterhin `Proposed / Pending Review`; Rating- und Liquidity/Spread-Evidence sowie fachliche Modellfreigabe fehlen. |
| ADR-0031 | Supabase-Free-Tier-Leaked-Password-Protection ist eine aktive, planbedingte Risk Acceptance bis Pro+. |

### ADR-0017 Revalidation Evidence — 2026-08-02

Die erneute Prüfung trennt Code-, Datenbank- und Billing-Wahrheit:

- **Supabase:** Die produktive Migration History enthält `user_quota`, `add_missing_service_role_rls_policies`, `harden_handle_new_user_search_path` und `compliance_runs`. Der verbleibende Auth-WARN `auth_leaked_password_protection` gehört zur separaten Free-Tier-Risk-Acceptance ADR-0031; `screening_slo_evidence` ohne Policy ist ein späterer, absichtlich fail-closed Service-Only-Befund.
- **Stripe Runtime:** Aktive Live-Prices: STARTER 7,00 EUR monatlich / 75,60 EUR jährlich (exakt 10% Rabatt); PRO 29,00 EUR monatlich / 248,00 EUR jährlich (nicht 10%); zusätzlich existiert ein aktiver ENTERPRISE-Jahrespreis von 1.280,00 EUR.
- **Backend:** `server/stripe.ts` wählt für STARTER und PRO bei `billingPeriod === 'yearly'` ausschließlich die konfigurierten `STRIPE_PRICE_ID_*_YEARLY`. Der Rabatt wird bewusst nicht im Backend berechnet. Damit muss die Price-Konfiguration selbst der freigegebenen Business Rule entsprechen.

Diese Revalidierung ändert **keinen** Stripe-Preis. Eine Preisänderung ist ein finanziell wirksamer Production-Billing-Change und benötigt eine explizite Entscheidung im Billing-/Release-Lifecycle.

ADR-0033 aktiviert ausschließlich den engeren **Sovereign Benchmark Yield** Contract. Das ist kein
Abschluss von ADR-0022/ADR-0029 für allgemeine Einzel- oder Corporate Bonds.

### Altbestand ADR-0004 bis ADR-0007

Die Aussage aus dem Snapshot vom 2026-07-30 wird nicht automatisch überschrieben. Seitdem wurden
zahlreiche Plattformmodule implementiert, aber die vier ursprünglichen Entscheidungen müssen jeweils
gegen ihren exakten historischen Decision Scope aus `adr_history.json` neu geprüft werden, bevor sie
nach `resolved/` verschoben oder als superseded/rejected klassifiziert werden. Insbesondere darf
ADR-0005 (Module Federation/PostMessage/JWT-Sharing) nicht allein wegen eines inzwischen umfangreichen
Frontends als umgesetzt gelten.

Für ADR-0006 ist inzwischen zusätzlich belegt: `src/platform/PlatformDirector` ist weiterhin ohne
Funktionscode, während ESS-0003 einen vollständigen Decision-/Release-/Exception-Contract definiert.
Damit ist ADR-0006 ein echter Implementierungs-Backlog und darf nicht als abgeschlossen markiert
werden.

`IAM_IMPLEMENTATION_LOG.md` war vor der historischen Aktualisierung ausschließlich auf dem Stand von
"Prompt 1" (Entwicklungsumgebung, vor Migration); für IAM gilt inzwischen die separate verifizierte
Resolved-Evidence der entsprechenden IAM-ADRs.
