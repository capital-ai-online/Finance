# M9 — Break-Glass Design Proposal (2026-08-16)

Status: **OWNER_ACCEPTED — 2026-08-16, explizite Antwort via `AskUserQuestion` in
Claude-Code-Sitzung** (Design freigegeben; siehe §5 für Reichweite der Freigabe)
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domain 7: Break-Glass",
ADR-0063 (`PROPOSED`), ADR-0064/M5A (Native TOTP/AAL2, `VERIFIED PASS`), ADR-0065 (REM)
Autor/Rolle: Claude Code (`claude-code-cli`), im Rahmen der Systemadmin-Rolle für I2 laut
`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` §5: „Darf Kill-Switch- und
Break-Glass-**Proposals** formulieren" — **kein** Implementierungs- oder Aktivierungsschritt.
Auslöser: Owner-Anweisung „fahre mit M9 fort" (nach `AskUserQuestion`-Wahl „M9 zuerst
fertigstellen"), 2026-08-16, im Kontext des Wunsches, anschließend mit M10/Passkey fortzufahren.

## 0. Zweck und Abgrenzung

Break-Glass ist der letzte fehlende Baustein von M9-Exit-Gate-Punkt 4. Aktuell existiert **kein**
Break-Glass-Mechanismus — nur die Zielbeschreibung im Runbook. Dieses Dokument ist ein
**Entwurf zur Owner-Prüfung**, kein implementierter Code und keine aktivierte Kontrolle. Es
enthält keine Codeänderung.

**Nicht Teil dieses Vorschlags:** die tatsächliche Implementierung, ein Drill, oder eine
Aktivierung. Diese folgen — falls ACCEPTED — als separate, eigene Schritte mit jeweils eigener
Owner-Freigabe, exakt wie bei jedem vorherigen M9-Drill dieser Sitzung.

## 1. Leitprinzip: additiv, nicht umgehend

Der zentrale Entwurfsentscheid: Break-Glass ist **kein Bypass-Codepfad**, der bestehende Prüfungen
umgeht. Stattdessen mintet Break-Glass — nach starkem, frischem Owner-Step-up — ein sehr eng
begrenztes, kurzlebiges REM-Mandat (`RoadmapExecutionMandate`, `src/platform/Security/
roadmapExecutionMandate.ts`), das anschließend **exakt dieselbe** REM→IAM→Audit-Kette durchläuft,
die diese Sitzung bereits mehrfach real bewiesen hat (Kill-Switch, Rollback/Recovery, Audit-Outage,
Replay/Idempotency, Authorization-Bypass, Secret/Exfiltration, Prompt/Tool-Injection — alle
gemergt). Kein neuer, paralleler „Notfall-Pfad" mit eigener, ungetesteter Logik. Das ist der
gleiche additive Ansatz wie bei jeder Lücke, die diese Sitzung bisher geschlossen hat
(`killSwitchActive`, Envelope-Replay), nur hier von Anfang an so entworfen statt nachträglich
verdrahtet.

## 2. Wie die acht Runbook-Anforderungen erfüllt werden

### 2.1 Starke Owner-Identität/Step-up-Anforderung

Wiederverwendung des bereits `VERIFIED PASS` nativen TOTP/AAL2-Mechanismus (M5A,
`server/stepUp.ts`, `src/platform/Security/nativeMfa.ts`) — **kein neuer Auth-Mechanismus**.
Aktivierung erfordert einen frischen, zweckgebundenen Step-up-Token mit
`purpose: 'break-glass-activation'` (dasselbe Token-Muster wie B4 „Step-up" im M5A-Runbook: nicht
aus einer AAL1-Session ausstellbar, nicht für einen anderen Zweck wiederverwendbar, nicht replay­bar
nach Verbrauch). Kein M10/Passkey-Abhängigkeit — Break-Glass darf nicht auf einen noch nicht
existierenden Mechanismus warten müssen, sonst wäre ein echter Notfall ohne jede Eskalationsoption.

### 2.2 Explizite Begründung und explizites Ziel

Aktivierung verlangt zwei Pflichtfelder: einen Freitext-Grund (`reason`, rein protokollierend, wie
jeder Audit-Metadata-Wert bereits in `M9_SECRET_EXFILTRATION_LIVE_DRILL_2026-08-16.md` bewiesen —
niemals als Autorität interpretiert, siehe `M9_PROMPT_TOOL_INJECTION_LIVE_DRILL_2026-08-16.md`)
und ein exaktes, typisiertes Ziel: **eine einzelne Capability** aus `AGENT_CAPABILITIES` plus eine
einzelne `targetResource`. Kein Freitext-Ziel, keine Wildcard-Ziele.

### 2.3 Begrenzte Capability

`MERGE` ist keine bekannte Agent-Capability (bereits strukturell erzwungen, `agentIam.ts`) und
bleibt daher für Break-Glass automatisch unerreichbar — keine Sonderprüfung nötig, das bestehende
`isKnownAgentCapability`-Gate deckt dies bereits ab. Zusätzlich: `PRODUCTION_MUTATION` und
`DEPLOY_REQUEST` werden für Break-Glass-Mandate **explizit auf der Proposal-Ebene ausgeschlossen**
(Allowlist statt Blocklist) — ein Break-Glass-Mandat darf nur genau eine Capability aus
`{READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST}` enthalten, nie mehr als eine gleichzeitig.

### 2.4 Kurze Gültigkeitsdauer

Ein Break-Glass-`expiresAt` wird **serverseitig berechnet**, nie vom Aktivierenden frei gewählt:
hartes Maximum 30 Minuten ab Ausstellung (verglichen mit REM-Mandaten dieser Sitzung, deren
Standard-Gültigkeit typischerweise 7 Tage beträgt — Break-Glass ist um zwei Größenordnungen enger).

### 2.5 Keine stille Rollen-Elevation

Break-Glass ändert niemals `agentIam.ts`s Rollenmodell, vergibt niemals die menschliche IAM-Rolle
`owner` an einen Service-Account (CLAUDE.md-Invariante), und erweitert niemals die
`allowedCapabilities` eines bestehenden, dauerhaften Mandats. Es entsteht ausschließlich ein
**neues, eigenständiges, zusätzliches** REM-Mandat mit `mandateId`-Präfix `BREAK-GLASS-`, das nach
Ablauf oder Widerruf spurlos verfällt — kein bestehendes Mandat wird verändert.

### 2.6 Append-only Audit

Jede Aktivierung, jede tatsächliche Verwendung (Autorisierung + Outcome) und jeder
Ablauf/Widerruf schreibt über denselben, bereits als append-only bewiesenen Pfad
(`writeAgentAuditEvent`, `docs/evidence/m9/M9_AUDIT_OUTAGE_LIVE_DRILL_2026-08-16.md` §3 „structural
append-only proof") — kein neuer Audit-Mechanismus.

### 2.7 Automatischer/expliziter Widerruf

Automatisch: `expiresAt`-Prüfung, identisch zum bestehenden REM-Mechanismus
(`roadmapExecutionMandate.ts` `evaluateMandateScope`). Explizit: ein dediziertes
`breakGlassRevoked`-Flag, das denselben Denial-Pattern wie `killSwitchActive` folgt (additiv,
optional, standardmäßig nicht gesetzt) — Owner kann jederzeit vor Ablauf widerrufen.

### 2.8 Verpflichtender Post-Event-Review

Nach jeder Aktivierung (Ablauf ODER Widerruf ODER Verbrauch) ist ein strukturiertes
Post-Review-Artefakt verpflichtend, bevor der M9-Exit-Gate-Punkt „break-glass drill PASS" als
erfüllt gelten kann: `.ai/evidence/break-glass/BREAK-GLASS-<id>-POST-REVIEW.md` mit Pflichtfeldern
— war der Notfall real, war die gewählte Capability ausreichend/übermäßig, hätte der Vorfall
verhindert werden können, ist eine Nachbesserung an einer bestehenden Kontrolle nötig,
Owner-Signatur. Kein automatisches „PASS" ohne dieses Review.

## 3. Explizit ausgeschlossen (Runbook-Anforderung „must not")

- Break-Glass mintet **niemals** `MERGE` (strukturell unmöglich, §2.3).
- Break-Glass schwächt **niemals** eine bestehende Kontrolle dauerhaft — jedes Mandat ist additiv,
  zeitlich begrenzt und eigenständig; keine bestehende Policy-Datei, kein bestehendes Mandat, keine
  bestehende Provider-Profil-Registry wird je verändert.
- Ein Service-Account kann sich **niemals selbst** Break-Glass gewähren — Aktivierung erfordert
  zwingend eine frische Owner-AAL2-Session (§2.1), keine Agent-/Service-Account-Identität kann
  diese herstellen.

## 4. Was dieser Vorschlag NICHT abdeckt (bewusst offen für die Owner-Entscheidung)

- Exakte Implementierungsdetails (Router-Pfad, genaue Feldnamen) — folgen bei ACCEPT als eigener
  Implementierungsschritt, nicht Teil dieses Proposals.
- Ob ADR-0063 im selben Schritt von `PROPOSED` auf `ACCEPTED` gesetzt wird — das ist eine separate
  Owner-Entscheidung, die dieses Dokument nicht vorwegnimmt.
- Der eigentliche Drill (Aktivierung + Verwendung + Ablauf/Widerruf + Review, mit vollem
  Evidence-Schema) — folgt erst nach Implementierung, als eigener, wieder separat
  Owner-autorisierter Schritt.

## 5. Owner-Aktionsfeld

- [x] **ACCEPT** — Vorschlag wird als Grundlage für die Implementierung freigegeben.
- [ ] **REJECT**
- [ ] **DEFER**

Signatur / Datum (Owner): SvenKulessa (explizite Antwort „ACCEPT (empfohlen)" via
`AskUserQuestion` in Claude-Code-Sitzung) / 2026-08-16

**Reichweite der Freigabe:** deckt ausschließlich die **reine Policy-/Logik-Ebene** ab (Aktivierung,
Ablauf-/Widerruf-Prüfung, Audit-Korrelation, als getesteter, isolierter TypeScript-Modul-Code,
identisch zum bestehenden Muster von `roadmapExecutionMandate.ts`/`agentIam.ts`/
`providerProfile.ts`). Ausdrücklich **nicht** von dieser Freigabe umfasst: ein live erreichbarer
HTTP-Endpunkt/Router, der diese Logik tatsächlich aufrufbar macht, oder jede Produktions-/
Server-Verdrahtung (`server.application.ts`). Das Verdrahten eines echten, erreichbaren
Aktivierungs-Endpunkts ist ein eigener, separat zu autorisierender nächster Schritt — analog zu
M10s eigener Phasen-Sequenzierung (Resolver → Challenge → Enrollment → Verification → Consumption
→ Shadow Mode → Cutover, jede Phase einzeln freigegeben).

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/adr/ADR-0063-agent-assurance-incident-break-glass.md`
- `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md` §B4 „Step-up"
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `docs/evidence/m9/M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`
- `docs/evidence/m9/M9_AUDIT_OUTAGE_LIVE_DRILL_2026-08-16.md`
- `server/stepUp.ts`
- `src/platform/Security/roadmapExecutionMandate.ts`
- `src/platform/Security/agentIam.ts`
