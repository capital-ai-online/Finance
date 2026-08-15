# ADR-0078 — Vocabulary Governance Authority and Namespace

Status: Proposed  
Date: 2026-08-09  
Decision Owner: Platform Director  
Authority: ESS-0001-CONTRACTS

## Numbering note

Formerly filed as ADR-0046 (number collision with modern-supabase-key-contracts). Content intent unchanged; number reassigned under ADR-0081.

## Kontext / Context

Die Vocabulary-Governance-Roadmap referenzierte ESS-0012, ADR-0044 und ADR-0045 ursprünglich als eigene Vocabulary-Authorities. Der Repository-Zustand zeigte Kollisionen mit bereits belegten IDs.

## Entscheidung / Decision

1. ESS-0012 bleibt Documentation Governance.
2. Vocabulary Governance unter ESS-0017 / ESS-0017-CONTRACTS.
3. Dieser ADR (ADR-0078) trennt Documentation- und Vocabulary-Authorities.
4. Keine sofortigen Code-Renames; Safe Rename Gate bleibt Voraussetzung.

## Runtime

Keine unmittelbare Runtime-/Deploy-Auswirkung.

## Referenzen

ESS-0012, ESS-0017, ADR-0081
