#!/usr/bin/env node

/**
 * CAPITAL-AI read-only domain/mail security audit.
 *
 * This script intentionally performs no registrar, DNS-provider, Render, Supabase or mail-provider
 * mutations. It uses HTTPS GET requests only and is safe to run as a pre/post-check around the
 * owner-gated steps in docs/runbooks/DOMAIN_MAIL_SECURITY_HARDENING_2026-08-25.md.
 */

import { pathToFileURL } from 'node:url';

export const DEFAULT_DOMAIN = 'capital-ai.online';

const DNS_PROVIDERS = [
  {
    name: 'Google Public DNS',
    buildUrl(name, type) {
      const url = new URL('https://dns.google/resolve');
      url.searchParams.set('name', name);
      url.searchParams.set('type', type);
      url.searchParams.set('do', '1');
      return url;
    },
    headers: { accept: 'application/dns-json' },
  },
  {
    name: 'Cloudflare DNS',
    buildUrl(name, type) {
      const url = new URL('https://cloudflare-dns.com/dns-query');
      url.searchParams.set('name', name);
      url.searchParams.set('type', type);
      url.searchParams.set('do', 'true');
      return url;
    },
    headers: { accept: 'application/dns-json' },
  },
];

const SECURITY_HEADERS = [
  ['content-security-policy', 'Content-Security-Policy'],
  ['strict-transport-security', 'Strict-Transport-Security'],
  ['x-frame-options', 'X-Frame-Options'],
  ['x-content-type-options', 'X-Content-Type-Options'],
  ['referrer-policy', 'Referrer-Policy'],
];

function normalizeTxtRecord(value = '') {
  return String(value)
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/"\s+"/g, '');
}

export function parseDmarcPolicy(records = []) {
  const record = records.map(normalizeTxtRecord).find((value) => /^v=DMARC1;/i.test(value));
  if (!record) return { record: null, policy: null, pct: null };

  const tags = Object.fromEntries(
    record
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split('=');
        return [String(key || '').toLowerCase(), rest.join('=').trim()];
      }),
  );

  return {
    record,
    policy: tags.p?.toLowerCase() || null,
    pct: tags.pct ? Number(tags.pct) : 100,
  };
}

export function parseSpf(records = []) {
  const spfRecords = records.map(normalizeTxtRecord).filter((value) => /^v=spf1\b/i.test(value));
  const record = spfRecords[0] || null;
  return {
    count: spfRecords.length,
    record,
    hardFail: Boolean(record && /(?:^|\s)-all(?:\s|$)/i.test(record)),
    softFail: Boolean(record && /(?:^|\s)~all(?:\s|$)/i.test(record)),
  };
}

export function evaluateCaa(records = []) {
  const normalized = records.map((value) => String(value).replace(/\s+/g, ' ').trim());
  const hasLetsEncrypt = normalized.some((value) => /\bissue\s+"?letsencrypt\.org"?/i.test(value));
  const hasGoogle = normalized.some((value) => /\bissue\s+"?pki\.goog(?:;[^\"]*)?"?/i.test(value));
  const wildcardDenied = normalized.some((value) => /\bissuewild\s+"?;"?\s*$/i.test(value));
  const wildcardLetsEncrypt = normalized.some((value) => /\bissuewild\s+"?letsencrypt\.org"?/i.test(value));
  const wildcardGoogle = normalized.some((value) => /\bissuewild\s+"?pki\.goog(?:;[^\"]*)?"?/i.test(value));

  return {
    records: normalized,
    hasLetsEncrypt,
    hasGoogle,
    wildcardDenied,
    wildcardLetsEncrypt,
    wildcardGoogle,
  };
}

async function fetchJson(url, headers) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...headers,
      'user-agent': 'CAPITAL-AI-DomainSecurityAudit/1.0',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function queryDnsProvider(provider, name, type) {
  try {
    const payload = await fetchJson(provider.buildUrl(name, type), provider.headers);
    const answers = Array.isArray(payload.Answer) ? payload.Answer : [];
    return {
      provider: provider.name,
      ok: Number(payload.Status) === 0,
      status: Number(payload.Status),
      authenticatedData: Boolean(payload.AD),
      answers: answers.map((answer) => ({
        name: answer.name,
        type: answer.type,
        ttl: answer.TTL,
        data: answer.data,
      })),
      error: null,
    };
  } catch (error) {
    return {
      provider: provider.name,
      ok: false,
      status: null,
      authenticatedData: false,
      answers: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function queryDns(name, type) {
  return Promise.all(DNS_PROVIDERS.map((provider) => queryDnsProvider(provider, name, type)));
}

function uniqueAnswerData(results = []) {
  return [...new Set(results.flatMap((result) => result.answers.map((answer) => answer.data)))];
}

async function probeHttps(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'CAPITAL-AI-DomainSecurityAudit/1.0',
      },
      signal: AbortSignal.timeout(15_000),
    });

    // Read and discard the body so pooled connections can be reused cleanly.
    await response.arrayBuffer();

    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      headers: Object.fromEntries(response.headers.entries()),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      finalUrl: null,
      headers: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildCheck(id, area, status, summary, action = null) {
  return { id, area, status, summary, action };
}

function evaluateWebProbe(host, probe) {
  if (!probe.ok) {
    return [
      buildCheck(
        `WEB_REACHABLE_${host}`,
        'web',
        'FAIL',
        `${host} konnte nicht erfolgreich per HTTPS gelesen werden (${probe.error || probe.status}).`,
        'Erreichbarkeit/TLS prüfen, bevor weitere Härtungsschritte vorgenommen werden.',
      ),
    ];
  }

  const checks = [
    buildCheck(`WEB_REACHABLE_${host}`, 'web', 'PASS', `${host} antwortet per HTTPS mit ${probe.status}.`),
  ];

  for (const [key, label] of SECURITY_HEADERS) {
    checks.push(
      probe.headers[key]
        ? buildCheck(`HEADER_${key}_${host}`, 'web', 'PASS', `${label} ist vorhanden.`)
        : buildCheck(
            `HEADER_${key}_${host}`,
            'web',
            'FAIL',
            `${label} fehlt in der Live-Response.`,
            'Runtime-/Deployment-Regression untersuchen; nicht durch eine zweite Header-Authority kompensieren.',
          ),
    );
  }

  checks.push(
    probe.headers['x-powered-by']
      ? buildCheck(
          `HEADER_X_POWERED_BY_${host}`,
          'web',
          'WARN',
          'X-Powered-By ist sichtbar.',
          'Express-Fingerprinting erneut deaktivieren.',
        )
      : buildCheck(`HEADER_X_POWERED_BY_${host}`, 'web', 'PASS', 'X-Powered-By ist nicht sichtbar.'),
  );

  const cspMode = probe.headers['x-csp-mode'];
  checks.push(
    cspMode
      ? buildCheck(`CSP_MODE_${host}`, 'web', 'PASS', `X-CSP-Mode=${cspMode}.`)
      : buildCheck(
          `CSP_MODE_${host}`,
          'web',
          'WARN',
          'X-CSP-Mode fehlt; CSP kann dennoch vorhanden sein, aber die ADR-0040-Evidence ist unvollständig.',
          'Deployment auf den kanonischen securityResponse-Pfad korrelieren.',
        ),
  );

  return checks;
}

export async function auditDomainSecurity(domain = DEFAULT_DOMAIN) {
  const apex = domain;
  const www = `www.${domain}`;
  const dmarcHost = `_dmarc.${domain}`;
  const mtaStsHost = `_mta-sts.${domain}`;
  const tlsRptHost = `_smtp._tls.${domain}`;

  const [
    apexA,
    apexAaaa,
    apexMx,
    apexTxt,
    apexCaa,
    apexDs,
    apexDnskey,
    wwwAaaa,
    dmarcTxt,
    mtaStsTxt,
    tlsRptTxt,
    apexHttps,
    wwwHttps,
  ] = await Promise.all([
    queryDns(apex, 'A'),
    queryDns(apex, 'AAAA'),
    queryDns(apex, 'MX'),
    queryDns(apex, 'TXT'),
    queryDns(apex, 'CAA'),
    queryDns(apex, 'DS'),
    queryDns(apex, 'DNSKEY'),
    queryDns(www, 'AAAA'),
    queryDns(dmarcHost, 'TXT'),
    queryDns(mtaStsHost, 'TXT'),
    queryDns(tlsRptHost, 'TXT'),
    probeHttps(`https://${apex}/`),
    probeHttps(`https://${www}/`),
  ]);

  const checks = [...evaluateWebProbe(apex, apexHttps), ...evaluateWebProbe(www, wwwHttps)];

  const apexAaaaValues = uniqueAnswerData(apexAaaa);
  const wwwAaaaValues = uniqueAnswerData(wwwAaaa);
  checks.push(
    apexAaaaValues.length === 0 && wwwAaaaValues.length === 0
      ? buildCheck(
          'RENDER_IPV6_EXCEPTION',
          'dns',
          'PASS',
          'Kein AAAA auf Apex/www gefunden; dies entspricht der aktuellen Render-IPv4-Invariante.',
        )
      : buildCheck(
          'RENDER_IPV6_EXCEPTION',
          'dns',
          'FAIL',
          `AAAA gefunden: apex=${apexAaaaValues.join(', ') || '-'}; www=${wwwAaaaValues.join(', ') || '-'}.`,
          'Nur entfernen, wenn Render weiterhin die autorisierte Hosting-Architektur ist und kein verifizierter IPv6-Cutover existiert.',
        ),
  );

  const caa = evaluateCaa(uniqueAnswerData(apexCaa));
  checks.push(
    caa.hasLetsEncrypt && caa.hasGoogle && (caa.wildcardDenied || (caa.wildcardLetsEncrypt && caa.wildcardGoogle))
      ? buildCheck('CAA_RENDER', 'dns', 'PASS', 'CAA erlaubt die Render-CAs und besitzt eine explizite Wildcard-Policy.')
      : buildCheck(
          'CAA_RENDER',
          'dns',
          'MANUAL',
          `CAA noch nicht im erwarteten Render-Zielzustand: ${caa.records.join(' | ') || 'keine Records'}.`,
          'Ohne Render-Wildcard: issue letsencrypt.org + issue pki.goog + issuewild ";". Bei verifiziertem Wildcard-Scope den Deny-Record ersetzen, nicht ergänzen.',
        ),
  );

  const dsValues = uniqueAnswerData(apexDs);
  const dnskeyValues = uniqueAnswerData(apexDnskey);
  const dnssecAd = apexA.some((result) => result.authenticatedData);
  if (dsValues.length > 0 && dnskeyValues.length > 0 && dnssecAd) {
    checks.push(buildCheck('DNSSEC', 'dns', 'PASS', 'DS + DNSKEY vorhanden; mindestens ein Resolver liefert authentifizierte Daten (AD).'));
  } else if (dsValues.length > 0 && (!dnskeyValues.length || !dnssecAd)) {
    checks.push(
      buildCheck(
        'DNSSEC',
        'dns',
        'FAIL',
        `DS=${dsValues.length}, DNSKEY=${dnskeyValues.length}, AD=${dnssecAd}. Potenziell inkonsistente Chain of Trust.`,
        'Keine weiteren DNS-Änderungen durchführen; DS/DNSKEY beim Provider/Registrar gegen den letzten verifizierten Zustand prüfen.',
      ),
    );
  } else {
    checks.push(
      buildCheck(
        'DNSSEC',
        'dns',
        'MANUAL',
        'Keine vollständig verifizierte DNSSEC-Chain erkannt.',
        'DNSSEC beim autoritativen Provider aktivieren und ausschließlich provider-generierte DS-Werte beim Registrar verwenden.',
      ),
    );
  }

  const spf = parseSpf(uniqueAnswerData(apexTxt));
  if (spf.count !== 1) {
    checks.push(
      buildCheck(
        'SPF',
        'mail',
        spf.count === 0 ? 'MANUAL' : 'FAIL',
        `${spf.count} SPF-Records erkannt.`,
        spf.count === 0
          ? 'Legitime Sender inventarisieren und einen einzigen SPF-Record pflegen.'
          : 'Mehrere SPF-Records zusammenführen; mehrere v=spf1-Records sind ungültig.',
      ),
    );
  } else if (spf.hardFail) {
    checks.push(buildCheck('SPF', 'mail', 'PASS', 'Genau ein SPF-Record mit -all erkannt.'));
  } else {
    checks.push(
      buildCheck(
        'SPF',
        'mail',
        'MANUAL',
        `SPF vorhanden, aber noch nicht mit -all gehärtet: ${spf.record}`,
        'Erst nach vollständigem Senderinventar und Alignment auf -all umstellen.',
      ),
    );
  }

  const dmarc = parseDmarcPolicy(uniqueAnswerData(dmarcTxt));
  if (dmarc.policy === 'reject') {
    checks.push(buildCheck('DMARC', 'mail', 'PASS', `DMARC p=reject (pct=${dmarc.pct ?? 100}).`));
  } else if (dmarc.policy === 'quarantine') {
    checks.push(
      buildCheck(
        'DMARC',
        'mail',
        'MANUAL',
        `DMARC p=quarantine (pct=${dmarc.pct ?? 100}).`,
        'Nach sauberer DMARC-Telemetrie pct auf 100 und anschließend kontrolliert p=reject prüfen.',
      ),
    );
  } else if (dmarc.policy === 'none') {
    checks.push(
      buildCheck(
        'DMARC',
        'mail',
        'MANUAL',
        'DMARC ist im Monitoring-Modus p=none.',
        'Nach DKIM/SPF-Alignment stufenweise p=quarantine; pct=25 → 50 → 100; danach p=reject.',
      ),
    );
  } else {
    checks.push(
      buildCheck(
        'DMARC',
        'mail',
        'MANUAL',
        'Kein auswertbarer DMARC-Record erkannt.',
        'Einen einzigen DMARC-Record mit Reporting-Mailbox im Monitoring-Modus anlegen und danach stufenweise härten.',
      ),
    );
  }

  const mtaStsRecords = uniqueAnswerData(mtaStsTxt).map(normalizeTxtRecord);
  checks.push(
    mtaStsRecords.some((value) => /^v=STSv1;/i.test(value))
      ? buildCheck('MTA_STS_DNS', 'mail', 'PASS', 'MTA-STS DNS-TXT ist vorhanden.')
      : buildCheck(
          'MTA_STS_DNS',
          'mail',
          'MANUAL',
          'MTA-STS DNS-TXT fehlt.',
          'Erst nach verifizierten MX/TLS-Namen MTA-STS im testing-Modus einführen; danach enforce.',
        ),
  );

  const tlsRptRecords = uniqueAnswerData(tlsRptTxt).map(normalizeTxtRecord);
  checks.push(
    tlsRptRecords.some((value) => /^v=TLSRPTv1;/i.test(value))
      ? buildCheck('TLS_RPT', 'mail', 'PASS', 'TLS-RPT ist vorhanden.')
      : buildCheck(
          'TLS_RPT',
          'mail',
          'MANUAL',
          'TLS-RPT fehlt.',
          'Eine kontrollierte TLS-RPT-Mailbox konfigurieren, bevor MTA-STS auf enforce gesetzt wird.',
        ),
  );

  const resolverErrors = [apexA, apexAaaa, apexMx, apexTxt, apexCaa, apexDs, apexDnskey, wwwAaaa, dmarcTxt]
    .flat()
    .filter((result) => result.error)
    .map((result) => `${result.provider}: ${result.error}`);

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    domain,
    mutationMode: 'READ_ONLY',
    dnsResolvers: DNS_PROVIDERS.map((provider) => provider.name),
    resolverErrors: [...new Set(resolverErrors)],
    observed: {
      apexA: uniqueAnswerData(apexA),
      apexAaaa: apexAaaaValues,
      apexMx: uniqueAnswerData(apexMx),
      apexTxt: uniqueAnswerData(apexTxt),
      apexCaa: caa.records,
      apexDs: dsValues,
      apexDnskeyCount: dnskeyValues.length,
      wwwAaaa: wwwAaaaValues,
      dmarc: dmarc.record,
      mtaStsTxt: mtaStsRecords,
      tlsRptTxt: tlsRptRecords,
      apexHttps,
      wwwHttps,
    },
    checks,
    summary: {
      pass: checks.filter((check) => check.status === 'PASS').length,
      manual: checks.filter((check) => check.status === 'MANUAL').length,
      warn: checks.filter((check) => check.status === 'WARN').length,
      fail: checks.filter((check) => check.status === 'FAIL').length,
    },
  };
}

function renderTextReport(result) {
  const lines = [];
  lines.push(`CAPITAL-AI Domain Security Audit — ${result.domain}`);
  lines.push(`Mode: ${result.mutationMode}`);
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push('');

  for (const check of result.checks) {
    lines.push(`[${check.status.padEnd(6)}] ${check.id}: ${check.summary}`);
    if (check.action) lines.push(`         Aktion: ${check.action}`);
  }

  lines.push('');
  lines.push(
    `Summary: PASS=${result.summary.pass} MANUAL=${result.summary.manual} WARN=${result.summary.warn} FAIL=${result.summary.fail}`,
  );

  if (result.resolverErrors.length) {
    lines.push('');
    lines.push('Resolver-Hinweise:');
    for (const error of result.resolverErrors) lines.push(`- ${error}`);
  }

  return lines.join('\n');
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const domainArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  const result = await auditDomainSecurity(domainArg || DEFAULT_DOMAIN);

  if (args.has('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(renderTextReport(result));
  }

  if (args.has('--strict') && result.summary.fail > 0) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  await main();
}
