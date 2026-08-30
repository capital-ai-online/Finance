# Preflight — Commit-Signing-Automatisierung

- Date: 2026-08-30
- Baseline: `main@1286bdedc8416bb6621bbd621a723117f92e47bc` (Merge #610)
- Repository: `SvenKulessa/Finance`
- Work-Claim: `COMMIT-SIGNING-AUTOMATION-2026-08-30`
- Mutation status: CODE PROPOSED / NOT MERGED / NO RULESET APPLY

## Beobachtung

1. Connector-`push_files` erzeugt unverifizierte Commits.
2. Owner hat `required_signatures` am 2026-08-30 wieder deaktiviert, damit #610 mergebar blieb.
3. S1-R2-02 / PR #611 beschreibt `required_signatures` weiter als Sollzustand und darf in diesem Workstream nicht überschrieben werden.
4. GitHub Actions `GITHUB_TOKEN`-Commits ohne Owner-GPG bleiben unverifiziert. Deshalb reicht ein Token-Commit nicht als Signing-Lösung.

## Gewählter Pfad

Owner-gated `workflow_dispatch` auf trusted `main`:

- `plan` liest die GitHub-Verification jedes PR-Commits.
- `apply` importiert den Owner-GPG-Key aus Repository-Secrets und ersetzt den PR-Head durch genau einen signierten Squash-Commit.
- Kein Event-Autosigner, kein Fork-Pfad, kein Direct-Push auf `main`, kein Ruleset-Apply.

## Offene Owner-Schritte nach Merge

1. Secrets `COMMIT_SIGNING_GPG_PRIVATE_KEY`, `COMMIT_SIGNING_GIT_NAME`, `COMMIT_SIGNING_GIT_EMAIL` (optional Passphrase) setzen.
2. Public Key am GitHub-Konto als GPG signing key hinterlegen.
3. An einem offenen Test-PR `mode=plan`, danach `mode=apply` ausführen und prüfen, dass GitHub den neuen Head als `Verified` zeigt.
4. `required_signatures` nur über den bestehenden `ruleset-sync` / Owner-Pfad reaktivieren, nicht durch diesen PR.

## Production boundary

Keine Render-, Supabase-, Stripe-, Runtime- oder Secret-Werte im Repository. Merge bleibt Human/Owner-only.
