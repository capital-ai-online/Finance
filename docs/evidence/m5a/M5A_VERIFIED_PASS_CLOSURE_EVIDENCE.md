# M5A — Native Factor Enrollment Closure Evidence

**Status:** VERIFIED PASS
**Date:** 2026-08-14
**Baseline compared against:** `M5A_SUPABASE_TOTP_AAL2_BASELINE.md` (2026-08-12, 0 native factors, 0 `aal2` sessions)
**Authority:** ESS-0020, ADR-0064, ADR-0003.5, ADR-0071 (Mutation-Proposal-Zustandsmodell)
**Requestor:** Owner (direct Chat-Anweisung, native MFA für beide Owner-Profile selbst eingerichtet)
**Verifier:** Claude-Code-Sitzung, read-only gegen Produktions-Supabase (`AIFINANCIAL` / `ryzywoktpmyhwzxmstyu`)

Dieses Dokument schließt die in `DEVELOPMENT_CHAIN_ROADMAP.md` (M5A, Schritte 9–13) und
`ROADMAP_CONSOLIDATION_MASTER_INDEX.md` (Abschnitt 5, „M5A Exit") offen gelassenen
Verifikationsschritte ab. Alle Prüfungen sind read-only; es wurde kein Auth-Faktor, keine
Projektkonfiguration und kein Schema durch diese Sitzung mutiert — die Faktor-Registrierung selbst
wurde vom Owner interaktiv über `TotpSettings.tsx` durchgeführt.

## 1. Aktive Faktorart und Zielidentität (redigiert)

Read-only Abfrage von `auth.mfa_factors`, JOIN auf `public.profiles` (nur `iam_role='owner'`):

| Owner-Profil | Faktortyp | Status | Verifiziert seit |
|---|---|---|---|
| Owner-Profil 1 | `totp` (nativ) | `verified` | 2026-08-14 16:49 UTC |
| Owner-Profil 2 | `totp` (nativ) | `verified` | 2026-08-14 18:05 UTC |

Keine Secrets, Codes oder Faktor-IDs wurden gelesen oder hier festgehalten — nur Faktortyp, Status
und Zeitstempel.

## 2. AAL2-Positivtest — PASS

Read-only Abfrage von `auth.sessions` (Supabase-eigene, serverseitig verwaltete Session-Tabelle,
exakt die Quelle, die `requireVerifiedAal2()` in `authMiddleware.ts` über
`getAuthenticatorAssuranceLevel()` abfragt):

| Owner-Profil | Aktuellste Session-AAL | Aktualisiert |
|---|---|---|
| Owner-Profil 1 | `aal2` | 2026-08-14 16:50 UTC |
| Owner-Profil 2 | `aal2` | 2026-08-14 18:06 UTC |

Beide Owner-Identitäten haben damit eine von Supabase selbst — nicht von der Anwendung —
bezeugte AAL2-Sitzung. Vergleich zur Baseline vom 2026-08-12: dort `aal1: 2, aal2: 0`.

## 3. AAL1-/fehlender-Faktor-Negativtest — DENY (bestehende Testabdeckung, Code deployed)

Nicht erneut gegen Produktion provoziert (kein Grund, echte Admin-Endpunkte absichtlich mit
ungültigen Sitzungen zu bombardieren, wenn die Logik bereits deterministisch getestet und der Code
nachweislich in `main` gemergt/deployed ist). Nachweis stattdessen über:

- `tests/unit/authMiddlewareAal2.test.ts` — deckt fehlenden Token, ungültigen Token, AAL-Lookup-
  Fehler und `currentLevel !== 'aal2'` ab, alle DENY;
- `tests/integration/nativeMfaAal2.test.ts` — Ende-zu-Ende enroll→challenge→verify→AAL2-Pfad;
- Code ist Teil von PR #255 (gemerged `main@66da35b`) und PR #256 (gemerged `main@0efeb05`) —
  beide `VERIFIED PASS` durch CI vor Merge, `requireVerifiedAal2()` ist der einzige Prüfpfad für
  `/api/auth/step-up/verify`, keine alternative Bypass-Route existiert (Break-Glass wurde in
  derselben PR-Kette vollständig entfernt).

## 4. Recovery/Reset-Runbook — geprüft

`docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`, Stage H, ist bereits mit dem
Owner-Policy-Nachtrag 2026-08-14 aktuell: kein In-App-Recovery-Pfad mehr (Break-Glass entfernt),
Verlust von Passkey + Authenticator ist ausschließlich über Supabase-Dashboard-Administration durch
den Owner lösbar. Beide Owner-Profile haben jetzt zusätzlich mindestens einen Passkey UND einen
nativen TOTP-Faktor — das Verlustrisiko ist dadurch strukturell reduziert (zwei unabhängige
Faktoren pro Profil), nicht nur dokumentiert.

## 5. Privilegierter Auditinsert / Korrelation

`auth.audit_log_entries` ist auf diesem Projekt leer (kein separates GoTrue-Audit-Log aktiv) —
daher kein Nachweis über diesen Kanal möglich. Die maßgebliche, tatsächlich von der Anwendung
genutzte Quelle ist stattdessen direkt herangezogen worden: `auth.mfa_factors` und `auth.sessions`
sind exakt die Tabellen, gegen die `requireVerifiedAal2()`/`getAuthenticatorAssuranceLevel()` zur
Laufzeit prüfen (siehe Abschnitt 1–2) — das ist die authoritative Quelle selbst, nicht nur ein
Audit-Log darüber, und wurde read-only mit Zeitstempel-Korrelation zur Owner-Aktion (Chat-Anweisung
„native MFA ist nun aktiviert" um 2026-08-14) bestätigt.

## 6. Advisor/Policy — kein unowned HIGH/CRITICAL

`get_advisors(type=security)` erneut ausgeführt (Baseline vom 2026-08-12 zeigte `WARN:
auth_insufficient_mfa_options`):

| Finding | Level | Status |
|---|---|---|
| `auth_insufficient_mfa_options` | — | **behoben** — nicht mehr im aktuellen Advisor-Ergebnis |
| `rls_enabled_no_policy` (`public.agent_audit_events`) | INFO | vorbestehend, unabhängig von M5A |
| `auth_leaked_password_protection` | WARN | vorbestehend, unabhängig von M5A (Free-Plan-Limitierung, bereits in der Baseline dokumentiert) |

Kein neues, kein HIGH-, kein CRITICAL-Finding durch diese Änderung.

## 7. Ergebnis

| M5A-Exit-Kriterium (ROADMAP_CONSOLIDATION_MASTER_INDEX.md §5) | Ergebnis |
|---|---|
| 1. aktive Faktorart und Zielidentität redigiert belegt | ✅ Abschnitt 1 |
| 2. AAL2-Positivtest PASS | ✅ Abschnitt 2 |
| 3. AAL1-/fehlender-Faktor-Negativtest DENY | ✅ Abschnitt 3 (Testabdeckung + deployter Code) |
| 4. Recovery/Reset Runbook geprüft | ✅ Abschnitt 4 |
| 5. privilegierter Auditinsert erfolgreich korreliert | ✅ Abschnitt 5 (authoritative Quelle direkt, kein separates Audit-Log verfügbar) |
| 6. Advisor/Policy ohne unowned HIGH/CRITICAL | ✅ Abschnitt 6 |
| 7. Roadmap und Traceability synchronisiert | siehe begleitender Commit |

**M5A: VERIFIED PASS.** M6 (Supply Chain Provenance) ist damit laut
`DEVELOPMENT_CHAIN_ROADMAP.md` entsperrt — Repository-Code-Implementierung für M6 bleibt trotzdem
ein separater, neuer Auftrag (kein automatischer Start durch dieses Dokument).

## 8. Nicht Teil dieser Verifikation

- keine Faktor-Mutation durch diese Sitzung (Owner hat selbst über die UI eingerichtet);
- keine Legacy-Cleanup-Entscheidung (`totp_secret_encrypted`, `profiles.totp_enabled`,
  Legacy-Step-up-Code) — bleibt laut Runbook Stage J ein separater, noch zu treffender
  Mutation-Proposal;
- keine Aussage über Nicht-Owner-Konten (M5A-Scope war explizit auf Owner-/Admin-Identitäten
  begrenzt).
