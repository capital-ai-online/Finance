# PlatformDirector

## Enterprise Component

Status: Development

Version: 1.0.0

Owner: CAPITAL-AI

---

## Purpose

Der Platform Director ist der oberste Governance-/Decision-Layer der CAPITAL-AI-Plattform. Seit Commit
`cd5c93137074dc7f8a8ba562aff09ea7f54f6a70` existiert mit
`Contracts/PlatformDecision.ts` ein erster fail-closed Decision Contract fuer Architektur-, Governance-,
Release-, Exception-, Risk-, Priority- und Emergency-Entscheidungen.

Der Contract verlangt explizite Evidence-Referenzen, Correlation IDs, betroffene Komponenten/Contracts
und — bei Release Decisions — Quality-, Security-, Compliance- und Version-Gates. Damit ist der fruehere
Status `Unspecified` nicht mehr korrekt.

---

## Current implementation boundary

Vorhanden:

- `Contracts/PlatformDecision.ts`
- Contract-Version `platform-director-decision/0.1.0`
- evidence-bearing Decision-/Exception-/Ownership-Request-Typen
- explizite Release-Gate-Evidence-Struktur
- fail-closed Modellierung fuer `UNAVAILABLE`/`BLOCKED`-Zustaende

Noch nicht vorhanden:

- ausfuehrbarer Platform-Director-Service
- automatische Evidence-Aggregation aus Supervisor/Traceability/Release/Compliance
- EventMesh Consume-/Produce-Integration
- persistentes Decision Ledger
- Runtime Policy Enforcement
- vollstaendige ADR-0006-Acceptance-Tests

ADR-0006 bleibt deshalb aktiv und darf nicht als `resolved` klassifiziert werden.

---

## ESS Reference

ESS-0001

ESS-0001-CONTRACTS

---

## ADR References

ADR-0006

---

## Dependencies

Der aktuelle Contract hat keine Runtime-Abhaengigkeiten. Zukuenftige Abhaengigkeiten duerfen erst mit
konkreter Implementierung und ADR-/ESS-konformer Layer-Pruefung aktiviert werden.

---

## Events

Noch keine Runtime-Events. EventMesh-Integration bleibt Folgearbeit von ADR-0006.

---

## Notes

ARCH-AUDIT-0002 hatte den damaligen Bootstrap-Platzhalter korrekt auf `unspecified` gesetzt, weil zu
diesem Zeitpunkt kein Code existierte. Diese Aussage wurde am 2026-08-02 durch den neuen Decision
Contract ueberholt. Der Status ist nun `development`; dies ist eine Zustandskorrektur und keine
Behauptung, dass der Platform Director bereits vollstaendig implementiert sei.
