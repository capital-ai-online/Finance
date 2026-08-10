# Event Value Chain E6 — Governance Boundaries

Status: IMPLEMENTED IN DRAFT
Date: 2026-08-10
Basis: E2/E5 / PR #177 / verified main `32d7ca0bcfef5f7eb5cb54be7772a6c69c8d3b4c` / main CI #720 / Render production verified

## Deutsch

E6 macht die geschützten Entscheidungsgrenzen der Event-Driven Value Chain explizit prüfbar. Ein `PlatformDecisionRecord` darf die Boundary nur passieren, wenn er `APPROVED` ist, vom `Platform Director` entschieden wurde, eine Correlation-ID und mindestens eine Decision-Basis-Evidence besitzt und keine geblockte Supervisor-Evidence enthält.

Für `Release Decision` gelten zusätzliche fail-closed Regeln: Release-Candidate-Evidence und Rollback-Plan müssen vorhanden sein; Quality-, Security-, Compliance- und Version-Gate müssen jeweils `PASS` sein. `FAIL` und `UNAVAILABLE` blockieren die Boundary.

E6 erzeugt keine Entscheidung, genehmigt nichts autonom und ersetzt weder Platform Director, Version Manager, Release Center noch EventMesh. Die Policy ist ein reiner Boundary-Validator vor einer bereits bestehenden Propagation.

## English

E6 makes protected governance boundaries explicitly testable. Approved Platform Director decisions require correlation and decision-basis evidence and must not contain a blocked Supervisor assessment. Release decisions additionally require release-candidate evidence, a rollback plan and PASS results for quality, security, compliance and version gates.

The validator does not create or approve decisions and does not introduce a second governance, release, versioning or event authority.
