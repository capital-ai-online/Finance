-- ARCH-AUDIT-0002 (H3, Kapitel 14.5) - server/mailer.ts fuehrte die Idempotenzsperre fuer
-- Abo-Bestaetigungsmails (verhindert doppelten Mailversand bei Stripes "at-least-once"-
-- Webhook-Zustellung) bislang ausschliesslich als Datei unter uploads/. Render laesst diese
-- Datei bei jedem Deploy verworfen zurueck (ephemerer Dateisystem-Speicher) und teilt sie bei
-- mehreren Instanzen nicht - beides zerstoert die Idempotenzgarantie genau in den Situationen,
-- fuer die sie gedacht ist (Redeploy waehrend eines Stripe-Retries, horizontale Skalierung).

create table if not exists public.subscription_confirmations_sent (
  session_id text primary key,
  sent_at    timestamptz not null default now()
);

comment on table public.subscription_confirmations_sent is 'Idempotenzsperre fuer Abo-Bestaetigungsmails je Stripe Checkout Session (ARCH-AUDIT-0002 H3). Service-Role-only, kein Client-Zugriff.';

alter table public.subscription_confirmations_sent enable row level security;

drop policy if exists "service_role_full_access" on public.subscription_confirmations_sent;
create policy "service_role_full_access" on public.subscription_confirmations_sent
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
