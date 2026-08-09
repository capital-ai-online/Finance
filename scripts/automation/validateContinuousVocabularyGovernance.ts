import { validateContinuousVocabularyGovernance } from '../../src/platform/Vocabulary/Validators/ContinuousGovernanceValidator';

const report = validateContinuousVocabularyGovernance(process.cwd());
console.log(JSON.stringify(report, null, 2));

if (report.blocking) {
  console.error(`[Continuous Vocabulary Governance] ${report.findings.length} blocking finding(s) detected.`);
  process.exit(1);
}

console.log('[Continuous Vocabulary Governance] repository terminology verified.');
