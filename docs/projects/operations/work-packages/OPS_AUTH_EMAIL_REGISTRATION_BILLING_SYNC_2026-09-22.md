# OPS-AUTH-EMAIL-01 — E-Mail-Registrierung, Recovery & Billing-Sync

**Projekt:** `CAPITAL-AI-OPS`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08`  
**Trust Root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@4c4a88e7f83150191c81134439e7bc9a1145ad4a`  
**Parent foundation:** PR #1270 / backend-first Auth  
**Status:** OWNER-DIRECTED / IN IMPLEMENTATION  
**FE boundary:** `CAPITAL-AI-FE` owner-correct handover for visible forms/routes

## 1. Ziel

Die produktive backend-first Authentifizierung wird um den normalen Supabase-E-Mail-Lifecycle erweitert, ohne Supabase-Sitzungstokens wieder in Browser-JavaScript zu verlagern:

1. E-Mail/Passwort registrieren;
2. E-Mail/Passwort anmelden;
3. Registrierungsbestätigung per Supabase Auth Mail;
4. Bestätigung erneut senden;
5. Passwort-Reset-Mail anfordern;
6. Token-Hash serverseitig bestätigen;
7. neues Passwort in einer verifizierten Backend-Sitzung setzen;
8. neue Auth-UUID automatisch mit `profiles` und `subscriptions` verbinden;
9. Stripe-Entitlements weiterhin ausschließlich über die kanonische Stripe-Sync-Kette auflösen.

## 2. Kanonische Identitäts- und Billing-Kette

```text
Website
  -> /api/auth/*
  -> Supabase Auth / auth.users.id (UUID)
       -> on_auth_user_created
       -> public.handle_new_user()
            -> public.profiles.id
            -> public.subscriptions.user_id (Free)
  -> Stripe Checkout subscription_data.metadata.user_id = auth.users.id
  -> provider-managed stripe-webhook / stripe-worker
  -> stripe.subscriptions
  -> stripe_subscription_sync_trigger
  -> public.sync_stripe_subscription_to_public()
  -> public.subscriptions.user_id
  -> server/db.ts#getSubscription(UUID)
  -> Website subscriptionTier
```

`public.users.tier`, `public.users.stripe_customer_id` und
`public.users.stripe_subscription_id` sind **Legacy-Evidence** und keine produktive
Entitlement-Autorität. Die Tabelle wird in diesem Paket nicht destruktiv entfernt, da
`usage_log` weiterhin einen FK auf `public.users.id` besitzt.

## 3. Backend-Contract

| Endpoint | Zweck | Sicherheitsgrenze |
|---|---|---|
| `POST /api/auth/register` | E-Mail/Passwort-Registrierung | server password safety, rate limit, kein Browser-Token |
| `POST /api/auth/login/email` | E-Mail/Passwort-Login | Supabase verification -> HttpOnly Backend-Session |
| `POST /api/auth/confirmation/resend` | Bestätigung erneut senden | enumeration-resistant, mail rate limit |
| `POST /api/auth/password/forgot` | Recovery-Mail | enumeration-resistant, mail rate limit |
| `GET /api/auth/email/confirm` | `token_hash` für `email/recovery` verifizieren | server-side `verifyOtp`, Session nur HttpOnly |
| `POST /api/auth/password/update` | neues Passwort setzen | verified backend session + password safety |

## 4. Supabase Auth Mail Template Contract

Serverseitige Token-Verifikation benötigt produktiv angepasste Supabase-E-Mail-Templates.
Die Management-Ebene ist kein SQL-Schema und wird über Provider-Auth-Konfiguration gepflegt.

**Confirm signup:**

```html
<a href="{{ .SiteURL }}/api/auth/email/confirm?token_hash={{ .TokenHash }}&type=email&next=/">
  E-Mail-Adresse bestätigen
</a>
```

**Reset password:**

```html
<a href="{{ .SiteURL }}/api/auth/email/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/update-password">
  Passwort zurücksetzen
</a>
```

Produktiv müssen `Site URL = https://capital-ai.online`, E-Mail-Bestätigungen und ein
für Endnutzer geeigneter SMTP-Provider aktiv sein. Das Supabase-MCP dieser Ausführung bietet
keine Auth-Config-/Template-Mutation; diese Provider-Konfiguration bleibt als explizite
Readback-/Handover-Grenze statt als erfundener PASS.

## 5. Stripe-Spaltenvertrag

Provider Sync liefert für die kanonische Projektion insbesondere:

- `stripe.subscriptions.id`
- `stripe.subscriptions.customer`
- `stripe.subscriptions.status`
- `stripe.subscriptions.current_period_end`
- `stripe.subscriptions.metadata.user_id`
- `stripe.subscriptions.metadata.plan_id`
- `stripe.subscriptions.items.data[0].price.id`

Der vorhandene Trigger validiert `metadata.user_id` gegen `auth.users.id`, normalisiert nur
bekannte Tarife/Price-IDs und schreibt `stripe_subscription_id/status/current_period_end/tier/email`
in `public.subscriptions`.

## 6. Abhängigkeiten / Owner-Handover

- **CAPITAL-AI-FE:** Loginseite um E-Mail-Login, Registrierung, „Passwort vergessen“,
  „Bestätigung erneut senden“ sowie `/account/update-password` ergänzen. FE konsumiert nur
  die oben definierten Backend-Endpunkte; keine direkte `supabase.auth.*`-Nutzung.
- **Supabase Provider:** Auth Site URL, Redirect-Allowlist, Confirm-Signup-Template,
  Recovery-Template und SMTP Readback/Einrichtung.
- **Security/QM:** Exact-head Security/CI plus produktiver Mail-/Login-Smoke-Test nach Merge.

## 7. Exit Evidence

- Backend-E-Mail-Auth-Contract unit-testbar und TypeScript-clean.
- Keine Supabase-Tokens im Browser.
- `on_auth_user_created -> profiles + Free subscription` live korreliert.
- Stripe-Sync-Trigger und erforderliche Provider-Spalten live korreliert.
- Legacy `public.users` nicht als Entitlement-Reader verwendet.
- FE-Handover angelegt.
- Required Checks auf Exact Head PASS.
- Human/CODEOWNER Merge.
