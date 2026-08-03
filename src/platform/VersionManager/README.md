# VersionManager

## Enterprise Component

Status: Implemented

Version: 1.1.0

Owner: CAPITAL-AI

---

## Purpose

Verwaltet die verbindliche Plattformversion und Build-Nummer von CAPITAL-AI. Fuehrt
admin-getriggerte Versions-Bumps (patch/minor/major) aus, schreibt Git-/Docker-Tags fort und
generiert dabei 11 Compliance-Markdown-Dokumente unter `docs/` (CHANGELOG, RELEASE_NOTES,
ARCHITECTURE_REPORT, u.a.).

Mit Version 1.1.0 erweitert der **Naming & Repository Convention Validator** die Komponente um
eine deterministische, read-only Repository-Pruefung. Sie validiert Projektidentitaet,
Semantic-Version-Synchronitaet zwischen `package.json` und `package-lock.json`, ADR-/ESS-/React-
und Platform-Namenskonventionen, case-insensitive Pfadkollisionen, Legacy-Identitaeten sowie
abgelaufene Enterprise Exceptions.

Persistenz: `uploads/version_manager.json`. REST-API: `GET /api/admin/version`,
`POST /api/admin/version/bump` (admin- und Step-Up-geschuetzt, siehe `server/iam/`).

Repository-Validation:

- `npm run repository:validate` — Strict Mode fuer gezielte Governance-/Quality-Pruefungen.
- `npm run repository:validate:advisory` — Advisory Mode; Findings werden gemeldet, aber nicht blockiert.
- `npm run predeploy:check` — prueft ausschliesslich technische und sicherheitsrelevante Deployment-Readiness und ruft den Repository Convention Validator bewusst nicht auf.

Der Repository Convention Validator ist damit **kein Deployment-Gate**. Governance-, Naming-,
ADR-/ESS- und Repository-Policy-Findings werden ausserhalb der technischen Live-Deployability-
Pipeline behandelt. Die Deployment-Pipeline beantwortet ausschliesslich, ob ein Build technisch
und sicher in der Live-Umgebung betrieben werden kann.

Der Validator veraendert keine Dateien und genehmigt keine Ausnahmen. Abweichungen werden nur
als Findings ausgegeben; Ausnahmen bleiben ausschliesslich der Governance bzw. dem Platform
Director vorbehalten.

---

## ESS Reference

ESS-0001

ESS-0001-CONTRACTS

ESS-0004 — Enterprise Version Manager

---

## ADR References

ADR-0011 — Bestandsschutz / Enterprise Exception Registry

ADR-0020 — Naming & Repository Convention Validator Capability

---

## Dependencies

`server/systemEvents.ts`, `server/documentHygiene.ts`, `server/iam/authMiddleware.ts`,
`server/iam/types.ts`.

Die Convention-Validation selbst verwendet ausschliesslich Node.js `fs`/`path` und ist damit
ohne weitere Runtime-Abhaengigkeiten ausfuehrbar.

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

ADR-0020 erweitert die bestehende Komponente bewusst um eine Validator-Capability statt einen
parallelen Naming-Agenten einzufuehren. Damit bleibt Versionierungs- und Repository-Konformitaet
in einer verantwortlichen Enterprise-Komponente gebuendelt, ohne das technische Deployment-Gate
mit Governance-Policies zu vermischen.
