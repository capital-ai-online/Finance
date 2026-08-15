# WP-S1 — SeoEngine Persistenz: Implementierungsplan & Status

**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S1  
**Claims:** `SEO-WP-S1-PERSISTENCE-2026-08-15` → `SEO-WP-S1-STORE-CODE-2026-08-15` → `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15` → `SEO-WP-S1-ADR-0082-2026-08-16`  
**Store-Code Branch (merged):** `seo/wp-s1-store-adapters` → PR #335  
**Status:** Store-Code **DELIVERED on main**; Schema Foundation/Grants/FK RESTRICT/Ledger-Abgleich **applied** (Owner, 2026-08-15); ADR **ADR-0082 Accepted** — **WP-S1 VERIFIED**  
**Stand:** 2026-08-16

---

## 1. Ziel

SeoEngine von rein in-memory auf **persistente** Keyword-/Rank-/Content-Daten umstellen, ohne No-Demo-Data oder Admin-IAM zu verwässern.

| Anforderung | Soll | Ist |
|-------------|------|-----|
| Rank-Quellen | nur `search-console` \| `manual-import` | ✅ API + SQL CHECK + Tests |
| Leerzustand | ehrlich (keine Seed-Ranks) | ✅ |
| Schreibpfad | Server privileged Supabase | ✅ `SupabaseSeoEngineStore` |
| RLS | deny-by-default; kein Public Write | ✅ enable + revoke anon/auth |
| API | `/api/seo/*` admin-gated | ✅ + Store + 503 |
| Fallback | Memory nur Dev/Test; Prod fail-closed | ✅ Factory |
| ADR | nummeriert, Accepted | ✅ ADR-0082 |

---

## 2. Ist-Zustand (verifiziert, nach PR #333 / #335 / #341 / ADR-0082)

| Baustein | Status |
|----------|--------|
| `ISeoEngineStore` + Memory + Supabase | ✅ main (PR #335) |
| Admin-Router `/api/seo` auf Store | ✅ |
| Dashboard S3 | ✅ PR #309 |
| Migration Foundation `20260815010000` | ✅ Repo + Prod apply |
| Source-Align `20260815200000` | ✅ Repo + Prod apply |
| service_role Grants `20260815210000` | ✅ Repo + Prod apply (PR #333) |
| FK RESTRICT `20260815220000` | ✅ Repo + Prod apply 2026-08-15 |
| Ledger-Abgleich (schema_migrations) | ✅ ausgeführt 2026-08-15 |
| ADR formalisiert/nummeriert | ✅ **ADR-0082** (2026-08-16) |

### Schema-Drift (historisch, behoben)

| Schicht | `source`-Werte |
|---------|----------------|
| TypeScript / API | `search-console`, `manual-import` |
| SQL (nach Align) | `search-console`, `manual-import` |

`estimated` ist aus dem CHECK entfernt; API lehnt Non-Canonical ab.

**Bekannte Domain-/Schema-Lücke (nicht blockierend für Store-DoD):** Domain-Felder `notes` und `sourceRef` haben **keine** DB-Spalten. Memory speichert sie; Supabase-Adapter persistiert sie nicht. Follow-up nur bei Bedarf, eigene Migration + Owner-Gate.

---

## 3. Architektur (geliefert)

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

Privilege-Separation (ADR-0043-Linie):

- Publishable/Anon **nie** für SEO-Writes
- Production: `assertPrivilegedSupabaseConfigured` / Factory fail-closed

---

## 4. Implementierungsschritte — Status

| Schritt | Inhalt | Status |
|---------|--------|--------|
| A | Schema align + RLS harden | ✅ Repo + Prod |
| B | Store-Abstraktion | ✅ PR #335 |
| C | Router async + 503 | ✅ PR #335 |
| D | Unit/Contract-Tests | ✅ PR #335 |
| E | Owner Production Gate | ✅ FK RESTRICT + Ledger |
| F | ADR-Nummerierung | ✅ ADR-0082 |

---

## 5. Definition of Done (WP-S1)

- [x] Source-Enum SQL ≡ API (kein `estimated`)
- [x] RLS enabled + keine anon/authenticated Write-Policies
- [x] `ISeoEngineStore` + Memory + Supabase Adapter
- [x] Routes nutzen Store; Production fail-closed ohne privileged key
- [x] Unit/Contract-Tests (Source-Reject, unknown keyword, empty ranks)
- [x] `docs/seo/S1_SEO_ENGINE.md` Status aktualisiert
- [x] ADR finalisiert und nummeriert — **ADR-0082** (Kollisionscheck nach PR #345)
- [x] Production apply + Evidence **vollständig** (FK RESTRICT + Ledger) — angewendet 2026-08-15, Evidenz in `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`

---

## 6. Risiken & Stop-Conditions

| Risiko | Maßnahme |
|--------|----------|
| Shared Migration Zone | Nur `seo_*` Tabellen; keine globalen Auth-Tabellen |
| Privilege fallback auf Anon | Factory + assertPrivileged |
| Doppelte IDs Memory vs UUID | Domain `id` als string; DB uuid → string |
| Stille Rank-Invention | CHECK + API reject + Tests |
| CASCADE löscht Rank-Historie | FK RESTRICT Migration (applied) |

STOP bei: Scope-Drift in Shared Zone, fehlender Owner-Approval für Prod-Apply, Request nach `estimated`-Ranks.

---

## 7. Nicht in diesem WP

- Search Console MCP (WP-D5)
- Prerender (WP-S2)
- Content-Generate (WP-N1)
- AdSense (WP-R1)
- Documentary Event-Emission (optional follow-up)
- `notes` / `source_ref` Spalten (optional follow-up)

---

## 8. Nächste Aktionen

1. ~~Apply `20260815220000_seo_rank_snapshots_fk_restrict.sql` auf AIFINANCIAL~~ — erledigt 2026-08-15
2. ~~Ledger-Abgleich laut `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`~~ — erledigt 2026-08-15
3. ~~ADR-Draft nummerieren~~ — **ADR-0082 Accepted** (2026-08-16)
4. ~~WP-S1 als VERIFIED markieren in Roadmap~~ — in diesem Docs-PR
5. Nächstes Code-WP: **WP-D1 / D2 / D3** (JSON-LD, Title/Meta, Soft-404)

Siehe `docs/seo/HANDOFF_WP_S1_NEXT_2026-08-15.md` und `docs/adr/ADR-0082-seo-engine-platform-module.md`.
