// GitGuardian-Honeytoken — Konfiguration und Erkennung.
//
// Der Wert eines Honeytokens haengt an zwei Eigenschaften, die hier ausgefuehrt geprueft werden:
// er loest bei jeder Verwendung aus (keine False Negatives), und er loest bei nichts anderem aus
// (keine False Positives). Dazu kommt die Nichtweitergabe des Secrets in Ereignisdaten.

import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import {
  describeHoneytokenMatch,
  honeytokenFingerprints,
  loadHoneytokenConfiguration,
} from '../../server/security/honeytoken';
import { detectHoneytokenInRequest } from '../../server/security/honeytokenTripwire';

const AKID = 'AKIAZZ7EXAMPLE9QWERT';
// Bewusst kein AWS-Beispiel-Secret: solche Literale triggern Secret-Scanner unnoetig.
// Erfuellt nur die Laengenanforderung und ist als Fixture erkennbar.
const SECRET = 'HONEYTOKEN-FIXTURE-NOT-A-REAL-SECRET-0001';

const VALID_ENV = {
  GITGUARDIAN_HONEYTOKEN_ID: 'ht-4711',
  GITGUARDIAN_HONEYTOKEN_AKID: AKID,
  GITGUARDIAN_HONEYTOKEN_SECRET: SECRET,
} as NodeJS.ProcessEnv;

const DEFINITION = { id: 'ht-4711', accessKeyId: AKID, secret: SECRET };

function request(init: { headers?: Record<string, unknown>; query?: Record<string, unknown> }): Request {
  return {
    headers: init.headers || {},
    query: init.query || {},
    method: 'GET',
    path: '/api/anything',
  } as unknown as Request;
}

describe('Honeytoken-Konfiguration', () => {
  it('akzeptiert eine vollstaendige, formal gueltige Definition', () => {
    const result = loadHoneytokenConfiguration(VALID_ENV);
    expect(result.configured).toBe(true);
    expect(result.definition).toEqual(DEFINITION);
    expect(result.reason).toBeNull();
  });

  it('bleibt ohne Konfiguration schlicht inaktiv', () => {
    const result = loadHoneytokenConfiguration({} as NodeJS.ProcessEnv);
    expect(result.configured).toBe(false);
    expect(result.reason).toBe('not-configured');
  });

  it('deaktiviert fail-closed statt mit halber Konfiguration weiterzulaufen', () => {
    // Ein Token ohne Secret wuerde nie ausloesen und eine Schutzwirkung nur vortaeuschen.
    const partial = loadHoneytokenConfiguration({
      GITGUARDIAN_HONEYTOKEN_ID: 'ht-4711',
      GITGUARDIAN_HONEYTOKEN_AKID: AKID,
    } as NodeJS.ProcessEnv);
    expect(partial.configured).toBe(false);
    expect(partial.reason).toMatch(/incomplete-configuration/);
  });

  it('weist formal falsches Material zurueck', () => {
    const badAkid = loadHoneytokenConfiguration({ ...VALID_ENV, GITGUARDIAN_HONEYTOKEN_AKID: 'nope' });
    expect(badAkid.configured).toBe(false);
    expect(badAkid.reason).toMatch(/invalid-access-key-id/);

    const shortSecret = loadHoneytokenConfiguration({ ...VALID_ENV, GITGUARDIAN_HONEYTOKEN_SECRET: 'zu-kurz' });
    expect(shortSecret.configured).toBe(false);
    expect(shortSecret.reason).toMatch(/invalid-secret/);
  });

  it('gibt in Fehlergruenden niemals Secret-Material preis', () => {
    for (const env of [
      { ...VALID_ENV, GITGUARDIAN_HONEYTOKEN_AKID: 'nope' },
      { ...VALID_ENV, GITGUARDIAN_HONEYTOKEN_SECRET: 'zu-kurz' },
    ]) {
      const reason = loadHoneytokenConfiguration(env).reason || '';
      expect(reason).not.toContain(SECRET);
    }
  });
});

describe('Honeytoken-Erkennung', () => {
  it('erkennt das Credential in allen ueblichen Auth-Headern', () => {
    for (const header of ['authorization', 'x-api-key', 'x-aws-access-key-id', 'apikey']) {
      const hit = detectHoneytokenInRequest(request({ headers: { [header]: AKID } }), DEFINITION);
      expect(hit, `Header ${header}`).not.toBeNull();
      expect(hit?.surface).toBe('header');
      expect(hit?.location).toBe(header);
      expect(hit?.component).toBe('access-key-id');
    }
  });

  it('erkennt das Credential auch als Teil eines groesseren Header-Werts', () => {
    // Realistisch: "AWS4-HMAC-SHA256 Credential=AKIA.../20260826/eu-west-1/s3/aws4_request"
    const hit = detectHoneytokenInRequest(
      request({ headers: { authorization: `AWS4-HMAC-SHA256 Credential=${AKID}/20260826/eu-west-1/s3/aws4_request` } }),
      DEFINITION,
    );
    expect(hit?.component).toBe('access-key-id');
  });

  it('erkennt das Secret und unterscheidet es von der Access Key ID', () => {
    const hit = detectHoneytokenInRequest(request({ headers: { 'x-auth-token': SECRET } }), DEFINITION);
    expect(hit?.component).toBe('secret');
  });

  it('erkennt das Credential im Query-String', () => {
    const hit = detectHoneytokenInRequest(request({ query: { access_key: AKID } }), DEFINITION);
    expect(hit?.surface).toBe('query');
    expect(hit?.location).toBe('access_key');
  });

  it('erkennt es auch in Array-Header und Array-Query', () => {
    expect(detectHoneytokenInRequest(request({ headers: { 'x-api-key': [AKID] } }), DEFINITION)).not.toBeNull();
    expect(detectHoneytokenInRequest(request({ query: { k: ['a', SECRET] } }), DEFINITION)).not.toBeNull();
  });

  it('loest bei legitimem Verkehr nicht aus — das ist die entscheidende Eigenschaft', () => {
    const benign = [
      request({}),
      request({ headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.legit.token' } }),
      request({ headers: { 'x-api-key': 'AKIAREALKEYBUTNOTOURS' } }),
      request({ query: { symbol: 'BTC', assetClass: 'crypto' } }),
      // Praefix-Kollision darf nicht genuegen.
      request({ headers: { 'x-api-key': AKID.slice(0, 12) } }),
    ];
    for (const req of benign) {
      expect(detectHoneytokenInRequest(req, DEFINITION)).toBeNull();
    }
  });

  it('durchsucht keine beliebigen Header — nur die deklarierten Auth-Traeger', () => {
    // Ein Referer oder Cookie mit zufaelliger Aehnlichkeit darf keinen Vorfall ausloesen.
    expect(detectHoneytokenInRequest(request({ headers: { referer: AKID } }), DEFINITION)).toBeNull();
  });

  it('fuehrt genau zwei Fingerprints und keine weiteren', () => {
    expect(honeytokenFingerprints(DEFINITION)).toEqual([AKID, SECRET]);
  });

  it('benennt Treffer, ohne das Material zu wiederholen', () => {
    expect(describeHoneytokenMatch(DEFINITION, AKID)).toBe('access-key-id');
    expect(describeHoneytokenMatch(DEFINITION, SECRET)).toBe('secret');
    expect(describeHoneytokenMatch(DEFINITION, 'irgendwas')).toBe('unknown');
  });
});
