# CAPITAL-AI Frontend-Sicherheitsrichtlinie (Version 0.5.5)

Diese Sicherheitsrichtlinie regelt die strikte Trennung von Frontend-Präsentation und Backend-Ausführung im CAPITAL-AI Ökosystem zur Gewährleistung maximaler Datenintegrität und zur Absicherung sensibler Schlüssel.

---

## 🛡️ 1. Ausschluss administrativer Frontend-Komponenten

- **Strikte Einschränkung**: Alle Komponenten, die administrative Rechte oder direkte Eingriffe in Systemparameter erfordern (z. B. `AdminPanel`, `AuthStateDebugger`), wurden vollständig aus dem Frontend-Code und den UI-Ansichten entfernt.
- **Zentralisierte Verwaltung**: Systemübergreifende Administrationsvorgänge dürfen ausschließlich serverseitig über sichere SSH-/Terminal-Schnittstellen oder passwortgeschützte Backend-APIs initiiert werden.
- **Kein Client-Bypass**: Es ist verboten, Client-seitige Abkürzungen oder Bypass-Parameter zur Umgehung von Authentifizierungsschranken in das UI einzubauen.

---

## 🔑 2. Ausschluss sensibler Schlüssel aus dem Frontend

- **Keine API-Schlüssel im Client-Code**: Keine privaten Tokens, API-Schlüssel (z. B. Stripe-Secret-Keys, Gemini-API-Keys, Datenbank-Zugangsdaten) oder sensible kryptografische Schlüssel dürfen im Browser geladen oder ausgeführt werden.
- **Sichere Proxy-Architektur**: Alle externen API-Dienste müssen über serverseitige API-Endpunkte (`/api/*`) geschleust werden. Das Frontend kommuniziert ausschließlich mit diesen gesicherten, sitzungsüberprüften Backend-Schnittstellen.
- **Umgebungsvariablen**: Sensible Variablen dürfen im Client-Code nicht als Umgebungsvariablen geladen werden. Die ausschließliche Verwaltung erfolgt serverseitig in der verschlüsselten Laufzeitumgebung.

---

## 📈 3. Einhaltung von DSGVO- und BaFin-Vorgaben

- Alle Protokolle, Berichte und Berechnungsmetriken entsprechen den strengen Vorgaben der BaFin und DSGVO.
- PII-Daten (Personally Identifiable Information) werden im Frontend generell maskiert oder anonymisiert dargestellt.
