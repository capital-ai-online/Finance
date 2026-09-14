import { prLifecycleSkill } from './prLifecycleSkill';
import { skillCatalog as baseSkillCatalog } from './skillCatalog';
import type { VerificationSkill } from './types';

/**
 * Active-authority projection for catalog consumers.
 * Historical/suspended references may remain discoverable evidence, but they are never
 * compiled into a verification prompt as current authority.
 */
export const skillCatalog: VerificationSkill[] = [
  ...baseSkillCatalog.map((skill) => {
    if (skill.id !== 'VERIFY-VERSION-MANAGER') return skill;

    return {
      ...skill,
      authorities: [
        'AGENTS.md',
        'ADR-0096',
        'CTRL-GOV-VERSION-001',
        'src/platform/VersionManager/manifest.json',
      ],
    };
  }),
  prLifecycleSkill,
];

export const skillById = new Map(skillCatalog.map((entry) => [entry.id, entry]));
