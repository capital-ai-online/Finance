import { validateRepositoryConventions, type RepositoryConventionMode } from '../../src/platform/VersionManager/repositoryConventionValidator';

const mode: RepositoryConventionMode = process.argv.includes('--advisory') ? 'advisory' : 'strict';
const report = validateRepositoryConventions(process.cwd(), mode);

console.log(JSON.stringify(report, null, 2));

if (report.blocking) {
  console.error(`[Repository Convention Validator] ${report.summary.errors} blocking violation(s) detected.`);
  process.exit(1);
}

if (report.summary.warnings > 0) {
  console.warn(`[Repository Convention Validator] completed with ${report.summary.warnings} warning(s).`);
} else {
  console.log('[Repository Convention Validator] repository conventions verified.');
}
