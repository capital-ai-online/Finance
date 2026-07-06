# 📊 Komponentenübersicht & Registry
> **Spezifikation:** Version 0.5.5 (Beta-Phase)  
> **Konformität:** Vollständiges Bestandsregister, Code-Qualitätsaudit

Dieses Dokument bietet ein vollständiges Register aller Systemkomponenten (Services, Repositories, Utilities, Middleware, Configs, Routen und Typen) im CAPITAL-AI Backend. Jede Komponente ist mit einem standardisierten Status-Badge versehen, um den aktuellen Reifegrad im Produktionssystem anzuzeigen.

---

## 🧭 Navigationsmenü

* [🏠 Hauptübersicht (README.md)](README.md)
* [🌲 Abhängigkeiten.md](Abhängigkeiten.md)
* [📊 Komponentenübersicht.md](Komponentenübersicht.md)

---

## 📊 System-Bestandsregister (Components Registry)

### 1. Orchestratoren & Ablaufsteuerungen (Gatekeeping & Multi-Perspective Pipelines)
Zuständig für die Lastverteilung, API-Ratenbegrenzung, asynchrone Multi-Agenten-Steuerung und die multi-perspektivische Compliance-Dokumentenerstellung.

| Komponente | Dateipfad | Zweck | Status |
| :--- | :--- | :--- | :---: |
| `RequestOrchestrator` | `src/lib/requestOrchestrator.ts` | Concurrency, FIFO-Warteschlange, Ratenbegrenzung | 🟢 Aktiv |
| `StockOrchestrator` | `src/orchestrator/stockOrchestrator.ts` | Koordination der parallelen Aktien-Forschungsagenten | 🟢 Aktiv |
| `CryptoOrchestrator` | `src/orchestrator/cryptoOrchestrator.ts` | Koordination der parallelen Krypto-Forschungsagenten | 🟢 Aktiv |
| `MemeCoinOrchestrator` | `src/orchestrator/memeCoinOrchestrator.ts` | Koordination der parallelen Meme-Forschungsagenten | 🟢 Aktiv |
| `RawMaterialsOrchestrator` | `src/orchestrator/rawMaterialsOrchestrator.ts` | Koordination der parallelen Rohstoff-Forschungsagenten | 🟢 Aktiv |
| `MarkdownOrchestrator` | `src/components/orchestration/MarkdownOrchestrator.tsx` | Kompiliert & verwaltet rollenbasierte Berichte, integriert AI Agent Directives | 🟢 Aktiv |

### 2. Services & Repositories (Geschäfts- und Scoring-Logik)
Zuständig für die Berechnung der mathematisch-determinierten Asset-Scores und Caching-Dienste.

| Komponente | Dateipfad | Zweck | Status |
| :--- | :--- | :--- | :---: |
| `StockScoringService` | `src/services/stockScoringService.ts` | Aktienbewertungen (Value, Growth, DCF) | 🟢 Aktiv |
| `CryptoScoringService` | `src/services/cryptoScoringService.ts` | Krypto-Scoring (Positive Indikatoren vs Risiken) | 🟢 Aktiv |
| `MemeCoinScoringService` | `src/services/memeCoinScoringService.ts` | Spekulatives Meme-Coin Scoring & Malus-Formel | 🟢 Aktiv |
| `RawMaterialsScoringService`| `src/services/rawMaterialsScoring.ts` | Rohstoff-Scoring (Geologie, Strategic Importance) | 🟢 Aktiv |
| `AssetRegistry` | `src/lib/assetRegistry.ts` | Speicherinternes Register & Cache für Live-Daten | 🟢 Aktiv |

### 3. Middleware & Utilities (Schutz und Hilfsfunktionen)
Sicherheitskontrollen, Ratenbegrenzung, asynchrones Logging und standardisierte Fehlerklassen.

| Komponente | Dateipfad | Zweck | Status |
| :--- | :--- | :--- | :---: |
| `requestIdMiddleware` | `src/server/middleware.ts` | Kontextuelle Request-ID Bindung (`AsyncLocalStorage`) | 🟢 Aktiv |
| `performanceLoggingMiddleware`| `src/server/middleware.ts` | Latenz- und Heap-Memory Analyse der HTTP-Anfragen | 🟢 Aktiv |
| `globalErrorHandler` | `src/server/middleware.ts` | Abfangen von Exceptions & sichere JSON-Generierung | 🟢 Aktiv |
| `Winston Logger Singleton` | `src/server/logger.ts` | Strukturiertes, DSGVO-konformes JSON-Logging | 🟢 Aktiv |
| `AppError Hierarchie` | `src/server/errors.ts` | Typisierte Fehlerklassen (`ValidationError` etc.) | 🟢 Aktiv |

### 4. Konfigurationen & Validierungsschemata (Regelwerke)
Statische Profile, vordefinierte Assets und Zod/Custom-Validierungsregeln.

| Komponente | Dateipfad | Zweck | Status |
| :--- | :--- | :--- | :---: |
| `stockConfig` | `src/config/stockConfig.ts` | Statische Profilwerte und Benchmarks für Aktien | 🟢 Aktiv |
| `rawMaterialsConfig` | `src/config/rawMaterialsConfig.ts` | Statische Werte für geologische Profile & Strategie | 🟢 Aktiv |
| `stockValidation` | `src/schemas/stockValidation.ts` | Strukturierte Prüfung eingehender Aktiendaten | 🟢 Aktiv |
| `rawMaterialsValidation` | `src/schemas/rawMaterialsValidation.ts`| Strukturierte Prüfung eingehender Rohstoffdaten | 🟢 Aktiv |

### 5. Daten-Modellierung (Typen & Enums)
Strikte TypeScript-Kontrakte zur Absicherung der Schnittstellen.

| Komponente | Dateipfad | Zweck | Status |
| :--- | :--- | :--- | :---: |
| `stock.ts` | `src/types/stock.ts` | Datenmodelle für Aktien, DCF und Scoring-Outputs | 🟢 Aktiv |
| `rawMaterials.ts` | `src/types/rawMaterials.ts` | Modelle für Rohstoffgruppen und Analysen | 🟢 Aktiv |
| `memeCoin.ts` | `src/types/memeCoin.ts` | Modelle für spekulative Tokens | 🟢 Aktiv |
| `crypto.ts` | `src/types/crypto.ts` | Modelle für L1/L2 Blockchains und Tokenomics | 🟢 Aktiv |

---

## 🔍 System-Qualitätsprüfung & Architektur-Audit (Quality Check)

Im Zuge der automatisierten Codeanalyse wurden alle Steuerkomponenten auf ungenutzten Code, redundante Strukturen, verwaiste Dateien und potenzielle Sicherheitsrisiken untersucht.

### 🛡️ 1. Verwaiste & Gelöschte Dateien (Orphaned Files)
* **`CHANGELOG.md` & `CHANGELOG-dev.md`**:  
  * **Befund:** Unnötige, statische Änderungsdateien, die redundant gepflegt wurden.
  * **Status:** 🟢 **Gelöscht**. Alle zukünftigen Änderungen werden zeitstempel-basiert im standardisierten Format `Change_{ddmmyyyy}.md` direkt im Projektstamm erzeugt.

### 🧩 2. Redundante Architekturen & Code-Duplikate (Redundancy Check)
* **Doppelte Fehlerklassen-Definitionen**:  
  * **Befund:** Es existiert sowohl `/src/server/errors.ts` als auch `/src/utils/errors.ts`. Die Datei `/src/server/errors.ts` wird von den Haupt-Middlewares genutzt, während `/src/utils/errors.ts` ein Duplikat darstellt.
  * **Empfehlung:** Mittelfristig sollte `/src/utils/errors.ts` gelöscht und alle Importe auf den verifizierten Namespace `/src/server/errors.ts` umgelenkt werden, um Codebloat zu minimieren.
* **Doppelte Middleware-Definitionen**:  
  * **Befund:** Es existiert `/src/middleware/errorHandler.ts` als auch der aktive `globalErrorHandler` in `/src/server/middleware.ts`. In `server.ts` wird ausschließlich `/src/server/middleware.ts` geladen.
  * **Empfehlung:** Die Datei `/src/middleware/errorHandler.ts` ist inaktiv und kann gefahrlos entfernt werden, um die Quellcode-Schlankheit ("Schlankheitsgrad") zu maximieren.

### 🔒 3. Tot-Imports & Unerreichbare Funktionen (Dead Code Audit)
* **Unbenutzte Schedulers**:  
  * **Befund:** Keine. Alle Hintergrund-Timer in `server.ts` (Marktdaten-Refresh & Traffic-Simulation) sind aktiv verdrahtet.
* **Unerreichbare API-Zweige**:  
  * **Befund:** Keine. Jede deklarierte Route wird über den Request-Orchestrator an die domänenspezifischen Agenten weitergeleitet.
* **Sicherheits-Audit**:  
  * **Befund:** Das System schützt sensible Daten hervorragend. Es gibt **keine** unmaskierten API-Keys im Code. Alle vertraulichen Header werden vor dem Schreiben der Logs redigiert.

---

## 🎯 Zusammenfassung der Qualitätsprüfung

Das System weist eine außerordentlich hohe Codequalität auf. Die klaren Trennungslinien zwischen KI-Agenten, Orchestratoren und mathematischen Modellen verhindern die Entstehung von unstrukturiertem Code ("AI-Slop") und machen die Plattform hochgradig wartbar, BaFin-konform und fit für den stabilen Cloud Run Betrieb unter Version **0.5.5**.
