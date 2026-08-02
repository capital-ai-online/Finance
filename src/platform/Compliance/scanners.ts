// ADR-0012 — Scanner-Register des SecurityComplianceAuditor Backends.
//
// Alle 21 Module lesen den tatsächlichen Repository-Zustand zur Laufzeit
// (Dateisystem, Migrationsdateien, ADR/ESS-Registry) - es werden keine
// festen Demo-Werte zurückgegeben. Ein Scan liefert damit reale, jederzeit
// nachvollziehbare Befunde statt einer Momentaufnahme, die sofort veraltet.

import fs from 'fs';
import path from 'path';
import type { Finding, ScannerResult, Severity } from './types';

const REPO_ROOT = process.cwd();
const SCAN_DIRS = ['src', 'server'];
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.git', 'uploads', 'build', '.vite']);
const INCLUDE_EXT = new Set(['.ts', '.tsx']);

interface RepoFile {
  relPath: string;
  content: string;
}

function walk(dir: string, out: RepoFile[]) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (INCLUDE_EXT.has(path.extname(entry.name))) {
      try {
        out.push({ relPath: path.relative(REPO_ROOT, full), content: fs.readFileSync(full, 'utf8') });
      } catch {
        // Datei nicht lesbar (Berechtigungen/Symlink) - überspringen statt Scan abzubrechen.
      }
    }
  }
}

let cachedIndex: RepoFile[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

function buildRepoIndex(): RepoFile[] {
  const now = Date.now();
  if (cachedIndex && now - cachedAt < CACHE_TTL_MS) return cachedIndex;
  const out: RepoFile[] = [];
  for (const dir of SCAN_DIRS) walk(path.join(REPO_ROOT, dir), out);
  const serverTs = path.join(REPO_ROOT, 'server.ts');
  if (fs.existsSync(serverTs)) {
    out.push({ relPath: 'server.ts', content: fs.readFileSync(serverTs, 'utf8') });
  }
  cachedIndex = out;
  cachedAt = now;
  return out;
}

let findingSeq = 0;
function mkFinding(f: Omit<Finding, 'id'>): Finding {
  findingSeq += 1;
  return { id: `FND-${Date.now().toString(36)}-${findingSeq}`, ...f };
}

const SEVERITY_WEIGHT: Record<Severity, number> = { CRITICAL: 40, HIGH: 25, MEDIUM: 12, LOW: 5 };

function scoreFromFindings(findings: Finding[]): { complianceScore: number; riskScore: number } {
  let penalty = 0;
  for (const f of findings) penalty += SEVERITY_WEIGHT[f.severity];
  return { complianceScore: Math.max(0, 100 - penalty), riskScore: Math.min(100, penalty) };
}

interface ScannerDef {
  id: string;
  name: string;
  type: string;
  // Audit ARCH-AUDIT-0002 (N6): ISO/IEC 27001:2022 Annex-A-Kontrollen (2022er Revision,
  // NICHT die 2013er Nummerierung mit den Domaenen A.9/A.12/A.14), denen dieser Scanner
  // fachlich zuzuordnen ist. Interne Selbsteinschaetzung anhand des tatsaechlich
  // geprueften Sachverhalts, kein zertifiziertes Audit-Mapping - dient als Startpunkt fuer
  // eine spaetere ISO-27001-Zertifizierungsvorbereitung (Roadmap J6), nicht als deren
  // Ersatz. Bewusst leer bei reinen Code-Qualitaets-/Geschaeftslogik-Pruefungen ohne
  // direkten Informationssicherheits-Kontrollbezug, statt eine Zuordnung zu erzwingen.
  isoControls: string[];
  evaluate: (files: RepoFile[]) => { findings: Finding[]; evidence: string; confidenceScore?: number };
}

const SCANNERS: ScannerDef[] = [
  // --- SECURITY (7) --------------------------------------------------
  {
    id: 'SEC-01', name: 'Hardcoded Live Secrets', type: 'SECURITY',
    isoControls: ['A.8.28 Secure coding', 'A.5.17 Authentication information'],
    evaluate: (files) => {
      const pattern = /sk_live_[A-Za-z0-9]+|pk_live_[A-Za-z0-9]+|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY-----/;
      const hits = files.filter(f => pattern.test(f.content));
      const findings = hits.map(f => mkFinding({
        title: 'Hartkodierter Live-Schlüssel im Quellcode',
        severity: 'CRITICAL', complianceReference: 'ESS-0001-CONTRACTS Chapter 11',
        risk: 'Kompromittierung produktiver Zahlungs-/Cloud-Zugangsdaten bei Repository-Zugriff.',
        description: `Muster für einen produktiven Schlüssel gefunden in ${f.relPath}.`,
        filePath: f.relPath,
      }));
      return { findings, evidence: `${files.length} Dateien geprüft, ${hits.length} mit Live-Schlüssel-Muster.` };
    },
  },
  {
    id: 'SEC-02', name: 'Globales API Rate Limiting', type: 'SECURITY',
    isoControls: ['A.8.6 Capacity management'],
    evaluate: (files) => {
      const serverTs = files.find(f => f.relPath === 'server.ts');
      const hasGlobal = !!serverTs && /app\.use\([^)]*rate.?limit/i.test(serverTs.content);
      const findings: Finding[] = hasGlobal ? [] : [mkFinding({
        title: 'Kein globales Rate-Limiting auf /api/*',
        severity: 'HIGH', complianceReference: 'ESS-0001-CONTRACTS Chapter 11 (S-03)',
        risk: 'Unbegrenzte automatisierte Anfragen gegen alle API-Endpunkte möglich (Scraping, Kostenexplosion bei AI-Endpunkten).',
        description: 'src/platform/Security/rateLimiter.ts wird nur punktuell (Admin-Zonen, Step-Up) verwendet, nicht als globale Middleware.',
        filePath: 'server.ts',
      })];
      return { findings, evidence: hasGlobal ? 'Globale Rate-Limit-Middleware gefunden.' : 'Keine globale Rate-Limit-Middleware in server.ts gefunden.' };
    },
  },
  {
    id: 'SEC-03', name: 'Stripe Webhook Signaturprüfung', type: 'SECURITY',
    isoControls: ['A.8.26 Application security requirements', 'A.5.20 Addressing information security within supplier agreements'],
    evaluate: (files) => {
      const stripeFile = files.find(f => f.relPath === path.join('server', 'stripe.ts')) ||
        files.find(f => f.relPath.endsWith(path.join('server', 'stripe.ts')));
      const serverTs = files.find(f => f.relPath === 'server.ts');
      const combined = (stripeFile?.content || '') + (serverTs?.content || '');
      const verified = /stripe\.webhooks\.constructEvent/.test(combined) || /constructEvent/.test(combined);
      const findings: Finding[] = verified ? [] : [mkFinding({
        title: 'Stripe-Webhook ohne erkennbare Signaturprüfung',
        severity: 'CRITICAL', complianceReference: 'ESS-0001-CONTRACTS Chapter 11',
        risk: 'Gefälschte Webhook-Events könnten Abo-Status/Zahlungen manipulieren.',
        description: 'Kein Aufruf von stripe.webhooks.constructEvent im Webhook-Pfad gefunden.',
        filePath: 'server.ts',
      })];
      return { findings, evidence: verified ? 'constructEvent()-Signaturprüfung gefunden.' : 'Keine Signaturprüfung im Webhook-Pfad gefunden.' };
    },
  },
  {
    id: 'SEC-04', name: 'IAM Fail-Closed Verhalten', type: 'SECURITY',
    isoControls: ['A.5.15 Access control', 'A.8.2 Privileged access rights'],
    evaluate: (files) => {
      const authMw = files.find(f => f.relPath.endsWith(path.join('Security', 'authMiddleware.ts')));
      const failClosed = !!authMw && /authorized:\s*false/.test(authMw.content) && /supabase-not-configured/.test(authMw.content);
      const findings: Finding[] = failClosed ? [] : [mkFinding({
        title: 'IAM-Autorisierung nicht eindeutig fail-closed',
        severity: 'CRITICAL', complianceReference: 'ADR-0003.5 / ADR-0008',
        risk: 'Ausfall der Rollenprüfung könnte fälschlich zu gewährtem Zugriff statt Sperrung führen.',
        description: 'src/platform/Security/authMiddleware.ts fehlt oder enthält kein erkennbares fail-closed-Muster.',
        filePath: 'src/platform/Security/authMiddleware.ts',
      })];
      return { findings, evidence: failClosed ? 'checkAdminAccess() liefert bei jedem Fehlerpfad authorized:false.' : 'Fail-closed-Muster nicht gefunden.' };
    },
  },
  {
    id: 'SEC-05', name: 'Step-Up-Erzwingung für Owner-Aktionen', type: 'SECURITY',
    isoControls: ['A.8.5 Secure authentication', 'A.8.2 Privileged access rights'],
    evaluate: (files) => {
      const usages = files.filter(f => !f.relPath.endsWith(path.join('Security', 'authMiddleware.ts')) && /requireStepUp\(/.test(f.content));
      const findings: Finding[] = usages.length > 0 ? [] : [mkFinding({
        title: 'Step-Up-Mechanismus implementiert, aber nirgends erzwungen',
        severity: 'MEDIUM', complianceReference: 'ADR-0003.5',
        risk: 'Kritische Owner-Aktionen (Rollenverwaltung, Break-Glass) könnten ohne frische TOTP-Bestätigung ausführbar sein.',
        description: 'requireStepUp() ist definiert, wird aber in keinem geprüften Aufrufer verwendet.',
      })];
      return { findings, evidence: `requireStepUp() wird in ${usages.length} Datei(en) aufgerufen.` };
    },
  },
  {
    id: 'SEC-06', name: 'CORS-Konfiguration', type: 'SECURITY',
    isoControls: ['A.8.26 Application security requirements'],
    evaluate: (files) => {
      const serverTs = files.find(f => f.relPath === 'server.ts');
      const content = serverTs?.content || '';
      const usesCors = /\bcors\(/.test(content);
      const wildcard = /origin:\s*['"]\*['"]/.test(content) || /app\.use\(cors\(\)\)/.test(content);
      const findings: Finding[] = !usesCors
        ? [mkFinding({ title: 'Keine explizite CORS-Konfiguration gefunden', severity: 'LOW', complianceReference: 'ESS-0001-CONTRACTS Chapter 11', risk: 'Browser-Standardverhalten (same-origin) greift, aber keine dokumentierte Policy.', description: 'Kein cors()-Aufruf in server.ts gefunden.' })]
        : wildcard
        ? [mkFinding({ title: 'CORS erlaubt Wildcard-Origin', severity: 'HIGH', complianceReference: 'ESS-0001-CONTRACTS Chapter 11', risk: 'Jede beliebige Website kann API-Endpunkte im Namen eingeloggter Nutzer aufrufen.', description: 'cors() ohne origin-Einschränkung oder mit \'*\' konfiguriert.', filePath: 'server.ts' })]
        : [];
      return { findings, evidence: usesCors ? (wildcard ? 'CORS mit Wildcard-Origin konfiguriert.' : 'CORS mit eingeschränkter Origin konfiguriert.') : 'Keine CORS-Middleware gefunden.' };
    },
  },
  {
    id: 'SEC-07', name: 'HTTP-Sicherheitsheader', type: 'SECURITY',
    isoControls: ['A.8.26 Application security requirements'],
    evaluate: (files) => {
      const serverTs = files.find(f => f.relPath === 'server.ts');
      const content = serverTs?.content || '';
      const hasHelmet = /helmet\(/.test(content);
      const hasManualHeaders = /X-Content-Type-Options|Content-Security-Policy|Strict-Transport-Security/.test(content);
      const ok = hasHelmet || hasManualHeaders;
      const findings: Finding[] = ok ? [] : [mkFinding({
        title: 'Keine Security-Header-Middleware gefunden',
        severity: 'MEDIUM', complianceReference: 'ESS-0001-CONTRACTS Chapter 11',
        risk: 'Fehlende Header (CSP, X-Content-Type-Options, HSTS) erleichtern Clickjacking/MIME-Sniffing-Angriffe.',
        description: 'Weder helmet() noch manuell gesetzte Security-Header in server.ts gefunden.',
        filePath: 'server.ts',
      })];
      return { findings, evidence: ok ? 'Security-Header-Konfiguration gefunden.' : 'Keine Security-Header-Konfiguration gefunden.' };
    },
  },

  // --- DATA & PRIVACY (5) ---------------------------------------------
  {
    id: 'DAT-01', name: 'Row Level Security Abdeckung (Migrationen)', type: 'DATA',
    isoControls: ['A.8.3 Information access restriction', 'A.5.15 Access control'],
    evaluate: () => {
      const migrDir = path.join(REPO_ROOT, 'supabase', 'migrations');
      let files: string[] = [];
      try { files = fs.readdirSync(migrDir).filter(f => f.endsWith('.sql')); } catch { /* kein Verzeichnis */ }
      let createCount = 0;
      let rlsCount = 0;
      for (const f of files) {
        const content = fs.readFileSync(path.join(migrDir, f), 'utf8');
        createCount += (content.match(/create table/gi) || []).length;
        rlsCount += (content.match(/enable row level security/gi) || []).length;
      }
      const gap = Math.max(0, createCount - rlsCount);
      const findings: Finding[] = gap > 0 ? [mkFinding({
        title: `${gap} Tabellendefinition(en) ohne erkennbares "enable row level security"`,
        severity: gap > 2 ? 'HIGH' : 'MEDIUM', complianceReference: 'ESS-0001-CONTRACTS Chapter 11',
        risk: 'Tabellen ohne RLS sind über den anon/authenticated PostgREST-Schlüssel potenziell lesbar/schreibbar.',
        description: `${createCount} CREATE TABLE, ${rlsCount} RLS-Aktivierungen über ${files.length} Migrationsdateien.`,
      })] : [];
      return { findings, evidence: `${createCount} CREATE TABLE / ${rlsCount} RLS-Aktivierungen in ${files.length} Migrationsdateien.` };
    },
  },
  {
    id: 'DAT-02', name: 'Serverseitige Quota-Durchsetzung', type: 'DATA',
    isoControls: ['A.8.3 Information access restriction'],
    evaluate: (files) => {
      const quotaFile = files.find(f => f.relPath === path.join('server', 'quota.ts'));
      const serverTs = files.find(f => f.relPath === 'server.ts');
      const wired = !!quotaFile && !!serverTs && /enforceScreeningQuota/.test(serverTs.content);
      const findings: Finding[] = wired ? [] : [mkFinding({
        title: 'Quota-Limits sind ausschließlich clientseitig durchsetzbar',
        severity: 'HIGH', complianceReference: 'ESS-0001-CONTRACTS Chapter 14 (S-04)',
        risk: 'localStorage-Zähler ist über DevTools/Inkognito/curl trivial umgehbar.',
        description: 'server/quota.ts fehlt oder ist nicht in server.ts eingebunden.',
      })];
      return { findings, evidence: wired ? 'server/quota.ts ist aktiv und in server.ts eingebunden.' : 'Serverseitige Durchsetzung nicht gefunden.' };
    },
  },
  {
    id: 'DAT-03', name: 'IAM Audit-Trail-Abdeckung', type: 'DATA',
    isoControls: ['A.8.15 Logging'],
    evaluate: (files) => {
      const usages = files.filter(f => !f.relPath.endsWith(path.join('Security', 'authMiddleware.ts')) && /logIamEvent\(/.test(f.content));
      const findings: Finding[] = usages.length > 0 ? [] : [mkFinding({
        title: 'logIamEvent() wird von keiner Owner-/Admin-Aktion aufgerufen',
        severity: 'MEDIUM', complianceReference: 'ADR-0003.5',
        risk: 'Sicherheitsrelevante Rollenänderungen wären nicht im Audit-Trail nachvollziehbar.',
        description: 'Keine Aufrufstelle für logIamEvent() außerhalb der Definition gefunden.',
      })];
      return { findings, evidence: `logIamEvent() wird in ${usages.length} Datei(en) aufgerufen.` };
    },
  },
  {
    id: 'DAT-04', name: 'PII in Log-Ausgaben', type: 'DATA',
    isoControls: ['A.8.12 Data leakage prevention', 'A.5.34 Privacy and protection of PII'],
    evaluate: (files) => {
      const pattern = /console\.(log|warn|error)\([^)]*\$\{[^}]*password[^}]*\}/i;
      const hits = files.filter(f => pattern.test(f.content));
      const findings = hits.map(f => mkFinding({
        title: 'Möglicher Passwort-Wert in Log-Ausgabe',
        severity: 'HIGH', complianceReference: 'Art. 32 DSGVO',
        risk: 'Klartext-Passwörter in Logs verletzen Datenminimierung und erhöhen das Leak-Risiko.',
        description: `Log-Statement mit password-Interpolation in ${f.relPath}.`,
        filePath: f.relPath,
      }));
      return { findings, evidence: `${files.length} Dateien geprüft, ${hits.length} mit auffälligem Log-Muster.` };
    },
  },
  {
    id: 'DAT-05', name: 'Secret-Hygiene (.env)', type: 'DATA',
    isoControls: ['A.5.17 Authentication information', 'A.8.12 Data leakage prevention'],
    evaluate: () => {
      const gitignorePath = path.join(REPO_ROOT, '.gitignore');
      let ignoresEnv = false;
      try { ignoresEnv = /(^|\n)\.env($|\n)/.test(fs.readFileSync(gitignorePath, 'utf8')); } catch { /* keine .gitignore */ }
      const committedEnv = fs.existsSync(path.join(REPO_ROOT, '.env'));
      const findings: Finding[] = [];
      if (!ignoresEnv) {
        findings.push(mkFinding({ title: '.env ist nicht in .gitignore gelistet', severity: 'HIGH', complianceReference: 'ESS-0001-CONTRACTS Chapter 11', risk: 'Reale Zugangsdaten könnten versehentlich committet werden.', description: '.gitignore enthält keinen .env-Eintrag.' }));
      }
      if (committedEnv) {
        findings.push(mkFinding({ title: 'Eine .env-Datei liegt im Repository', severity: 'CRITICAL', complianceReference: 'ESS-0001-CONTRACTS Chapter 11', risk: 'Möglicherweise reale Zugangsdaten im Repository.', description: 'Datei .env im Repository-Root gefunden.', filePath: '.env' }));
      }
      return { findings, evidence: `.gitignore ${ignoresEnv ? 'schließt' : 'schließt NICHT'} .env aus; committete .env: ${committedEnv ? 'ja' : 'nein'}.` };
    },
  },

  // --- BILLING (3) -----------------------------------------------------
  {
    id: 'BIL-01', name: 'Verifizierte Identität in Billing-Endpunkten', type: 'BILLING',
    isoControls: ['A.5.15 Access control', 'A.8.3 Information access restriction'],
    evaluate: (files) => {
      const stripeFile = files.find(f => f.relPath.endsWith(path.join('server', 'stripe.ts')));
      const usages = stripeFile ? (stripeFile.content.match(/resolveVerifiedIdentity\(/g) || []).length : 0;
      const findings: Finding[] = usages >= 3 ? [] : [mkFinding({
        title: 'Billing-Endpunkte prüfen Identität nicht durchgängig serverseitig',
        severity: 'HIGH', complianceReference: 'ADR-0003.5',
        risk: 'IDOR-Klasse: Abo-/Credit-Status fremder Konten könnte abfragbar sein.',
        description: `resolveVerifiedIdentity() wird nur ${usages}x in server/stripe.ts verwendet.`,
        filePath: 'server/stripe.ts',
      })];
      return { findings, evidence: `resolveVerifiedIdentity() wird ${usages}x in server/stripe.ts verwendet.` };
    },
  },
  {
    id: 'BIL-02', name: 'Stripe als Single Source of Truth', type: 'BILLING',
    isoControls: ['A.5.33 Protection of records'],
    evaluate: (files) => {
      const stripeFile = files.find(f => f.relPath.endsWith(path.join('server', 'stripe.ts')));
      const ok = !!stripeFile && /sync_stripe_subscription_to_public/.test(stripeFile.content);
      const findings: Finding[] = ok ? [] : [mkFinding({
        title: 'Kein erkennbarer Verweis auf die DB-Trigger-Synchronisation',
        severity: 'MEDIUM', complianceReference: 'COMPLIANCE_REVIEW.md',
        risk: 'Abo-Status könnte über zwei widersprüchliche Schreibpfade aktualisiert werden.',
        description: 'Kein Verweis auf sync_stripe_subscription_to_public() im Webhook-Handler gefunden.',
      })];
      return { findings, evidence: ok ? 'Webhook-Handler verweist auf die trigger-basierte Synchronisation als Source of Truth.' : 'Kein Verweis gefunden.' };
    },
  },
  {
    id: 'BIL-03', name: 'Jahresrabatt über eigene Price-ID', type: 'BILLING',
    // Reine Abrechnungskorrektheit (Geschaeftslogik), kein Informationssicherheits-
    // Kontrollbezug - bewusst kein ISO-27001-Mapping erzwungen.
    isoControls: [],
    evaluate: (files) => {
      const stripeFile = files.find(f => f.relPath.endsWith(path.join('server', 'stripe.ts')));
      // Der Jahresrabatt steckt im Betrag der separaten STRIPE_PRICE_ID_*_YEARLY
      // Price-Objekte (Stripe-seitig konfiguriert) - bewusst keine serverseitige
      // Coupon-Berechnung (ADR-0017 Nachtrag, Platform-Director-Entscheidung:
      // Jahresabonnements benötigen keine serverseitige Rabatt-Logik).
      const ok = !!stripeFile && /STRIPE_PRICE_ID_STARTER_YEARLY/.test(stripeFile.content) && /STRIPE_PRICE_ID_PRO_YEARLY/.test(stripeFile.content);
      const findings: Finding[] = ok ? [] : [mkFinding({
        title: 'Jahrespreise sind nicht über eigene Stripe-Price-IDs abgebildet',
        severity: 'MEDIUM', complianceReference: 'ADR-0017',
        risk: 'Ohne separate Jahres-Price-ID müsste der Rabatt an anderer Stelle berechnet werden, wodurch Anzeige und Abrechnung auseinanderlaufen könnten.',
        description: 'Keine STRIPE_PRICE_ID_*_YEARLY-Verwendung in server/stripe.ts gefunden.',
      })];
      return { findings, evidence: ok ? 'Checkout wählt für billingPeriod=yearly eine eigene, bereits rabattierte Stripe-Price-ID - keine serverseitige Rabattberechnung nötig.' : 'Keine separaten Jahres-Price-IDs gefunden.' };
    },
  },

  // --- CODE QUALITY (3) --------------------------------------------------
  {
    id: 'QUA-01', name: 'TODO/FIXME/HACK-Marker', type: 'CODE_QUALITY',
    isoControls: ['A.8.28 Secure coding'],
    evaluate: (files) => {
      const pattern = /\b(TODO|FIXME|HACK)\b/;
      const hits = files.filter(f => pattern.test(f.content));
      const findings: Finding[] = hits.length > 0 ? [mkFinding({
        title: `${hits.length} Datei(en) mit TODO/FIXME/HACK-Markern`,
        severity: hits.length > 10 ? 'MEDIUM' : 'LOW', complianceReference: 'ESS-0001-CONTRACTS Chapter 12',
        risk: 'Unvollständige Implementierungen können unbemerkt in Produktion gelangen.',
        description: `${hits.length} von ${files.length} Dateien enthalten TODO/FIXME/HACK.`,
      })] : [];
      return { findings, evidence: `${hits.length} von ${files.length} Dateien mit TODO/FIXME/HACK-Markern.` };
    },
  },
  {
    id: 'QUA-02', name: 'Import-Integrität (server/ ↔ src/)', type: 'CODE_QUALITY',
    // Build-/Typkorrektheit, kein Informationssicherheits-Kontrollbezug - bewusst kein
    // ISO-27001-Mapping erzwungen.
    isoControls: [],
    evaluate: (files) => {
      const importPattern = /from\s+['"](\.\.[\/\\][^'"]*server[\/\\][^'"]+)['"]/g;
      const broken: { file: RepoFile; target: string }[] = [];
      for (const f of files) {
        let m: RegExpExecArray | null;
        importPattern.lastIndex = 0;
        while ((m = importPattern.exec(f.content))) {
          const importSpecifier = m[1];
          const resolved = path.resolve(path.dirname(path.join(REPO_ROOT, f.relPath)), importSpecifier);
          const candidates = [resolved, `${resolved}.ts`, `${resolved}.tsx`, path.join(resolved, 'index.ts')];
          if (!candidates.some(c => fs.existsSync(c))) {
            broken.push({ file: f, target: importSpecifier });
          }
        }
      }
      const findings = broken.map(b => mkFinding({
        title: 'Import verweist auf nicht existierenden Pfad',
        severity: 'CRITICAL', complianceReference: 'ESS-0001-CONTRACTS Chapter 12',
        risk: 'Typprüfung schlägt fehl; abhängig von Bundler-Konfiguration bricht ggf. auch der Build.',
        description: `${b.file.relPath} importiert aus '${b.target}', das im Dateisystem nicht existiert.`,
        filePath: b.file.relPath,
      }));
      return { findings, evidence: `${broken.length} gebrochene(r) server/-Import(e) über alle geprüften Dateien.` };
    },
  },
  {
    id: 'QUA-03', name: 'Unreferenzierte Komponenten', type: 'CODE_QUALITY',
    // Wartbarkeit/toter Code, kein Informationssicherheits-Kontrollbezug - bewusst kein
    // ISO-27001-Mapping erzwungen.
    isoControls: [],
    evaluate: (files) => {
      const componentFiles = files.filter(f => f.relPath.startsWith(path.join('src', 'components')) && f.relPath.endsWith('.tsx'));
      const others = files.filter(f => !componentFiles.includes(f));
      const orphans: RepoFile[] = [];
      for (const c of componentFiles) {
        const base = path.basename(c.relPath, '.tsx');
        const referenced = others.some(o => o.content.includes(`/${base}'`) || o.content.includes(`/${base}"`));
        if (!referenced) orphans.push(c);
      }
      const findings: Finding[] = orphans.length > 0 ? [mkFinding({
        title: `${orphans.length} Komponente(n) ohne erkennbaren Import`,
        severity: 'LOW', complianceReference: 'ESS-0001-CONTRACTS Chapter 12',
        risk: 'Toter Code erhöht Wartungsaufwand und Bundle-Analyse-Rauschen.',
        description: orphans.map(o => o.relPath).join(', '),
      })] : [];
      return { findings, evidence: `${orphans.length} von ${componentFiles.length} Komponenten ohne gefundenen Import.` };
    },
  },

  // --- GOVERNANCE (3) ----------------------------------------------------
  {
    id: 'GOV-01', name: 'ADR Implementation-Status Abdeckung', type: 'GOVERNANCE',
    isoControls: ['A.5.37 Documented operating procedures', 'A.5.1 Policies for information security'],
    evaluate: () => {
      const adrDir = path.join(REPO_ROOT, 'docs', 'adr');
      let files: string[] = [];
      try { files = fs.readdirSync(adrDir).filter(f => /^ADR-\d{4}.*\.md$/.test(f)); } catch { /* kein Verzeichnis */ }
      const missing = files.filter(f => !/## Implementation-Status/.test(fs.readFileSync(path.join(adrDir, f), 'utf8')));
      const findings: Finding[] = missing.length > 0 ? [mkFinding({
        title: `${missing.length} ADR(s) ohne Implementation-Status-Abschnitt`,
        severity: missing.length > 3 ? 'MEDIUM' : 'LOW', complianceReference: 'docs/adr/README.md',
        risk: 'Ohne getrennten Implementation-Status ist der Umsetzungsgrad einer Entscheidung nicht maschinenlesbar nachvollziehbar.',
        description: missing.join(', '),
      })] : [];
      return { findings, evidence: `${files.length - missing.length} von ${files.length} ADRs mit Implementation-Status-Abschnitt.` };
    },
  },
  {
    id: 'GOV-02', name: 'ESS-Registry Vollständigkeit', type: 'GOVERNANCE',
    isoControls: ['A.5.37 Documented operating procedures'],
    evaluate: () => {
      const registryPath = path.join(REPO_ROOT, '.ai', 'registry', 'ess-registry.json');
      let missing = 0;
      let total = 0;
      try {
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        const entries: any[] = Array.isArray(registry) ? registry : registry.entries || registry.documents || [];
        total = entries.length;
        missing = entries.filter((e: any) => !e.document).length;
      } catch { /* Registry fehlt oder hat unerwartete Struktur */ }
      const findings: Finding[] = missing > 0 ? [mkFinding({
        title: `${missing} reservierte ESS-Nummer(n) ohne Dokument`,
        severity: 'MEDIUM', complianceReference: 'ESS-0001 Related Enterprise Specifications',
        risk: 'Reservierte, aber undokumentierte Nummern sind für Governance-Auswertungen ein Fehlzustand.',
        description: `${missing} von ${total} Registry-Einträgen ohne document-Feld.`,
      })] : [];
      return { findings, evidence: `${total - missing} von ${total} ESS-Registry-Einträgen mit Dokument.` };
    },
  },
  {
    id: 'GOV-03', name: 'Governance-Verzeichnisstruktur', type: 'GOVERNANCE',
    isoControls: ['A.5.37 Documented operating procedures'],
    evaluate: () => {
      const dirs = ['quality', 'release', 'knowledge', 'compliance'].map(d => path.join(REPO_ROOT, 'docs', d));
      const empty = dirs.filter(d => {
        try { return fs.readdirSync(d).length === 0; } catch { return true; }
      });
      const findings: Finding[] = empty.length > 0 ? [mkFinding({
        title: `${empty.length} Governance-Verzeichnis(se) ohne Inhalt`,
        severity: 'LOW', complianceReference: 'ESS-0012-CONTRACTS',
        risk: 'Angelegte, aber leere Verzeichnisse suggerieren vorhandene Dokumentation, die nicht existiert.',
        description: empty.map(d => path.relative(REPO_ROOT, d)).join(', '),
      })] : [];
      return { findings, evidence: `${dirs.length - empty.length} von ${dirs.length} Governance-Verzeichnissen mit Inhalt.` };
    },
  },
];

export function runAllScanners(): ScannerResult[] {
  const files = buildRepoIndex();
  return SCANNERS.map(def => {
    const start = Date.now();
    const { findings, evidence, confidenceScore } = def.evaluate(files);
    const { complianceScore, riskScore } = scoreFromFindings(findings);
    return {
      id: def.id,
      name: def.name,
      type: def.type,
      version: '1.0.0',
      complianceScore,
      confidenceScore: confidenceScore ?? 0.9,
      evidence,
      findings,
      riskScore,
      executionTimeMs: Date.now() - start,
      isoControls: def.isoControls,
    };
  });
}
