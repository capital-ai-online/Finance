import type { VocabularyConcept } from '../Domain/VocabularyConcept';

const vocabularyAuthority = ['ADR-0078'];
const securityTraceability = ['OWASP-ASVS-5.0.0', 'SEC-03', 'SEC-08', 'SEC-SOTA-04'];
const aiDevelopmentCategory: VocabularyConcept['category'] = 'ai-development-chat-execution';

export const securityVerificationConcepts: VocabularyConcept[] = [
  {
    id: 'VOC-AIDEV-0042',
    canonicalCodeTerm: 'OWASPASVS',
    displayNameDE: 'OWASP Application Security Verification Standard (ASVS)',
    displayNameEN: 'OWASP Application Security Verification Standard (ASVS)',
    definitionDE:
      'Externer, nicht repository-autorisierender OWASP-Standard mit prüfbaren Anforderungen zur Verifikation der Anwendungssicherheit; die aktuell stabile, für CAPITAL-AI referenzierte Version ist ASVS 5.0.0.',
    definitionEN:
      'External, non-repository-authorizing OWASP standard containing verifiable application-security requirements; the current stable version referenced by CAPITAL-AI is ASVS 5.0.0.',
    aliases: ['ASVS', 'Application Security Verification Standard'],
    forbiddenTerms: [],
    category: aiDevelopmentCategory,
    status: 'approved',
    version: '1.0.0',
    essReferences: ['ESS-0017', 'ESS-0017-CONTRACTS'],
    adrReferences: vocabularyAuthority,
    traceabilityReferences: securityTraceability,
  },
  {
    id: 'VOC-AIDEV-0043',
    canonicalCodeTerm: 'ASVSVerificationMatrix',
    displayNameDE: 'ASVS-Verifikationsmatrix',
    displayNameEN: 'ASVS verification matrix',
    definitionDE:
      'Strukturierte, evidenzbasierte Zuordnung versionierter OWASP-ASVS-Anforderungen zu relevanten Security Controls, Implementierungen, Tests, Evidence, Verifikationsstatus und zuständigen Ownern; sie dient der Abdeckungs- und Gap-Analyse und ist weder ein eigener Sicherheitsstandard noch alleiniger Nachweis vollständiger ASVS-Konformität.',
    definitionEN:
      'Structured, evidence-based mapping of versioned OWASP ASVS requirements to relevant security controls, implementations, tests, evidence, verification status and accountable owners; it supports coverage and gap analysis and is neither a separate security standard nor sufficient proof of complete ASVS conformance on its own.',
    aliases: ['ASVS Matrix', 'ASVS-Matrix'],
    forbiddenTerms: ['ASVA Matrix', 'ASVA-Matrix'],
    category: aiDevelopmentCategory,
    status: 'approved',
    version: '1.0.0',
    essReferences: ['ESS-0017', 'ESS-0017-CONTRACTS'],
    adrReferences: vocabularyAuthority,
    traceabilityReferences: securityTraceability,
  },
];
