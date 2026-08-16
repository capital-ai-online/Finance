# PR-Vorlagenvertrag — Durable Evidence Fix (2026-08-16)

**Document ID:** GOV-PR-TEMPLATE-DURABLE-2026-08-16  
**Status:** ACTIVE  
**Authority:** Owner request — dauerhafte Korrektur der PR-Vorlagenvertrag-Prüfung

## Problem

Der PR-Vorlagenvertrag schlug systematisch fehl, obwohl die Vorlage inhaltlich korrekt war:

1. **Ephemere SHAs im Body** — `validatePrBody.mjs` verlangte `baseline.head.sha` und `baseline.main.sha` als Substring im PR-Body. Jeder Push (Fix-Commit) änderte den Head-SHA → Body sofort veraltet → Check rot, bis der Body manuell nachgezogen wurde.
2. **Kein `edited`-Trigger** — Body-Korrekturen allein starteten den Workflow nicht neu; leere Force-Commits waren nötig.
3. **Dash-Mismatch** — Abschnitt 3 mit ASCII-`-` statt Unicode-`—` wurde als fehlend gewertet.
4. **Policy vs. Candidate** — Validator lief aus dem PR-Head; ein PR konnte die Prüfung abschwächen.

## Decision (fail-closed, durable)

| Token / Check | Vorher | Nachher |
|---|---|---|
| Claim-ID + Claim-Pfad | Pflicht | **Pflicht** (unverändert) |
| Produktionsversion | Pflicht | **Pflicht** (unverändert) |
| Produktions-Commit | Pflicht (40 Zeichen) | **Pflicht** (40 Zeichen **oder** 12-Zeichen-Präfix) |
| `baseline.head.sha` | Pflicht | **entfernt** (ephemer) |
| `baseline.main.sha` | Pflicht | **entfernt** (ephemer bei Rebase) |
| Abschnitts-Matching | exact string | **dash-tolerant** (— / – / -) |
| Workflow-Trigger | opened/synchronize/… | **+ `edited`** (Body-only Re-Check) |
| Validator-Quelle | candidate | **prefer main policy** |

## Non-goals

- Rebase-Gate (`branch contains current main`) bleibt bei Code-Pushes (`synchronize`) aktiv.
- Human-/CODEOWNER-Freigabe-Zeile bleibt Pflicht.
- Template-Marker v1.4.0 und Governance-IDs bleiben Pflicht.

## Files

- `scripts/pr/validatePrBody.mjs`
- `.github/workflows/pr-governance.yml`

## Verification

Nach Merge: neuer PR mit Claim muss Claim-ID/Pfad + Produktionsversion/Commit im Body tragen; Push eines Fix-Commits darf den Vorlagenvertrag **nicht** allein wegen geändertem Head-SHA rot färben.
