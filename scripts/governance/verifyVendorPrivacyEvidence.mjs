#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EXPECTED_VENDOR_IDS = [
  'supabase','render','stripe','ionos','google','youtube','instagram','tiktok','x','threads','linkedin','facebook',
];

const ROLE_STATUSES = new Set(['pending-legal-evidence','pre-onboarding-pending','verified-scoped','verified']);
const DPA_STATUSES = new Set(['pending','executed','electronically-incorporated','not-applicable']);
const SUBPROCESSOR_STATUSES = new Set(['pending','snapshot-verified-scope-pending','verified','not-applicable']);

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const fileIndex = args.indexOf('--file');
const file = resolve(process.cwd(), fileIndex >= 0 && args[fileIndex + 1] ? args[fileIndex + 1] : 'docs/compliance/vendor-evidence/vendor-inventory.json');

const errors = [];
const warnings = [];
const informational = [];
const isIsoDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isSha256 = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const daysBetween = (a, b) => Math.floor(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
const isActiveProductionProcessing = (vendor) => String(vendor?.processingStatus || '').startsWith('active-');
const isPlannedProcessing = (vendor) => String(vendor?.processingStatus || '').startsWith('planned-');

function problem(target, message) { (strict ? errors : warnings).push(`${target}: ${message}`); }
function requireEvidence(target, evidence) {
  if (!isSha256(evidence?.evidenceSha256)) errors.push(`${target}: verified evidence requires a SHA-256 digest`);
  if (!evidence?.evidenceLocation) errors.push(`${target}: verified evidence requires a controlled evidence location`);
}
function normalizeRegion(region) { return String(region).toLowerCase().replace(/^aws:/, '').replace(/^render:/, ''); }

const raw = await readFile(file, 'utf8');
const inventory = JSON.parse(raw);
if (inventory.schemaVersion !== '1.0.0') errors.push('inventory: unsupported schemaVersion');
if (!isIsoDate(inventory.lastInventoryUpdate)) errors.push('inventory: lastInventoryUpdate must be YYYY-MM-DD');
if (!Number.isInteger(inventory.reviewCadenceDays) || inventory.reviewCadenceDays < 1) errors.push('inventory: reviewCadenceDays must be a positive integer');
if (!Array.isArray(inventory.vendors)) errors.push('inventory: vendors must be an array');

const vendors = Array.isArray(inventory.vendors) ? inventory.vendors : [];
const ids = vendors.map((vendor) => vendor.id);
for (const expected of EXPECTED_VENDOR_IDS) if (!ids.includes(expected)) errors.push(`inventory: missing required vendor candidate ${expected}`);
for (const id of new Set(ids)) if (ids.filter((candidate) => candidate === id).length > 1) errors.push(`inventory: duplicate vendor id ${id}`);

const today = new Date(`${inventory.lastInventoryUpdate || '1970-01-01'}T00:00:00Z`);
for (const vendor of vendors) {
  const target = vendor.id || '<missing-id>';
  if (!vendor.id || !vendor.displayName) errors.push(`${target}: id and displayName are required`);
  if (!vendor.roleStatus) errors.push(`${target}: roleStatus is required`);
  if (!vendor.processingStatus) errors.push(`${target}: processingStatus is required`);
  if (!vendor.dpa || !vendor.subprocessors || !vendor.regions || !vendor.transfers) {
    errors.push(`${target}: dpa, subprocessors, regions and transfers objects are required`);
    continue;
  }

  if (!ROLE_STATUSES.has(vendor.roleStatus)) errors.push(`${target}: unsupported roleStatus ${vendor.roleStatus}`);
  if (!DPA_STATUSES.has(vendor.dpa.status)) errors.push(`${target}: unsupported DPA status ${vendor.dpa.status || 'missing'}`);
  if (!SUBPROCESSOR_STATUSES.has(vendor.subprocessors.status)) errors.push(`${target}: unsupported subprocessor status ${vendor.subprocessors.status || 'missing'}`);

  if (isPlannedProcessing(vendor) && vendor.roleStatus !== 'pre-onboarding-pending' && vendor.overallEvidenceStatus !== 'verified') {
    errors.push(`${target}: planned processing must remain pre-onboarding-pending until legal onboarding evidence is verified`);
  }

  if (vendor.roleStatus === 'verified-scoped' && (vendor.roleEvidence?.status !== 'verified' || !vendor.roleEvidence?.scope || !vendor.roleEvidence?.evidenceLocation)) {
    errors.push(`${target}: verified-scoped role requires verified roleEvidence with scope and evidenceLocation`);
  }

  if (vendor.dpa.status === 'executed') {
    if (!isIsoDate(vendor.dpa.executedAt)) errors.push(`${target}: executed DPA requires executedAt`);
    requireEvidence(`${target}/dpa`, vendor.dpa);
  }
  if (vendor.dpa.status === 'electronically-incorporated') {
    if (!vendor.dpa.version) errors.push(`${target}: electronically incorporated DPA requires version`);
    if (!vendor.dpa.incorporationBasis) errors.push(`${target}: electronically incorporated DPA requires incorporationBasis`);
    if (vendor.dpa.executedAt !== null && vendor.dpa.executedAt !== undefined && !isIsoDate(vendor.dpa.executedAt)) errors.push(`${target}: electronically incorporated DPA executedAt must be YYYY-MM-DD or null`);
    requireEvidence(`${target}/dpa`, vendor.dpa);
  }

  if (vendor.subprocessors.status === 'snapshot-verified-scope-pending') {
    if (!isIsoDate(vendor.subprocessors.reviewedAt)) errors.push(`${target}: subprocessor snapshot requires reviewedAt`);
    requireEvidence(`${target}/subprocessors`, vendor.subprocessors);
    if (vendor.subprocessors.changeNotifications === 'unknown') errors.push(`${target}: subprocessor snapshot requires a documented change-notification posture`);
  }

  if (vendor.overallEvidenceStatus === 'verified') {
    if (vendor.roleStatus !== 'verified') errors.push(`${target}: overall verified requires globally verified legal role`);
    if (!['executed','electronically-incorporated','not-applicable'].includes(vendor.dpa.status)) errors.push(`${target}: overall verified requires executed, electronically-incorporated or not-applicable DPA status`);
    if (!['verified','not-applicable'].includes(vendor.subprocessors.status)) errors.push(`${target}: overall verified requires verified/not-applicable subprocessors`);
    if (vendor.subprocessors.status === 'verified') {
      if (!isIsoDate(vendor.subprocessors.reviewedAt)) errors.push(`${target}: subprocessor evidence requires reviewedAt`);
      requireEvidence(`${target}/subprocessors`, vendor.subprocessors);
      if (vendor.subprocessors.changeNotifications === 'unknown') errors.push(`${target}: verified subprocessors require a known change-notification posture`);
    }
  } else if (strict || isActiveProductionProcessing(vendor)) {
    // Normal CI must surface unresolved evidence for active production processors/controllers.
    // Strict verification additionally blocks every not-yet-onboarded candidate before activation.
    problem(target, `overall evidence status is ${vendor.overallEvidenceStatus || 'missing'}`);
  } else {
    informational.push(`${target}: planned/inactive pre-onboarding evidence remains pending`);
  }

  const mechanisms = Array.isArray(vendor.transfers.mechanisms) ? vendor.transfers.mechanisms : [];
  if (vendor.transfers.thirdCountry === true && mechanisms.includes('SCC')) {
    if (vendor.transfers.tiaStatus !== 'approved') errors.push(`${target}: SCC third-country transfer requires approved TIA`);
    if (!isIsoDate(vendor.transfers.tiaReviewedAt) || !vendor.transfers.tiaEvidenceLocation) errors.push(`${target}: approved TIA requires review date and evidence location`);
  }

  const contractual = Array.isArray(vendor.regions.contractual) ? vendor.regions.contractual : [];
  const observed = Array.isArray(vendor.regions.observed) ? vendor.regions.observed : [];
  if (contractual.length > 0 && observed.length > 0) {
    const allowed = new Set(contractual.map(normalizeRegion));
    const mismatches = observed.filter((region) => !allowed.has(normalizeRegion(region)));
    if (mismatches.length > 0) errors.push(`${target}: observed region(s) not covered by contractual evidence: ${mismatches.join(', ')}`);
  }

  const reviewDates = [vendor.subprocessors.reviewedAt, vendor.transfers.tiaReviewedAt].filter(isIsoDate);
  for (const date of reviewDates) if (daysBetween(new Date(`${date}T00:00:00Z`), today) > inventory.reviewCadenceDays) errors.push(`${target}: evidence review ${date} exceeds ${inventory.reviewCadenceDays}-day cadence`);
}

console.log(`Vendor privacy evidence preflight (${strict ? 'strict' : 'onboarding'} mode)`);
console.log(`Inventory: ${file}`);
console.log(`Candidates: ${vendors.length}/${EXPECTED_VENDOR_IDS.length}`);
for (const item of informational) console.log(`INFO ${item}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length > 0) {
  console.error(`Evidence gate failed with ${errors.length} error(s).`);
  process.exit(1);
}
if (strict) {
  console.log('Vendor privacy evidence strict gate passed.');
} else {
  console.log(`Vendor privacy evidence structure is valid; ${warnings.length} active production gap(s), ${informational.length} planned/inactive candidate(s).`);
}
