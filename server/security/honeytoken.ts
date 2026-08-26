// GitGuardian-Honeytoken — kanonische Registry der ausgelegten Decoy-Credentials.
//
// Ein Honeytoken ist ein funktionsloses Credential, das an einer plausiblen Stelle ausgelegt wird.
// Es wird von keinem legitimen Pfad verwendet. Deshalb gilt: **jede** Verwendung ist ein Vorfall.
// Diese Null-False-Positive-Eigenschaft ist der gesamte Wert des Mechanismus — sie darf nicht
// dadurch verwaessert werden, dass unspezifisches Rauschen (Scanner-Pfade, fehlgeschlagene Logins)
// in denselben Kanal geschrieben wird.
//
// Arbeitsteilung:
//   - GitGuardian erkennt die Verwendung des Tokens *ausserhalb* unserer Infrastruktur (der
//     Decoy-AWS-Key wird gegen AWS benutzt) und meldet Leak-Kontext.
//   - Dieses Modul plus honeytokenTripwire.ts erkennen die Verwendung *gegen unsere eigene API*.
//     Diesen Teil sieht GitGuardian nicht.
//
// Governance: `docs/runbooks/GITGUARDIAN_SNYK_APP_INTEGRATION.md` untersagt, der GitGuardian-App
// Honeytoken-Schreibrechte zu erteilen. Diese Implementierung haelt das ein: das Token wird
// ausserhalb der Anwendung erzeugt (GitGuardian-Dashboard/-API durch den Owner) und der Laufzeit
// ausschliesslich lesend ueber Environment-Variablen bekannt gemacht. Die Anwendung erzeugt,
// rotiert oder loescht keine Honeytokens.

const HONEYTOKEN_ID_ENV = 'GITGUARDIAN_HONEYTOKEN_ID';
const HONEYTOKEN_AKID_ENV = 'GITGUARDIAN_HONEYTOKEN_AKID';
const HONEYTOKEN_SECRET_ENV = 'GITGUARDIAN_HONEYTOKEN_SECRET';

// AWS Access Key IDs sind 20 Zeichen, Secret Access Keys 40. GitGuardian-Honeytokens verwenden
// dieselbe Form, damit sie in echten Konfigurationskontexten nicht auffallen.
const AKID_PATTERN = /^(AKIA|ASIA)[0-9A-Z]{16}$/;
const SECRET_MIN_LENGTH = 32;

export interface HoneytokenDefinition {
  /** GitGuardian-Honeytoken-ID. Nicht geheim; dient der Zuordnung im GitGuardian-Dashboard. */
  id: string;
  /** Die Access Key ID des Decoys. Erkennungsmerkmal, selbst nicht geheim. */
  accessKeyId: string;
  /** Das Decoy-Secret. Wird niemals geloggt, ausgegeben oder in Ereignisse geschrieben. */
  secret: string;
}

export interface HoneytokenConfigurationResult {
  configured: boolean;
  definition: HoneytokenDefinition | null;
  /** Grund, warum keine aktive Definition vorliegt. Nie mit Secret-Material befuellt. */
  reason: string | null;
}

function readEnv(env: NodeJS.ProcessEnv, name: string): string {
  return String(env[name] || '').trim();
}

/**
 * Laedt die Honeytoken-Definition fail-closed.
 *
 * Fehlende Konfiguration ist kein Fehler — der Mechanismus ist dann schlicht inaktiv. Eine
 * *unvollstaendige* oder formal falsche Konfiguration ist dagegen ein Fehler und deaktiviert den
 * Mechanismus ebenfalls, statt mit einem halb gueltigen Token weiterzulaufen, das nie ausloest.
 */
export function loadHoneytokenConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): HoneytokenConfigurationResult {
  const id = readEnv(env, HONEYTOKEN_ID_ENV);
  const accessKeyId = readEnv(env, HONEYTOKEN_AKID_ENV);
  const secret = readEnv(env, HONEYTOKEN_SECRET_ENV);

  const provided = [id, accessKeyId, secret].filter((value) => value.length > 0).length;
  if (provided === 0) {
    return { configured: false, definition: null, reason: 'not-configured' };
  }
  if (provided < 3) {
    return {
      configured: false,
      definition: null,
      reason: `incomplete-configuration: ${HONEYTOKEN_ID_ENV}, ${HONEYTOKEN_AKID_ENV} und ${HONEYTOKEN_SECRET_ENV} muessen gemeinsam gesetzt sein`,
    };
  }
  if (!AKID_PATTERN.test(accessKeyId)) {
    return {
      configured: false,
      definition: null,
      reason: `invalid-access-key-id: ${HONEYTOKEN_AKID_ENV} entspricht nicht der AWS-Access-Key-ID-Form`,
    };
  }
  if (secret.length < SECRET_MIN_LENGTH) {
    return {
      configured: false,
      definition: null,
      reason: `invalid-secret: ${HONEYTOKEN_SECRET_ENV} ist zu kurz fuer ein AWS-Secret-Access-Key`,
    };
  }

  return { configured: true, definition: { id, accessKeyId, secret }, reason: null };
}

/**
 * Die Zeichenketten, deren Auftauchen in einem Request einen Treffer bedeutet.
 *
 * Bewusst getrennt von der Definition, damit Aufrufer die Erkennung durchfuehren koennen, ohne die
 * Definition — und damit das Secret — weiterreichen zu muessen.
 */
export function honeytokenFingerprints(definition: HoneytokenDefinition): readonly string[] {
  return Object.freeze([definition.accessKeyId, definition.secret]);
}

/**
 * Bezeichnet einen Treffer, ohne das getroffene Material preiszugeben.
 *
 * Ein Sicherheitsereignis darf das Secret nicht enthalten: security_events ist fuer Operatoren
 * lesbar und wird exportiert. Die Honeytoken-ID genuegt zur Zuordnung.
 */
export function describeHoneytokenMatch(
  definition: HoneytokenDefinition,
  matched: string,
): 'access-key-id' | 'secret' | 'unknown' {
  if (matched === definition.accessKeyId) return 'access-key-id';
  if (matched === definition.secret) return 'secret';
  return 'unknown';
}
