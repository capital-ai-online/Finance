import {
  assertDocumentationHygiene,
  DOCUMENTATION_HYGIENE_VALIDATOR_VERSION,
} from '../../src/platform/Documentary/Governance/Services/DocumentationHygieneValidator';

try {
  assertDocumentationHygiene(process.cwd());
  console.log(`[docs-hygiene] PASS ${DOCUMENTATION_HYGIENE_VALIDATOR_VERSION}`);
} catch (error) {
  console.error(`[docs-hygiene] FAIL-CLOSED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
