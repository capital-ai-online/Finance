# Runbook — Geschütztes GitHub-Environment `production`

Status: **DESIGN ONLY / M7 HANDOFF**  
Stand: 2026-08-12  
Repository: `SvenKulessa/Finance`

> Dieses Runbook autorisiert **keine** GitHub-/Render-Mutation. Umsetzung erst im dafür freigegebenen DevelopmentChain-Schritt mit separater Human/Owner-Produktionsfreigabe.

## 1. Zielzustand

- GitHub Environment `production` existiert.
- Deployment-Branch ist ausschließlich `main`.
- `RENDER_DEPLOY_HOOK_URL` liegt environment-scoped und nicht dauerhaft repositoryweit nutzbar.
- `deploy-production` kann nur nach erfolgreicher `main`-CI für den exakt geprüften SHA auslösen.
- Pull Requests deployen nicht produktiv.
- Post-Deployment-Evidence bindet GitHub SHA an Render Deployment und Runtime-Status.

## 2. Sichere Reihenfolge

1. **Owner Precheck:** aktuellen GitHub-/Render-Zustand read-only erfassen.
2. **Owner:** Environment `production` anlegen und `main` als einzigen Deployment-Branch konfigurieren.
3. **Owner:** Deploy-Hook als Environment-Secret hinterlegen; altes Repository-Secret zunächst beibehalten.
4. **Repository-PR:** `deploy-production` an `environment: production` binden und erforderliche Tests ausführen.
5. **Human Merge + main CI.**
6. **Postcheck:** GitHub-Deployment und Render-Deploy müssen denselben verifizierten SHA zeigen.
7. **Erst danach Owner:** altes Repository-Secret entfernen/rotieren.
8. Evidence/Roadmap aktualisieren.

## 3. Fail-Closed-Regeln

- Secret nie in PR, Log oder Evidence schreiben.
- Kein Environment-/Secret-/Ruleset-Schritt wird aus einem Repository-PR abgeleitet.
- Schlägt die Post-Verification fehl, bleibt/kehrt der letzte verifizierte Deploy-Pfad aktiv.
- Bei Verdacht auf Hook-Kompromittierung wird rotiert, nicht auf kompromittierte Credentials zurückgerollt.

## 4. Rollback

Vor Entfernung des alten Repository-Secrets kann die Repository-Änderung per `git revert` zurückgenommen werden. Nach Credential-Rotation wird ein neuer, kontrollierter Hook erzeugt und der alte widerrufen.

## 5. Exit Gate

M7 ist erst `VERIFIED PASS`, wenn:

- Authority und Owner Approval vorliegen;
- CI und Deployment für exakt denselben SHA erfolgreich sind;
- Secret Scope und Branch Policy verifiziert sind;
- Rollback/Evidence dokumentiert sind.
