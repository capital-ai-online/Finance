import type { SeoKeyword } from './types';

/**
 * Initial keyword register for CAPITAL-AI public surfaces.
 * No fabricated rankings — only planned targets (No-Demo-Data).
 */
export const SEO_KEYWORD_SEED: Omit<SeoKeyword, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    phrase: 'quantitative investment screener',
    locale: 'en',
    intent: 'commercial',
    targetPath: '/',
    priority: 10,
    active: true,
  },
  {
    phrase: 'benjamin graham calculator online',
    locale: 'en',
    intent: 'informational',
    targetPath: '/',
    priority: 20,
    active: true,
  },
  {
    phrase: 'monte carlo portfolio simulator',
    locale: 'en',
    intent: 'commercial',
    targetPath: '/',
    priority: 30,
    active: true,
  },
  {
    phrase: 'dsgvo konforme trading software',
    locale: 'de',
    intent: 'commercial',
    targetPath: '/',
    priority: 15,
    active: true,
  },
  {
    phrase: 'capital-ai impressum',
    locale: 'de',
    intent: 'navigational',
    targetPath: '/impressum',
    priority: 90,
    active: true,
  },
  {
    phrase: 'capital-ai datenschutz',
    locale: 'de',
    intent: 'navigational',
    targetPath: '/datenschutz',
    priority: 90,
    active: true,
  },
];
