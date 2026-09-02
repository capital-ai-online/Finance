# CAPITAL-AI Stripe Legacy Webhook Decommission Evidence — 2026-08-30

Status: **DISABLED / PROVIDER-READBACK VERIFIED**  
Lifecycle: **HISTORICAL EVIDENCE / NON-AUTHORIZING**

## 1. Scope und Identität

Diese Evidence dokumentiert ausschließlich die kontrollierte produktive Abschaltung des redundanten Stripe-Legacy-Webhooks. Sie führt keine zweite Billing-Architektur ein und ersetzt keine bestehende Security- oder Operations-Authority.

- Repository: `SvenKulessa/Finance`
- Branch: `fix/auth-registration-root-redirect-20260830`
- Produktions-/Main-Baseline vor der Provider-Mutation: `b8c4757aaa62a2a63745e2f86a777630968f4f5d`
- damaliger Branch-Head vor dieser Evidence: `cde7464b0371577c09e9737db34ad57f2a694368`
- Stripe-Modus: Live
- Supabase Project Ref: `ryzywoktpmyhwzxmstyu`

Die dokumentierten SHAs bleiben unveränderte historische Identitäten. Die aktuelle Governance verwendet für Git-Zustände `main SHA`, `branch head SHA`, `PR head SHA` und `merge SHA`.

## 2. Pre-Change-Verifikation

Vor der Mutation wurden beide Stripe-Webhook-Endpunkte erneut providerseitig gelesen.

### Kanonischer Endpoint — unverändert beibehalten

- Endpoint-ID: `we_1Tytx6PKr4joNbEcx28r87Qz`
- URL: `https://ryzywoktpmyhwzxmstyu.supabase.co/functions/v1/stripe-webhook`
- Status vor Änderung: `enabled`
- Lifecycle: `managed`
- Managed by: `stripe-sync`
- Event-Scope umfasst unter anderem Checkout-, Invoice-, Subscription- und PaymentIntent-Lifecycle.

### Legacy Endpoint — damaliger Abschaltkandidat

- Endpoint-ID: `we_1TlsozPKr4joNbEcI2vik5yO`
- URL: `https://capital-ai.online/billing/webhook`
- Status vor Änderung: `enabled`
- Lifecycle: `legacy-review`
- Primary Sync laut Provider-Metadaten: `supabase-edge-function`
- Event-Scope: ausschließlich `checkout.session.completed`

`Abschaltkandidat` ist hier ein fachlicher damaliger Auswahlbegriff, kein Git-/PR-Lifecycle-Status.

Zusätzliche Supabase-Evidence aus `public.stripe_event_inbox` bestätigte den kanonischen Ingress `capital-ai-webhook` für:

| Eventtyp | verarbeitete Events | max. Attempts | Fehler |
|---|---:|---:|---:|
| `checkout.session.completed` | 1 | 1 | 0 |
| `invoice.payment_succeeded` | 1 | 1 | 0 |
| `customer.subscription.updated` | 5 | 1 | 0 |

Damit ist der Supabase-Ingress die aktive fachliche Authority: Der Legacy-Endpoint kann aufgrund seines Stripe-Event-Scopes weder Invoice- noch Subscription-Lifecycle-Ereignisse empfangen.

Die Supabase Edge-Function-Logs der letzten 24 Stunden zeigten zusätzlich den zugehörigen `stripe-worker` regelmäßig mit HTTP `200`. Es wurde für diese Verifikation **keine synthetische Live-Zahlung** erzeugt.

## 3. Produktive Mutation

Am 2026-08-30 wurde ausschließlich der Legacy-Endpoint über die Stripe Webhook Endpoint API deaktiviert:

```text
we_1TlsozPKr4joNbEcI2vik5yO
status: enabled -> disabled
```

Der Endpoint wurde bewusst **nicht gelöscht**. URL, Endpoint-ID, Event-Scope und Provider-Historie bleiben dadurch für Audit und Rollback erhalten.

Es wurden keine Produkte, Preise, Kunden, Subscriptions, Payments, Secrets oder Supabase-Daten mutiert.

## 4. Post-Change-Readback

Unmittelbar nach der Mutation wurde providerseitig erneut gelesen:

- Legacy `we_1TlsozPKr4joNbEcI2vik5yO`: **disabled**
- Kanonisch `we_1Tytx6PKr4joNbEcx28r87Qz`: **enabled**
- Kanonische URL weiterhin: `https://ryzywoktpmyhwzxmstyu.supabase.co/functions/v1/stripe-webhook`
- Kanonischer Event-Scope blieb unverändert.

Damit wurde keine Umschaltung oder Scope-Änderung am produktiven Supabase-Ingress vorgenommen.

## 5. Rollback

Rollback ist providerseitig reversibel und beschränkt sich auf denselben Legacy-Endpoint:

```text
we_1TlsozPKr4joNbEcI2vik5yO
disabled: false
```

Ein Rollback darf nur erfolgen, wenn neue Evidence zeigt, dass ein produktiver Consumer den alten `/billing/webhook`-Pfad tatsächlich benötigt. Ein paralleler Dauerbetrieb beider Endpunkte ist wegen Double-Processing-/Doppelarchitektur-Risiko nicht der Zielzustand.

## 6. Exit- und Beobachtungsgate

Die Abschaltung ist providerseitig verifiziert. Für eine erneute aktuelle Bewertung müssen heutige Provider-/Runtime-Daten neu erhoben werden; diese historische Evidence ist kein aktueller Zustandsnachweis.

Für Repository-Arbeit gelten die aktuellen DevelopmentChain-Begriffe: Tests/Evidence werden an den konkreten Branch-/PR-Head gebunden. Diese Evidence dokumentiert eine bestehende Provider-Mutation; sie behauptet keinen durch Repository-Code ausgelösten Stripe-Deploy.
