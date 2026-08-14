# ADR-0072: Alpaca Shadow-Integration und Stilllegung von Gemini

- Status: Angenommen
- Datum: 2026-08-14

## Kontext

Aktienkurse werden kanonisch über die bestehende Providerkette bezogen. Fehlende oder veraltete Echtzeitdaten sollen messbar werden, ohne den produktiven Score unkontrolliert zu verändern. Gemini wird anwendungsweit nicht mehr benötigt.

## Entscheidung

1. Gemini wird aus Runtime, Provider-Routing, Governance, Embeddings, UI, Konfiguration und Abhängigkeiten entfernt.
2. Alpaca wird zunächst ausschließlich als read-only Shadow-Provider für den jeweils letzten Aktien-Trade angebunden.
3. Der kanonische Twelve-Data-Wert bleibt unverändert. Alpaca darf in dieser Phase weder Score noch Bewertung überschreiben.
4. Pro Beobachtung werden Feed, Zeitstempel, Alter, Preisabweichung, Providerzustand und Evidenz-ID erfasst.
5. Fehlende Credentials, Stale-Daten, Abweichungen und API-Fehler sind explizite Zustände; synthetische Ersatzwerte sind verboten.
6. Render lädt die beiden Alpaca-Schlüssel aus der kanonischen Secret File `/etc/secrets/finance-secrets.env`. Schlüsselwerte dürfen nicht geloggt oder in Client-Bundles aufgenommen werden.

## Schwellenwerte

- Frische: maximal 90 Sekunden
- Preisabweichung gegenüber dem kanonischen Provider: maximal 1 %
- Feed: standardmäßig IEX; SIP nur nach Kosten-/Lizenzfreigabe

## Folgen

Die Datenqualität kann ohne Änderung des produktiven Scores beobachtet werden. Eine Beförderung von Alpaca zum Fallback oder Primärprovider benötigt eine weitere Entscheidung mit ausreichender Shadow-Stichprobe, Marktzeiten-Segmentierung und Kostenfreigabe. Die frühere Gemini-Bildanalyse ist bewusst nicht mehr verfügbar; der Endpunkt antwortet fail-closed.
