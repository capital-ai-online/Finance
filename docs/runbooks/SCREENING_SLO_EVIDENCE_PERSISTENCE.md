# RUNBOOK — Screening SLO Evidence Persistence

## Zweck

Dieser Runbook beschreibt den Produktions-Handoff für die persistente Ablage von `screening-slo-evidence/1.0.0`.

Der Code in `src/services/screeningSloEvidence.ts` erzeugt ausschließlich einen versionierten Evidence-Record. Er schreibt selbst weder in Supabase noch in ein externes Observability-System. Dadurch bleibt die Entwicklungsumgebung frei von produktiven Infrastrukturmutationen.

## Datenquelle

Der Evidence-Record basiert ausschließlich auf bereits vorhandenen Contracts:

- `screening-eligibility/1.0.0`
- `screening-sla/1.0.0`
- `screening-operations/1.0.0`

Er enthält keine neu berechneten Finanzscores und verändert keinen kanonischen Score.

## Persistenzanforderungen

Empfohlen ist eine append-only Ablage mit mindestens:

- `correlation_id`
- `observed_at`
- `symbol`
- `asset_class`
- `state`
- `eligible`
- `eligibility_status`
- `quote_status`
- `quote_age_ms`
- `quote_fresh`
- `sla_state`
- `reasons`
- `contract_version`

Zusätzlich sollte der persistierte Datensatz die Policy-Felder enthalten:

- `score_impact_enabled = false`
- `hard_screening_block_enabled = false`
- `synthetic_evidence_allowed = false`

## Produktions-Handoff

Eine tatsächliche Supabase-Tabelle oder eine externe Observability-Senke darf erst im Produktions-Handoff eingerichtet werden.

Empfohlene Reihenfolge:

1. Zielspeicher festlegen: Supabase append-only Tabelle oder Observability Backend.
2. Retention Policy definieren.
3. RLS/Service-Role-Zugriff prüfen.
4. Write-Path ausschließlich serverseitig implementieren.
5. Correlation-ID unverändert übernehmen.
6. Keine Secrets oder Roh-Provider-Credentials persistieren.
7. Golden-/Regression-Test für Record-Schema ergänzen.
8. Erst nach ausreichender Runtime-Stichprobe SLO-Schwellen reviewen.

## Verbotene Abkürzungen

Nicht zulässig sind:

- synthetische SLO-Evidence,
- künstliche Healthy-Defaults bei fehlenden Runtime-Daten,
- direkte Ableitung eines Asset-Scores aus SLO/Latenz,
- automatische Aktivierung eines Hard Screening Gates,
- Persistieren von API Keys oder Provider-Secrets.

## Aktivierung eines Hard Gates

Ein späteres Hard Gate benötigt separat:

- ausreichende Produktionsstichprobe,
- dokumentierte Schwellenanalyse,
- ADR,
- Regression-/Golden-Dataset-Prüfung,
- Rollback-Plan,
- Supervisor-/Compliance-Evidence.

Bis dahin bleiben `scoreImpactEnabled=false` und `hardScreeningBlockEnabled=false` verbindlich.
