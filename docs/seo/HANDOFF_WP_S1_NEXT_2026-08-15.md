# Übergabe — WP-S1 SeoEngine an nächsten Bearbeiter (Grok)

**Von:** Claude (Sonnet 5 / Opus 5, Sessions 2026-08-15)
**An:** Grok — übernimmt SEO-GM-ROADMAP-0002 / WP-S1 und die anschließenden SEO-Code-WPs
**Stand:** 2026-08-15, nach Abschluss `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15`
**Repo-Kontext:** Dieses Repo wird von mehreren Agenten-Providern parallel bearbeitet (Claude, ChatGPT, jetzt Grok) — Koordination läuft über `.ai/work-claims/*.json`, `docs/coordination/claims/*.md` und die Roadmap-Statustabellen. Vor jedem neuen Branch dort nach überlappendem Scope suchen.

---

## 1. Kurzfassung

WP-S1 (SeoEngine Persistenz, RLS, No-Demo-Data) ist **inhaltlich fertig**. Code liegt auf `main` (PR #335), alle fünf Supabase-Migrationen sind auf Produktion angewendet und verifiziert. Der **einzige offene Schritt** für WP-S1 = VERIFIED ist die ADR-Nummerierung (Abschnitt 4). Danach beginnt laut Roadmap §10 das nächste Code-WP: **WP-D1/D2/D3** (JSON-LD, Title/Meta, Soft-404).

## 2. Was bereits erledigt ist — mit Belegen

### 2.1 Code (main, PR #335)

| Baustein | Pfad |
|---|---|
| Domain-Typen + Service-Fassade | `src/platform/SeoEngine/` |
| Store-Abstraktion | `src/platform/SeoEngine/store/` (`ISeoEngineStore`, `MemorySeoEngineStore`, `SupabaseSeoEngineStore`, `createSeoEngineStore`) |
| Admin-API | `server/routes/seoEngineRoutes.ts` → `/api/seo/*`, `checkAdminAccess`-gated, 503 fail-closed ohne privilegierten Supabase-Client |
| Tests | `tests/unit/seoEngineStore.test.ts`, `tests/unit/seoEnginePersistence.contract.test.ts`, `tests/unit/seoEngine.test.ts` |
| Dashboard | S3, PR #309 |

### 2.2 Datenbank (Supabase `AIFINANCIAL`, Projekt-Ref `ryzywoktpmyhwzxmstyu` — **die einzige Instanz, also Produktion**)

Vier Migrationen angewendet, in dieser Reihenfolge, jede einzeln Owner-freigegeben:

1. `20260815010000_seo_engine.sql` — drei Tabellen (`seo_keywords`, `seo_rank_snapshots`, `seo_content_inventory`), RLS aktiviert, keine Policies (deny-by-default).
2. `20260815200000_seo_engine_source_align_rls.sql` — `source`-CHECK auf `search-console` \| `manual-import` gehärtet (`estimated` ausgeschlossen), `REVOKE ALL … FROM anon, authenticated`.
3. `20260815210000_seo_engine_service_role_grants.sql` — `service_role` bekommt explizite Grants: `seo_keywords`/`seo_content_inventory` volles DML, `seo_rank_snapshots` **ohne DELETE und ohne TRUNCATE** (Rank-Evidenz).
4. `20260815220000_seo_rank_snapshots_fk_restrict.sql` — `seo_rank_snapshots.keyword_id`-FK von `ON DELETE CASCADE` auf `ON DELETE RESTRICT` umgestellt. Grund: Postgres verlangt für einen Cascade kein DELETE-Recht auf der referenzierenden Tabelle — das Löschen eines Keywords hätte trotz entzogenem DELETE-Grant die komplette Rank-Historie mitgerissen. Stilllegung eines Keywords läuft über das bestehende Feld `seo_keywords.active`, nicht über DELETE.

Verifiziert per `information_schema`/`pg_constraint`/`has_table_privilege`: RLS `true` + `policy_count = 0` auf allen drei Tabellen, FK-Definition exakt `FOREIGN KEY (keyword_id) REFERENCES seo_keywords(id) ON DELETE RESTRICT`, `service_role`-Privilegien exakt wie oben. Alle drei Tabellen leer (0 Zeilen) — **keine Seed-/Demo-Ranks**, das bleibt Pflicht (No-Demo-Data-Kontrakt, `estimated` ist DB-seitig ausgeschlossen).

Zusätzlich: Ledger-Abgleich durchgeführt (`docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`). Der Supabase-MCP-Connector stempelt beim Anwenden die Ausführungszeit statt der Repo-Version in `supabase_migrations.schema_migrations`; die vier Zeilen wurden per namensbasiertem `UPDATE` auf die Repo-Versionen korrigiert. `schema_migrations` zeigt jetzt exakt `20260815010000`, `20260815200000`, `20260815210000`, `20260815220000`.

**Wichtige Abgrenzung, nicht verwechseln:** Drei andere Migrationen (`20260801150000_social_media_publishing`, `20260810110642_pdf_credit_ledger`, `20260815140000_social_media_content_approvals`) fehlen ebenfalls im Ledger — das ist aber **kein** Drift, sondern echter, unangewendeter Migrationsrückstand. Verifiziert per `to_regclass`: keine der sechs dort deklarierten Tabellen existiert in der Datenbank. Diese drei liegen außerhalb von WP-S1 und wurden bewusst nicht angefasst — falls das auffällt, ist es ein separater, vorbestehender Befund, keiner deiner offenen Punkte.

### 2.3 Governance-Muster, das für diese Mutationen galt

Jede Supabase-Produktionsmutation lief einzeln: VORHER (read-only Pre-Check) → explizite Owner-Freigabe im Chat (`APPROVE <migration-id>` bzw. eine ausformulierte ROLE/AUTHORITY/GOAL-Freigabe mit `ownerDecision`) → Apply → NACHHER (Verifikation per SQL gegen `information_schema`/`pg_constraint`/`pg_policies`, nie nur "success"). `CLAUDE.md` in diesem Repo verlangt dieses Muster hart für die dort gelistete Kategorie (CookieHub/Consent/CSP/IAM) — für Supabase-Schemamutationen wie diese ist es nicht formal vorgeschrieben, wurde hier aber als Sicherheitsnetz für jede Produktionsmutation angewendet, und die Owner-Praxis in diesem Repo (siehe `docs/runbooks/M5_SUPABASE_AGENT_AUDIT_MUTATION.md`, `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`) folgt demselben Muster. Empfehlung: bei künftigen `seo_*`-Migrationen genauso verfahren, nicht stillschweigend mutieren.

## 3. Branch-/PR-Zustand

- Branch `claude/seo-engine-db-migration-bmgb7o` trug den Follow-up-Commit; PR dafür ist vorbereitet/offen zum Zeitpunkt dieser Übergabe (Docs-only: Runbook-Evidenz + diese drei Status-Doku-Updates + dieses Handoff).
- `main` enthält bereits PR #333 (Grants) und PR #335 (Store-Adapter) und PR #338 (Doku-Closure nach #335) — diese drei sind gemergt.
- Work Claims: `.ai/work-claims/SEO-WP-S1-PERSISTENCE-2026-08-15.json` (prepared) → `SEO-WP-S1-STORE-CODE-2026-08-15` (merged, von anderem Agenten) → `.ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json` (status `applied`, dieser Vorgang).
- Für deinen nächsten Schritt (ADR-Nummerierung oder WP-D1/D2/D3): **neuen Branch + neuen Work Claim** anlegen, nicht auf einem der oben genannten weiterarbeiten — die sind mit ihrem jeweiligen PR abgeschlossen.

## 4. Dein nächster Schritt: ADR-Nummerierung

Datei: `docs/adr/ADR-DRAFT-seo-engine-platform-module.md`, Status aktuell `Draft — number to be assigned on acceptance (avoid AUD5-F-002 collisions)`.

- Höchste vergebene ADR-Nummer im Repo ist aktuell `ADR-0074` → nächste freie Nummer ist `ADR-0075`. **Vor dem Umbenennen erneut `ls docs/adr/` prüfen** — zwischen dieser Übergabe und deiner Bearbeitung können andere Agenten weitere ADRs gemergt haben; das ist der Kollisionscheck, den AUD5-F-002 verlangt.
- Datei von `ADR-DRAFT-seo-engine-platform-module.md` auf `ADR-0075-seo-engine-platform-module.md` (oder die dann tatsächlich freie Nummer) umbenennen, Status-Header von `Draft` auf den finalen Status setzen, interne Querverweise in `docs/seo/S1_SEO_ENGINE.md`, `docs/seo/WP_S1_PERSISTENCE_IMPLEMENTATION.md` und der Roadmap-Datei auf den neuen Dateinamen aktualisieren.
- Danach: WP-S1 in der Roadmap-Statustabelle (§4/§5.2, `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`) auf VERIFIED setzen.

## 5. Was danach ansteht (Roadmap §10)

Reihenfolge laut `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` Abschnitt 10, Stand nach diesem Vorgang:

1. ~~FK RESTRICT + Ledger-Abgleich~~ — erledigt (dieser Vorgang).
2. Search Console Property verifizieren (WP-Q-CLOSE / Q3) — Owner-Aktion, nicht Code.
3. **ADR-Nummerierung** — siehe Abschnitt 4 oben, dein erster Schritt.
4. ADR-0068 + ESS-0022 Owner-Review (WP-M0) — ohne Runtime-Enablement, vermutlich nicht dein Scope.
5. Nächstes Code-WP ohne Shared-Zone-Lease: **WP-D1/D2/D3** (JSON-LD, Title/Meta, Soft-404) — siehe `docs/seo/D_BLOCK_IMPLEMENTATION_NOTES.md` und `docs/seo/D3_SOFT_404.md`.
6. WP-S2 (Prerender) erst nach formalem Prerender-ADR — nicht vorziehen.

## 6. Guardrails, die für dich gelten

- **No-Demo-Data:** Ranks bleiben leer, bis eine echte Quelle liefert. Kein Seed, kein `estimated`, das ist jetzt auch DB-seitig durch den CHECK-Constraint erzwungen.
- **Privilege-Trennung:** SEO-Tabellen bleiben `service_role`-only, deny-by-default RLS ohne Policies. Keine Policy für `anon`/`authenticated` hinzufügen, ohne das explizit mit dem Owner zu klären — das wäre eine bewusste Abkehr vom aktuellen Modell, nicht eine Fortsetzung.
- **`seo_rank_snapshots` bleibt ohne DELETE/TRUNCATE für `service_role`.** Falls ein Feature das bräuchte (z. B. Korrektur fehlerhafter Snapshots), ist das eine eigene, explizit zu begründende Migration — nicht implizit mitziehen.
- **Shared-Zone-Lease:** Nur `seo_*`-Tabellen und die in Abschnitt 4/5 genannten Pfade anfassen. Keine globalen Auth-/Billing-Tabellen, kein `server.application.ts`, `server/stripe.ts`, `render.yaml`, `Dockerfile` im selben PR.
- **Migration-Ledger:** Falls du den Supabase-MCP-Connector für weitere `apply_migration`-Aufrufe nutzt, bedenke den in Abschnitt 2.2 beschriebenen Zeitstempel-Drift — entweder den Abgleich analog zum Runbook wiederholen, oder (sauberer) per `supabase db push` anwenden.

## 7. Referenzen

| Zweck | Pfad |
|---|---|
| WP-S1 Statusübersicht | `docs/seo/S1_SEO_ENGINE.md` |
| WP-S1 Implementierungsplan + DoD | `docs/seo/WP_S1_PERSISTENCE_IMPLEMENTATION.md` |
| Ledger-Runbook (Muster für künftige Abgleiche) | `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md` |
| Follow-up-Vorgang (dieser) | `.ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json` |
| Roadmap (kanonisch) | `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` |
| ADR-Draft, umzubenennen | `docs/adr/ADR-DRAFT-seo-engine-platform-module.md` |
| Migrationen (alle vier, angewendet) | `supabase/migrations/20260815{010000,200000,210000,220000}_*.sql` |
