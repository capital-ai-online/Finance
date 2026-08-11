# Runbook — Geschütztes GitHub-Environment `production` einrichten

Status: **DESIGN ONLY** — Ausführung blockiert bis M2G Documentation Freeze und M7-Start
Stand: 2026-08-11
Repository: `SvenKulessa/Finance`
Autorität: ADR-0047, ADR-0037 §5 und §3.6, `docs/governance/GITHUB_PRO_ENABLEMENT_PLAN.md` P1

> **Dieses Runbook autorisiert keine Mutation.** Es beschreibt den Zielzustand und das Vorgehen; die Ausführung ist bis zum Abschluss des M2G Documentation Freeze gesperrt (siehe `docs/governance/DEVELOPMENT_CHAIN_DOCUMENTATION_FREEZE_POLICY.md`). Die zugehörige `.github/workflows/ci.yml`-Änderung wird bewusst erst nach Aufhebung des Freeze als eigener Pull Request eingereicht.

> Gegliedert nach den sieben Nachweisen aus ADR-0037 §5 „Production Change Authorization". Die Schritte 1 und 4 sind **nicht durch einen Agenten ausführbar** — sie erfordern Repository-Admin.

## 1. Ist-Zustand (Evidence)

| Merkmal | Beobachteter Wert | Quelle |
| --- | --- | --- |
| Deploy-Auslöser | GitHub-Actions-Job `deploy-production` ruft den Render Deploy Hook | `.github/workflows/ci.yml` |
| Secret-Ablage | Repository-Secret `RENDER_DEPLOY_HOOK_URL`, aus jedem Workflow-Kontext lesbar | ADR-0047 Zeile 34 |
| Environment-Bindung | keine | `ci.yml` vor dieser Änderung |
| Kanonisches `production` | existiert nicht | `docs/evidence/m0/GITHUB_ENFORCEMENT_STATE_2026-08-10.md` |
| Vorhandene Environments | 15, keines mit Protection Rules, `can_admins_bypass=true` | dito |
| Render-seitiger Auto-Deploy | „Auto Deploy: no / Trigger: off" | `docs/evidence/m0/RENDER_DEPLOYMENT_EVIDENCE.md` |
| Sollvertrag | `production_environment.status: "owner-admin-handoff-required"` | `.github/policies/main-production-protection.expected.json` |

## 2. Zielzustand

- Environment `production` existiert mit Deployment-Branch-Policy **ausschließlich `main`**.
- `RENDER_DEPLOY_HOOK_URL` liegt **nur** als Environment-Secret dieses Environments.
- Kein Repository-Secret dieses Namens mehr vorhanden.
- Der Job `deploy-production` läuft ausschließlich bei `push` auf `main` und deklariert `environment: production`.
- Die 15 Altbestand-Environments sind inventarisiert und entschieden.

## 3. Blast Radius

**Mittel.** Betroffen ist der Produktions-Deploy-Pfad, nicht die laufende Anwendung. Ein Fehler in diesem Vorgehen verhindert künftige Deployments; er nimmt die Produktion nicht offline und verändert keine Daten, keine Zahlungen und keine IAM-Zustände.

Der Schritt mit dem größten Risiko ist **Schritt 4** (Löschen des Repository-Secrets) — er ist nach der hier vorgegebenen Reihenfolge risikofrei, in falscher Reihenfolge bricht er den nächsten Deploy.

## 4. Durchführung — verbindliche Reihenfolge

Environment-Secrets haben Vorrang vor gleichnamigen Repository-Secrets; fehlt das Environment-Secret, greift weiterhin das Repository-Secret. Nur die folgende Reihenfolge ist ausfallfrei.

### Schritt 1 — Owner, vor dem Merge

1. `Settings → Environments → New environment` → Name exakt **`production`**.
2. Unter **Deployment branches and tags**: `Selected branches and tags` wählen, Regel **`main`** hinzufügen. Keine weiteren Muster.
3. **Required reviewers: nicht aktivieren.** Bei genau einem Collaborator erzeugt das kein Vier-Augen-Prinzip, sondern einen Deadlock — siehe `docs/governance/GITHUB_MAIN_PROTECTION_POLICY.md`, Single-Owner-Ausnahme.
4. **Wait timer: zunächst nicht aktivieren.** Empfehlung, um das Deploy-Verhalten in diesem Schritt unverändert zu lassen. Als Break-Glass-Fenster später nachrüstbar.
5. Unter **Environment secrets** → `Add secret` → Name exakt **`RENDER_DEPLOY_HOOK_URL`**, Wert: die Deploy-Hook-URL aus Render `Finance → Settings`.
6. **Das gleichnamige Repository-Secret bleibt vorerst bestehen.** Nicht löschen.

Die Deploy-Hook-URL wird an keiner Stelle in Evidence, Runbooks oder PR-Bodies notiert — ADR-0037 §3.1 und `docs/runbooks/RENDER_PRODUCTION_EVIDENCE_HANDOFF.md`.

### Schritt 2 — Merge

Den Pull Request mit der `ci.yml`-Änderung mergen. Ab jetzt deklariert der Job `environment: production` und liest bevorzugt das Environment-Secret.

### Schritt 3 — Verifikation

Nach dem ersten `main`-Push die Post-Change-Prüfungen aus Abschnitt 6 durchlaufen. **Erst bei vollständigem Erfolg weiter zu Schritt 4.**

### Schritt 4 — Owner, nach erfolgreicher Verifikation

`Settings → Secrets and variables → Actions → Repository secrets` → `RENDER_DEPLOY_HOOK_URL` löschen.

**Erst dieser Schritt stellt die Schutzwirkung her.** Vorher ist der Hook weiterhin repository-weit lesbar.

### Schritt 5 — Folge-PR

`.github/policies/main-production-protection.expected.json`, Feld `production_environment.status`, vom Wert `owner-admin-handoff-required` auf den erreichten Zustand fortschreiben. Bewusst nicht vorab geändert: Eine Statusangabe vor der tatsächlichen Serverkonfiguration wäre eine unbelegte Behauptung.

### Schritt 6 — Inventar der Altbestand-Environments

Die Namen der 15 vorhandenen Environments sind **nirgends im Repository dokumentiert**, und kein Workflow verwendet `environment:` — sie stammen aus einer externen Integration über die GitHub-Deployments-API. Unter `Settings → Environments` erfassen:

| Name | Vermutete Herkunft | Protection Rules | Secrets vorhanden? | Entscheidung |
| --- | --- | --- | --- | --- |
| | | | | behalten / löschen |

Prüfkriterium je Zeile: Wird das Environment von einem heute aktiven Prozess benötigt? Wenn nein, löschen — jedes ungeschützte Environment mit `can_admins_bypass=true` ist ein unbewerteter Zugriffspfad.

## 5. Rollback

| Situation | Vorgehen |
| --- | --- |
| Deploy schlägt nach Schritt 2 fehl | Repository-Secret ist noch vorhanden → `environment:`-Block aus `ci.yml` per Revert entfernen; Deploy läuft wie zuvor |
| Deploy schlägt nach Schritt 4 fehl | Environment-Secret prüfen; im Zweifel Repository-Secret aus der Render-Hook-URL neu anlegen |
| Environment fehlerhaft konfiguriert | Deployment-Branch-Policy korrigieren; das Environment selbst muss nicht gelöscht werden |
| Verdacht auf Hook-Kompromittierung | **Nicht** auf das alte Secret zurückrollen. Neuen Deploy Hook in Render erzeugen, alten revoken, Environment-Secret neu setzen — `RENDER_PRODUCTION_EVIDENCE_HANDOFF.md` |

Kein Schritt erfordert eine Datenmigration oder einen Rollback der Anwendung.

## 6. Post-Change-Verifikation

Nach dem ersten `main`-Push nach Schritt 2 müssen **alle** Punkte zutreffen:

1. Der Job `deploy-production` läuft und ist nicht `skipped`.
2. Der Run zeigt in der GitHub-Oberfläche ein Deployment gegen das Environment `production`.
3. Der aufgerufene Hook enthält `ref=` mit exakt dem SHA, der `build-and-test` bestanden hat (ADR-0047, normativ).
4. Render zeigt einen Deploy mit genau diesem SHA und Status `live`.
5. In einem Pull-Request-Run erscheint **kein** `deploy-production`-Lauf.
6. Nach Schritt 4: Ein Workflow ohne `environment: production` kann `RENDER_DEPLOY_HOOK_URL` nicht mehr lesen.

Punkt 5 ist die Umsetzung von ADR-0047 Zeile 32; Punkt 6 ist die eigentliche Schutzwirkung.

## 7. Traceability

- ADR-0047 — Deploy-Gate. **Zu ergänzen im Umsetzungs-PR nach dem Freeze:** ein Addendum für das Job-Level-Gating, den Umzug des Deploy-Hooks auf ein Environment-Secret, die überholte Plan-Prämisse im Context und den in §8 benannten Widerspruch. Der Umzug auf ein Environment-Secret weicht vom Wortlaut in ADR-0047 Zeile 34 ab („stored only as GitHub Actions repository secret") und darf nicht ohne dieses Addendum umgesetzt werden.
- `docs/governance/GITHUB_PRO_ENABLEMENT_PLAN.md` P1 — Plan of record.
- `docs/governance/DEVELOPMENT_CHAIN_DOCUMENTATION_FREEZE_POLICY.md` — Gate, das die Ausführung derzeit sperrt.
- `.github/policies/main-production-protection.expected.json` — Sollvertrag, Fortschreibung in Schritt 5.
- Ergebnis von Schritt 3 und 6 als Evidence unter `docs/evidence/` ablegen, Muster: `docs/evidence/m0/GITHUB_ENFORCEMENT_STATE_2026-08-10.md`. **Keine Hook-URL, keine Secret-Werte** — zulässig ist ausschließlich das Rotationsdatum ohne Inhalt.

## 8. Offener Punkt außerhalb dieses Runbooks

`render.yaml` deklariert `autoDeployTrigger: checksPass`, der Build-Guard PCG-001 erzwingt diesen Literalstring, ADR-0037 §9 führt ihn als geschützte Invariante — während ADR-0047 „Auto-Deploy Off" verlangt und die Render-Evidence „Auto Deploy: no" zeigt.

Die Blueprint-Datei widerspricht damit der dokumentierten Realität, und ein Build-Gate erzwingt den Widerspruch.

Dieser Punkt wird durch dieses Runbook **nicht** aufgelöst und ist für die hier beschriebenen Schritte auch nicht blockierend, weil der einzige praktisch wirksame Deploy-Pfad der Workflow-Hook ist. Eine Korrektur an `render.yaml` würde PCG-001 verletzen und eine als geschützt markierte Invariante berühren. Die Auflösung erfordert eine Owner-Entscheidung: entweder ADR-0037 §9 und PCG-001 an ADR-0047 angleichen, oder Render `checksPass` wiederherstellen und ADR-0047 ablösen.
