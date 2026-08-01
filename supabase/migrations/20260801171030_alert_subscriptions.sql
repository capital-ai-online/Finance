-- ARCH-AUDIT-0002 (H2, Kapitel 14.5) - Serverseitiges Alerting. Vorher konnte ein Score-
-- Ausschlag ausserhalb 3.0/7.0 (siehe Watchlist.tsx, "News <3.0 o. >7.0 triggert Push") nur
-- bewirken, dass etwas in der offenen Browser-Session sichtbar wurde - kein Signal erreichte
-- einen Nutzer, der die Seite gerade nicht offen hatte.
--
-- Identitaetsmodell: es gibt in dieser Anwendung keine echte Endnutzer-Session (nur die
-- gleiche schwache E-Mail-Bindung wie public.subscriptions/public.user_quota, siehe server/
-- db.ts). Alert-Abos werden daher ebenfalls per E-Mail gefuehrt, mit Double-Opt-In (confirm_
-- token) gegen versehentliche/missbraeuchliche Anmeldung fremder Adressen und einem
-- Unsubscribe-Token (unsubscribe_token) fuer jede Zustellung - beides eigenstaendige, pro
-- Abo eindeutige Zufallswerte, kein wiederverwendbares Geheimnis.

create table if not exists public.alert_subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  symbol             text not null,
  asset_type         text not null,
  condition          text not null check (condition in ('score_above', 'score_below')),
  threshold          numeric not null,
  confirmed          boolean not null default false,
  confirm_token      text,
  unsubscribe_token  text not null,
  active             boolean not null default true,
  last_notified_at   timestamptz,
  created_at         timestamptz not null default now()
);

comment on table public.alert_subscriptions is 'E-Mail-basierte Alert-Abos je Symbol/Schwellenwert (ARCH-AUDIT-0002 H2). Double-Opt-In ueber confirm_token, Abmeldung ueber unsubscribe_token. Service-Role-only, kein Client-Zugriff.';

create index if not exists idx_alert_subscriptions_symbol on public.alert_subscriptions (symbol) where confirmed = true and active = true;
create unique index if not exists idx_alert_subscriptions_confirm_token on public.alert_subscriptions (confirm_token) where confirm_token is not null;
create unique index if not exists idx_alert_subscriptions_unsubscribe_token on public.alert_subscriptions (unsubscribe_token);

alter table public.alert_subscriptions enable row level security;

drop policy if exists "service_role_full_access" on public.alert_subscriptions;
create policy "service_role_full_access" on public.alert_subscriptions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
