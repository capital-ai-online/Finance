# Runbook — Owner-gated Commit-Signing-Automatisierung

**Authority:** Human/Owner only  
**Workflow:** `.github/workflows/sign-pr-commits.yml`  
**Inspector:** `scripts/security/inspectCommitSignatures.mjs`  
**Status:** Proposed until Human merge  
**Does not authorize:** Merge, Deploy, Ruleset-Apply, Self-Merge

## Zweck

GitHub-Connector- und Contents-API-Commits sind unverifiziert. Das Ruleset `required_signatures` blockiert solche Köpfe. Dieser Pfad erzeugt **nicht** Signaturen im Connector. Er erzeugt sie in einem **trusted-main** Workflow, nachdem der Owner `workflow_dispatch` ausgelöst hat.

## Nicht-Ziele

- `required_signatures` wird hier nicht wieder aktiviert.
- `main` wird nicht direkt beschrieben.
- Offene PRs anderer Workstreams (#611) werden nicht angefasst.
- Es gibt keinen PR-Event-Autosigner und keinen Fork-Pfad.

## Voraussetzungen (Owner, einmalig)

1. Bestehenden GPG-Signing-Key des Owner-Kontos exportieren oder einen neuen erzeugen.
2. Den **public** Key unter GitHub → Settings → SSH and GPG keys hinterlegen, bis GitHub ihn als verifiziert führt.
3. Repository-Secrets anlegen:
   - `COMMIT_SIGNING_GPG_PRIVATE_KEY` — ASCII-armored private key
   - `COMMIT_SIGNING_GPG_PASSPHRASE` — optional, nur wenn der Key geschützt ist
   - `COMMIT_SIGNING_GIT_NAME` — exakter Committer-Name
   - `COMMIT_SIGNING_GIT_EMAIL` — E-Mail, die am GitHub-Konto und am GPG-Key hängt
4. Den Workflow nur vom Branch `main` starten (Actions → PR-Commits signieren).

Ohne diese Secrets bleibt `mode=apply` fail-closed. `mode=plan` braucht keine Signing-Secrets.

## Betrieb

### Plan

1. Actions → **PR-Commits signieren** → `workflow_dispatch`
2. `pull_number` = offene PR gegen `main`
3. `mode=plan`
4. Summary zeigt je Commit `verified` / `reason`

Exit 0 im Inspect-Job bedeutet: Bericht erzeugt. Unsigned Commits sind kein Inspect-Fehler; sie sind Apply-Kandidaten.

### Apply

Nur wenn Plan den Same-Repository-PR gegen `main` bestätigt und der Head bereits `origin/main` enthält:

1. Dieselben Inputs mit `mode=apply`
2. Workflow squash't den PR-Diff auf `origin/main` zu **einem** `git commit -S`
3. Push mit `--force-with-lease` auf denselben PR-Branch
4. Tree/Inhalt bleibt der PR-Diff; ersetzt werden nur Commit-Objekte

Der Workflow verweigert Rewrite von `main`/`master` und bricht ab, wenn der Head seit dem Inspect driftet.

## Wiederkehrende Agent-PRs

Nach Merge dieses Runbooks:

1. Agent erzeugt unverifizierte Commits wie bisher.
2. Owner startet `plan`, danach bei Bedarf `apply`.
3. Erst der signierte Head ist ein zulässiger Merge-Kandidat, falls `required_signatures` später wieder aktiv ist.
4. Human merge bleibt separat.

## Rollback

- Workflow-Datei revertieren.
- Secrets löschen.
- Einen Apply-Push mit `git revert` des folgenden Human-Merge rückgängig machen; der PR-Branch selbst kann auf den vorherigen Head zurückgesetzt werden, solange er nicht gemergt ist.

## Threat notes

- Der Private Key in Actions ist ein Hochwert-Secret. Least privilege: nur dieses Repository, kein Fork-Job, kein `pull_request_target`.
- `GITHUB_TOKEN` erhält `contents: write` nur im Apply-Job.
- Checkout bleibt `persist-credentials: false`; Push nutzt den Job-Token explizit.
