# Crypto Provider Validation Runbook

Status: REQUIRED BEFORE MERGE
Bezug: ADR-0054, CRYPTO_MARKET_DATA_REMEDIATION_ROADMAP

## Zweck

Dieses Runbook definiert den operativen Nachweis, dass CoinGecko, CoinMarketCap und Kraken nicht nur konfiguriert sind, sondern tatsächlich verwertbare, plausible und provenance-fähige Daten für CAPITAL-AI liefern.

## Sicherheitsregeln

- API-Keys und Secret-Werte niemals ausgeben, committen oder in CI-Logs schreiben.
- Kraken Public Market Data benötigt für diesen Scoring-Pfad keinen privaten Trading-Key.
- Kein Demo-, Registry- oder synthetischer Produktionsfallback darf einen fehlgeschlagenen Provider als gesund erscheinen lassen.
- HTTP 401/403/429/5xx, Timeout, leere Payload und Schemafehler sind unterschiedliche Zustände und getrennt zu protokollieren.

## Einheitlicher Provider-Status

Jeder Provider muss einen Status aus dieser Menge liefern:

- `healthy`: Request erfolgreich und verwertbare Payload vorhanden.
- `degraded`: Daten vorhanden, aber stale/partiell oder ein sekundäres Qualitätskriterium verletzt.
- `rate_limited`: HTTP 429 bzw. äquivalenter Providerfehler.
- `auth_error`: 401/403 bzw. ungültige Credentials.
- `schema_error`: HTTP erfolgreich, Payload aber nicht verwertbar.
- `unavailable`: Timeout, DNS, 5xx oder Transportfehler.
- `not_configured`: erforderliche Konfiguration fehlt.

## Validierung CoinGecko

Prüfen:
1. Request erreicht den vorgesehenen Endpunkt.
2. HTTP-Status ist erfolgreich.
3. Asset-Liste ist nicht leer.
4. Für Testassets sind Preis und – soweit vorgesehen – Market Cap, Volume und Supply numerisch plausibel.
5. Timestamp/Staleness ist innerhalb der festgelegten Grenze.
6. Rate-Limit wird nicht als leere Erfolgspayload interpretiert.

Erforderliche Evidence:
- Providername;
- Endpoint-Klasse, ohne Secret;
- HTTP-Status;
- Anzahl geladener Assets;
- observedAt;
- Ergebnis der Schema-/Plausibilitätsprüfung.

## Validierung CoinMarketCap

Prüfen:
1. Konfigurationsvariable vorhanden, Wert nicht loggen.
2. Minimalen Quotes-Request durchführen.
3. HTTP- und CMC-Fehlercode getrennt erfassen.
4. Bei 429 `Retry-After`/Provider-Metadaten erfassen und keinen unmittelbaren Retry-Sturm auslösen.
5. Bei 2xx prüfen, ob Datenobjekt nicht leer ist.
6. Market Cap, Volume und Supply auf Typ, Wertebereich und Asset-Zuordnung prüfen.

Ein bloß vorhandener Key ist **kein PASS**.

Aktueller bekannter Zustand zum 2026-08-10: Variable wird gelesen, Provider wurde aufgerufen, beobachteter Lauf endete jedoch mit HTTP 429 und lieferte keine verwertbare Evidence. Bis zu einem erfolgreichen Wiederholungstest bleibt CMC BLOCKED.

## Validierung Kraken

Prüfen:
1. Public Ticker ohne privaten Key aufrufen.
2. Paarauflösung für BTC/USD und weitere unterstützte Assets prüfen.
3. Spot-Preis > 0.
4. Volume >= 0.
5. Notional Volume muss aus dokumentierten Feldern deterministisch ableitbar sein.
6. Providerfehlerarray muss leer sein.
7. `exchange_liquidity` darf nur aus valider Kraken-Evidence entstehen.

Kraken-Evidence muss als `single-exchange-spot` gekennzeichnet sein und darf nicht als globales Marktvolumen oder globale Market Cap interpretiert werden.

## Consensus-Validierung

Für globale Crypto-Faktoren:

- CoinGecko + CoinMarketCap stimmen innerhalb definierter Toleranz überein → `CONSENSUS` und canonical value zulässig.
- Beide vorhanden, aber außerhalb der Toleranz → `SOURCE_CONFLICT`, kein canonical value.
- Nur ein Provider verfügbar → `INSUFFICIENT_QUORUM`, kein Zwei-Provider-Consensus.
- Stale Provider → nicht als frische Quorum-Stimme zählen.

Kraken ist von diesem globalen Quorum ausgeschlossen.

## Docker-/Runtime-Validierung

Nach erfolgreichem Image-Build:
1. Runtime-User auf non-root prüfen.
2. Container ohne Build-Secrets starten.
3. Health-/Readiness-Endpunkt prüfen.
4. Provider-Konfiguration über Runtime-Injection bereitstellen.
5. Provider-Diagnose aus der vorgesehenen Runtime durchführen.
6. Sicherstellen, dass Logs nur Secret-Präsenz/Status, niemals Secret-Werte enthalten.

## Merge Evidence Record

Vor Ready-for-Review muss für jeden Provider mindestens folgender Datensatz vorliegen:

| Feld | Pflicht |
|---|---|
| provider | ja |
| environment | ja |
| checkedAt | ja |
| HTTP/provider status | ja |
| payload usable | ja |
| schema valid | ja |
| freshness valid | ja |
| provenance retained | ja |
| scoring eligible | ja |
| failure reason | bei FAIL/BLOCKED |

## Eskalation

- CMC 429 nach Cooldown erneut: Plan/Credit-/Rate-Limit im CMC-Konto prüfen.
- CoinGecko wiederholtes 429: Request-Volumen, Cache und Planlimit prüfen.
- Kraken 4xx trotz Public Endpoint: Pair-Mapping und Request-Contract prüfen.
- Provider liefern unterschiedliche globale Werte: nicht automatisch mitteln; Conflict-Evidence erhalten und Toleranz fachlich überprüfen.
