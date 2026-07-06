# ⏳ Scheduler & Hintergrund-Intervalle
> **Spezifikation:** Version 0.5.5 (Beta-Phase)  
> **Konformität:** Nicht-blockierender Event-Loop, Fehlertolerante Timeouts

Dieses Dokument beschreibt die zeitgesteuerten Systemaktivitäten (Scheduler-Schicht) im CAPITAL-AI Backend. Alle periodischen Aufgaben werden asynchron ausgeführt, um eine Blockierung des Node.js Event-Loops zu verhindern.

---

## 🧭 Navigationsmenü

* [🏠 Hauptübersicht (README.md)](README.md)
* [⏳ Scheduler.md](Scheduler.md)
* [📡 Events.md](Events.md)
* [🌐 API-Flows.md](API-Flows.md)
* [🔄 Datenflüsse.md](Datenflüsse.md)
* [⏳ Cronjobs.md](Cronjobs.md)

---

## 📅 Die zwei aktiven Schedulers (System-Intervalle)

Im laufenden Betrieb von CAPITAL-AI sind zwei periodische Hintergrund-Tasks aktiv, die über den nativen Node.js Event-Loop (`setInterval`) gesteuert werden.

### 1. Marktdaten Cache Scheduler
* **Trigger-Typ:** Wiederkehrendes Intervall (`setInterval`)
* **Intervall:** 60.000 Millisekunden (1 Minute)
* **Start-Zeitpunkt:** Beim Bootstrapping der Express-App (in `server.ts`)
* **Ausführende Funktion:** `fetchLiveMarketData()`
* **Sicherheits-Timeout:** 45.000 ms (Netzwerk-Timeout für API-Anfragen)
* **Backoff / Retry:** Bei Fehlern wird nach 60 Sekunden im nächsten regulären Intervall ein neuer Versuch gestartet. Es gibt kein exponentielles Backoff, um dichte Folge-Anfragen bei transienten Netzwerkfehlern flach zu halten.
* **Dateipfad:** `server.ts`

### 2. Page-Views Traffic Simulator
* **Trigger-Typ:** Wiederkehrendes Intervall (`setInterval`)
* **Intervall:** 60.000 Millisekunden (1 Minute)
* **Start-Zeitpunkt:** Sobald Express horcht (`app.listen()`)
* **Ausführende Logik:** `globalPageViews += Math.floor(Math.random() * 3) + 1`
* **Zweck:** Bereitstellung von kontinuierlichen Interaktions-Kennzahlen für das Telemetrie-Schnittstellenmodul.
* **Dateipfad:** `server.ts`

---

## 🛠️ Thread-Sicherheit & Vermeidung von Event-Loop-Blockierungen

Da Node.js in einem Single-Threaded-Modell ausgeführt wird, können blockierende Scheduler das gesamte System lahmlegen. CAPITAL-AI stellt die Thread-Sicherheit durch folgende Implementierungskriterien sicher:

1. **Strikt asynchrone Kapselung (Promise-Chains)**:
   Die Funktion `fetchLiveMarketData` ist als `async function` deklariert. Der Scheduler führt sie aus, ohne auf das Ergebnis zu blockieren (Fire-and-Forget-Muster im Scheduler):
   ```typescript
   setInterval(async () => {
     try {
       await fetchLiveMarketData();
     } catch (err) {
       logger.error('Error in background market data interval', { err });
     }
   }, 60000);
   ```
2. **Umgang mit Netzwerk-Latenzen**:
   Jeder externe Fetch-Aufruf verwendet ein Signal-Timeout (`AbortController`), um hängende Sockets nach maximal 45 Sekunden hart zu trennen. Dies stellt sicher, dass das asynchrone Intervall nicht durch blockierte Verbindungen überläuft.
3. **Auswirkungsanalyse auf den Speicher (RAM)**:
   Die Daten werden direkt im Hauptspeicher-Cache (`assetRegistry`) überschrieben. Da die Anzahl der verwalteten Assets konstant ist, bleibt der RAM-Bedarf über die gesamte Betriebsdauer konstant (O(1) Speicherkomplexität).
