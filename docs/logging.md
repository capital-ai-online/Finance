# CAPITAL-AI Logging-System & Architektur (Version 0.5.5)

Das CAPITAL-AI Ökosystem nutzt ein zentralisiertes, hochperformantes und DSGVO-konformes Logging-System auf Basis von **Winston**. Alle Logs werden strukturiert verarbeitet, sensible Daten werden automatisch maskiert, und jeder HTTP-Request wird über asynchronen Context-Storage (`AsyncLocalStorage`) lückenlos zurückverfolgt.

---

## 🛠️ 1. Architektur-Übersicht

```
[HTTP Request] ──> [requestIdMiddleware] ──> Speichert Request-ID im AsyncLocalStorage
                                                            │
                                                            ▼
[Winston Logger] <───────────────────────────────── Holt Request-ID automatisch
   │
   ├─► Development: Farbige, lesbare Konsolen-Ausgaben
   └─► Production/Staging: Strukturierte JSON-Logs für Log-Aggregatoren (Elastic, CloudWatch)
```

---

## ⚙️ 2. Konfiguration & Log-Levels

Das Log-Level wird über die Umgebungsvariable `LOG_LEVEL` gesteuert (Case-Insensitive). Folgende Levels stehen zur Verfügung:

1. **fatal**: Kritische Fehler, die einen Systemabbruch oder harten Neustart erfordern.
2. **error**: Fehler, die die normale Ausführung beeinträchtigen, aber keinen Absturz verursachen.
3. **warn**: Warnungen über unübliche Zustände oder Ausfälle von Drittanbieter-APIs mit Fallback.
4. **info**: Standard-Informationsmeldungen über den regulären Systembetrieb (z.B. erfolgreiche Analysen).
5. **debug**: Detaillierte Ablaufberichte für die Entwicklung.
6. **trace**: Tiefste Ablaufprotokollierung (z.B. rohe API-Payloads).

In `.env` einstellbar:
```env
LOG_LEVEL=info
NODE_ENV=production
```

---

## 🛡️ 3. Sicherheits- & Datenschutz-Konformität (DSGVO/BaFin)

Das Logging-System maskiert vollautomatisch sensible Daten aus allen Logmeldungen und Metadaten-Objekten. Folgende Schlüssel und Werte werden niemals unverschlüsselt in Logs geschrieben:

- API Keys & Tokens (Stripe, Supabase, Gemini, OpenAI, etc.)
- Passwörter & Passphrasen
- Cookies & Session-IDs
- Authorization-Header (`Bearer` Tokens)
- JWTs (JSON Web Tokens) werden mittels Regex-Erkennung auch in beliebigen Strings unschädlich gemacht (`[JWT_REDACTED]`).

---

## 📋 4. Strukturiertes JSON-Format (Production)

Jeder Logeintrag im Production-Modus ist ein einzeiliges JSON-Dokument mit standardisierten Feldern:

```json
{
  "timestamp": "2026-07-06T10:15:30.123Z",
  "level": "info",
  "requestId": "req-1719830531234-a2b3c4",
  "module": "stockService",
  "function": "calculateScore",
  "message": "Stock analysis completed",
  "duration": 123,
  "symbol": "AAPL"
}
```

---

## 💻 5. Verwendung im Code

Der Logger wird als Singleton-Instanz importiert. Sie müssen die Request-ID **nicht** manuell durch Ihre Funktionen reichen – Winston holt diese automatisch aus dem asynchronen Kontext!

### Einfacher Log:
```typescript
import { logger } from '../server/logger';

logger.info('Marktdaten-Cache erfolgreich aktualisiert');
```

### Log mit strukturierten Metadaten:
```typescript
import { logger } from '../server/logger';

logger.info('Aktienbewertung abgeschlossen', {
  module: 'stockService',
  function: 'evaluateStock',
  symbol: 'TSLA',
  duration: 42, // Millisekunden
  score: 85
});
```

### Fehler protokollieren (mit Stack-Trace):
```typescript
import { logger } from '../server/logger';

try {
  // Risiko-Logik
} catch (error: any) {
  logger.error('Fehler bei der Risikobewertung', {
    module: 'riskEngine',
    function: 'assessRisk',
    error: error.message,
    stack: error.stack
  });
}
```
