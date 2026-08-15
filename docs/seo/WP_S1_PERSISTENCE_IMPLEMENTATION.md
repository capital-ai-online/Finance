# WP-S1 — SeoEngine Persistenz: Implementierungsvorbereitung

**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S1  
**Claim:** `SEO-WP-S1-PERSISTENCE-2026-08-15`  
**Branch:** `seo/wp-s1-persistence-prep`  
**Status:** PREPARED (noch nicht implementiert / keine Produktions-DB-Mutation)  
**Stand:** 2026-08-15

---

## 1. Ziel

SeoEngine von rein in-memory auf **persistente** Keyword-/Rank-/Content-Daten umstellen, ohne No-Demo-Data oder Admin-IAM zu verwässern.

| Anforderung | Soll |
|-------------|------|
| Rank-Quellen | nur `search-console` \| `manual-import` |
| Leerzustand | ehrlich (keine Seed-Ranks) |
| Schreibpfad | Server privileged Supabase (`getServerSupabase` / `server/db`) |
| RLS | deny-by-default; kein Public Write |
| API | `/api/seo/*` unverändert admin-gated (`checkAdminAccess`) |
| Fallback | Memory nur Dev/Test; Production fail-closed ohne privileged config |

---

## 2. Ist-Zustand (verifiziert)

| Baustein | Status |
|----------|--------|
| `SeoEngineService` in-memory | ✅ auf main |
| Admin-Router `/api/seo` | ✅ |
| Dashboard S3 | ✅ PR #309 |
| Migration `20260815010000_seo_engine.sql` | ⚠️ Draft auf main; **Source-Enum drift** |
| Persistenz-Wiring im Service | ❌ fehlt |
| RLS Policies (über ENABLE hinaus) | ❌ fehlen |
| Production apply der Migration | ❓ Owner-Gate |

### Schema-Drift (kritisch)

| Schicht | `source`-Werte |
|---------|----------------|
| TypeScript / API | `search-console`, `manual-import` |
| SQL Draft | `manual`, `search_console`, **`estimated`** |

`estimated` verstößt gegen No-Demo-Data und darf **nicht** produktiv bleiben.

---

## 3. Architektur (Ziel)

```
seoEngineRoutes.ts
        │
        ▼
  ISeoEngineStore  (interface)
     ├── MemorySeoEngineStore      (tests / optional local)
     └── SupabaseSeoEngineStore    (getServerSupabase)
              │
              ▼
     public.seo_keywords
     public.seo_rank_snapshots
     public.seo_content_inventory
```

**Muster:** analog `src/platform/Compliance/store.ts` → `getServerSupabase()` / `isSupabaseConfigured()` aus `server/db`.

Privilege-Separation (ADR-0043-Linie):

- Publishable/Anon **nie** für SEO-Writes
- Production: `assertPrivilegedSupabaseConfigured` bzw. äquivalent fail-closed

---

## 4. Implementierungsschritte (Reihenfolge)

### Schritt A — Schema angleichen (Repo, noch kein Prod-Apply)

1. Neue Migration `20260815200000_seo_engine_source_align_rls.sql`:
   - `source` CHECK nur `search-console` | `manual-import` (oder kanonische snake_case mit Mapping-Layer — **Empfehlung:** API-Strings beibehalten und SQL angleichen)
   - optional `notes` auf keywords/content falls API sie speichert
   - RLS Policies: SELECT/INSERT/UPDATE/DELETE **nur** für `service_role` (bzw. keine Policies für `authenticated`/`anon` → deny)
2. Bestehenden Draft-Kommentar aktualisieren: „Apply only after OWNER review“

### Schritt B — Store-Abstraktion

1. `src/platform/SeoEngine/store/ISeoEngineStore.ts` — async-fähige Interface-Methoden (list/add keywords, ranks, content, snapshot)
2. `MemorySeoEngineStore` — extrahiert aus aktuellem `SeoEngineService`
3. `SupabaseSeoEngineStore` — row mapping snake_case ↔ domain types
4. `createSeoEngineStore()` — Factory: production → Supabase privileged; test → memory

### Schritt C — Router

1. `seoEngineRoutes.ts` auf async Store umstellen
2. Fehlercodes: 400 domain validation, 403 authz, 503 DB not configured (prod)

### Schritt D — Tests

1. Bestehende `seoEngineStore.test.ts` gegen Memory-Adapter
2. Neu: contract tests — reject `estimated`, unknown keywordId, empty ranks default
3. Mock-Supabase optional; kein Live-DB in CI Pflicht

### Schritt E — Owner Production Gate (separat)

1. Migration auf Supabase Production **nur** nach ausdrücklicher Owner-Freigabe
2. Evidence: Migration History + read-only Probe (keyword count, rank count = 0 initial)
3. Kein automatischer Seed von Rankings

---

## 5. Definition of Done (WP-S1)

- [ ] Source-Enum SQL ≡ API (kein `estimated`)
- [ ] RLS enabled + keine anon/authenticated Write-Policies
- [ ] `ISeoEngineStore` + Memory + Supabase Adapter
- [ ] Routes nutzen Store; Production fail-closed ohne privileged key
- [ ] Unit/Contract-Tests grün
- [ ] `docs/seo/S1_SEO_ENGINE.md` Status aktualisiert
- [ ] ADR-Draft finalisiert oder nummeriert nach Kollisionscheck
- [ ] Production apply + Evidence **oder** explizit „schema on main, apply pending Owner“

---

## 6. Risiken & Stop-Conditions

| Risiko | Maßnahme |
|--------|----------|
| Shared Migration Zone | Nur `seo_*` Tabellen; keine globalen Auth-Tabellen |
| Privilege fallback auf Anon | Tests wie `supabasePrivilegeSeparation.test.ts` |
| Doppelte IDs Memory vs UUID | Domain `id` als string; DB uuid → string |
| Stille Rank-Invention | CHECK + API reject + Tests |

STOP bei: Scope-Drift in Shared Zone, fehlender Owner-Approval für Prod-Apply, Request nach `estimated`-Ranks.

---

## 7. Nicht in diesem WP

- Search Console MCP (WP-D5)
- Prerender (WP-S2)
- Content-Generate (WP-N1)
- AdSense (WP-R1)
- Documentary Event-Emission (optional follow-up, nicht blockierend für Store)

---

## 8. Nächster Code-PR (nach diesem Prep)

Empfohlener Titel: `feat(seo): WP-S1 SeoEngine Supabase store + source enum align`  
Scope: Adapter + Migration-Align + Tests; **ohne** automatisches Prod-Apply.
