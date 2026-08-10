# M0 Deep Research – Plugin Evidence

Stand: 2026-08-10
Branch: `agent/m0-deep-research-evidence-bundle`
Modus: Evidence-first; externe Systeme wurden für die Bestandsaufnahme nur gelesen.

## Ziel

Dieses Dokument ergänzt das M0-Abschlussartefakt um direkt über die angebundenen CAPITAL-AI-Plugins erhobene Evidence aus GitHub, Render, Supabase, Stripe, Bitdefender und Malwarebytes.

## Executive Findings

1. GitHub: `SvenKulessa/Finance` ist privat, Default-Branch `main`; Auto-Merge ist deaktiviert. Merge Commit, Squash und Rebase sind erlaubt.
2. Render: Service `Finance` läuft als Docker-Web-Service in Frankfurt auf Starter. `main` ist der Produktionsbranch; Render-Auto-Deploy ist deaktiviert. Der aktuelle Live-Deploy referenziert Commit `f615cf4062f60eff07772c948c461025729a89dd`.
3. Supabase: Projekt `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`) ist `ACTIVE_HEALTHY`, Region `eu-west-1`, PostgreSQL 17.6.1. Alle im Plugin-Inventar sichtbaren Public-Tabellen haben RLS aktiviert.
4. Supabase Security Advisor meldet zwei Warnungen: Leaked Password Protection deaktiviert und zu wenige MFA-Optionen aktiviert.
5. Stripe: Produktionskonto `CAPITAL-AI` ist verbunden. Für die Zielarchitektur gelten Restricted API Keys als bevorzugtes Key-Modell; Webhook-Signaturen, Idempotenz und kontrollierte API-Versionierung bleiben Pflichtbestandteile.
6. Bitdefender meldet für `capital-ai.online` und die Render-Origin zum Prüfzeitpunkt keinen erkannten schädlichen Linkbefund (`so_far_so_good`).
7. Malwarebytes klassifiziert beide geprüften URLs als `unknown`, nicht als malicious/suspicious. Für `capital-ai.online` ist die geringe Domainhistorie ein Reputationsfaktor, kein Malware-Nachweis.
8. WHOIS: `capital-ai.online` wurde am 2026-07-02 über IONOS SE registriert und läuft laut Abfrage bis 2027-07-02; Nameserver liegen bei `ui-dns`.

## Gate-Auswirkung

Die Plugin-Evidence schließt Teile von M0-B04 und M0-B05, aber nicht die vollständige GitHub-Enforcement-, Secret-Metadata- und SBOM-Inventur. M0 bleibt bis zum vollständigen Evidence Bundle formal `BLOCKED`.

## Sicherheitsprinzip

Keine Secret-Werte, API-Keys, Tokens, Webhook-Secrets oder personenbezogenen Rohdaten werden in diesem Evidence Bundle gespeichert.