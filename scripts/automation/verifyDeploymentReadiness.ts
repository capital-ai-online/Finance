// ARCH-AUDIT-0002 (H7, Kapitel 14.5): "Deployment-Rollback und Backup-Verfahren". Dieses
// Skript ist der automatisierbare Teil des Runbooks
// (docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md): eine Pre-Deploy-Pruefung, die
// vorhersehbare Deployment-Fehlkonfigurationen abfaengt, BEVOR sie in Produktion sichtbar
// werden - Rollback ist immer ein Notfall-Mechanismus, keine erste Verteidigungslinie.
//
// Prueft:
// 1. render.yaml hat einen healthCheckPath (Voraussetzung fuer Renders automatisches
//    Zero-Downtime-Deploy mit Rollback-auf-Fehlschlag - siehe Runbook Abschnitt 1).
// 2. Jede in server.ts/server/**/*.ts ueber getCleanEnv() referenzierte Variable ist entweder
//    in render.yaml gelistet, Teil einer bekannten Alternativnamen-Gruppe (mind. ein Mitglied
//    gelistet) oder auf der bekannten Optional-Liste (hartkodierter Fallback im Code
//    verifiziert, siehe Kommentare unten) - alles andere ist ein echter, bisher unbekannter
//    Konfigurationsluecken-Kandidat und wird als Fehler gemeldet statt stillschweigend
//    ignoriert.
// 3. supabase/migrations/ ist nicht leer und jede Datei folgt der Zeitstempel-Namenskonvention
//    (Voraussetzung fuer eine nachvollziehbare Schema-Rekonstruktion, siehe Runbook
//    Abschnitt 3).

import fs from 'fs';
import path from 'path';

const REPO_ROOT = process.cwd();
let hasErrors = false;

function fail(message: string) {
  console.error(`[FEHLER] ${message}`);
  hasErrors = true;
}

function ok(message: string) {
  console.log(`[OK] ${message}`);
}

// --- 1. render.yaml: healthCheckPath ---------------------------------------------------
const renderYamlPath = path.join(REPO_ROOT, 'render.yaml');
const renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
if (/healthCheckPath:\s*\S+/.test(renderYaml)) {
  ok('render.yaml definiert healthCheckPath.');
} else {
  fail('render.yaml hat keinen healthCheckPath - Render kann fehlgeschlagene Deploys nicht automatisch erkennen/zurueckrollen.');
}

// --- 2. Env-Var-Abdeckung ----------------------------------------------------------------
// Audit-verifiziert (Kommentare an den jeweiligen Fundstellen, Stand H7): diese Variablen
// haben einen hartkodierten Fallback im Code und sind daher fuer den Betrieb nicht
// zwingend erforderlich. Bei Erweiterung um neue getCleanEnv()-Aufrufe OHNE Fallback muss
// diese Liste NICHT angepasst werden - nur fuer bewusst optionale Variablen.
const KNOWN_OPTIONAL_ENV_VARS = new Set([
  'NODE_ENV', // von der Laufzeitumgebung gesetzt, kein Secret.
  'LLAMA_LOCAL_ENDPOINT', // server/orchestrator.ts: rein informativer configured-Flag, kein Produktionspfad.
  'OWNER_DISPLAY_NAME', 'OWNER_BUSINESS_EMAIL', 'OWNER_DEFAULT_AUTHOR_EMAIL', 'OWNER_NOTIFICATION_EMAIL', 'OWNER_LEGACY_EMAILS', // server/ownerConfig_server.ts: alle mit hartkodiertem Fallback.
  'RENDER_EXTERNAL_URL', // server/alerts.ts (H2): von Render automatisch gesetzt, lokaler Fallback auf localhost.
  'PORT', // server/alerts.ts (H2): hartkodierter Fallback '3000', identisch zu server.ts' eigener PORT-Konstante.
  'ANTHROPIC_MODEL', // server/anthropicClient.ts (J3): hartkodierter Fallback 'claude-haiku-4-5'.
  'OPENAI_MODEL', // server/openaiClient.ts (J3-Folge): hartkodierter Fallback 'gpt-5.4-mini'.
]);

// Gruppen von Variablen, die sich gegenseitig per `||` vertreten (server/db.ts, server/stripe.ts) -
// es reicht, wenn EIN Mitglied der Gruppe in render.yaml gelistet ist.
const ALTERNATE_NAME_GROUPS: string[][] = [
  ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
  ['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
  ['STRIPE_PUBLISHABLE_KEY', 'VITE_STRIPE_PUBLISHABLE_KEY'],
];

function findEnvVarUsages(): Set<string> {
  const found = new Set<string>();
  const directPattern = /getCleanEnv\(\s*['"]([A-Z_0-9]+)['"]\s*\)/g;
  // ADR-0020: server/socialMedia/oauthProviders.ts liest Client-ID/Secret NICHT per
  // getCleanEnv('LITERAL'), sondern dynamisch ueber ein Config-Objekt
  // (getCleanEnv(cfg.clientIdEnvVar)) - der obige Pattern kann das grundsaetzlich nicht
  // erfassen, egal wie viele Plattformen noch dazukommen. Dieser zweite Pattern greift
  // stattdessen die literalen Variablennamen an ihrer Deklarationsstelle ab
  // (clientIdEnvVar: 'X', clientSecretEnvVar: 'Y'), damit neue Plattform-Eintraege in
  // OAUTH_PROVIDERS automatisch mitgeprueft werden, ohne dieses Skript je wieder anfassen
  // zu muessen.
  const dynamicEnvVarPattern = /(?:clientIdEnvVar|clientSecretEnvVar):\s*['"]([A-Z_0-9]+)['"]/g;
  const files: string[] = [];

  const serverTs = path.join(REPO_ROOT, 'server.ts');
  if (fs.existsSync(serverTs)) files.push(serverTs);

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts')) files.push(full);
    }
  };
  walk(path.join(REPO_ROOT, 'server'));
  // ARCH-AUDIT-0002 (J5, 2026-08-02): server-seitiger Code lebt seitdem nicht mehr
  // ausschliesslich unter server/ - src/platform/Security, src/platform/Compliance und
  // src/platform/VersionManager enthalten physisch verschobenen, echten Backend-Code mit
  // eigenen getCleanEnv()-Aufrufen (z.B. TOTP_ENCRYPTION_KEY in secretCrypto.ts). Ohne diesen
  // zweiten Scan-Pfad wuerde die Env-Var-Abdeckungspruefung fuer neue getCleanEnv()-Aufrufe in
  // diesen Dateien lautlos blind werden. src/ enthaelt auch Client-Code, aber getCleanEnv()
  // ist eine server-only Hilfsfunktion (server/env.ts) - ein zusaetzlicher Scan schadet nicht,
  // er findet nur zusaetzliche echte Treffer.
  walk(path.join(REPO_ROOT, 'src'));

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    directPattern.lastIndex = 0;
    while ((m = directPattern.exec(content))) found.add(m[1]);
    dynamicEnvVarPattern.lastIndex = 0;
    while ((m = dynamicEnvVarPattern.exec(content))) found.add(m[1]);
  }
  return found;
}

function findRenderYamlKeys(): Set<string> {
  const found = new Set<string>();
  const pattern = /key:\s*([A-Z_0-9]+)/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(renderYaml))) found.add(m[1]);
  return found;
}

const usedVars = findEnvVarUsages();
const renderYamlKeys = findRenderYamlKeys();
const alternateGroupOf = new Map<string, string[]>();
for (const group of ALTERNATE_NAME_GROUPS) {
  for (const name of group) alternateGroupOf.set(name, group);
}

const uncoveredVars: string[] = [];
for (const name of usedVars) {
  if (renderYamlKeys.has(name)) continue;
  if (KNOWN_OPTIONAL_ENV_VARS.has(name)) continue;
  const group = alternateGroupOf.get(name);
  if (group && group.some(alt => renderYamlKeys.has(alt))) continue;
  uncoveredVars.push(name);
}

if (uncoveredVars.length === 0) {
  ok(`Alle ${usedVars.size} in server.ts/server/**/*.ts referenzierten Env-Variablen sind in render.yaml, einer Alternativnamen-Gruppe oder der Optional-Liste abgedeckt.`);
} else {
  fail(`${uncoveredVars.length} Env-Variable(n) ohne render.yaml-Eintrag, Alternativnamen-Abdeckung oder bekannten Fallback: ${uncoveredVars.join(', ')}`);
}

// --- 3. Migrations-Verzeichnis -------------------------------------------------------------
const migrationsDir = path.join(REPO_ROOT, 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fail('supabase/migrations/ existiert nicht - Schema kann im Notfall nicht rekonstruiert werden.');
} else {
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  if (migrationFiles.length === 0) {
    fail('supabase/migrations/ enthaelt keine .sql-Dateien.');
  } else {
    const malformed = migrationFiles.filter(f => !/^\d{14}_.+\.sql$/.test(f));
    if (malformed.length > 0) {
      fail(`${malformed.length} Migrationsdatei(en) folgen nicht dem Zeitstempel-Namensschema (YYYYMMDDHHMMSS_name.sql): ${malformed.join(', ')}`);
    } else {
      ok(`${migrationFiles.length} Migrationsdateien vorhanden, alle folgen dem Namensschema.`);
    }
  }
}

if (hasErrors) {
  console.error('\n[verifyDeploymentReadiness] Fehlgeschlagen - siehe [FEHLER]-Zeilen oben.');
  process.exit(1);
} else {
  console.log('\n[verifyDeploymentReadiness] Alle Pruefungen bestanden.');
}
