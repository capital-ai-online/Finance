# ADR-0017: Produktions-Audit-Nachbesserungen — Quota-Durchsetzung, Supabase-Härtung, Stripe-Jahresrabatt, Compliance-Backend

## Status

**Accepted**

## Implementation-Status

✅ **COMPLETE** (verifiziert 2026-07-31) — Alle vier Entscheidungen sind umgesetzt und gegen
die produktive Supabase-Instanz sowie `tsc --noEmit` / `vite build` verifiziert.

## Datum

2026-07-31

## Verantwortlich

Platform Director

## Betroffene Artefakte

`server/quota.ts` (neu), `server.ts` (Quota-Einbindung, Router-Mount), `supabase/migrations/20260730000000_user_quota.sql` (angepasst), `supabase/migrations/20260731000000_add_missing_service_role_rls_policies.sql` (neu), `supabase/migrations/20260731000100_harden_handle_new_user_search_path.sql` (neu), `supabase/migrations/20260731000200_compliance_runs.sql` (neu), `server/stripe.ts` (Import-Fix), `server/_.env.example` (Jahres-Price-ID-Dokumentation), `src/components/Abonnements.tsx` (Hinweistext), `server/compliance/types.ts` (neu), `server/compliance/scanners.ts` (neu), `server/compliance/store.ts` (neu), `server/compliance/router.ts` (neu), `src/components/SecurityComplianceAuditor.tsx` (Import-Fix, `authFetch`), `docs/adr/ADR-0012-SecurityComplianceAuditor.md` (Implementation-Status aktualisiert)

---

## Kontext

`docs/architecture/ENTERPRISE_PRODUCTION_AUDIT.md` (ARCH-AUDIT-0001) benannte vier offene
Entscheidungen, die ausdrücklich dem Platform Director vorbehalten waren. Der Platform Director
hat alle vier am 2026-07-31 wie folgt entschieden:

1. `user_quota` — per Best-Practice-Abwägung entscheiden.
2. Supabase — Realzustand erneut prüfen und Fehler nur beheben, sofern die Prozessketten
   Useranmeldung und Abonnement-Synchronisation dadurch nicht beeinträchtigt werden.
3. Der 10%-Jahresrabatt wird über einen Stripe-Produktrabatt gelöst, nicht clientseitig berechnet.
4. Die `/api/compliance/*` Endpunkte aus ADR-0012 werden gemäß der dort beschriebenen
   Architektur und Prozesskette angebunden.

---

## Entscheidung

### 1. `user_quota` — Best-Practice-Abwägung

**Befund vor der Entscheidung:** Die Migration `20260730000000_user_quota.sql` existierte im
Repository, war aber **nie gegen die produktive Datenbank ausgeführt** worden (nicht in
`list_migrations` enthalten). Ihr Kommentar verwies auf `src/lib/freeTierLimits.ts` — eine Datei,
die **nie existiert hat**. Die tatsächliche Durchsetzung des Screening-Limits lief ausschließlich
über `src/lib/dailyScreeningTracker.ts`, einen reinen `localStorage`-Zähler ohne jede
Server-Beteiligung — trivial umgehbar (Audit-Befund S-04) und zugleich die einzige Kontrolle für
einen bezahlten Tarif-Unterschied (Starter 5 Screenings/Tag vs. PRO unbegrenzt).

**Abwägung:** Löschen der Migration hätte den Fehlzustand nur beseitigt, nicht behoben — das
zugrunde liegende Problem (Tarifgrenze ohne Serverkontrolle) hätte fortbestanden. Das
Tabellendesign selbst ist korrekt (Service-Role-only RLS, saniert). Best Practice für eine
monetarisierte Nutzungsgrenze ist serverseitige Durchsetzung.

**Entscheidung:** Migration aktivieren und mit echter Serverlogik verbinden.

- `server/quota.ts` implementiert `enforceScreeningQuota()`: eingeloggte Nutzer werden per
  E-Mail in `public.user_quota` gezählt (persistent, geräteübergreifend); Aufrufe ohne
  verifizierte Session (Free/Gast) fallen auf den bestehenden In-Memory-IP-Limiter aus
  `server/iam/rateLimiter.ts` zurück, da für sie keine stabile Identität existiert.
- Eingebunden in `GET`/`POST /api/crypto-scoring/:symbol` in `server.ts` — der bislang völlig
  ungeschützte Endpunkt, den der client-seitige Zähler zu schützen vorgab.
- Der client-seitige Tracker bleibt unverändert bestehen (sofortiges UI-Feedback ohne
  Server-Roundtrip); die Serverseite ist jetzt die tatsächliche Durchsetzung, nicht mehr nur die
  Anzeige.
- Datenbankfehler in diesem Pfad führen bewusst zu `fail-open` (zahlende Kunden dürfen nicht durch
  einen DB-Ausfall gesperrt werden) — anders als bei `checkAdminAccess()`, das sicherheitskritisch
  `fail-closed` bleibt.

### 2. Supabase — Realzustand geprüft, korrigiert wo gefahrlos möglich

**Live-Prüfung (2026-07-31):** Projekt `ryzywoktpmyhwzxmstyu` steht auf `ACTIVE_HEALTHY`, alle 17
vorher dokumentierten Migrationen sind angewendet. Der im Produktionsaudit dokumentierte Zustand
`MIGRATIONS_FAILED` betraf einen inzwischen bereinigten Branch-Zustand, nicht das aktuelle Projekt.

**Real gefundene und behobene Befunde** (Supabase Security Advisor):

| Befund | Fix | Risiko für Login/Abo-Sync |
|---|---|---|
| 6 Tabellen (`audit_logs_iam`, `iam_access_log`, `step_up_tokens`, `break_glass_codes`, `usage_log`, `users`) mit RLS aktiv, aber ohne Policy | Service-Role-only Policy ergänzt, identisches Muster wie die bestehende `user_quota`-Policy | Keins — alle sechs Tabellen sind bereits ausschließlich über den Service-Role-Key adressiert |
| `handle_new_user()` (Signup-Trigger) ohne festen `search_path` | `SET search_path = public, pg_temp` ergänzt, Funktionslogik **byte-identisch** belassen | Geprüft: additive Härtung, kein Verhaltensunterschied. Läuft bei jeder Neuregistrierung |
| `user_quota`-Migration nie angewendet | Angewendet (siehe Punkt 1) | Keins — neue, isolierte Tabelle |

**Bewusst nicht verändert:**

- `stripe.set_updated_at`, `stripe.set_updated_at_metadata`, `stripe.check_rate_limit` (Schema
  `stripe`) — verwaltet durch die Supabase-Stripe-Sync-Engine, nicht durch dieses Repository.
  Eingriffe hier würden bei der nächsten Sync-Engine-Aktualisierung überschrieben und riskieren die
  Abonnement-Synchronisation, die die Vorgabe ausdrücklich schützen sollte.
- `auth_leaked_password_protection` — eine Supabase-Auth-Dashboard-Einstellung, nicht per
  Migration erreichbar. Verbleibt als offener Punkt für den Platform Director (Supabase Dashboard
  → Authentication → Policies).

### 3. Stripe-Jahresrabatt — keine serverseitige Berechnung

**Erster Ansatz (verworfen, siehe Alternativen):** ein serverseitig automatisch angewendeter
Stripe-Coupon (`STRIPE_COUPON_ID_YEARLY`). Der Platform Director hat diesen Ansatz korrigiert:
Jahresabonnements benötigen **keine serverseitige Berechnung und somit auch keine Variable und
keine Backend-Logik**.

**Begründung:** `server/stripe.ts` wählt bei `billingPeriod === 'yearly'` bereits seit vorheriger
Implementierung eine **eigene** Stripe-Price-ID (`STRIPE_PRICE_ID_STARTER_YEARLY`,
`STRIPE_PRICE_ID_PRO_YEARLY`) statt der Monatspreis-ID. Der Jahresrabatt gehört damit strukturell
in den Betrag dieses separaten, im Stripe Dashboard gepflegten Price-Objekts — nicht in eine
zusätzliche Coupon-Berechnung zur Laufzeit. Ein Coupon obendrauf hätte den Rabatt dupliziert oder
mit dem bereits im Jahrespreis enthaltenen Rabatt kollidieren können.

**Entscheidung:** Die zunächst eingeführte Coupon-Logik (`effectiveCouponId`,
`STRIPE_COUPON_ID_YEARLY`, `stripe.coupons.retrieve()`) wurde vollständig entfernt.
`server/stripe.ts` verwendet für `couponId` wieder ausschließlich den vom Client übergebenen Wert
— reserviert für vom Kunden eingelöste Promotion-Codes (bestehendes `validate-coupon`-Feature),
nicht für den automatischen Jahresrabatt. `server/_.env.example` führt `STRIPE_COUPON_ID_YEARLY`
nicht mehr. `Abonnements.tsx` zeigt weiterhin eine Vorabschätzung (0.9-Multiplikator auf den
Monatspreis) ohne Verweis auf einen serverseitigen Coupon-Mechanismus, da keiner mehr existiert.

### 4. ADR-0012 Compliance-Endpunkte — Backend implementiert

ADR-0012 dokumentierte den Befund: sieben Frontend-Aufrufe unter `/api/compliance/*`, kein einziger
Endpunkt implementiert, Import aus einem nicht existierenden Verzeichnis
(`server/compliance/types`). Umgesetzt gemäß der im ADR beschriebenen Architektur
(`Admin Portal → SecurityComplianceAuditor → IAM System / Audit Logging → Supabase`):

- **`server/compliance/types.ts`** — die zuvor fehlende Typdatei, exakt passend zu den bereits im
  Frontend verwendeten Interfaces.
- **`server/compliance/scanners.ts`** — 21 Scanner-Module (passend zur im Frontend fest verdrahteten
  Beschriftung "Scanner-Module (21)"), gruppiert in Security (7), Data & Privacy (5), Billing (3),
  Code Quality (3), Governance (3). Jedes Modul liest den tatsächlichen Repository-/Migrations-/
  Registry-Zustand zur Laufzeit (Dateisystem-Greps, Migrationsdateien, `ess-registry.json`,
  ADR-Verzeichnis) — keine festen Demo-Werte.
- **Abweichung zu ADR-0012 korrigiert:** Das ADR nannte `audit_logs_iam`/`iam_access_log` als
  Datenquelle für den Auditor. Diese Tabellen sind IAM-Ereignis-Logs (Actor/Target/Action) und für
  Scan-Ergebnisse strukturell ungeeignet — dieselbe Feststellung, die das ADR selbst bereits als
  offenen Punkt führte. Stattdessen: eigene Tabellen `compliance_runs` und
  `compliance_certificates` (Migration `20260731000200_compliance_runs.sql`), Service-Role-only RLS.
- **`server/compliance/router.ts`** — alle sechs Endpunkte (`dashboard`, `risk`, `certificates`,
  `run`, `certify`, `report`), jeder über `checkAdminAccess(req, 'compliance:*', ADMIN_ZONE_ROLES)`
  geschützt — dasselbe Muster wie der bestehende `registry:assets:update`-Zonenschutz in `server.ts`.
  Der Auditor bleibt damit, wie in ADR-0012 gefordert, auf Leserechte/Analyse/Reporting beschränkt:
  `run` und `certify` erzeugen ausschließlich Scan-Ergebnisse bzw. Zertifikate, verändern keine
  IAM-Regeln und vergeben keine Berechtigungen.
- **`src/components/SecurityComplianceAuditor.tsx`**: kaputter Import korrigiert; alle sieben
  `fetch()`-Aufrufe auf `authFetch()` umgestellt (bestehende Utility aus `src/lib/authFetch.ts`),
  da die neuen Endpunkte einen Bearer-Token erfordern — ohne diese Änderung hätte die
  Admin-Gate-Prüfung jeden Aufruf mit 403 abgelehnt.
- **Verifiziert:** `npx tsc --noEmit` sank von 38 auf 9 Fehler (die verbleibenden 9 sind
  vorbestehend und nicht Gegenstand dieser Entscheidung — `stepUp.ts`, `systemEvents.ts`,
  `Dashboard.tsx`). `npx vite build` erfolgreich. Ein bislang unbemerkter, unabhängiger Bug in
  `server/stripe.ts` (`getServerSupabase` verwendet, aber nie importiert — hätte bei
  Gast-Checkout-Abschluss eine `ReferenceError` geworfen) wurde beim Bearbeiten derselben Datei
  mitkorrigiert.

---

## Alternativen

**Zu 1) `user_quota`-Migration ersatzlos löschen.**
Verworfen. Hätte den Fehlzustand entfernt, aber die eigentliche Schwachstelle (S-04) unbehoben
gelassen und wäre der einfachere, nicht der bessere Weg gewesen.

**Zu 2) Vollständige RLS-Policy-Überarbeitung inkl. differenzierter Nutzerrechte.**
Verworfen für diesen Schritt. Die sechs betroffenen Tabellen sind ausschließlich server-seitig
adressiert; eine Service-Role-only-Policy bildet den tatsächlichen Zugriff exakt ab, ohne die
Prozesskette anzufassen. Feingranularere Policies wären eine eigene, hier nicht angeforderte
Entscheidung.

**Zu 3a) Rabatt weiterhin ausschließlich clientseitig berechnen (ursprünglicher Zustand).**
Verworfen. Widerspricht der Vorgabe "über Stripe Rabatt in den Produkten gelöst".

**Zu 3b) Serverseitiger Stripe-Coupon, automatisch angewendet (erster Umsetzungsversuch).**
Verworfen und wieder entfernt. Der Rabatt steckt bereits strukturell im Betrag der separaten
Jahres-Price-ID; ein zusätzlicher Coupon wäre redundante, potenziell kollidierende
Backend-Logik für etwas, das Stripe über die Price-ID-Auswahl bereits abbildet. Explizite
Platform-Director-Korrektur: "Alle Jahresabonnements benötigen keine serverseitige Berechnung
und somit auch keine Variable und keine Backend-Logik."

**Zu 4) `audit_logs_iam`/`iam_access_log` wie im ADR-Text beschrieben zweckentfremden.**
Verworfen. Das ADR selbst dokumentierte diese Abweichung bereits als offenen Punkt; eigene,
korrekt geformte Tabellen lösen den Konflikt, statt ihn fortzuschreiben.

---

## Konsequenzen

### Positiv

- S-04 (Quota clientseitig umgehbar) ist geschlossen: Screening-Limit wird jetzt serverseitig
  durchgesetzt.
- 6 RLS-Advisory-Befunde und 1 Function-Search-Path-Befund gegen die produktive Datenbank behoben,
  ohne Login- oder Abo-Sync-Verhalten zu verändern.
- Jahresrabatt ist strukturell an die Stripe-Price-ID gebunden, ohne zusätzliche
  Backend-Logik, Variable oder Fehlerquelle im Server.
- C-01 (kaputter Import, 19 von 38 TypeScript-Fehlern) ist behoben; FND-ADR-0012-01 (fehlende
  Compliance-Endpunkte) ist geschlossen.

### Negativ / Aufwand

- Der Platform Director muss sicherstellen, dass die Beträge der
  `STRIPE_PRICE_ID_STARTER_YEARLY`/`STRIPE_PRICE_ID_PRO_YEARLY` Price-Objekte im Stripe
  Dashboard den beworbenen 10%-Rabatt tatsächlich enthalten — das Frontend zeigt weiterhin nur
  eine Schätzung, keine live abgefragte Zahl.
- Die 21 Compliance-Scanner sind statische Repository-Analysen, kein Ersatz für einen echten
  SAST/Dependency-Scanner. Sie sind bewusst leichtgewichtig, um ohne externe Abhängigkeiten
  innerhalb eines Admin-Panel-Requests zu laufen.
- `auth_leaked_password_protection` bleibt als offener, nur per Dashboard lösbarer Punkt bestehen.

### Neutral

- Keine bestehende ESS- oder ADR-Entscheidung inhaltlich verändert; ADR-0012 wurde ausschließlich
  im Implementation-Status-Abschnitt fortgeschrieben.

---

## Folgeentscheidungen

1. Platform Director verifiziert, dass die Beträge der Jahres-Price-IDs im Stripe Dashboard den
   beworbenen 10%-Rabatt korrekt enthalten.
2. Platform Director aktiviert "Leaked Password Protection" im Supabase-Auth-Dashboard.
3. Prüfung, ob die 21 statischen Compliance-Scanner mittelfristig um einen echten
   Dependency-/SAST-Scan ergänzt werden sollen.
4. Behebung der verbleibenden 9 vorbestehenden `tsc`-Fehler (`stepUp.ts`, `systemEvents.ts`,
   `Dashboard.tsx`) — nicht Gegenstand dieser Entscheidung.

---

## Referenzen

- `docs/architecture/ENTERPRISE_PRODUCTION_AUDIT.md` (ARCH-AUDIT-0001) — Befunde S-04, S-01, C-01
- ADR-0012 — SecurityComplianceAuditor Integration
- ADR-0003.5 — Owner-IAM (Rate-Limiting-, Fail-Closed- und Audit-Log-Muster wiederverwendet)
- ESS-0001-CONTRACTS Chapter 11, 12, 14
- `server/quota.ts`, `server/compliance/*`, `supabase/migrations/20260731*`
