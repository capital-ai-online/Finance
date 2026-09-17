# Security

## Enterprise Component

Status: Implemented

Version: 1.0.0

Owner: CAPITAL-AI

---

## Purpose

IAM-Kern der Plattform:

- **`authMiddleware.ts`**: `resolveVerifiedIdentity()` (E-Mail-basierte Identitaetsverifikation,
  konsistent mit dem Subscription-Modell), `checkAdminAccess()` (rollenbasierte Autorisierung,
  fail-closed - jeder Fehlerpfad liefert `authorized: false`), `requireStepUp()` (frischer
  TOTP-Nachweis fuer kritische Owner-Aktionen, ADR-0003.5), `logIamEvent()`.
- **`rateLimiter.ts`**: In-Memory-Zaehler fuer Admin-/Auth-kritische Endpunkte (Prozess-lokal,
  siehe Einschraenkung im Dateikopf zu horizontaler Skalierung).
- **`secretCrypto.ts`**: AES-256-GCM-Verschluesselung ruhender Secrets (TOTP-Seeds), Opaque-Token
  Hashing.
- **`totp.ts`**: RFC-6238-TOTP-Implementierung ohne externe Abhaengigkeit.

---

## ESS Reference

ESS-0001

ESS-0001-CONTRACTS

ESS-0006 — Security & Compliance

---

## ADR References

ADR-0003.5 — Step-Up-Authentication

---

## Dependencies

`server/db.ts`, `server/env.ts`, `server/logger.ts`.

---

## Events

Produziert und konsumiert aktuell keine Enterprise-Bus-Events (ESS-0013). Sicherheitsereignisse
werden ueber `logSystemEvent()` (server/systemEvents.ts) protokolliert. Die zuvor im
manifest.json genannten Events (SecurityViolationDetectedEvent, ComplianceValidatedEvent) waren
nie implementiert und wurden entfernt (ARCH-AUDIT-0002 J5).

---

## Notes

ARCH-AUDIT-0002 (J5, Kapitel 14.6): physisch aus `server/iam/` hierher verschoben. Vorher
deklarierte die ESS-Registry (`implementedBy` von ESS-0006) diesen Ordner, obwohl er nur eine
leere, vom Enterprise Bootstrapper generierte Huelle war und der tatsaechliche Code unter
`server/iam/` lag.
