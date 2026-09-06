import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlan,
  normalizeName,
  validateDesiredConfig,
  zoneFingerprint,
} from './ionosDnsAdmin.mjs';

const zone = {
  id: 'zone-1',
  name: 'capital-ai.online',
  records: [
    { id: 'r1', name: 'mta-sts.capital-ai.online', type: 'CNAME', content: 'old.example.net', ttl: 3600, prio: 0, disabled: false },
    { id: 'r2', name: '_smtp._tls.capital-ai.online', type: 'TXT', content: '"v=TLSRPTv1; rua=mailto:support@capital-ai.online"', ttl: 3600, prio: 0, disabled: false },
  ],
};

const caaRecords = [
  { name: '@', type: 'CAA', content: '0 issue "letsencrypt.org"', ttl: 3600, state: 'present' },
  { name: '@', type: 'CAA', content: '0 issue "pki.goog"', ttl: 3600, state: 'present' },
  { name: '@', type: 'CAA', content: '0 issue "sectigo.com"', ttl: 3600, state: 'present' },
  { name: '@', type: 'CAA', content: '0 issuewild "sectigo.com"', ttl: 3600, state: 'present' },
];

const desired = {
  schemaVersion: 1,
  zone: 'capital-ai.online',
  deleteUnmanagedRecords: false,
  records: [
    { name: 'mta-sts', type: 'CNAME', content: 'finance-7clq.onrender.com', ttl: 3600, singleton: true, state: 'present' },
    { name: '_smtp._tls', type: 'TXT', content: 'v=TLSRPTv1; rua=mailto:support@capital-ai.online', ttl: 3600, singleton: true, state: 'present' },
    ...caaRecords,
  ],
};

test('normalizes relative names into the managed zone', () => {
  assert.equal(normalizeName('mta-sts'), 'mta-sts.capital-ai.online');
  assert.equal(normalizeName('@'), 'capital-ai.online');
});

test('buildPlan updates singleton, preserves exact TXT and adds all missing CAA values', () => {
  const plan = buildPlan(zone, desired);
  assert.equal(plan.mutations.length, 5);
  assert.equal(plan.mutations[0].method, 'PUT');
  assert.equal(plan.mutations[0].recordId, 'r1');
  const caaMutations = plan.mutations.filter((mutation) => mutation.type === 'CAA');
  assert.equal(caaMutations.length, 4);
  assert.deepEqual(
    caaMutations.map((mutation) => mutation.content).sort(),
    caaRecords.map((record) => record.content).sort(),
  );
  assert.match(plan.planSha256, /^sha256:[a-f0-9]{64}$/);
});

test('managed Render www CNAME is created as a singleton without touching unmanaged records', () => {
  const live = {
    id: 'zone-www',
    name: 'capital-ai.online',
    records: [
      { id: 'unmanaged', name: 'capital-ai.online', type: 'TXT', content: 'unmanaged-proof', ttl: 3600, prio: 0, disabled: false },
    ],
  };
  const wwwDesired = {
    schemaVersion: 1,
    zone: 'capital-ai.online',
    deleteUnmanagedRecords: false,
    records: [
      {
        name: 'www',
        type: 'CNAME',
        content: 'finance-7clq.onrender.com',
        ttl: 3600,
        prio: 0,
        disabled: false,
        singleton: true,
        state: 'present',
      },
    ],
  };

  const plan = buildPlan(live, wwwDesired);
  assert.equal(plan.mutations.length, 1);
  assert.deepEqual(plan.mutations[0], {
    method: 'POST',
    name: 'www.capital-ai.online',
    type: 'CNAME',
    content: 'finance-7clq.onrender.com',
    body: [{
      name: 'www.capital-ai.online',
      type: 'CNAME',
      content: 'finance-7clq.onrender.com',
      ttl: 3600,
      prio: 0,
      disabled: false,
    }],
  });
  assert.deepEqual(plan.warnings, []);
});

test('mail policy TXT singletons replace wrong report destinations instead of adding duplicates', () => {
  const live = {
    id: 'zone-mail',
    name: 'capital-ai.online',
    records: [
      {
        id: 'dmarc-live',
        name: '_dmarc.capital-ai.online',
        type: 'TXT',
        content: '"v=DMARC1; p=none; rua=mailto:support@capital-ai.online"',
        ttl: 3600,
        prio: 0,
        disabled: false,
      },
      {
        id: 'tlsrpt-live',
        name: '_smtp._tls.capital-ai.online',
        type: 'TXT',
        content: '"v=TLSRPTv1; rua=mailto:sven.kulessa@capital-ai.online"',
        ttl: 3600,
        prio: 0,
        disabled: false,
      },
    ],
  };
  const mailDesired = {
    schemaVersion: 1,
    zone: 'capital-ai.online',
    deleteUnmanagedRecords: false,
    records: [
      {
        name: '_dmarc',
        type: 'TXT',
        content: 'v=DMARC1; p=none; rua=mailto:Sven.kulessa@capital-ai.online',
        ttl: 3600,
        singleton: true,
        state: 'present',
      },
      {
        name: '_smtp._tls',
        type: 'TXT',
        content: 'v=TLSRPTv1; rua=mailto:support@capital-ai.online',
        ttl: 3600,
        singleton: true,
        state: 'present',
      },
    ],
  };

  const plan = buildPlan(live, mailDesired);
  assert.equal(plan.mutations.length, 2);
  assert.deepEqual(plan.mutations.map((mutation) => mutation.method), ['PUT', 'PUT']);
  assert.deepEqual(plan.mutations.map((mutation) => mutation.recordId), ['dmarc-live', 'tlsrpt-live']);
  assert.equal(plan.mutations.some((mutation) => mutation.method === 'POST'), false);
  assert.deepEqual(plan.warnings, []);
});

test('mail policy TXT records must be declared singleton fail-closed', () => {
  for (const name of ['_dmarc', '_smtp._tls']) {
    assert.throws(() => validateDesiredConfig({
      schemaVersion: 1,
      zone: 'capital-ai.online',
      deleteUnmanagedRecords: false,
      records: [{ name, type: 'TXT', content: 'policy-value', state: 'present' }],
    }), /singleton/i);
  }
});

test('CAA policy permits Render single-host issuance and IONOS Sectigo wildcard renewal', () => {
  assert.deepEqual(caaRecords.map((record) => record.content), [
    '0 issue "letsencrypt.org"',
    '0 issue "pki.goog"',
    '0 issue "sectigo.com"',
    '0 issuewild "sectigo.com"',
  ]);
  assert.equal(caaRecords.some((record) => /issuewild "letsencrypt\.org"/.test(record.content)), false);
  assert.equal(caaRecords.some((record) => /issuewild "pki\.goog"/.test(record.content)), false);
});

test('protected record types are rejected fail-closed', () => {
  assert.throws(() => validateDesiredConfig({
    schemaVersion: 1,
    zone: 'capital-ai.online',
    deleteUnmanagedRecords: false,
    records: [{ name: '@', type: 'NS', content: 'ns.example.net', state: 'present' }],
  }), /nicht für Write freigegeben|geschützt/);
});

test('unmanaged deletion must remain disabled', () => {
  assert.throws(() => validateDesiredConfig({
    schemaVersion: 1,
    zone: 'capital-ai.online',
    deleteUnmanagedRecords: true,
    records: [],
  }), /deleteUnmanagedRecords/);
});

test('zone fingerprint changes on unrelated DNS drift', () => {
  const before = zoneFingerprint(zone);
  const after = zoneFingerprint({ ...zone, records: [...zone.records, { id: 'r3', name: 'x.capital-ai.online', type: 'TXT', content: 'drift', ttl: 3600 }] });
  assert.notEqual(before, after);
});
