# Threat Model — Runtime, Supabase Secret und Recovery

**Datum:** 2026-08-29  
**Scope:** Security-Hardening-Paket auf Basis von `main@9b2c0205b611e1d9c76e8c25dcc0d45ec1ce6bfa`  
**Status:** Review-/PR-Evidence

## 1. Schutzgüter

- Integrität und Verfügbarkeit des produktiven Node/Render-Runtimes.
- Vertraulichkeit und kontrollierte Rotation privilegierter Supabase-Credentials.
- Korrekte Autorisierungsgrenze zwischen browsergebundenem RLS-Zugriff und serverseitigem privilegiertem Zugriff.
- Wiederherstellbarkeit produktiver Daten ohne erfundene RPO-/RTO-Zusagen.
- Nachvollziehbare, unveränderliche Build-/Container-Evidence.

## 2. Trust Boundaries

1. **GitHub Source/CI → Docker Image → Render Runtime**
   - Source und Policy werden über PR/CI geprüft.
   - Das Runtime-Image ist digest-gepinnt und läuft non-root.
2. **Render Runtime → Supabase**
   - Privilegierte Serverzugriffe verwenden einen server-only Secret-Key.
   - Browser-/RLS-Zugriffe verwenden publishable/anon-artige Low-Privilege-Credentials.
3. **Supabase → Backup-/Restore-Ziel**
   - Dumps enthalten potenziell produktive Daten und dürfen weder ins Repository noch in PR-Evidence gelangen.
   - Restore erfolgt nur auf explizit getrenntem Ziel, bevor ein produktiver Restore freigegeben wird.
4. **Repository-Änderung → Provider-Mutation**
   - Dieser PR verändert Code/Policy, aber rotiert oder deaktiviert keine Live-Credentials und führt keinen Restore/Deploy aus.

## 3. Bedrohungen und Kontrollen

| Bedrohung | Angriffs-/Fehlerpfad | Kontrolle in diesem Paket | Restrisiko |
|---|---|---|---|
| Verwundbare Runtime-Basis | Betrieb auf veraltetem Node-Patchstand | Node 24.20.0 + unveränderlicher OCI-Digest; Docker-Hardening-Gate erzwingt Baseline | neue CVEs nach Merge erfordern erneute Baseline-Pflege |
| Legacy-Privilege-Fallback in Produktion | `SUPABASE_SERVICE_ROLE_KEY` bleibt unbemerkt alleinige Produktionsberechtigung | Produktionsstart verlangt `SUPABASE_SECRET_KEY` fail-closed | Provider-seitige Legacy-Key-Deaktivierung bleibt separater Owner-Schritt |
| Privilege Downgrade/Verwechslung | privilegierter Client fällt auf Browser-Key zurück | bestehende Client-Separation bleibt unverändert; neuer Boot-Gate stärkt privilegierten Pfad | alte nicht-produktive Umgebungen dürfen vorübergehend Service-Role verwenden |
| Secret Leakage | Secret-Werte in Logs/PR/Dump | Validator loggt nur Key-Namen/Fehler; Dumps und Credentials explizit außerhalb Repository/Evidence | operative Fehlbedienung außerhalb Codepfads bleibt möglich |
| Falsche Recovery-Zusage | Free-Plan wird fälschlich als PITR/Retention interpretiert | Runbook markiert RPO/RTO als UNVERIFIED bis Off-site-Backup + Restore-Drill gemessen sind | tatsächlicher RPO/RTO bleibt offen bis operativer Drill |
| Datenverlust beim Restore | Restore gegen falsches/produktives Ziel | separates Restore-Ziel + Owner-Gate + Integritätscheck im Runbook | menschlicher Fehler bleibt als operatives Risiko |
| CSP/Auth-Regression durch Parallelhärtung | gleichzeitige Strict-CSP-Änderung nach Auth/#589 | CSP-Promotion bewusst nicht Teil dieses Pakets; Evidence-Gate bleibt bestehen | `report-only` bleibt bis Produktions-Telemetrie vorliegt |
| Konkurrenzänderungen | parallele PRs ändern gleiche Dateien/Trust Boundary | Main- und offene-PR-Korrelation unmittelbar vor Draft/PR | neue Commits nach Preflight erfordern erneuten Abgleich |

## 4. Sicherheitsinvarianten

- Kein direkter Write auf `main`.
- Kein produktiver Start ohne `SUPABASE_SECRET_KEY`.
- Kein privilegierter Supabase-Client mit Publishable-/Anon-Fallback.
- Kein unpinnter Node-Produktions-Base-Tag.
- Keine Live-Credential-Rotation und kein Restore als Nebenwirkung dieses PRs.
- RPO/RTO bleiben ohne Mess-Evidence ausdrücklich `UNVERIFIED`.
- Merge und externe Produktionsmutation bleiben Human-/Owner-gated.

## 5. Negative Tests

- `tests/unit/runtimeSecretsSecurity.test.ts` beweist, dass ein Produktionsstart mit vorhandenem Legacy-Service-Role-Key, aber fehlendem `SUPABASE_SECRET_KEY`, mit `process.exit(1)` fail-closed beendet wird.
- Derselbe Test beweist den positiven Gegenfall mit modernem Supabase-Secret und gültigen übrigen kritischen Secrets.
- `scripts/security/verifyDockerHardening.mjs` lehnt den obsoleten Node-24.18-Produktions-Base sowie einen unpinnierten 24.20-Base-Tag ab.
- Die bestehende Container-CI prüft anschließend Runtime-Image, SBOM und Vulnerability-Policy am exakten PR-Head.

## 6. Rollback

Bei Code-/Runtime-Regression:

1. keine Provider-Credentials zurückrotieren;
2. PR/Commit über den kanonischen branchbasierten Revert-Pfad zurücksetzen;
3. bei bereits erfolgtem Deploy Render auf den letzten verifizierten Build zurückrollen;
4. `/healthz`, Auth/IAM und privilegierte Supabase-Operationen verifizieren;
5. bei Node-spezifischer Inkompatibilität bevorzugt einen korrigierten aktuellen 24.x-LTS-Digest verwenden statt dauerhaft auf einen bekannten veralteten Patchstand zurückzugehen.

Bei Recovery-Änderungen ist `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md` maßgeblich.

## 7. Nicht automatisch ausgeführte Provider-Mutationen

- Legacy Supabase `service_role`/anon Keys deaktivieren oder rotieren.
- Supabase Leaked Password Protection aktivieren.
- CSP auf `strict` promoten.
- Backup-/Restore-Job oder produktiven Restore ausführen.

Diese Schritte benötigen jeweils eigene aktuelle Evidence und, soweit produktionswirksam, separate Owner-Freigabe.
