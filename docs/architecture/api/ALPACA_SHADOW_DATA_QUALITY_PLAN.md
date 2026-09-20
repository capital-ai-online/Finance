# Alpaca Shadow: Datenqualitäts- und Kostenplan

Stand: 2026-08-14

## Zielbild

Alpaca beobachtet Aktienkurse parallel zur kanonischen Quelle. Die erste Phase ist read-only und score-neutral. Jede Beobachtung muss Preis, Provider-Zeitstempel, Abrufzeit, Alter, Feed, Abweichung und Evidenz-ID enthalten.

## Qualitätsmetriken

| Metrik | Ziel | Eskalation |
|---|---:|---:|
| Erfolgreiche Abrufe | >= 99 % | < 97 % |
| Frische während US-Marktzeiten | <= 90 s | > 180 s |
| Median-Abweichung | <= 0,25 % | > 1 % |
| P95-Latenz | <= 1 s | > 2,5 s |
| Fehlende Zeitstempel | 0 % | > 0 % |

Auswertungen müssen Marktstatus, Symbol und Feed getrennt betrachten. Overnight-/Premarket-Daten dürfen nicht mit regulären Handelszeiten vermischt werden.

## Kosten/Nutzen

| Option | Nutzen | Kosten/Risiko | Empfehlung |
|---|---|---|---|
| IEX Shadow | Frühe Erkennung von Ausfällen und Stale-Daten | geringe Zusatzlast, eingeschränkte Marktabdeckung | sofort |
| SIP Shadow | breitere konsolidierte Marktabdeckung | höherer Tarif und Lizenzprüfung | nach 14–30 Tagen Shadow-Evidenz |
| Alpaca Fallback | höhere Verfügbarkeit | verändert produktive Datenherkunft | nur nach ADR und Freigabe |
| Zweite Fundamentals-API | bessere Bilanzabdeckung | Mapping-/Lizenzkosten | P2 nach Quote-Stabilisierung |
| News-/Corporate-Actions-API | bessere Ereignisqualität | Entitätenauflösung und laufende Kosten | P2/P3 |

## Beförderungskriterien

Mindestens 14 Handelstage, mindestens 1.000 vergleichbare Beobachtungen, keine Secret-Leaks, dokumentierte Rate-Limits, >= 99 % Erfolgsquote und keine ungeklärten systematischen Abweichungen über 1 %. Erst danach darf über Fallback- oder Primärbetrieb entschieden werden.

## Betrieb

Die Render server-only Render environment variables heißt exakt Render Environment Variables. Benötigte Schlüssel: `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY`; optional `ALPACA_DATA_FEED=iex` als normale Konfiguration. Der Auth-Smoke-Test erfolgt erst nach Merge und Deployment, ohne Schlüsselwerte auszugeben.
