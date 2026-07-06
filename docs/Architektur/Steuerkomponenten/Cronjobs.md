# ⏳ Cronjobs & Periodische Hintergrund-Tasks
> **Spezifikation:** Version 0.5.5 (Beta-Phase)  
> **Konformität:** Zeitgesteuerte Speicherintegrität, Cache-Eviction Policies

Dieses Dokument beschreibt die zeitgesteuerten Systemaufgaben, die in CAPITAL-AI als Pseudo-Cronjobs im Node.js-Prozess laufen. Da die Plattform in einer leichtgewichtigen Cloud Run containerisierten Server-Umgebung ausgeführt wird, wird auf schwere externe Cron-Dienste verzichtet und stattdessen eine hochperformante, speicherinterne Intervall-Steuerung verwendet.

---

## 🧭 Navigationsmenü

* [🏠 Hauptübersicht (README.md)](README.md)
* [⏳ Scheduler.md](Scheduler.md)
* [📡 Events.md](Events.md)
* [🌐 API-Flows.md](API-Flows.md)
* [🔄 Datenflüsse.md](Datenflüsse.md)
* [⏳ Cronjobs.md](Cronjobs.md)

---

## ⏳ Spezifikationen der periodischen Aufgaben

| Task-ID | Intervall (Cron-Äquivalent) | Funktion | Cache TTL | Quelldatei | Status |
| :--- | :---: | :--- | :---: | :--- | :---: |
| **`MARKET_REFRESH`** | `*/1 * * * *` (Jede Minute) | Synchronisiert Kurse aller verzeichneten Wertpapiere. | 60 Sekunden | `server.ts` | 🟢 Aktiv |
| **`TRAFFIC_SIM`** | `*/1 * * * *` (Jede Minute) | Emuliert Interaktionsströme für Diagnosemetriken. | Keine | `server.ts` | 🟢 Aktiv |

---

## 🛡️ Fehler-Fehlertoleranz & Retry-Verhalten

Da die Hintergrund-Tasks auf externe API-Schnittstellen (wie CoinMarketCap, AlphaVantage) zugreifen, ist das Fehlerrisiko durch Netzwerk-Timeouts oder Ratenbegrenzungen (HTTP 429) verhältnismäßig hoch. Das System schützt sich durch folgende Strategien:

1. **Stufenweises Fallback-Routing**:
   Bricht die Verbindung zur Primärquelle ab, springt die Synchronisation im selben Schleifendurchlauf sofort zur Sekundärquelle (z.B. von CoinMarketCap zu CoinGecko, dann zu Binance, Kraken, Coinbase und schließlich zu Stooq CSV).
2. **"Circuit-Protection" durch Cache-Retention**:
   Sollten alle Netzwerkpfade fehlschlagen, wird der Speicher-Cache **niemals** gelöscht oder mit Nullwerten überschrieben ("Daten-Sicherheit"). Stattdessen verbleiben die letzten bekannten Werte (`Last Known Good State`) im Cache.
3. **Ausbleiben von "Thundering Herd"-Problemen**:
   Das Retry-Verhalten verzichtet auf dicht aufeinanderfolgende automatische Wiederholungsversuche. Tritt ein Fehler auf, wird das Problem im Log dokumentiert, die Aufgabe abgebrochen und erst im nächsten regulären Intervall (nach 60 Sekunden) erneut ausgeführt. Dies verhindert eine zusätzliche Belastung der APIs bei anhaltenden Störungen.

---

## 🗄️ Caching TTL & Speicher-Eviction-Richtlinien

* **Speicherort:** Arbeitsspeicher (RAM) via `assetRegistry`-Sicherheitskapsel.
* **Cache TTL (Time To Live):** Strikte 60 Sekunden.
* **Eviction (Daten-Bereinigung):**
  Es findet keine automatische Datenlöschung (Eviction) statt. Da die Anzahl der Wertpapiere im System konstant bleibt (feste Liste an Tickers), überschreibt das neue Intervall einfach die vorherigen Datensätze im Speicher (`Upsert-Muster`). Das schont die CPU-Zyklen des Servers und verhindert Garbage-Collection-Spitzen (GC Spikes).
