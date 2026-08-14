# ADR-0071 — Konsolidierte Roadmap-Authority und angefragte Systemadministrator-Mutationen

Status: ACCEPTED FOR DOCUMENTATION / IMPLEMENTATION REQUIRES PHASE GATES  
Datum: 2026-08-14  
Owner: SvenKulessa  
Bezug: PR #257, ESS-0023

## Kontext

CAPITAL-AI besitzt mehrere parallele Roadmaps mit teilweise abweichenden Baselines und Statusangaben. Zusätzlich soll der Systemadministrator-Agent codebasierte Prototypen aus dokumentierten Arbeitspaketen erstellen und notwendige Mutationen entweder vom Owner erhalten oder selbst beim Owner anfragen können.

Die Begriffe Anfrage, Freigabe und Ausführung dürfen nicht vermischt werden. Eine selbst erzeugte Agentenanfrage darf niemals zur Selbstautorisierung werden.

## Entscheidung

1. `ROADMAP_CONSOLIDATION_MASTER_INDEX.md` ist der kanonische Portfolio- und Ausführungsindex.
2. Die DEVELOPMENT Chain bleibt das sequenzielle M0–M10-Gate.
3. Systemadministrator-Prototypen werden in separaten, phasenbezogenen PRs umgesetzt.
4. Der Owner oder der Systemadministrator-Agent darf eine Mutation initiieren.
5. Eine Agenteninitiative besteht ausschließlich aus Diagnose, Lösungsoptionen und einem Mutation Proposal.
6. Produktions-, IAM-, Datenbank-, Billing-, Secret-, Deployment-, DNS- sowie HIGH/CRITICAL-Mutationen erfordern immer eine ausdrückliche Owner-Freigabe für den exakten Zielzustand.
7. Kein Modell, Provider, Agent, Workflow oder Dokument darf seine eigene Authority erhöhen.
8. Native MFA wird aufgrund der Owner-Attestation als aktiviert, aber bis technischer Evidence als `VERIFICATION PENDING` geführt.
9. PR #257 bleibt Documentation-only; Runtime-Prototypen erhalten eigene Branches/PRs.
10. Nach Merge wird der Remote-Arbeitsbranch gelöscht.

## Mutation-Proposal-Zustandsmodell

```text
DISCOVERED
→ PROPOSED_BY_OWNER | PROPOSED_BY_SYSTEMADMIN
→ OWNER_REVIEW_REQUIRED
→ OWNER_APPROVED | REJECTED | EXPIRED
→ PRECHECK_PASSED
→ EXECUTING
→ VERIFIED_PASS | VERIFIED_FAIL
→ ROLLED_BACK | CLOSED
```

Nur der Owner darf `OWNER_APPROVED` erzeugen. Ein Zustands-, Ziel-, SHA-, Versions- oder Risikowechsel invalidiert die Freigabe.

## Sicherheitsinvarianten

- permit before side effect;
- deny on ambiguity;
- exact target and environment binding;
- no secrets in roadmap, PR oder Evidence;
- minimal mutation and bounded blast radius;
- precheck, postcheck and rollback are mandatory;
- append-only redacted audit evidence;
- no Human-approval emulation by an agent;
- no merge or production mutation by documentation authority alone.

## Folgen

Positiv:

- offene Programme werden nachvollziehbar priorisiert;
- der Agent kann proaktiv notwendige Mutationen anfragen;
- Owner-Authority bleibt getrennt und fail-closed;
- Prototypen werden klein, testbar und reviewbar.

Kosten:

- zusätzliche Proposal-, Evidence- und Traceability-Artefakte;
- blockierte Phasen bleiben trotz fertiger Dokumentation blockiert;
- Owner-Attestations benötigen technische Nachverifikation.

## Abgelehnte Alternativen

- autonome Agentenfreigabe: verletzt Separation of Duties;
- vollständige Roadmap und Runtimecode in PR #257: zu großer Review- und Risikoumfang;
- Native MFA allein aufgrund verbaler Aktivierung als VERIFIED PASS: Evidence-Lücke;
- alle Fachroadmaps löschen: Verlust historischer und fachlicher Details.

## Verifikation

- ESS-0023 Contract Review;
- Roadmap enthält M0–M10, P0–P3 und Prototyp-IDs;
- Agenteninitiierte Anfrage wird ohne Owner-Approval DENY;
- geändertes Proposal invalidiert Approval;
- branch cleanup ist Exit-Kriterium.
