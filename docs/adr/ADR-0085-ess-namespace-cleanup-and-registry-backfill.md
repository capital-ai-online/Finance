# ADR-0085 — ESS Namespace Cleanup and Registry Backfill

Status: Accepted
Implementation-Status: 🟢 IMPLEMENTED (documentation-only)
Date: 2026-08-16
Decision Owners: Platform Director / Repository Owner
Authority: ESS-0001-CONTRACTS Chapter 16 (ESS Registry Contract), ADR-0019, ADR-0081
Related: ESS-0022, ESS-0024, ADR-0080, SEO-GM-ROADMAP-0002 (WP-M0)

## Context

`ADR-0081` bereinigte den **ADR**-Nummernraum, nachdem dort Doppelnummern entstanden
waren (0014, 0020, 0044, 0046, 0067, 0068). Der **ESS**-Nummernraum blieb dabei
unberührt und trug denselben Defekt weiter.

Zwei Befunde, dokumentiert in `docs/governance/WP_M0_OWNER_REVIEW_PACKAGE.md`:

**B1 — Doppelvergabe.** Zwei Spezifikationen tragen die Nummer `ESS-0022`, beide
angelegt am 2026-08-12, beide `PROPOSED`:

| Datei | Domäne |
|---|---|
| `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md` | DEVELOPMENT Chain M10, Owner-PR-Autorisierung |
| `.ai/skills/ESS-0022-Marketing-Roadmap-Executor.md` | Marketing-Agent-Abgrenzung |

**B2 — Registry-Lücke.** `.ai/registry/ess-registry.json` endete bei `ESS-0018`.
Die Nummern `ESS-0019` bis `ESS-0023` existierten als Dokumente, ohne registriert zu
sein. `freeNumberSpaceStartsAt` stand auf `ESS-0019`.

B2 ist die Ursache von B1: Ohne gepflegte Registry wurden Kollisionsprüfungen gegen
Dateinamen statt gegen die Registry durchgeführt. Die Marketing-Spezifikation hielt in
ihrem Abschnitt 17 ausdrücklich fest, die Nummer sei als unbelegt geprüft worden — diese
Prüfung traf nicht zu.

Der Defekt blockierte konkret **WP-M0** (SEO-GM-ROADMAP-0002 §5.3): Sowohl ESS-0022 §17
als auch `MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` §18 machen die Registry-Pflege zur
Vorbedingung der Gültigkeit. Die Definition of Done von WP-M0 war damit nicht erfüllbar.

## Entscheidung

### 1. Auflösung der Doppelvergabe

`ESS-0022` bleibt bei **Passkey-only Human/Owner PR Authorization**.
Die Marketing-Spezifikation wird auf **`ESS-0024`** umgenummert.

Begründung:

- Die Passkey-Variante ist erheblich breiter verankert (ADR-0066, M10-Runbook,
  M10-Threat-Model, `DEVELOPMENT_CHAIN_ROADMAP.md`, `docs/architecture/ROADMAP.md`,
  `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`,
  `DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`). Ihre Umnummerierung wäre der
  größere Eingriff.
- Die Passkey-Variante berührt Owner-IAM und Step-up-Autorisierung. Änderungen in diesem
  Bereich werden bewusst minimiert.
- Die Marketing-Variante ist noch nicht angenommen; ihre Referenzen liegen geschlossen im
  Marketing-Paket.

Analog zu ADR-0081 bleibt der Inhalt unverändert; nur die Nummer wechselt.

### 2. Registry-Nachzug

`.ai/registry/ess-registry.json` wird um `ESS-0019` bis `ESS-0024` ergänzt.
`freeNumberSpaceStartsAt` wird auf `ESS-0025` gesetzt.

Der Eintrag zu `ESS-0024` trägt eine `numberingNote`, die die Umnummerierung festhält —
analog zur bestehenden Note bei `ESS-0018`.

### 3. Vergaberegel

Eine neue ESS-Nummer wird ausschließlich gegen `.ai/registry/ess-registry.json`
vergeben, nicht gegen die Dateiliste unter `.ai/skills/`. Wer eine Spezifikation anlegt,
trägt sie im selben PR in die Registry ein.

## Nummernvergabe dieses ADR

Dieses ADR wurde zunächst als **ADR-0084** entworfen, gestützt auf
`ADR_UNIFIED_LOCATION_INVENTORY_2026-08-16.md` („Next free ADR number after this PR:
**ADR-0084**"). Während der Ausarbeitung wurde 0084 auf `main` parallel an
`ADR-0084-prerender-public-routes.md` (WP-S2) vergeben. Nach erneuter Kollisionsprüfung
gegen den aktuellen `main`-Stand trägt dieses ADR die Nummer **ADR-0085**.

Der Vorfall belegt die Begründung dieses ADR: Eine Nummernvergabe gegen eine Momentaufnahme
statt gegen ein gepflegtes Register kollidiert, sobald zwei Vorgänge parallel laufen. Für
den **ADR**-Raum existiert mit `adr_history.json` und dem Shadow-Validator bereits eine
Teilabsicherung; für den **ESS**-Raum stellt Abschnitt 3 sie erstmals her.

## Alternativen

| Alternative | Verworfen weil |
|---|---|
| Passkey-Variante umnummerieren | Erheblich breiter verankert; berührt Owner-IAM/Step-up |
| Beide auf neue Nummern | Doppelter Eingriff ohne Zusatznutzen |
| Kollision belassen, nur Registry pflegen | Registry kann eine Nummer nicht zweimal führen; Referenzen blieben mehrdeutig |
| Suffix-Schema (`ESS-0022-A` / `-B`) | Widerspricht ESS-0001-CONTRACTS Chapter 16 (eindeutiger Nummernraum) |

## Konsequenzen

**Positiv**

- Der ESS-Nummernraum ist eindeutig; Referenzen sind nicht mehr mehrdeutig auflösbar.
- Die Registry ist erstmals seit ESS-0018 vollständig und wieder als Vergabequelle nutzbar.
- Die Registry-Vorbedingung aus ESS-0024 §17 und Execution Policy §18 ist erfüllt; das
  Registry-Hindernis vor WP-M0 entfällt.

**Negativ / Aufwand**

- Alle Marketing-Referenzen auf `ESS-0022` mussten auf `ESS-0024` gezogen werden.
- Externe Notizen oder Chatverläufe, die die Marketing-Spezifikation als `ESS-0022`
  zitieren, sind veraltet. Die `numberingNote` in der Registry und dieses ADR bilden das
  Mapping ab.

**Ausdrücklich nicht bewirkt**

- Keine Statusänderung: `ESS-0024` und `ADR-0080` bleiben `PROPOSED`.
- Keine Annahme von WP-M0 und keine Runtime-Capability.
- Keine Änderung an `ESS-0022` (Passkey) oder an M10.

## Verifikation / Definition of Done

- [x] `ESS-0022` wird nur noch von genau einer Spezifikation belegt
- [ ] Genau eine Spezifikation je ESS-Nummer über den gesamten `.ai/skills/`-Baum
      — **offen, siehe Folgebefund F1**
- [x] `.ai/registry/ess-registry.json` enthält `ESS-0019` … `ESS-0024`
- [x] `freeNumberSpaceStartsAt` = `ESS-0025`
- [x] Registry ist valides JSON, jede `document`-Angabe zeigt auf eine existierende Datei
- [x] Keine Marketing-Referenz zeigt mehr auf `ESS-0022`
- [x] Keine Passkey-/M10-Referenz wurde verändert
- [x] `scripts/governance/shadowAdrMetadataValidator.mjs`: `error=0`

## Folgebefund F1 — ESS-0012 ist ebenfalls doppelt belegt (offen)

Bei der Verifikation dieses ADR wurde eine zweite, bisher nicht dokumentierte
Doppelbelegung sichtbar. Zwei Dateien deklarieren im Frontmatter `id: ESS-0012`:

| Datei | Status im Dokument | Registry |
|---|---|---|
| `.ai/skills/ESS-0012-Documentation-Governance.md` | `Enterprise Approved` | **registriert** als `ESS-0012` |
| `.ai/skills/ESS-0012-Enterprise-Vocabulary-Terminology-Governance.md` | `Proposed` | **nicht registriert** |

Die Registry ist eindeutig: `ESS-0012` gehört der Documentation Governance.
Das Thema der zweiten Datei — Vocabulary- und Terminologie-Governance — wurde später
unter **ESS-0017** (`ESS-0017-Vocabulary-Governance.md`) geführt. Die Datei ist damit
mit hoher Wahrscheinlichkeit ein abgelöster Vorentwurf, der bei der Themenverschiebung
nicht umgenummert oder als SUPERSEDED markiert wurde. Sie wird nur noch von
`.ai/work-claims/PR-vocabulary-governance-roadmap.json` referenziert.

F1 wird hier **bewusst nicht mitentschieden**: Ob die Datei als SUPERSEDED markiert, auf
eine freie Nummer gezogen oder archiviert wird, ist eine eigene Owner-Entscheidung und
lag außerhalb des für dieses ADR freigegebenen Scopes (Auflösung der ESS-0022-Kollision
und Registry-Nachzug). Die Vergaberegel aus Abschnitt 3 gilt ab sofort und verhindert
neue Fälle dieser Art.

## Referenzen

- `docs/adr/ADR-0081-adr-namespace-cleanup-shadow-validator-and-weekly-score.md`
- `docs/governance/ADR_CROSSREF_INVENTORY_2026-08-16.md`
- `docs/governance/WP_M0_OWNER_REVIEW_PACKAGE.md`
- `.ai/registry/ess-registry.json`
