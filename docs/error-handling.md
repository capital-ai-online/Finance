# CAPITAL-AI Centralized Error Handling Architecture (Version 0.5.5)

CAPITAL-AI implementiert eine robuste, hierarchische Fehlerbehandlung für alle Backend-Komponenten. Fehler werden an einer zentralen Stelle (Express Global Error Middleware) abgefangen, einheitlich strukturiert und sicher für den Client aufbereitet (Kein Leak von Stacktraces oder internen Pfaden in Production).

---

## 🏛️ 1. Fehlerklassen-Hierarchie

Alle benutzerdefinierten Fehler erben von `AppError`, welcher wiederum von der nativen JavaScript-Klasse `Error` erbt. Dadurch wird die fehlerfreie Erstellung von Stacktraces und die Typisierung sichergestellt.

```
          [Error] (Native class)
             │
             ▼
         [AppError] (Base Class with statusCode, errorCode, timestamp, details)
             │
   ┌─────────┼──────────┬──────────┬──────────┬────────────┬─────────────┐
   ▼         ▼          ▼          ▼          ▼            ▼             ▼
[Valid.] [Authent.] [Author.]  [Database] [External] [RateLimit] [InternalServer]
```

### Die Subklassen im Detail:

| Fehlerklasse | HTTP Status | Interner Fehlercode | Verwendung |
| :--- | :---: | :--- | :--- |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Ungültiger Request-Body, falsche Parameter, fehlerhaftes JSON. |
| `AuthenticationError` | 401 | `AUTHENTICATION_REQUIRED` | Fehlender oder abgelaufener Authentifizierungs-Token / Login-Status. |
| `AuthorizationError` | 403 | `ACCESS_DENIED` | Fehlende Berechtigungen für eine Admin-Funktion oder Premium-Feature. |
| `DatabaseError` | 500 | `DATABASE_ERROR` | Fehler bei SQL-Abfragen, Supabase-Verbindungsabbrüche, etc. |
| `ExternalApiError` | 502 | `EXTERNAL_API_ERROR` | Fehlerhafte Antworten oder Timeouts von Drittanbieter-APIs (Gemini, Stripe). |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` | Request-Orchestrator oder IP-Limiter hat die Anfrage blockiert. |
| `ConfigurationError` | 500 | `CONFIGURATION_ERROR` | Fehlende kritische Umgebungsvariablen beim Starten von Subsystemen. |
| `NotFoundError` | 404 | `RESOURCE_NOT_FOUND` | Ressource oder Endpoint existiert nicht. |
| `InternalServerError` | 500 | `INTERNAL_SERVER_ERROR` | Unbehandelte, unerwartete Fehler auf App-Ebene. |

---

## 🛡️ 2. Globaler Error-Handler & Standard-JSON-Response

Wenn ein Fehler im Code geworfen oder mittels `next(error)` an Express übergeben wird, fängt die globale Middleware diesen ab und generiert eine einheitliche, standardisierte JSON-Antwort.

### JSON-Response-Schema:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Das übergebene Symbol 'INVALID' wird im System nicht unterstützt.",
    "timestamp": "2026-07-06T10:20:45.678Z",
    "requestId": "req-1719830531234-a2b3c4"
  }
}
```

### Zusätzliche Informationen im Development-Modus (`NODE_ENV !== "production"`):
In der lokalen Entwicklungsumgebung werden zusätzliche Diagnoseinformationen wie `details` (strukturierte Fehlermeldungen) und `stack` (Stack-Trace zur Codezeile) mitgesendet:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Das übergebene Symbol 'INVALID' wird im System nicht unterstützt.",
    "timestamp": "2026-07-06T10:20:45.678Z",
    "requestId": "req-1719830531234-a2b3c4",
    "details": {
      "field": "symbol",
      "allowedSymbols": ["BTC", "ETH", "AAPL", "GOLD"]
    },
    "stack": "ValidationError: Das übergebene Symbol... \n   at evaluateAsset (/src/services/scoring.ts:42:11)..."
  }
}
```

---

## 💻 3. Verwendung im Code

Werfen Sie Fehler einfach direkt – Express und der globale Handler erledigen den Rest:

### In Routen oder Controllern:
```typescript
import { ValidationError, NotFoundError } from '../server/errors';

app.get('/api/assets/:symbol', (req, res, next) => {
  const symbol = req.params.symbol;
  
  if (!symbol) {
    throw new ValidationError('Symbol ist ein Pflichtfeld.');
  }

  const asset = assetRegistry.getAsset(symbol);
  if (!asset) {
    throw new NotFoundError(`Asset mit dem Symbol ${symbol} wurde nicht gefunden.`);
  }

  res.json({ success: true, data: asset });
});
```

### In asynchronen Funktionen (Try-Catch Pattern):
```typescript
import { ExternalApiError } from '../server/errors';

async function fetchExternalPrice() {
  try {
    const response = await fetch('https://api.external.com/price');
    return await response.json();
  } catch (error: any) {
    throw new ExternalApiError(
      'Der externe Preisdienst konnte nicht erreicht werden.',
      { url: 'https://api.external.com/price' },
      error // Speichert den originalen Verursacher-Fehler
    );
  }
}
```
