#!/usr/bin/env node
/**
 * Shadow ADR Metadata Validator (advisory, non-blocking)
 *
 * GOV-ADR subset checks that can run today without the full ESS-0012 engine:
 * - Duplicate ADR numbers in docs/adr/*.md (active)
 * - Filename number matches first heading / title number when present
 * - Required metadata hints: Status / Implementation-Status presence
 * - Collision report only — never exits non-zero unless --strict is passed
 *
 * Usage:
 *   node scripts/governance/shadowAdrMetadataValidator.mjs
 *   node scripts/governance/shadowAdrMetadataValidator.mjs --strict
 *   node scripts/governance/shadowAdrMetadataValidator.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const ADR_DIR = path.join(REPO_ROOT, 'docs/adr');
const RESOLVED_DIR = path.join(ADR_DIR, 'resolved');

const args = new Set(process.argv.slice(2));
const STRICT = args.has('--strict');
const AS_JSON = args.has('--json');

const NUMBER_FROM_NAME_RE = /^ADR-(\d{4})/i;
const NUMBER_FROM_TITLE_RE = /^#\s*ADR-(\d{4})\b/im;
const STATUS_RE = /(?:^|\n)\s*(?:\*\*)?Status(?:\*\*)?\s*[:\-]?\s*(.+)/i;
const IMPL_STATUS_RE = /(?:^|\n)\s*(?:\*\*)?Implementation-Status(?:\*\*)?\s*[:\-]?\s*(.+)/i;

function listAdrFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f.startsWith('ADR-'))
    .map((f) => path.join(dir, f));
}

function analyzeFile(filePath) {
  const base = path.basename(filePath);
  const rel = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
  const text = fs.readFileSync(filePath, 'utf8');
  const nameMatch = base.match(NUMBER_FROM_NAME_RE);
  const titleMatch = text.match(NUMBER_FROM_TITLE_RE);
  const statusMatch = text.match(STATUS_RE);
  const implMatch = text.match(IMPL_STATUS_RE);

  return {
    path: rel,
    filename: base,
    numberFromName: nameMatch ? nameMatch[1] : null,
    numberFromTitle: titleMatch ? titleMatch[1] : null,
    hasStatus: Boolean(statusMatch),
    statusSnippet: statusMatch ? statusMatch[1].trim().slice(0, 80) : null,
    hasImplementationStatus: Boolean(implMatch),
    implSnippet: implMatch ? implMatch[1].trim().slice(0, 80) : null,
    isDraft: /DRAFT/i.test(base),
  };
}

function main() {
  const active = listAdrFiles(ADR_DIR).map(analyzeFile);
  const resolved = listAdrFiles(RESOLVED_DIR).map(analyzeFile);

  const byNumber = new Map();
  for (const a of active) {
    if (!a.numberFromName || a.isDraft) continue;
    if (!byNumber.has(a.numberFromName)) byNumber.set(a.numberFromName, []);
    byNumber.get(a.numberFromName).push(a);
  }

  const findings = [];

  for (const [num, files] of byNumber) {
    if (files.length > 1) {
      findings.push({
        id: 'GOV-ADR-SHADOW-001',
        severity: 'error',
        rule: 'Unique ADR number in active docs/adr/',
        number: num,
        files: files.map((f) => f.path),
        message: `Duplicate active ADR number ${num}: ${files.map((f) => f.filename).join(', ')}`,
      });
    }
  }

  for (const a of active) {
    if (a.isDraft) continue;
    if (a.numberFromName && a.numberFromTitle && a.numberFromName !== a.numberFromTitle) {
      findings.push({
        id: 'GOV-ADR-SHADOW-002',
        severity: 'warning',
        rule: 'Filename number matches title number',
        number: a.numberFromName,
        files: [a.path],
        message: `${a.filename}: filename ADR-${a.numberFromName} vs title ADR-${a.numberFromTitle}`,
      });
    }
    if (!a.hasStatus) {
      findings.push({
        id: 'GOV-ADR-SHADOW-003',
        severity: 'warning',
        rule: 'Status field present',
        number: a.numberFromName,
        files: [a.path],
        message: `${a.filename}: missing Status metadata`,
      });
    }
    if (!a.hasImplementationStatus) {
      findings.push({
        id: 'GOV-ADR-SHADOW-004',
        severity: 'info',
        rule: 'Implementation-Status recommended',
        number: a.numberFromName,
        files: [a.path],
        message: `${a.filename}: missing Implementation-Status (recommended for active ADRs)`,
      });
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: STRICT ? 'strict' : 'advisory',
    activeAdrCount: active.filter((a) => !a.isDraft).length,
    resolvedAdrCount: resolved.length,
    draftCount: active.filter((a) => a.isDraft).length,
    uniqueActiveNumbers: byNumber.size,
    duplicateNumberGroups: [...byNumber.entries()].filter(([, v]) => v.length > 1).length,
    findings,
    countsBySeverity: {
      error: findings.filter((f) => f.severity === 'error').length,
      warning: findings.filter((f) => f.severity === 'warning').length,
      info: findings.filter((f) => f.severity === 'info').length,
    },
  };

  if (AS_JSON) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  } else {
    console.log('=== Shadow ADR Metadata Validator (advisory) ===');
    console.log(`Active ADRs: ${summary.activeAdrCount} | Resolved: ${summary.resolvedAdrCount} | Drafts: ${summary.draftCount}`);
    console.log(`Unique active numbers: ${summary.uniqueActiveNumbers} | Duplicate groups: ${summary.duplicateNumberGroups}`);
    console.log(`Findings: error=${summary.countsBySeverity.error} warning=${summary.countsBySeverity.warning} info=${summary.countsBySeverity.info}`);
    if (findings.length === 0) {
      console.log('No findings.');
    } else {
      for (const f of findings) {
        console.log(`[${f.severity.toUpperCase()}] ${f.id} ${f.message}`);
      }
    }
    console.log(STRICT ? 'Mode: STRICT (errors → exit 1)' : 'Mode: ADVISORY (never blocks merge)');
  }

  if (STRICT && summary.countsBySeverity.error > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
