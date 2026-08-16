# M9 — Break-Glass Policy-Logic Implementation (2026-08-16)

Status: LOGIC LAYER IMPLEMENTED AND TESTED — **not** a completed M9 Break-Glass drill, **not**
live-reachable (kein HTTP-Endpunkt verdrahtet)
Authority: `docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md` (OWNER_ACCEPTED
2026-08-16), `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`

## 0. Zweck und Abgrenzung

Implementiert die in `M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md` beschriebene, vom Owner
akzeptierte reine Policy-/Logik-Ebene. **Reichweite exakt wie im Proposal §5 festgehalten:**

- ✅ Aktivierungslogik, Ablauf-/Widerruf-Prüfung, Mandat-Konstruktion — implementiert und getestet.
- ❌ **Kein** HTTP-Endpunkt, **keine** `server.application.ts`-Verdrahtung — bleibt separater,
  eigens zu autorisierender Schritt.
- ❌ **Kein** echter M9-Drill (Aktivierung + Verwendung + Ablauf/Widerruf + Pflicht-Post-Review) —
  das erfordert die Live-Verdrahtung zuerst und ist ebenfalls ein eigener, separater Schritt.
- ❌ ADR-0063 bleibt `PROPOSED`, wird durch dieses Dokument nicht auf `ACCEPTED` gesetzt.

## 1. Implementierung

`src/platform/Security/breakGlass.ts` (neu) — reines, deterministisches Logik-Modul, exakt im
Stil von `agentIam.ts`/`roadmapExecutionMandate.ts`/`providerProfile.ts` (keine I/O, kein
Netzwerk, kein Datenbankzugriff):

- `activateBreakGlass(request)`: konstruiert bei Erfolg ein vollwertiges, echtes
  `RoadmapExecutionMandate` (`mandateId`-Präfix `REM-BREAK-GLASS-`, kompatibel mit dem
  bestehenden `MANDATE_ID_PATTERN`) und validiert es **zusätzlich selbst** über die reale,
  unveränderte `validateRoadmapExecutionMandate()` — ein Konstruktionsfehler in dieser Funktion
  würde also am eigenen Self-Check scheitern, nicht erst später unbemerkt durchrutschen.
- `isBreakGlassMandateActive(mandate, revoked, now)`: Gültigkeits-/Widerruf-Prüfung, extern
  gehaltener `revoked`-Zustand (wie `killSwitchActive`, nicht im Mandat selbst eingebettet).
- `src/platform/Security/roadmapExecutionMandate.ts`: `RESERVED_MUTATION_CLASSES` exportiert
  (vorher privates Modul-internes `const`) — reine Sichtbarkeits-Änderung, keine Logikänderung,
  ermöglicht `breakGlass.ts` dieselbe, bereits geprüfte reservierte Denylist wiederzuverwenden statt
  sie zu duplizieren (Drift-Risiko vermieden).

**Alle acht Runbook-Anforderungen wie im Proposal beschrieben umgesetzt** (§2 des Proposals):
starkes Owner-Step-up (Aufrufer muss `stepUpVerified: true` bereits unabhängig verifiziert haben —
dieses Modul führt selbst keine Authentifizierung durch), explizite Begründung+Ziel (Pflichtfelder),
begrenzte Capability (Allowlist von sieben Capabilities, `MERGE`/`PRODUCTION_MUTATION`/
`DEPLOY_REQUEST` ausgeschlossen), 30-Minuten-Hartlimit (nicht caller-einstellbar), keine stille
Rollen-Elevation (neues, eigenständiges Mandat, kein bestehendes wird verändert), append-only Audit
(via Wiederverwendung der realen SA3B-Kette, siehe §2), automatischer/expliziter Widerruf
(`expiresAt` + externer `revoked`-Zustand).

**Neu gegenüber dem Proposal, als Implementierungsdetail entschieden** (im Proposal §4 explizit als
offen markiert): eine zusätzliche Pflicht-Pfad-Allowlist (`allowedPaths`), da die geteilte
REM-Struktur eine nicht-leere Pfadliste voraussetzt. Bewusst kein impliziter Wildcard-Fallback —
der Owner muss bei Aktivierung explizit angeben, welche Pfade der Notfall betrifft (enger statt
weiter, konsistent mit dem übrigen Enge-Prinzip).

## 2. Testabdeckung

`tests/unit/breakGlass.test.ts` (neu), 27 Tests:

- **Isolierte Aktivierungslogik** (17 Tests): fehlender Step-up, falscher Owner, `MERGE`,
  `PRODUCTION_MUTATION`, `DEPLOY_REQUEST`, unbekannte Capability, fehlender Grund/Ziel/Roadmap-Item/
  Pfad-Allowlist → jeweils `DENY`; alle 7 zulässigen Capabilities einzeln → `ALLOW`; das
  konstruierte Mandat besteht die reale `validateRoadmapExecutionMandate()`-Prüfung erneut
  (nicht nur selbstbehauptet); Gültigkeitsdauer exakt 30 Minuten; eindeutige `mandateId` über
  mehrere Aktivierungen; vollständige reservierte Denylist übernommen.
- **Ablauf-/Widerruf-Prüfung** (2 Tests): aktiv exakt innerhalb `[validFrom, expiresAt)`; Widerruf
  gewinnt immer, auch mitten im Gültigkeitsfenster.
- **Live-Kette-Beweis über die reale SA3B-Kette** (4 Tests, `authorizeSystemadminAuditedExecution`,
  wie in jedem vorherigen M9-Drill dieser Sitzung): die exakt gewährte Capability für das exakte
  Ziel wird über die echte Kette erlaubt; eine ANDERE Capability unter demselben Break-Glass-Mandat
  wird verweigert (Ein-Capability-Scope wird von der Kette selbst durchgesetzt, nicht nur vom
  Aussteller behauptet); nach Ablauf wird über die echte Kette verweigert; sowohl ALLOW- als auch
  DENY-Ergebnisse werden über den bereits bewiesenen append-only Audit-Pfad protokolliert.

**Gefundener und sofort korrigierter Konstruktionsfehler** (während der Testentwicklung, vor
Fertigstellung): die erste Implementierung hatte `allowedPaths: []` (leer) und kein
`approvalEvidenceRef` gesetzt — beide verletzen bereits bestehende Struktur-Invarianten der
geteilten `validateRoadmapExecutionMandate()`-Prüfung. Der Fehler wurde durch den eigenen
Self-Validation-Schritt der Funktion selbst aufgedeckt (nicht durch manuelle Inspektion) — ein
direkter, praktischer Beweis, dass die „konstruiertes Mandat validiert sich selbst"-Entscheidung
aus §1 echten Wert hat.

**Nebenbefund (dokumentiert, nicht Teil des Break-Glass-Scopes):** Beim Debuggen dieses Fehlers
wurde eine bereits im Repository bestehende TypeScript-Narrowing-Eigenheit erneut bestätigt
(`if ('errors' in validation)` statt `if (!validation.valid)` — dieselbe Umgehung existiert
bereits in `roadmapExecutionMandate.ts:709`, dort offenbar aus demselben Grund gewählt). Kein neuer
Fund, nur Bestätigung eines bereits im Code etablierten Musters.

**Testlauf:** `npx vitest run` — **1191 Tests, 194 Dateien, alle PASS** (davon neu: 27, in
`tests/unit/breakGlass.test.ts`). `npm run lint` (`tsc --noEmit`) PASS.

## 3. Was dieses Dokument NICHT bedeutet

- M9-Exit-Gate-Punkt 4 („break-glass drill PASS") gilt **nicht** als erfüllt — kein Drill wurde
  ausgeführt, nur die Logikebene implementiert und isoliert/end-to-end-gegen-die-Autorisierungskette
  getestet.
- Break-Glass ist **nicht live erreichbar** — kein Aufrufer im Produktionscode nutzt
  `breakGlass.ts` bisher; es existiert ausschließlich als getesteter, aber unverdrahteter Baustein.
- ADR-0063 bleibt `PROPOSED`.

## 4. Nächste Schritte (jeweils eigene Owner-Freigabe erforderlich)

1. Live-Verdrahtung: ein echter, authentifizierter HTTP-Endpunkt (Owner-Step-up-Verifikation über
   `server/stepUp.ts` + Aufruf von `activateBreakGlass()` + Persistenz des `revoked`-Zustands).
2. Erst danach: der eigentliche M9-Drill (Aktivierung, Verwendung, Ablauf/Widerruf,
   Pflicht-Post-Event-Review) mit vollem Evidence-Schema.
3. Optional, separat: ADR-0063 `PROPOSED` → `ACCEPTED`.

## Related Documents

- `docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md`
- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/adr/ADR-0063-agent-assurance-incident-break-glass.md`
- `src/platform/Security/breakGlass.ts`
- `tests/unit/breakGlass.test.ts`
- `src/platform/Security/roadmapExecutionMandate.ts`
