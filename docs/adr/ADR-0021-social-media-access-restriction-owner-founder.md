# Architectural Decision Record (ADR-0021)
## Social Media Direct Publishing Hub — Zugriffsbeschränkung auf Owner-Rolle oder Founder-Abo

**Status:** ACCEPTED
**Implementation-Status:** ✅ COMPLETE
**Date:** 2026-08-01
**Version:** 0.6.0
**Authors:** CAPITAL-AI Enterprise Solution Architecture Team (Claude, im Auftrag von Sven Kulessa)
**Basis:** ADR-0020 (Social Media Direct Publishing — Reale OAuth-2.0- und Plattform-API-Integration)

---

## 1. Kontext

Nach Fertigstellung der echten OAuth-/Publishing-Integration (ADR-0020) wurde entschieden, dass
das Social Media Direct Publishing Hub kein für alle registrierten Nutzer zugängliches Feature
ist, sondern ausschließlich für:

1. Nutzer mit IAM-Rolle `owner` (`profiles.iam_role = 'owner'`), oder
2. Abonnenten des `Founder`-Tarifs (Stripe-Plan, siehe `server/stripe.ts`).

Alle anderen Tarife (Free, Starter, Pro, Enterprise) und Nutzer mit `admin`/`supervisor`/`user`-Rolle
ohne Founder-Abo haben **keinen** Zugriff.

## 2. Entscheidung

Zugriffskontrolle wird zentral in `server/socialMedia/accessControl.ts` implementiert und auf
**jedem** funktionalen Endpunkt des Moduls serverseitig erzwungen — nicht nur clientseitig
verborgen:

- `checkSocialMediaAccess(req)`: löst die verifizierte Identität auf (`resolveVerifiedIdentity`),
  prüft zuerst `profiles.iam_role === 'owner'`, danach `getSubscription(userId) === 'Founder'`
  (case-insensitiver Vergleich, analog zum bestehenden Muster in `server/quota.ts`
  `isUnlimitedTier()`).
- `requireAccess()` in `src/routes/socialMediaRoutes.ts` liefert `401` bei fehlendem/ungültigem
  Bearer-Token, `403` bei authentifizierten, aber nicht-berechtigten Nutzern — angewendet auf
  `/accounts`, `/accounts/toggle`, `/auth/url`, `/publish`, `/history`.
- `GET /api/social-media/access`: neuer, ungeschützter Statusendpunkt (immer `200`), der nur
  `{allowed, reason}` liefert — ermöglicht dem Frontend eine passende UI-Meldung statt eines
  rohen Fehlers.
- **Re-Prüfung im OAuth-Callback**: `completeOAuthCallback()` (`oauthExchange.ts`) prüft den
  Zugriff erneut anhand der im State-Datensatz gespeicherten `user_id`, *bevor* der Code gegen
  ein Token getauscht wird. Begründung: zwischen `/auth/url` (Zugriff wird geprüft) und dem
  Callback (oft Sekunden bis Minuten später) könnte ein Founder-Abo ablaufen oder der
  Owner-Status entzogen werden — ohne Re-Prüfung könnte ein zwischenzeitlich ungültig
  gewordener Zugriff trotzdem noch ein Konto verbinden.
- **Frontend** (`SocialAccountManager.tsx`): ruft `GET /access` beim Mount auf und zeigt bei
  fehlender Berechtigung eine klare "Zugriff beschränkt"-Ansicht statt der Konto-Verwaltung.
  Dies ist ausschließlich UX (keine Sicherheitsgrenze) — die serverseitige Durchsetzung ist die
  eigentliche Kontrolle, konsistent mit der bereits im Projekt etablierten Praxis (z. B.
  `RealtimeAiNewsfeed.tsx` `isNewsfeedLocked`).

## 3. Bewusst nicht wiederverwendet: `UNLIMITED_TIERS`

`server/quota.ts` definiert `UNLIMITED_TIERS = new Set(['PRO', 'ENTERPRISE', 'ENTERPRISE OS'])`
für Screening-Kontingente. Diese Liste wird hier **nicht** herangezogen — Social-Media-Zugriff
ist ausschließlich an `Founder` (und `owner`) gebunden, unabhängig davon, ob ein Tarif für andere
Features als "unlimited" gilt. Pro-/Enterprise-Abonnenten ohne Founder-Zusatz haben also keinen
Zugriff auf dieses Tool.

## 4. Betroffene Dateien

- `server/socialMedia/accessControl.ts` (neu)
- `server/socialMedia/oauthExchange.ts` (Re-Prüfung im Callback ergänzt)
- `src/routes/socialMediaRoutes.ts` (`requireIdentity` → `requireAccess`, neuer `/access`-Endpunkt)
- `src/platform/SocialMediaEngine/SocialMediaGeneratorService.ts` (`checkAccess()`)
- `src/components/SocialAccountManager.tsx` (Zugriffs-Gate vor der eigentlichen UI)

## 5. Konsequenzen

- Kein Schema-Change nötig — nutzt ausschließlich bereits vorhandene Spalten
  (`profiles.iam_role`, `subscriptions.tier`).
- Fail-closed: ohne Supabase-Konfiguration oder bei jedem unerwarteten Fehler ist der Zugriff
  verweigert, nie stillschweigend erlaubt.
- Wer den `Founder`-Tarif in Stripe/Supabase konfiguriert (Preis-ID, Produktname), muss
  sicherstellen, dass der resultierende `subscriptions.tier`-Wert exakt (case-insensitiv)
  `Founder` lautet, da `isFounderTier()` einen strikten String-Vergleich durchführt.
