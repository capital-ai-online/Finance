# M9 — Break-Glass Live-Wiring (2026-08-16)

Status: HTTP-ENDPUNKT LIVE-VERDRAHTET UND GETESTET — **weiterhin kein M9-Drill**
Authority: Owner-Wahl via `AskUserQuestion` ("Break-Glass live verdrahten (empfohlen)") nach Merge
von PR #401; `docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md` (OWNER_ACCEPTED),
`docs/evidence/m9/M9_BREAK_GLASS_LOGIC_IMPLEMENTATION_2026-08-16.md`

## 0. Zweck und Abgrenzung

Verdrahtet die bereits Owner-akzeptierte, bereits getestete Policy-/Logik-Ebene
(`src/platform/Security/breakGlass.ts`, PR #401) hinter einem echten, authentifizierten
HTTP-Endpunkt — der in `M9_BREAK_GLASS_LOGIC_IMPLEMENTATION_2026-08-16.md` §4 als nächster,
separat zu autorisierender Schritt benannte "Live-Verdrahtung":

- ✅ Echter, in `server.application.ts` (via `registerApplicationRoutes.ts`) erreichbarer
  HTTP-Endpunkt unter `/api/systemadmin/break-glass`.
- ✅ Owner-Step-up-Verifikation über den bestehenden, unveränderten M5A-Mechanismus
  (`server/stepUp.ts` / `requireStepUp()` aus `authMiddleware.ts`).
- ✅ Aufruf der realen, unveränderten `activateBreakGlass()` / `isBreakGlassMandateActive()`.
- ✅ Persistenz des `revoked`-Zustands (In-Memory, siehe §2 für die begründete Entscheidung gegen
  eine neue Supabase-Tabelle).
- ❌ **Kein** M9-Drill (Aktivierung + Verwendung + Ablauf/Widerruf + Pflicht-Post-Event-Review) —
  bleibt weiterhin ein eigener, separat zu autorisierender nächster Schritt.
- ❌ ADR-0063 bleibt `PROPOSED`.

## 1. Implementierung

`server/systemadmin/breakGlassRouter.ts` (neu) — Express-Router mit drei Endpunkten, exakt nach
dem in `server/adminDiagnostics.ts` etablierten Owner+Step-up-Guard-Muster (kein neuer
Auth-Mechanismus erfunden):

- **`POST /activate`** — Rate-Limit (5 Versuche / 5 Minuten pro IP, wiederverwendet
  `src/platform/Security/rateLimiter.ts`), dann `checkAdminAccess(..., OWNER_ONLY_ROLES)` +
  `requireStepUp()`. Bei Erfolg: `activateBreakGlass()` mit den validierten Body-Feldern
  (`capability`, `targetResource`, `reason`, `roadmapItem`, `allowedPaths`) und
  `stepUpVerified: true` (nur gesetzt, weil `requireStepUp()` bereits erfolgreich war — niemals aus
  Client-Eingabe übernommen). Bei `ALLOW`: Mandat wird im Modul-Scope-Store abgelegt und via
  `writeAgentAuditEvent()` (derselbe bereits bewiesene append-only SA3B-Audit-Pfad) protokolliert.
  Bei `DENY`: ebenfalls auditiert, HTTP 403.
- **`POST /revoke`** — derselbe Owner+Step-up-Guard, markiert `revoked: true` für eine bekannte
  `mandateId`, auditiert. 404 für unbekannte `mandateId`.
- **`GET /status/:mandateId`** — Owner-only (kein Step-up nötig für einen reinen Lesezugriff),
  liefert `{active, revoked, expiresAt}` via `isBreakGlassMandateActive()`.

`server/routes/registerApplicationRoutes.ts` — `breakGlassRouter` importiert und unter
`/api/systemadmin/break-glass` gemountet, direkt neben dem bestehenden
`/api/internal/systemadmin-execution`-Mount.

`server/agentAudit/systemadminAuditedExecution.ts` — `server/systemadmin/breakGlassRouter.ts` und
`src/platform/Security/breakGlass.ts` zur bestehenden, eingefrorenen
`SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS`-Liste hinzugefügt (schützt beide Dateien davor, von einem
Agenten über dessen eigene SA3B-mutierte `requestedPaths` verändert zu werden — dasselbe Muster wie
für `systemadminExecutionBrokerRouter.ts` bereits etabliert).

## 2. Entscheidung: In-Memory-Store statt neuer Supabase-Tabelle

Der akzeptierte Proposal (§2, Anforderung "automatischer/expliziter Widerruf") verlangt
Widerruf-Persistenz, spezifiziert aber keinen Speicherort. Bewusst gegen eine neue Supabase-Tabelle
entschieden:

1. CLAUDE.md warnt ausdrücklich vor produktiven Schema-Mutationen aus einem Dev-only-Schritt —
   eine neue Tabelle hat einen eigenen Lifecycle (Policy → Grant → Approval → Dry-run → Apply →
   Verify → Audit), der nicht in diesen Schritt gehört.
2. Dieses Render-Deployment ist bereits an anderer Stelle (`rateLimiter.ts`, eigene
   Dokumentation dort) als Single-Instance dokumentiert — In-Memory-Zustand ist also eine bereits
   akzeptierte, präzedierte Einschränkung, keine neue.
3. Mandate laufen ohnehin binnen 30 Minuten ab (`MAX_BREAK_GLASS_DURATION_MS`) — ein Server-Neustart,
   der den `revoked`-Zustand verliert, ist eine akzeptable, tendenziell eher sicherere Eigenschaft
   (Mandat verschwindet komplett statt in unbekanntem Zustand fortzubestehen).

## 3. Ungelöster, dokumentierter Vorbefund (nicht Teil dieses Schritts)

`requireStepUp()` (`src/platform/Security/authMiddleware.ts`) prüft beim Konsum eines Step-up-Tokens
das `purpose`-Feld **nicht** — es wird bei Ausstellung gespeichert, aber nicht gefiltert. Die
Runbook-eigene M5A-Dokumentation verspricht wörtlich, ein Token könne "keinen anderen Zweck
autorisieren". Das ist eine echte, bereits vor diesem Schritt bestehende Lücke in gemeinsam
genutzter Infrastruktur (betrifft **jeden** Step-up-gated Endpunkt, nicht nur Break-Glass) — bewusst
**nicht** im Rahmen dieser Verdrahtung behoben, da eine Änderung an `requireStepUp()` alle
bestehenden Step-up-Konsumenten betrifft und damit ein eigener, größerer, separat zu autorisierender
Schritt wäre. Praktische Auswirkung für Break-Glass: ein Owner mit einem frischen Step-up-Token für
einen *anderen* Zweck könnte dieses Token aktuell auch für `/break-glass/activate` verwenden. Da
beide Fälle bereits eine echte, frische AAL2-Owner-Verifikation voraussetzen, ist das Risiko gering,
aber real und hiermit dokumentiert.

## 4. Testabdeckung

`tests/unit/breakGlassRouter.test.ts` (neu), 10 Tests — Muster wie
`tests/unit/systemadminExecutionBroker.test.ts` (echter `express()`-Server auf einem
Ephemeral-Port, `checkAdminAccess`/`requireStepUp`/`writeAgentAuditEvent` via `vi.mock()` gemockt,
die reale `activateBreakGlass()`/`isBreakGlassMandateActive()`-Logik läuft ungemockt):

- `/activate`: Ablehnung ohne Owner-Rolle (403, vor Body-Auswertung); Ablehnung ohne frischen
  Step-up (428, `code: step_up_required`); erfolgreiche Aktivierung liefert ein gültiges Mandat und
  auditiert `ALLOW`; ungeeignete Capability (`PRODUCTION_MUTATION`) wird verweigert und als `DENY`
  auditiert, ohne Mandat zu persistieren; Rate-Limit greift nach 5 Aktivierungsversuchen (6.
  Versuch → 429).
- `/revoke` + `/status`: ein aktiviertes Mandat wird widerrufen und ist danach über `/status`
  inaktiv (`active: false, revoked: true`) — Audit-Aufruf-Zähler bestätigt genau zwei Events
  (Aktivierung + Widerruf); 404 für unbekannte `mandateId` bei `/revoke` und `/status`; beide
  Endpunkte lehnen Nicht-Owner-Aufrufer ab (403).

**Testlauf:** `npx vitest run` — **195 Dateien, 1201 Tests, alle PASS** (davon neu: 10, in
`tests/unit/breakGlassRouter.test.ts`; die bereits bestehenden 27 aus `breakGlass.test.ts`
unverändert PASS). `npm run lint` (`tsc --noEmit`) PASS.

`node --test scripts/pr/*.test.mjs scripts/systemadmin/*.test.mjs` — 1 vorbestehender, von diesem
Schritt unabhängiger Fehlschlag bestätigt (`scripts/pr/*.test.mjs`, Testname "R-002 keeps
package/deploy metadata only as compatibility fallback when no manifest exists"). Verifiziert durch
`git stash` der hier gemachten Änderungen und erneutem Lauf auf dem unveränderten Branch-Stand —
identischer Fehlschlag, also nicht durch diese Arbeit verursacht. Nicht behoben, da außerhalb des
Scopes dieses Schritts (kein Berührungspunkt mit Break-Glass/PR-Governance-Skripten).

## 5. Was dieses Dokument NICHT bedeutet

- M9-Exit-Gate-Punkt 4 ("break-glass drill PASS") gilt weiterhin **nicht** als erfüllt — es wurde
  kein Drill ausgeführt, nur der Endpunkt verdrahtet und isoliert per HTTP getestet (mit gemockter
  Owner-Authentifizierung, nicht gegen ein echtes Supabase-IAM-Backend).
- ADR-0063 bleibt `PROPOSED`.
- Der in §3 genannte `purpose`-Filter-Fund bleibt unbehoben.

## 6. Nächste Schritte (jeweils eigene Owner-Freigabe erforderlich)

1. Der eigentliche M9-Break-Glass-Drill (Aktivierung, Verwendung, Ablauf/Widerruf,
   Pflicht-Post-Event-Review) mit vollem Evidence-Schema — jetzt technisch möglich, da ein echter
   Endpunkt existiert.
2. Optional, separat: Behebung des `purpose`-Filter-Funds in `requireStepUp()` (betrifft alle
   Step-up-gated Endpunkte, nicht nur Break-Glass).
3. Optional, separat: ADR-0063 `PROPOSED` → `ACCEPTED`.

## Related Documents

- `docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md`
- `docs/evidence/m9/M9_BREAK_GLASS_LOGIC_IMPLEMENTATION_2026-08-16.md`
- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/adr/ADR-0063-agent-assurance-incident-break-glass.md`
- `server/systemadmin/breakGlassRouter.ts`
- `tests/unit/breakGlassRouter.test.ts`
- `src/platform/Security/breakGlass.ts`
- `server/routes/registerApplicationRoutes.ts`
