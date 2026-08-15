# WP-S1 — SeoEngine Persistenz: Implementierungsplan & Status

**Roadmap:** SEO-GM-ROADMAP-0002 / WP-S1  
**Claims:** `SEO-WP-S1-PERSISTENCE-2026-08-15` → `SEO-WP-S1-STORE-CODE-2026-08-15` → `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15`  
**Store-Code Branch (merged):** `seo/wp-s1-store-adapters` → PR #335  
**Status:** Store-Code **DELIVERED on main**; Schema Foundation/Grants/FK RESTRICT/Ledger-Abgleich **applied** (Owner, 2026-08-15) — nur ADR-Nummerierung offen  
**Stand:** 2026-08-15

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

---

## 2. Ist-Zustand (verifiziert, nach PR #333 / #335)

| Baustein | Status |
|----------|--------|
| `ISeoEngineStore` + Memory + Supabase | ✅ main (PR #335) |
| Admin-Router `/api/seo` auf Store | ✅ |
| Dashboard S3 | ✅ PR #309 |
| Migration Foundation `20260815010000` | ✅ Repo + Prod apply |
| Source-Align `20260815200000` | ✅ Repo + Prod apply |
| service_role Grants `20260815210000` | ✅ Repo + Prod apply (PR #333) |
| FK RESTRICT `20260815220000` | ⚠️ Repo; **Prod-Apply Owner-Gate** |
| Ledger-Abgleich (schema_migrations) | ⚠️ Runbook; **Owner-Gate** |
| ADR-Draft formalisiert/nummeriert | ❌ offen |

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
| E | Owner Production Gate (Rest) | ⚠️ FK RESTRICT + Ledger |

---

## 5. Definition of Done (WP-S1)

- [x] Source-Enum SQL ≡ API (kein `estimated`)
- [x] RLS enabled + keine anon/authenticated Write-Policies
- [x] `ISeoEngineStore` + Memory + Supabase Adapter
- [x] Routes nutzen Store; Production fail-closed ohne privileged key
- [x] Unit/Contract-Tests (Source-Reject, unknown keyword, empty ranks)
- [x] `docs/seo/S1_SEO_ENGINE.md` Status aktualisiert (dieser Docs-PR)
- [ ] ADR-Draft finalisiert oder nummeriert nach Kollisionscheck (nächste freie Nummer: `ADR-0075`)
- [x] Production apply + Evidence **vollständig** (FK RESTRICT + Ledger) — angewendet 2026-08-15, Evidenz in `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`

---

## 6. Risiken & Stop-Conditions

| Risiko | Maßnahme |
|--------|----------|
| Shared Migration Zone | Nur `seo_*` Tabellen; keine globalen Auth-Tabellen |
| Privilege fallback auf Anon | Factory + assertPrivileged |
| Doppelte IDs Memory vs UUID | Domain `id` als string; DB uuid → string |
| Stille Rank-Invention | CHECK + API reject + Tests |
| CASCADE löscht Rank-Historie | FK RESTRICT Migration (Owner-Apply) |

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

## 8. Nächste Aktionen (keine Agent-Mutation ohne Freigabe)

1. ~~Apply `20260815220000_seo_rank_snapshots_fk_restrict.sql` auf AIFINANCIAL~~ — erledigt 2026-08-15
2. ~~Ledger-Abgleich laut `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`~~ — erledigt 2026-08-15
3. ADR-Draft nummerieren nach Kollisionscheck (nächste freie Nummer: `ADR-0075`) — **letzter offener Schritt**
4. Danach WP-S1 als VERIFIED markieren in Roadmap §4

Siehe `docs/seo/HANDOFF_WP_S1_NEXT_2026-08-15.md` für den vollständigen Übergabekontext.
