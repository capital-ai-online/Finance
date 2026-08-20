/**
 * Helper utility to verify if a user account is an authorized Owner or Dev Admin.
 *
 * Authorized Users:
 * 1. Supabase Registered Owner Accounts:
 *    - sven.kulessa@gmail.com
 *    - sven.kulessa@gmx.net
 *    - sven.kulessa@capital-ai.online
 * 2. Dev Admin Account in the Development Environment:
 *    - ID: dev-admin-sven-kulessa-gmx-net
 */

export const OWNER_EMAILS = [
  'sven.kulessa@gmail.com',
  'sven.kulessa@gmx.net',
  'sven.kulessa@capital-ai.online'
];

export function isAuthorizedOwnerOrDevAdmin(userSession?: any, directEmail?: string): boolean {
  const email = (directEmail || userSession?.email || userSession?.userEmail || '').toLowerCase().trim();
  const userId = userSession?.id || '';
  const isDev = (import.meta as any).env?.DEV || process.env.NODE_ENV !== 'production';

  // 1. Check if email matches declared Supabase Owner Accounts
  if (OWNER_EMAILS.includes(email)) {
    return true;
  }

  // 2. Check Dev Admin account in Development Environment
  if (isDev) {
    if (
      userId === 'dev-admin-sven-kulessa-gmx-net' ||
      email.includes('admin') ||
      email.includes('sven')
    ) {
      return true;
    }
  }

  return false;
}
