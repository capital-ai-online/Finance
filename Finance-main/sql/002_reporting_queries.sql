-- ═══════════════════════════════════════════════════════════════════════
-- Capital AI — Reporting Queries: Nutzer, Abos, Besucher
-- Ausführen im Supabase SQL Editor (Projekt: Production)
-- ═══════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------
-- 1. Registrierte Nutzer (gesamt)
--    Quelle: auth.users (Supabase-interne Tabelle, wird bei jeder
--    Registrierung — Email/Passwort, Google, Microsoft — automatisch
--    befüllt). Anonyme/Gast-Sessions zählen NICHT mehr mit, da der
--    Gastmodus entfernt wurde.
-- ---------------------------------------------------------------------
select count(*) as registrierte_nutzer_gesamt
from auth.users
where is_anonymous is not true;

-- Registrierungen pro Tag (letzte 30 Tage) — für einen Trendverlauf
select
  date_trunc('day', created_at)::date as tag,
  count(*) as neue_registrierungen
from auth.users
where is_anonymous is not true
  and created_at >= now() - interval '30 days'
group by 1
order by 1 desc;


-- ---------------------------------------------------------------------
-- 2. Abo-Verteilung nach Tarif
--    Quelle: public.subscriptions (wird vom Stripe-Webhook befüllt,
--    siehe server.ts saveSubscription()). Nutzer OHNE Zeile in dieser
--    Tabelle sind automatisch 'Free' (seit dem Fix, der das versehentliche
--    'Enterprise'-Default entfernt hat — siehe Sicherheitsbericht).
-- ---------------------------------------------------------------------
select
  coalesce(s.tier, 'Free') as tarif,
  count(*) as anzahl_nutzer
from auth.users u
left join public.subscriptions s
  on lower(u.email) = lower(s.email)
where u.is_anonymous is not true
group by 1
order by
  case coalesce(s.tier, 'Free')
    when 'Enterprise' then 1
    when 'Pro' then 2
    when 'Starter' then 3
    else 4
  end;

-- Nur zahlende Kunden (ohne Free), zusätzlich mit letztem Update-Datum
select email, tier, updated_at
from public.subscriptions
order by updated_at desc;


-- ---------------------------------------------------------------------
-- 3. Website-Besucher — AKTUELL NICHT MÖGLICH
--    Es gibt in der Datenbank keine Tabelle, die Seitenaufrufe oder
--    Besucher-Sessions speichert (weder registrierte noch anonyme).
--    Diese Query kann ich nicht seriös schreiben, ohne Zahlen zu
--    erfinden — das würde gegen die No-Demo-Data-Policy verstoßen.
--
--    Optionen, um echte Besucherzahlen zu bekommen (siehe Live_prio.md):
--    a) Datenschutzfreundliches Analytics-Tool ohne eigenen Cookie-Consent-
--       Aufwand: Plausible oder Umami (self-hosted oder Cloud), zählt
--       Seitenaufrufe ohne personenbezogene Cookies — meist DSGVO-
--       unproblematisch ohne Consent-Banner-Pflicht.
--    b) Server-seitige Zugriffs-Logs von Render auswerten (grob, keine
--       Unique-Visitor-Erkennung ohne Cookies).
--    c) Eigene page_views-Tabelle + Consent-gebundenes Tracking-Script
--       (mehr Aufwand, mehr Kontrolle, braucht Cookie-Banner-Anpassung).
--
--    Sobald du dich für eine Option entscheidest, baue ich die Anbindung
--    bzw. die zugehörige Query.
-- ---------------------------------------------------------------------
