# M8 Exit-Gate-Punkt 2 — Scope-Entscheidung (Owner-Proposal)

Status: **PROPOSED — wartet auf ausdrückliche Owner-Bestätigung**
Datum: 2026-08-16
Roadmap phase: M8 / Integrated Roadmap I1
Authority: `docs/runbooks/M8_AGENT_CUTOVER.md` Exit Gate Punkt 2, ADR-0062, ESS-0019,
`docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`
Executor: Owner-instruierte Grok-Sitzung (Punkt A–C)
Baseline: `main@fc03e327a01df458595b1210d74d109fd895b717`

## 0. Zweck

Exit-Gate-Punkt 2 lautet:

> privileged supported providers use the provider-neutral Control Plane as the canonical path

Historisch wurde das so gelesen, dass **alle vier** in `PROVIDER_PROFILES` eingetragenen Provider
einen realen Aufrufer brauchen. Die Evidence zeigt jedoch:

- nur **ein** mutierendes Profil hat einen realen, repository-gegaten Host;
- zwei Profile sind bewusst non-mutating (`NOT_APPLICABLE`);
- ein mutierendes Profil ist **strukturell** ohne vertretbaren realen Aufrufer.

Dieses Dokument formuliert die Scope-Entscheidung, mit der Punkt 2 **ohne Sicherheitsabsenkung**
geschlossen werden kann — oder abgelehnt wird. **Nur der Owner** kann den Status auf
`OWNER_ACCEPTED` setzen.

## 1. Ist-Zustand (Evidence-gebunden)

| Provider | Plane / Mutation | realer Aufrufer | Cutover-Readiness |
|---|---|---|---|
| `chatgpt-github-connector` | mutierend | Ja (SA3B / SA4 / Work-Package-Host) | **READY** nach `M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md` (alle 6 Evidence-Felder) |
| `claude-code-cli` | mutierend (Profil) | Nein — strukturell blockiert | **BLOCKED** (`M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`) |
| `google-ai-studio` | non-mutating | N/A | **NOT_APPLICABLE** |
| `notebooklm` | research-only | N/A | **NOT_APPLICABLE** |

## 2. Warum „alle vier Caller“ falsch skaliert

1. **google-ai-studio** und **notebooklm** besitzen keine mutierende Capability. Ein privilegierten
   Cutover ist weder erforderlich noch möglich (`evaluateProviderCutoverReadiness` → `NOT_APPLICABLE`).
2. **claude-code-cli**: Die interaktive CCR-Sitzung wird nicht durch `agentIam.ts` vermittelt. Ein
   echter agentischer Host (Modell B) erfordert eine Tool-Call-Vermittlungsschicht, die heute nicht
   existiert und ein **eigenes ADR** bräuchte. Weg 1 (Content-Generator in Model-A-Work-Package)
   bedient das mutierende Profil **nicht**. `BLOCKED` ist der korrekte Sicherheitszustand, kein
   offener To-do-Rest.
3. Der **kanonische privilegierte Pfad** im Repository ist bereits der provider-neutrale Control
   Plane (SA3 → SA2 → SA1 → M4 + M8 Profile-Gate). Es existiert kein paralleler provider-spezifischer
   Admin-Bypass (Exit-Gate 4 VERIFIED PASS).

## 3. Vorgeschlagene Scope-Entscheidung (Owner)

**Entscheidungsvorschlag:**

> Für M8 Exit-Gate-Punkt 2 gilt als „privileged supported providers“ die Menge der
> **mutierenden Provider mit produktivem Execution-Host**. Aktuell ist das ausschließlich
> `chatgpt-github-connector`. Non-mutating Profile bleiben `NOT_APPLICABLE`. `claude-code-cli`
> bleibt `BLOCKED` und ist **kein** unterstützter privilegierter Produktionspfad, bis ein separates
> ADR einen sicherheitsarchitektonisch tragfähigen realen Aufrufer freigibt.

### Folgen bei Owner-Akzeptanz

| Exit-Gate-Punkt | Ergebnis |
|---|---|
| 1 | PASS (unverändert) |
| 2 | **PASS** unter Scope oben |
| 3–7 | PASS (unverändert) |
| 8 | PASS nach Merge dieses Docs-PRs + Traceability-Sync |
| 9 | N/A / PASS (kein offener M8-Arbeitsbranch nach Merge+Delete) |

Dann darf M8 als `COMPLETE / VERIFIED PASS` **nur nach ausdrücklicher Owner-Bestätigung**
(Kommentar/Approve auf dem PR oder Follow-up-Commit Status-Flip) geführt und M9 freigegeben werden.

### Folgen bei Ablehnung

- Punkt 2 bleibt `PARTIAL`.
- M8 bleibt `IN PROGRESS`.
- M9 bleibt blockiert.
- Nächster Schritt wäre entweder (a) neues ADR für Claude-Code-Host oder (b) Profil-Umbau
  `claude-code-cli` → non-mutating / separates Content-Profil.

## 4. Was diese Entscheidung **nicht** tut

- Kein Self-Merge und kein automatisches M8-Closure ohne Owner.
- Keine Aktivierung von Claude-/Gemini-/NotebookLM-Mutation.
- Keine Schwächung von IAM, REM, Kill-Switch oder Human-only MERGE.
- Kein Start von M9-Drills in diesem PR.

## 5. Owner-Aktionsfeld

Bitte eine der folgenden Optionen **explizit** wählen:

- **[ ] ACCEPT** — Scope-Entscheidung wie in §3; nach Merge darf M8 Closure Evidence geschrieben und M9 freigegeben werden.
- **[ ] REJECT** — Punkt 2 bleibt PARTIAL; M8 nicht schließen.
- **[ ] DEFER** — weitere Evidence/ADR vor Entscheidung (bitte Ziel nennen).

Signatur / Datum (Owner): __________________ / __________

## Verwandte Dokumente

- `docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`
- `docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md`
- `docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`
- `docs/runbooks/M8_AGENT_CUTOVER.md`
- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`
