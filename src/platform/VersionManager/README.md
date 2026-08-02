# VersionManager

## Enterprise Component

Status: Implemented

Version: 1.0.0

Owner: CAPITAL-AI

---

## Purpose

Verwaltet die verbindliche Plattformversion und Build-Nummer von CAPITAL-AI. Fuehrt
admin-getriggerte Versions-Bumps (patch/minor/major) aus, schreibt Git-/Docker-Tags fort und
generiert dabei 11 Compliance-Markdown-Dokumente unter `docs/` (CHANGELOG, RELEASE_NOTES,
ARCHITECTURE_REPORT, u.a.).

Persistenz: `uploads/version_manager.json`. REST-API: `GET /api/admin/version`,
`POST /api/admin/version/bump` (admin- und Step-Up-geschuetzt, siehe `server/iam/`).

---

## ESS Reference

ESS-0001

ESS-0001-CONTRACTS

ESS-0004 — Enterprise Version Manager

---

## ADR References

None

---

## Dependencies

`server/systemEvents.ts`, `server/documentHygiene.ts`, `server/iam/authMiddleware.ts`,
`server/iam/types.ts`.

---

## Events

Produziert aktuell keine Enterprise-Bus-Events (ESS-0013). Protokolliert stattdessen ueber das
aeltere `logSystemEvent()`-Log. Die zuvor im manifest.json genannten Events
(VersionCalculatedEvent u.a.) waren nie implementiert und wurden entfernt (ARCH-AUDIT-0002 J5).

---

## Notes

ARCH-AUDIT-0002 (J5, Kapitel 14.6): physisch aus `server/versionManager.ts` hierher verschoben.
Vorher deklarierte die ESS-Registry (`implementedBy`) diesen Ordner fuer ESS-0004, obwohl er nur
eine leere, vom Enterprise Bootstrapper generierte Huelle war und der tatsaechliche Code unter
`server/` lag - eine Governance-Inkonsistenz, die mit dieser Verschiebung behoben wurde.
