# Crypto Market Data Remediation Roadmap

Status: ACTIVE / MERGE BLOCKED
Bezug: PR #184, ADR-0054
Stand: 2026-08-10

## Ziel

Diese Roadmap führt die verbleibenden Fehler der Crypto-Market-Data-, Scoring-, Dependency- und Docker-Kette schrittweise bis zu einem evidenzbasierten Merge-Gate. Ein vorhandener API-Key oder eine erfolgreiche Konfigurationsprüfung gilt ausdrücklich nicht als Funktionsnachweis. Provider müssen verwertbare Daten liefern und deren Provenance muss bis in die Scoring-Entscheidung nachvollziehbar bleiben.

## Merge-Grundsatz

PR #184 bleibt Draft, solange mindestens ein Pflicht-Gate BLOCKED oder UNKNOWN ist. Kein Merge aufgrund eines teilweise grünen CI-Laufs.

## Phase 1 – Dependency- und Lockfile-Integrität [P0]

1. `package.json` und `package-lock.json` synchronisieren.
2. Historische `kraken-api@1.0.2`-Einträge vollständig aus dem Lockfile entfernen.
3. `npm ci` aus sauberem Checkout ausführen.
4. `npm audit --omit=dev` ausführen.
5. Install-Script-Policy mit `strict-allow-scripts=true` beibehalten.
6. Verbleibende `node-domexception@1.0.0`-Deprecation auf transitive Herkunft, Upgrade-Pfad und Sicherheitswirkung prüfen.

Exit Criteria:
- kein `kraken-api` in Manifest oder Lockfile;
- reproduzierbares `npm ci`;
- keine High/Critical Production Vulnerabilities;
- keine unbekannten Install-Skripte;
- `node-domexception` entweder durch unterstütztes Upgrade entfernt oder als akzeptierter, nicht sicherheitskritischer Upstream-Gap mit Owner und Review-Datum dokumentiert.

## Phase 2 – CoinMarketCap Rate-Limit Remediation [P0]

1. 429-Antwort vollständig klassifizieren: HTTP-Status, CMC-Fehlercode, Retry-After, Credit-/Rate-Limit-Kontext.
2. Render-Variable nur auf Präsenz/Lesbarkeit prüfen; Secret niemals protokollieren.
3. Einen minimalen Quotes-Request gegen den vorgesehenen CMC-Endpunkt aus der Produktionsruntime durchführen.
4. Cache, Request-Deduplizierung und Backoff verifizieren.
5. Bei 429 keine synthetischen Werte und kein stilles Provider-Fallback als CMC-Evidence zulassen.
6. Account-/Plan-/Credit-Limit außerhalb des Codes korrigieren, falls der Fehler providerseitig ist.
7. Danach mindestens einen erfolgreichen Lauf mit nichtleerer, schema-valider Market-Cap-/Volume-/Supply-Antwort als Evidence erfassen.

Exit Criteria:
- Variable verfügbar;
- authentifizierter Request erfolgreich;
- HTTP 2xx;
- nichtleere verwertbare Payload;
- Schema-/Plausibilitätsprüfung bestanden;
- Provenance und Timestamp vorhanden;
- kein 429 im Validierungslauf.

## Phase 3 – CoinGecko Stabilität [P0]

1. Erfolgreichen Runtime-Nachweis reproduzieren.
2. Rate-Limit-Verhalten und Retry/Backoff testen.
3. Leere oder partielle Payloads als degraded/unavailable markieren.
4. Market Cap, Volume, Supply, Asset-ID und Timestamp validieren.
5. Cache-TTL und Staleness-Grenze dokumentieren und testen.

Exit Criteria:
- mindestens ein reproduzierbarer Produktionsruntime-Lauf mit verwertbaren Daten;
- keine Demo-/Registry-Evidence als Ersatz;
- stale/empty/error Zustände werden fail-closed behandelt.

## Phase 4 – Kraken Runtime- und Scoring-Evidence [P0]

1. Öffentlichen Kraken-Ticker ohne privaten Trading-Key aus der vorgesehenen Runtime testen.
2. Symbol-Mapping für unterstützte Assets validieren.
3. Spot-Preis, 24h Change, Base Volume und USD Notional Volume auf Schema und numerische Plausibilität prüfen.
4. `exchange_liquidity` ausschließlich als exchange-lokale Evidence verwenden.
5. Fehler-/Timeout-/unknown-symbol-Fälle testen.
6. Provenance `provider=kraken`, Scope `single-exchange-spot`, observedAt und Asset/Paar bis in den Scoring-Trace erhalten.

Exit Criteria:
- reale Kraken-Payload erfolgreich;
- keine privaten Kraken-Secrets erforderlich;
- Scoring-Faktor nur bei valider Evidence gesetzt;
- Unit-, Integration- und Runtime-Test grün.

## Phase 5 – Multi-Provider Datenintegrität [P0]

1. CoinGecko und CoinMarketCap als globale Provider getrennt erfassen.
2. Toleranzen für Preis, Market Cap, Volume und Supply explizit definieren.
3. Consensus nur bei ausreichender Übereinstimmung erzeugen.
4. Divergenz als `SOURCE_CONFLICT` behandeln.
5. Bei nur einem globalen Provider keinen Zwei-Provider-Consensus vortäuschen.
6. Kraken nicht in den globalen Market-Cap-/Supply-Consensus mischen.

Exit Criteria:
- Consensus-, Conflict-, Missing-Provider- und Stale-Data-Tests grün;
- jede scorefähige Kennzahl besitzt Provider-Provenance;
- keine Datenklassenvermischung zwischen globalem Markt und einzelner Börse.

## Phase 6 – Scoring Regression und Explainability [P1]

1. Golden-Fixture einschließlich `exchange_liquidity` versionieren.
2. Gewichtssumme exakt 100 % prüfen.
3. Renormalisierung bei fehlender Evidence testen.
4. Score-Ausgabe um Datenqualität, verwendete Provider und degradierte Faktoren ergänzen.
5. Keine fehlenden Faktoren mit neutralen oder synthetischen Produktionswerten auffüllen.

Exit Criteria:
- Golden Regression grün;
- deterministische Scores;
- erklärbare Faktorherkunft;
- Datenqualitätsstatus maschinenlesbar.

## Phase 7 – Docker und Supply Chain [P0]

1. Produktionsimage aus sauberem Checkout bauen.
2. Non-root Runtime verifizieren.
3. Image-User, Workdir, Entrypoint/CMD und exposed Port prüfen.
4. Keine Build-Secrets oder `.env`-Dateien im Image.
5. Production Dependencies und SBOM prüfen.
6. Runtime-Container starten und Health-/Readiness-Pfad testen.
7. Provider-Calls aus derselben Container-/Render-Runtime validieren, soweit CI-Netzwerkregeln dies zulassen.

Exit Criteria:
- Docker Build PASS;
- Runtime Metadata PASS;
- non-root bestätigt;
- keine Secrets im Image;
- Health/Readiness PASS;
- Supply-Chain-Gates PASS.

## Phase 8 – Merge Readiness [P0]

Merge erst freigeben, wenn folgende Matrix vollständig grün ist:

| Gate | Musszustand |
|---|---|
| Manifest/Lockfile | PASS |
| npm ci | PASS |
| Production Audit | PASS |
| Install-Script Policy | PASS |
| CoinGecko Daten | PASS |
| CoinMarketCap Daten | PASS |
| Kraken Daten | PASS |
| Provider Provenance | PASS |
| Consensus/Conflict Handling | PASS |
| Scoring Regression | PASS |
| TypeScript | PASS |
| Unit/Integration Tests | PASS |
| Production Build | PASS |
| Docker Image Build | PASS |
| Docker Runtime Metadata | PASS |
| Runtime Health/Readiness | PASS |

## Reihenfolge

P0-A: Lockfile + Dependency Hygiene
→ P0-B: CoinMarketCap 429 Root Cause
→ P0-C: CoinGecko/Kraken Runtime Evidence
→ P0-D: Multi-Provider Integrity
→ P0-E: Docker Runtime Evidence
→ P1: Explainability/Observability Hardening
→ Final Merge Review

## Stop Conditions

Die Validierung wird nicht als erfolgreich bewertet, wenn ein Provider-Key lediglich vorhanden ist, ein HTTP-Request ohne verwertbare Payload endet, ein 429/401/403 verschluckt wird, synthetische Daten echte Evidence ersetzen, ein Docker-Build nur lokal statt im vorgesehenen CI-Pfad funktioniert oder Provenance zwischen Provider und Score verloren geht.
