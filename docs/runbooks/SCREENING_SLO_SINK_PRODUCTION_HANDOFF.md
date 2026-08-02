# Screening SLO Sink — Production Handoff

## Ziel

`screening-slo-sink/1.0.0` definiert die Persistenzgrenze für `screening-slo-evidence/1.0.0`.

Der Default in der Anwendung ist bewusst `noop-unpersisted`. Er darf niemals behaupten, Evidence persistent gespeichert zu haben.

## Produktionsanforderungen

Eine produktive Senke MUSS:

- append-only schreiben,
- `correlationId`, `observedAt`, `state`, `eligibilityStatus`, `quoteStatus`, `quoteAgeMs`, `slaState` und `reasons` erhalten,
- keine Secrets oder API-Keys persistieren,
- `scoreImpactEnabled=false` und `hardScreeningBlockEnabled=false` unverändert bewahren,
- Fehler beim Persistieren als Persistenzfehler ausweisen und niemals einen Finanzscore verändern,
- Retention und Zugriffskontrolle dokumentieren.

## Empfohlene Tabelle / Event-Struktur

Eine spätere Supabase- oder Observability-Implementierung kann mindestens folgende Felder verwenden:

- `id` UUID
- `correlation_id` text, indexed
- `symbol` text nullable
- `asset_class` text nullable
- `observed_at` timestamptz
- `state` text
- `eligible` boolean
- `eligibility_status` text
- `quote_status` text nullable
- `quote_age_ms` bigint nullable
- `quote_fresh` boolean nullable
- `sla_state` text
- `reasons` jsonb
- `contract_version` text
- `created_at` timestamptz default now()

## Governance

Die Persistenzsenke ist Observability-/Audit-Infrastruktur. Sie darf weder Screening Eligibility noch Score, Recommendation oder Ranking automatisch verändern.

Eine spätere Aktivierung als Hard Gate erfordert eine eigene ADR, Produktionskalibrierung und Regressionstests.

## Handoff

Dieser Entwicklungs-PR nimmt keine Supabase- oder Render-Mutation vor. Die produktive Implementierung der Senke wird im Production-Handoff separat ausgeführt und danach mit realer Runtime-Evidence validiert.
