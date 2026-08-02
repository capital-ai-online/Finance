# Compliance

## Enterprise Component

Status: Implemented

Version: 1.0.0

Owner: CAPITAL-AI

---

## Purpose

Backend des `SecurityComplianceAuditor` (ADR-0012):

- **`scanners.ts`**: 20+ Scanner-Regeln (Praefixe `SEC-`, `DAT-`, `GOV-`), die direkt gegen den
  echten Repository-Code pruefen (Dateiinhalte, Pfade, Konfigurationsmuster) - keine simulierten
  Ergebnisse. Jede Regel ist einem ISO/IEC-27001-Annex-A-Control zugeordnet.
- **`router.ts`**: REST-API unter `/api/compliance/*` (`dashboard`, `run`, `certify`,
  `certificates`, `report`, `risk`), admin-geschuetzt ueber `checkAdminAccess()`.
- **`store.ts`**: Persistenz von Scan-Ergebnissen, Remediation-Plaenen und Compliance-
  Zertifikaten in Supabase.
- **`types.ts`**: gemeinsame Typen, auch client-seitig importiert (typreiner Import in
  `src/components/SecurityComplianceAuditor.tsx`, zur Kompilierzeit entfernt).

---

## ESS Reference

ESS-0001

ESS-0001-CONTRACTS

ESS-0006 — Security & Compliance

---

## ADR References

ADR-0012 — Security & Compliance Auditor

---

## Dependencies

`server/db.ts`, `src/platform/Security/authMiddleware.ts`, `src/platform/Security/types.ts`.

---

## Events

Produziert und konsumiert aktuell keine Enterprise-Bus-Events (ESS-0013). Die zuvor im
manifest.json genannten Events (`ComplianceValidatedEvent`, `LayerViolationEvent`,
`ContractViolationEvent`, `ArchitectureValidatedEvent`) waren nie implementiert und wurden
entfernt (ARCH-AUDIT-0002 J5).

---

## Notes

ARCH-AUDIT-0002 (J5, Kapitel 14.6): physisch aus `server/compliance/` hierher verschoben. Vorher
deklarierte die ESS-Registry (`implementedBy` von ESS-0006) diesen Ordner, obwohl er nur eine
leere, vom Enterprise Bootstrapper generierte Huelle war und der tatsaechliche Code unter
`server/compliance/` lag. Im Zuge der Verschiebung wurden vier Scanner-Regeln (SEC-04, SEC-05,
DAT-03) korrigiert, die den frueheren Pfad `server/iam/authMiddleware.ts` als Literal-String
pruefen - ohne diese Korrektur haetten sie nach der parallelen Verschiebung von `Security` dauerhaft
falsche Befunde gemeldet, da `relPath` ein zur Laufzeit berechneter String ist und von `tsc` nicht
geprueft wird.
