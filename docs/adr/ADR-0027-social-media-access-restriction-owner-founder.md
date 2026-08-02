# Architectural Decision Record (ADR-0027)
## Social Media Direct Publishing Hub — Zugriffsbeschränkung auf Owner-Rolle oder Founder-Abo

**Status:** ACCEPTED  
**Implementation-Status:** COMPLETE  
**Date:** 2026-08-01  
**Version:** 0.6.0  
**Basis:** ADR-0026 (Social Media Direct Publishing)

> Governance note: This ADR was formerly numbered ADR-0021. It was renumbered to ADR-0027 under AUD4-F-004 because ADR-0021 is canonically reserved for External Market Data Provider Activation.

## Kontext

Das Social Media Direct Publishing Hub ist kein allgemeines Feature für registrierte Nutzer, sondern ausschließlich für Owner oder Founder-Abonnenten vorgesehen.

## Entscheidung

1. Serverseitige zentrale Zugriffskontrolle in `server/socialMedia/accessControl.ts`.
2. Zugriff nur für `profiles.iam_role === 'owner'` oder Subscription-Tier `Founder`.
3. Alle funktionalen Social-Media-Endpunkte werden serverseitig geschützt.
4. OAuth-Callbacks prüfen die Berechtigung erneut, bevor ein Code gegen Tokens getauscht wird.
5. Frontend-Gates sind ausschließlich UX und niemals die Sicherheitsgrenze.
6. Fehlerzustände bleiben fail-closed.

## Konsequenzen

- Pro/Enterprise erhalten ohne Founder-Zugriff keine implizite Berechtigung.
- Kein neues Autorisierungskonzept; bestehende verifizierte Identity-/Subscription-Infrastruktur wird wiederverwendet.
- Änderungen an Stripe-/Supabase-Produktionskonfiguration bleiben Production-Handoff und sind nicht Teil dieser ADR-Neunummerierung.
