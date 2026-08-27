#!/usr/bin/env node

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const API_BASE = 'https://api.hosting.ionos.com/dns/v1';
export const DEFAULT_ZONE = 'capital-ai.online';
export const DEFAULT_DESIRED_FILE = 'config/dns/ionos-capital-ai.desired.json';
export const OWNER = 'SvenKulessa';
export const ALLOWED_WRITE_TYPES = new Set(['CAA', 'CNAME', 'TXT']);
export const PROHIBITED_WRITE_TYPES = new Set(['A', 'AAAA', 'MX', 'NS', 'SOA', 'DS', 'DNSKEY']);
export const REQUIRED_SINGLETON_TXT_NAMES = new Set(['_dmarc', '_smtp._tls']);

function fail(message) {
  throw new Error(`[IONOS-DNS][SECURITY] ${message}`);
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function normalizeName(name, zone = DEFAULT_ZONE) {
  const raw = String(name || '').trim().replace(/\.$/, '').toLowerCase();
  if (!raw || raw === '@') return zone.toLowerCase();
  if (raw === zone.toLowerCase() || raw.endsWith(`.${zone.toLowerCase()}`)) return raw;
  return `${raw}.${zone.toLowerCase()}`;
}

export function normalizeRecord(record, zone = DEFAULT_ZONE) {
  const type = String(record?.type || '').trim().toUpperCase();
  const name = normalizeName(record?.name, zone);
  const content = String(record?.content ?? '').trim();
  const ttl = Number.isInteger(Number(record?.ttl)) ? Number(record.ttl) : 3600;
  const prio = Number.isInteger(Number(record?.prio)) ? Number(record.prio) : 0;
  const disabled = Boolean(record?.disabled);
  return { name, type, content, ttl, prio, disabled };
}

function recordSortKey(record) {
  return [record.name, record.type, record.content, record.prio, record.ttl, record.disabled ? 1 : 0].join('|');
}

export function zoneFingerprint(zone) {
  const records = Array.isArray(zone?.records) ? zone.records.map((record) => ({
    id: String(record.id || ''),
    ...normalizeRecord(record, zone.name),
  })).sort((a, b) => recordSortKey(a).localeCompare(recordSortKey(b)) || a.id.localeCompare(b.id)) : [];
  return `sha256:${sha256(canonicalJson({ name: String(zone?.name || '').toLowerCase(), records }))}`;
}

function isRequiredSingleton(record, expectedZone) {
  if (record.type !== 'TXT') return false;
  return [...REQUIRED_SINGLETON_TXT_NAMES].some((name) => record.name === normalizeName(name, expectedZone));
}

export function validateDesiredConfig(config, expectedZone = DEFAULT_ZONE) {
  if (!config || typeof config !== 'object') fail('Desired-State-Konfiguration fehlt.');
  if (config.schemaVersion !== 1) fail('Unsupported desired-state schemaVersion.');
  if (String(config.zone || '').toLowerCase() !== expectedZone.toLowerCase()) fail('Desired-State-Zone stimmt nicht mit Zielzone überein.');
  if (config.deleteUnmanagedRecords !== false) fail('deleteUnmanagedRecords muss explizit false bleiben.');
  if (!Array.isArray(config.records)) fail('Desired-State records muss ein Array sein.');

  const seenSingleton = new Set();
  for (const entry of config.records) {
    const record = normalizeRecord(entry, expectedZone);
    const state = String(entry.state || 'present').toLowerCase();
    if (!ALLOWED_WRITE_TYPES.has(record.type)) fail(`Record-Typ ${record.type} ist nicht für Write freigegeben.`);
    if (PROHIBITED_WRITE_TYPES.has(record.type)) fail(`Record-Typ ${record.type} ist geschützt.`);
    if (!(record.name === expectedZone || record.name.endsWith(`.${expectedZone}`))) fail(`Record ${record.name} liegt außerhalb der Zone.`);
    if (!record.content) fail(`Record ${record.name}/${record.type} besitzt keinen Inhalt.`);
    if (!['present', 'absent'].includes(state)) fail(`Ungültiger state für ${record.name}/${record.type}.`);
    if (isRequiredSingleton(record, expectedZone) && entry.singleton !== true) {
      fail(`Mail-Policy-Record ${record.name}/${record.type} muss singleton=true sein.`);
    }
    if (entry.singleton === true) {
      const key = `${record.name}|${record.type}`;
      if (seenSingleton.has(key)) fail(`Singleton ${key} ist mehrfach im Desired State definiert.`);
      seenSingleton.add(key);
    }
  }
  return true;
}

function comparableContent(type, value) {
  let content = String(value ?? '').trim();
  if (type === 'TXT') {
    content = content.replace(/^"|"$/g, '').replace(/"\s+"/g, '');
  } else if (type === 'CNAME') {
    content = content.replace(/\.$/, '').toLowerCase();
  } else if (type === 'CAA') {
    content = content.replace(/\s+/g, ' ');
  }
  return content;
}

function sameContent(a, b) {
  return comparableContent(a.type, a.content) === comparableContent(b.type, b.content);
}

function toApiBody(record) {
  return {
    content: record.content,
    ttl: record.ttl,
    prio: record.prio,
    disabled: record.disabled,
  };
}

function toApiCreate(record) {
  return {
    name: record.name,
    type: record.type,
    ...toApiBody(record),
  };
}

export function buildPlan(zone, desiredConfig) {
  validateDesiredConfig(desiredConfig, zone.name);
  const current = Array.isArray(zone.records) ? zone.records.map((record) => ({
    id: String(record.id || ''),
    ...normalizeRecord(record, zone.name),
  })) : [];
  const mutations = [];
  const warnings = [];

  for (const entry of desiredConfig.records) {
    const desired = normalizeRecord(entry, zone.name);
    const state = String(entry.state || 'present').toLowerCase();
    const sameSet = current.filter((record) => record.name === desired.name && record.type === desired.type);
    const exact = sameSet.filter((record) => sameContent(record, desired));

    if (state === 'absent') {
      for (const record of exact) {
        mutations.push({
          method: 'DELETE',
          recordId: record.id,
          name: record.name,
          type: record.type,
          content: record.content,
        });
      }
      continue;
    }

    if (exact.length > 0) continue;

    if (entry.singleton === true) {
      if (sameSet.length > 1) fail(`Singleton ${desired.name}/${desired.type} hat ${sameSet.length} bestehende Records; manueller Review erforderlich.`);
      if (sameSet.length === 1) {
        mutations.push({
          method: 'PUT',
          recordId: sameSet[0].id,
          name: desired.name,
          type: desired.type,
          previousContent: sameSet[0].content,
          body: toApiBody(desired),
        });
        continue;
      }
    } else if (sameSet.length > 0) {
      warnings.push(`Zusätzlicher ${desired.type}-Wert wird ergänzt; vorhandene Werte für ${desired.name} bleiben unangetastet.`);
    }

    mutations.push({
      method: 'POST',
      name: desired.name,
      type: desired.type,
      content: desired.content,
      body: [toApiCreate(desired)],
    });
  }

  const unsignedPlan = {
    schemaVersion: 1,
    zone: zone.name,
    zoneId: String(zone.id || ''),
    zoneFingerprint: zoneFingerprint(zone),
    deleteUnmanagedRecords: false,
    mutations,
    warnings,
  };
  return {
    ...unsignedPlan,
    planSha256: `sha256:${sha256(canonicalJson(unsignedPlan))}`,
  };
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} fehlt.`);
  return value;
}

async function api(path, init = {}) {
  const key = requiredEnv('IONOS_DNS_API_KEY');
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-api-key': key,
      ...(init.headers || {}),
    },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) {
    const detail = typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body)?.slice(0, 500);
    throw new Error(`[IONOS-DNS] HTTP ${response.status} ${path}: ${detail || response.statusText}`);
  }
  return body;
}

async function resolveZone(zoneName) {
  const zones = await api('/zones', { method: 'GET' });
  if (!Array.isArray(zones)) fail('IONOS /zones lieferte kein Array.');
  const matches = zones.filter((zone) => String(zone?.name || '').toLowerCase() === zoneName.toLowerCase());
  if (matches.length !== 1) fail(`Zone ${zoneName} konnte nicht eindeutig aufgelöst werden (${matches.length} Treffer).`);
  const zone = await api(`/zones/${encodeURIComponent(matches[0].id)}`, { method: 'GET' });
  if (!zone || typeof zone !== 'object' || !Array.isArray(zone.records)) fail('IONOS Zone-Detail ist ungültig.');
  return zone;
}

function readDesired(file, zoneName) {
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  validateDesiredConfig(parsed, zoneName);
  return parsed;
}

function assertApplyGate(plan, options) {
  const actor = String(options.actor || '').trim();
  const ref = String(options.ref || '').trim();
  const expectedPlan = String(options.expectedPlanSha256 || '').trim();
  const confirmation = String(options.confirmation || '').trim();
  if (actor !== OWNER) fail(`Apply darf nur durch ${OWNER} ausgelöst werden.`);
  if (ref !== 'refs/heads/main') fail('Apply darf ausschließlich vom geschützten main-Ref laufen.');
  if (confirmation !== `APPLY ${plan.zone}`) fail(`Bestätigung muss exakt "APPLY ${plan.zone}" lauten.`);
  if (!/^sha256:[a-f0-9]{64}$/.test(expectedPlan)) fail('plan_sha256 fehlt oder ist ungültig.');
  if (expectedPlan !== plan.planSha256) fail(`Plan-Fingerprint mismatch: erwartet ${expectedPlan}, aktuell ${plan.planSha256}.`);
}

async function applyPlan(plan) {
  for (const mutation of plan.mutations) {
    if (!ALLOWED_WRITE_TYPES.has(mutation.type)) fail(`Mutationstyp ${mutation.type} wurde nach Planerzeugung unzulässig.`);
    if (mutation.method === 'POST') {
      await api(`/zones/${encodeURIComponent(plan.zoneId)}/records`, {
        method: 'POST',
        body: JSON.stringify(mutation.body),
      });
    } else if (mutation.method === 'PUT') {
      await api(`/zones/${encodeURIComponent(plan.zoneId)}/records/${encodeURIComponent(mutation.recordId)}`, {
        method: 'PUT',
        body: JSON.stringify(mutation.body),
      });
    } else if (mutation.method === 'DELETE') {
      await api(`/zones/${encodeURIComponent(plan.zoneId)}/records/${encodeURIComponent(mutation.recordId)}`, {
        method: 'DELETE',
      });
    } else {
      fail(`Unbekannte Mutation ${mutation.method}.`);
    }
  }
}

function publicRecord(record, zoneName) {
  const normalized = normalizeRecord(record, zoneName);
  return { id: String(record.id || ''), ...normalized };
}

export async function execute({ action, zoneName, desiredFile, expectedPlanSha256, actor, ref, confirmation }) {
  const zone = await resolveZone(zoneName);
  if (action === 'read') {
    return {
      action: 'read',
      mutationMode: 'READ_ONLY',
      zone: zone.name,
      zoneId: zone.id,
      zoneFingerprint: zoneFingerprint(zone),
      records: zone.records.map((record) => publicRecord(record, zone.name)).sort((a, b) => recordSortKey(a).localeCompare(recordSortKey(b))),
    };
  }

  const desired = readDesired(desiredFile, zoneName);
  const plan = buildPlan(zone, desired);
  if (action === 'plan') {
    return { action: 'plan', mutationMode: 'READ_ONLY', ...plan };
  }
  if (action !== 'apply') fail(`Unbekannte Aktion ${action}.`);

  assertApplyGate(plan, { expectedPlanSha256, actor, ref, confirmation });
  await applyPlan(plan);
  const after = await resolveZone(zoneName);
  const postPlan = buildPlan(after, desired);
  if (postPlan.mutations.length !== 0) fail(`Post-Apply-Verification ergab noch ${postPlan.mutations.length} ausstehende Mutation(en).`);
  return {
    action: 'apply',
    mutationMode: 'OWNER_GATED_WRITE',
    appliedPlanSha256: plan.planSha256,
    appliedMutations: plan.mutations.length,
    postZoneFingerprint: zoneFingerprint(after),
    postVerification: 'PASS',
  };
}

function parseArgs(argv) {
  const args = { action: 'read', zoneName: DEFAULT_ZONE, desiredFile: DEFAULT_DESIRED_FILE, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--action') args.action = String(argv[++i] || '').toLowerCase();
    else if (token === '--zone') args.zoneName = String(argv[++i] || '').toLowerCase();
    else if (token === '--desired') args.desiredFile = String(argv[++i] || '');
    else if (token === '--plan-sha256') args.expectedPlanSha256 = String(argv[++i] || '');
    else if (token === '--actor') args.actor = String(argv[++i] || '');
    else if (token === '--ref') args.ref = String(argv[++i] || '');
    else if (token === '--confirmation') args.confirmation = String(argv[++i] || '');
    else if (token === '--json') args.json = true;
    else fail(`Unbekanntes Argument ${token}.`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await execute(args);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (result.action === 'read') {
    console.log(`[IONOS-DNS] READ_ONLY zone=${result.zone} records=${result.records.length} fingerprint=${result.zoneFingerprint}`);
  } else if (result.action === 'plan') {
    console.log(`[IONOS-DNS] READ_ONLY plan=${result.planSha256} mutations=${result.mutations.length}`);
    for (const mutation of result.mutations) console.log(`[IONOS-DNS] ${mutation.method} ${mutation.name} ${mutation.type}`);
    for (const warning of result.warnings) console.log(`[IONOS-DNS][WARN] ${warning}`);
  } else {
    console.log(`[IONOS-DNS] OWNER_GATED_WRITE applied=${result.appliedMutations} plan=${result.appliedPlanSha256} post=${result.postVerification}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
