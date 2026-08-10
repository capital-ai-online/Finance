# Dependency and Container Remediation Plan

Status: MERGE GATE
Stand: 2026-08-10

## Scope

Behebung der verbleibenden Supply-Chain-, Lockfile-, Deprecation- und Docker-Runtime-Risiken in PR #184.

## DCR-001 – Veraltetes Kraken-Paket vollständig entfernen

Problem: `kraken-api@1.0.2` wurde aus `package.json` entfernt, historische Lockfile-Metadaten können jedoch noch vorhanden sein.

Maßnahmen:
- Lockfile mit aktuellem Manifest neu synchronisieren.
- Nach `kraken-api` und seinen ausschließlich darüber eingebrachten Abhängigkeiten suchen.
- `npm ci` aus leerem `node_modules` validieren.

Abnahme: kein Kraken-Library-Eintrag in Manifest/Lockfile/Installationsbaum; Kraken Public REST bleibt über den internen Adapter angebunden.

## DCR-002 – node-domexception klassifizieren

Problem: transitive Deprecation `node-domexception@1.0.0`.

Maßnahmen:
- vollständigen Dependency-Pfad bestimmen;
- prüfen, ob ein unterstütztes Upgrade der direkten Parent-Dependency den Polyfill entfernt;
- keinen Major-Override ohne Kompatibilitätstest erzwingen;
- falls Upstream aktuell unvermeidbar: Risiko dokumentieren, CVE-Status prüfen, Owner und Wiedervorlage festlegen.

Abnahme: entfernt oder dokumentierte zeitlich begrenzte Risk Acceptance ohne bekannte High/Critical Vulnerability.

## DCR-003 – Install-Script Allow/Deny Policy

Maßnahmen:
- `strict-allow-scripts=true` beibehalten;
- neue Lifecycle-Scripts fail-closed behandeln;
- Linux-irrelevante optionale Pakete nur explizit denylisten, wenn der Build reproduzierbar bleibt.

Abnahme: keine unbekannten Lifecycle-Scripts während `npm ci`.

## DCR-004 – Produktionsabhängigkeiten

Maßnahmen:
- `npm audit --omit=dev`;
- SBOM erzeugen/validieren;
- Registry-/Integrity-Metadaten im Lockfile prüfen;
- keine Git-/Remote-Source-Specifier für Production Dependencies zulassen.

Abnahme: Policy PASS und keine nicht akzeptierten High/Critical Findings.

## DCR-005 – Docker Build

Maßnahmen:
- Image ausschließlich aus sauberem Commit bauen;
- reproduzierbaren Dependency-Install verwenden;
- Multi-stage/Production-Minimierung beibehalten;
- Build muss bei Dependency-/Policy-Verstoß abbrechen.

Abnahme: CI Docker Build PASS.

## DCR-006 – Docker Runtime Metadata

Prüfen:
- non-root `USER`;
- erwarteter Entrypoint/CMD;
- korrekter Workdir;
- keine unnötigen Capabilities/privilegierten Anforderungen;
- keine Secrets oder `.env`-Dateien in Layers/Filesystem;
- nur notwendige Runtime-Artefakte.

Abnahme: Runtime Metadata Gate PASS.

## DCR-007 – Runtime Health

Maßnahmen:
- Container mit produktionsnahen, aber sicheren Konfigurationswerten starten;
- Health und Readiness testen;
- Start ohne private Kraken-Trading-Credentials sicherstellen;
- Providerfehler dürfen den Prozess nicht in einen falschen Healthy-Zustand versetzen.

Abnahme: Container startet non-root, Health/Readiness sind korrekt und Provider-Degradation ist beobachtbar.

## Merge Gate

Alle DCR-001 bis DCR-007 müssen PASS oder bei DCR-002 explizit dokumentiert und akzeptiert sein. Ein erfolgreicher `docker build` allein ersetzt weder Runtime-Metadata-, Secret- noch Health-Prüfung.
