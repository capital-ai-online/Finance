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

const desired = {
  schemaVersion: 1,
  zone: 'capital-ai.online',
  deleteUnmanagedRecords: false,
  records: [
    { name: 'mta-sts', type: 'CNAME', content: 'finance-7clq.onrender.com', ttl: 3600, singleton: true, state: 'present' },
    { name: '_smtp._tls', type: 'TXT', content: 'v=TLSRPTv1; rua=mailto:support@capital-ai.online', ttl: 3600, state: 'present' },
    { name: '@', type: 'CAA', content: '0 issue "letsencrypt.org"', ttl: 3600, state: 'present' },
  ],
};

test('normalizes relative names into the managed zone', () => {
  assert.equal(normalizeName('mta-sts'), 'mta-sts.capital-ai.online');
  assert.equal(normalizeName('@'), 'capital-ai.online');
});

test('buildPlan updates singleton, preserves exact TXT and adds missing CAA', () => {
  const plan = buildPlan(zone, desired);
  assert.equal(plan.mutations.length, 2);
  assert.equal(plan.mutations[0].method, 'PUT');
  assert.equal(plan.mutations[0].recordId, 'r1');
  assert.equal(plan.mutations[1].method, 'POST');
  assert.match(plan.planSha256, /^sha256:[a-f0-9]{64}$/);
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
