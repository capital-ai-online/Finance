# SEO WP-S1 Migration-Ledger-Abgleich

Status: PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH
Date: 2026-08-15
Target: Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`)
Work claim: `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15`
Roadmap: SEO-GM-ROADMAP-0002 / WP-S1

## Problem

Der Supabase-MCP-Connector nimmt beim `apply_migration` keine Versionsnummer entgegen. Er stempelt
stattdessen die Anwendungszeit in `supabase_migrations.schema_migrations.version`. Der SQL-Inhalt
ist identisch zur Repo-Datei, die Version im Ledger weicht aber ab:

| Repo-Datei | Ledger-Version (ist) | Ledger-Name |
| --- | --- | --- |
| `20260815010000_seo_engine.sql` | `20260815192502` | `seo_engine` |
| `20260815200000_seo_engine_source_align_rls.sql` | `20260815192747` | `seo_engine_source_align_rls` |
| `20260815210000_seo_engine_service_role_grants.sql` | `20260815193957` | `seo_engine_service_role_grants` |
| `20260815220000_seo_rank_snapshots_fk_restrict.sql` | wird beim Apply gestempelt | `seo_rank_snapshots_fk_restrict` |

Folge: Ein `supabase db push` haelt die vier Repo-Migrationen fuer offen und fuehrt sie erneut aus.
Alle vier sind idempotent (`create table if not exists`, `create index if not exists`,
`drop constraint if exists`, `revoke`/`grant`, `enable row level security`), und der Guard-Block in
`20260815200000` laeuft bei leerer Tabelle sauber durch. Der Re-Run ist damit ungefaehrlich, aber der
Ledger bildet den Repo-Stand nicht ab, und jeder kuenftige Drift-Vergleich startet mit falschem Bild.

## Abgrenzung — was hier ausdruecklich NICHT passiert

Drei weitere Repo-Migrationen fehlen im Ledger:

- `20260801150000_social_media_publishing.sql`
- `20260810110642_pdf_credit_ledger.sql`
- `20260815140000_social_media_content_approvals.sql`

Diese sind **kein Ledger-Drift, sondern offener Migrationsrueckstand.** Verifiziert am 2026-08-15
gegen die Produktionsdatenbank — keine der erzeugten Tabellen existiert:

```sql
select t.name as expected_table,
       to_regclass('public.'||t.name) is not null as exists_in_db
from (values ('social_media_accounts'),('social_media_oauth_states'),('social_media_publish_log'),
             ('pdf_credits'),('pdf_credit_grants'),('social_media_content_approvals')) as t(name);
-- alle sechs: exists_in_db = false
```

Ein Ledger-Eintrag fuer diese drei wuerde sie faelschlich als angewendet markieren und `db push` dazu
bringen, echtes Schema zu ueberspringen. Sie brauchen einen eigenen Vorgang mit der fachlichen Frage,
ob die Features noch gewollt sind. **Dieses Runbook fasst sie nicht an.**

## Reihenfolge

Der Abgleich laeuft **nach** dem Apply von `20260815220000`, damit alle vier Zeilen in einem Durchgang
korrigiert werden. Wird `20260815220000` nicht angewendet, entfaellt dessen `update` ersatzlos.

## Vorab-Pruefung

Kollisionsfreiheit der Zielversionen und Ist-Zustand:

```sql
select version, name
from supabase_migrations.schema_migrations
where name in ('seo_engine', 'seo_engine_source_align_rls',
               'seo_engine_service_role_grants', 'seo_rank_snapshots_fk_restrict')
   or version in ('20260815010000', '20260815200000', '20260815210000', '20260815220000')
order by version;
```

Erwartung vor der Mutation: genau die vier gestempelten Zeilen, keine Zeile traegt bereits eine der
vier Zielversionen. Trifft das nicht zu, **abbrechen** und den Befund melden.

## Mutation

Namensbasiert statt versionsbasiert, damit die Anweisungen unabhaengig vom gestempelten Zeitwert
korrekt bleiben und ein zweiter Lauf zum No-op wird:

```sql
begin;

update supabase_migrations.schema_migrations
set version = '20260815010000'
where name = 'seo_engine' and version <> '20260815010000';

update supabase_migrations.schema_migrations
set version = '20260815200000'
where name = 'seo_engine_source_align_rls' and version <> '20260815200000';

update supabase_migrations.schema_migrations
set version = '20260815210000'
where name = 'seo_engine_service_role_grants' and version <> '20260815210000';

update supabase_migrations.schema_migrations
set version = '20260815220000'
where name = 'seo_rank_snapshots_fk_restrict' and version <> '20260815220000';

commit;
```

Erwartet: vier mal `UPDATE 1` (bzw. drei, falls `20260815220000` noch nicht angewendet ist).

## Verifikation

```sql
select version, name
from supabase_migrations.schema_migrations
where name like 'seo\_%'
order by version;
```

Zielzustand:

```
20260815010000  seo_engine
20260815200000  seo_engine_source_align_rls
20260815210000  seo_engine_service_role_grants
20260815220000  seo_rank_snapshots_fk_restrict
```

Zusaetzlich pruefen, dass die Schema-Objekte unveraendert sind — der Abgleich ist reine Buchhaltung:

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.seo_rank_snapshots'::regclass and contype = 'f';
-- erwartet: FOREIGN KEY (keyword_id) REFERENCES seo_keywords(id) ON DELETE RESTRICT
```

## Rollback

Der Abgleich veraendert ausschliesslich Metadaten; kein Schema- und kein Datenverlust ist moeglich.
Zum Zuruecksetzen die urspruenglich gestempelten Werte wieder eintragen:

```sql
begin;
update supabase_migrations.schema_migrations set version = '20260815192502' where name = 'seo_engine';
update supabase_migrations.schema_migrations set version = '20260815192747' where name = 'seo_engine_source_align_rls';
update supabase_migrations.schema_migrations set version = '20260815193957' where name = 'seo_engine_service_role_grants';
-- 20260815220000: auf den beim Apply tatsaechlich gestempelten Wert zuruecksetzen (siehe Apply-Evidenz unten: 20260815210718)
commit;
```

## Wiederauftreten vermeiden

Solange Migrationen ueber den MCP-Connector statt ueber `supabase db push` angewendet werden, tritt der
Drift bei jedem Apply erneut auf. Zwei Optionen, jeweils eigener Vorgang:

1. Migrationen grundsaetzlich per CLI (`supabase db push`) anwenden, der Connector bleibt Lese-/Evidenzpfad.
2. Den Abgleich als festen Nachbereitungsschritt in den Apply-Ablauf aufnehmen und die Ledger-Version
   direkt nach jedem `apply_migration` korrigieren.

## Apply-Evidenz

Ausgefuehrt 2026-08-15, Owner-Freigabe SvenKulessa (Work claim
`SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15`).

| Schritt | Ergebnis |
| --- | --- |
| `20260815220000` FK-Apply | `success: true`. `pg_get_constraintdef` bestaetigt `FOREIGN KEY (keyword_id) REFERENCES seo_keywords(id) ON DELETE RESTRICT`, gestempelt als `20260815210718 seo_rank_snapshots_fk_restrict`. |
| Vorab-Pruefung Ledger | Genau vier Zeilen (`seo_engine`, `seo_engine_source_align_rls`, `seo_engine_service_role_grants`, `seo_rank_snapshots_fk_restrict`), keine trug bereits eine Zielversion. Keine Kollision. |
| Mutation Ledger | Vier namensbasierte `UPDATE`s in einer Transaktion, `commit`. |
| Verifikation Ledger | `schema_migrations` zeigt exakt die vier Repo-Versionen: `20260815010000 seo_engine`, `20260815200000 seo_engine_source_align_rls`, `20260815210000 seo_engine_service_role_grants`, `20260815220000 seo_rank_snapshots_fk_restrict`. |
| Abgrenzungs-Check | `to_regclass` fuer alle sechs Tabellen aus `social_media_publishing` / `pdf_credit_ledger` / `social_media_content_approvals` weiterhin `false` — unveraendert nicht angewendet, kein Ledger-Eintrag erzeugt. |
