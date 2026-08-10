# Stripe Integration Security Evidence

Stand: 2026-08-10
Konto: `CAPITAL-AI`

## Verbundener Zustand

Das Stripe-Plugin bestätigt ein verbundenes CAPITAL-AI-Konto. Dieses Dokument speichert bewusst keine Schlüssel oder Secret-Werte.

## Aktuelle Integrationsleitplanken

Für CAPITAL-AI als Subscription-SaaS gilt:

- Recurring Billing über Stripe Billing + Checkout Sessions.
- Restricted API Keys (`rk_`) sind gegenüber breit berechtigten Secret Keys zu bevorzugen, soweit die benötigten Operationen damit abbildbar sind.
- Webhook-Signaturen müssen vor Verarbeitung verifiziert werden.
- Webhook-Verarbeitung muss idempotent sein; die vorhandene `stripe_event_inbox` in Supabase ist hierfür ein relevanter bestehender Baustein.
- API-/SDK-Versionen werden kontrolliert aktualisiert; der aktuelle Stripe-Skill nennt `2026-06-24.dahlia` als aktuelle API-Version zum Prüfzeitpunkt.
- Secrets ausschließlich serverseitig; keine Secret Keys im Browser oder Repository.
- Checkout-/Webhook-Metadaten müssen eine belastbare interne Identität referenzieren, nicht nur E-Mail-Adressen.

## CAPITAL-AI Zielkette

`Checkout Session → signierter Stripe Event → durable Event Inbox → idempotente Verarbeitung → Subscription State → Audit/Trace → Nutzerberechtigung`

## Deep-Research-Fokus für M3/M4/M6

1. Key-Scope und Restricted-Key-Eignung.
2. Webhook Signature Verification.
3. Replay-/Duplicate-Schutz.
4. Event-Reconciliation für failed/stuck Events.
5. API-Version und SDK-Version als Supply-Chain-Evidence.
6. Billing-Mutation als HIGH/CRITICAL Capability klassifizieren.
7. Keine Agentenmutation an Stripe ohne explizite Capability + Approval Artifact.