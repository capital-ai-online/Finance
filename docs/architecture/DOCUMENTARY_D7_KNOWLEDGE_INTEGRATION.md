# Documentary D7 — Knowledge Integration

Status: IMPLEMENTED IN DRAFT
Date: 2026-08-10
Basis: D6 / PR #173 / verified main `890552455370b81c0285febc42bb724bb412afde`

## Deutsch

D7 implementiert die deterministische Übergabegrenze zwischen Documentary und der in ESS-0009 spezifizierten zentralen Knowledge Engine. Aus einem `DocumentaryDocument` wird eine `DocumentaryKnowledgeProjection` mit origin-basiertem Dokumentknoten, gerichteten Beziehungen, Source Commit, Fingerprint, Concept-/Traceability-IDs, Provenance und SHA-256-Prüfsumme abgeleitet.

Die Projektion ist reproduzierbar: identische Dokumente erzeugen identische Nodes, Relationships und Checksums. Laufzeit-Timestamps werden nicht neu erzeugt und beeinflussen die Projection nicht.

D7 implementiert ausdrücklich nicht die zentrale Knowledge Engine. `src/platform/Knowledge` bleibt gemäß ESS-0009 eine eigenständige Authority und aktuell specification-only. D7 schreibt nicht nach `.ai/knowledge/`, startet keinen Knowledge Build, führt keine zweite Registry ein und verändert keine ESS/ADR/Contracts/Quellcode-Metadaten.

## English

D7 implements the deterministic handoff boundary between Documentary and the central Knowledge Engine specified by ESS-0009. A governed `DocumentaryDocument` is projected into origin-backed documentation nodes, directed relationships, source commit, fingerprint, concept/traceability identifiers, provenance references and a SHA-256 checksum.

The projection is deterministic and side-effect free. It does not persist knowledge, start a Knowledge build, introduce a parallel graph or mutate source architecture artifacts.
