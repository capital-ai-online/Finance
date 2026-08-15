# ADR-0081: ADR-Nummernraum-Bereinigung, Shadow-Metadaten-Validator und wöchentlicher Governance-Score

## Status

**Accepted**

## Implementation-Status

🟡 **IN PROGRESS** — Nummernraum-Bereinigung und Shadow-Tools in diesem PR; volle ESS-0012-Engine bleibt Folgearbeit.

## Datum

2026-08-15

## Verantwortlich

Platform Director / Repository Owner (Human-authorized)

## Kontext

Im aktiven ADR-Baum `docs/adr/` existierten **Doppelnummern** (0014, 0020, 0044, 0046, 0067, 0068). ESS-0001-CONTRACTS Chapter 16 und ADR-0019 fordern einen eindeutigen ADR-Nummernraum.

## Entscheidung

### 1. Nummernraum-Bereinigung
Behalten: 0014 documentation-governance, 0020 multi-provider, 0044 production-runtime-immutability, 0046 modern-supabase, 0067 s1-security, 0068 first-bounded-autonomous.
Neu: 0075–0080 für die jeweiligen Zweitdateien; dieser ADR = 0081.

### 2. Shadow-Validator (nicht merge-blocking)
`scripts/governance/shadowAdrMetadataValidator.mjs` — advisory, exit 0 standard.

### 3. Wöchentlicher executable Governance Score
`scripts/governance/weeklyGovernanceScore.mjs` — Teilmenge der 57 GOV-Regeln, Shadow-Score 0–100.

### 4. Bibliotheksbericht
`docs/governance/CAPITAL_AI_GOVERNANCE_LIBRARY_REPORT_2026-08-15.md`

## Konsequenzen
Keine Runtime-/Deploy-Mutation. Human/Owner-Gate unverändert (ADR-0039, ADR-0069).

## Referenzen
ADR-0014, ADR-0019, ESS-0012, GOVERNANCE_MATURITY_REPORT
