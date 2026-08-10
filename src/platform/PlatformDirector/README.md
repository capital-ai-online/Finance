# PlatformDirector

## Enterprise Component

Status: Development

Version: 1.2.0

Owner: CAPITAL-AI

---

## Purpose

PlatformDirector enthaelt die Contracts fuer geschuetzte Plattformentscheidungen, die EventMesh-Bridge fuer bereits genehmigte `PlatformDecisionRecord`s und mit E6 eine explizite fail-closed Protected Decision Boundary. Die eigentliche Entscheidungsfindung und Persistenz bleibt weiterhin ausserhalb dieses Implementierungsschritts.

## Implementierter Scope

- `Contracts/PlatformDecision.ts`: Architecture-, Governance-, Release-, Exception-, Risk-, Priority- und Emergency-Decision Contracts.
- `Events/publishPlatformDecision.ts`: propagiert ausschliesslich bereits `APPROVED` Entscheidungen als kanonisches `PlatformDecisionEvent`.
- `Policies/ProtectedDecisionBoundary.ts`: validiert E6 Governance Boundaries vor der Propagation.

## E6 — Governance Boundaries

Eine geschuetzte Entscheidung darf die Boundary nur passieren, wenn sie explizit `APPROVED` ist, vom `Platform Director` entschieden wurde, eine Correlation-ID sowie Decision-Basis-Evidence besitzt und keine geblockte Supervisor-Evidence enthaelt.

Fuer `Release Decision` gelten zusaetzlich verpflichtend:

- Release-Candidate-Evidence;
- nicht-leerer Rollback-Plan;
- `qualityGate: PASS`;
- `securityGate: PASS`;
- `complianceGate: PASS`;
- `versionGate: PASS`.

`FAIL` oder `UNAVAILABLE` blockieren den Release-Pfad. Die Policy genehmigt nichts autonom und ersetzt weder Release Center, Version Manager, Quality, Security, Compliance noch EventMesh.

## Schutzgrenzen

Keine autonome Approval-Entscheidung, keine zweite Governance Engine, keine zweite EventMesh oder Registry und keine Persistenzmutation. Geschuetzte Entscheidungen bleiben Human-/Platform-Director-gesteuert.

## ESS Reference

- ESS-0001
- ESS-0001-CONTRACTS
- ESS-0003 — Platform Director
- ESS-0013 — Enterprise Event Mesh
- ESS-0017 — Vocabulary Governance

## ADR References

- ADR-0018 — Enterprise Event Mesh

## Notes

Die Komponente bleibt `development`, weil Entscheidungsfindung und persistente Decision Records noch nicht vollstaendig als PlatformDirector-Runtime implementiert sind. E6 ergaenzt ausschliesslich eine testbare Governance-Grenze fuer bereits vorhandene Decision-Evidence.
