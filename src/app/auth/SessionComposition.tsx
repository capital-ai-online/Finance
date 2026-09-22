/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { SubscriptionTier, UserSession } from '../types/UserSession';

export interface SessionCompositionValue {
  userSession: UserSession | null;
  authBootstrapPending: boolean;
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
  handleLogout: () => Promise<void>;
  handleGlobalLogout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

interface SessionCompositionProps {
  children: (value: SessionCompositionValue) => React.ReactNode;
}

const VALID_TIERS = new Set<SubscriptionTier>(['Free', 'Starter', 'Pro', 'Enterprise']);

function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === 'string' && VALID_TIERS.has(value as SubscriptionTier);
}

/**
 * OPS-AUTH-BACKEND-01 browser adapter.
 *
 * Authentication authority lives entirely behind /api/auth/*. The browser owns no Supabase
 * session, OAuth callback, MFA/onboarding choreography, refresh token, bearer token or auth
 * localStorage state. Public UI renders immediately; this adapter only projects the backend's
 * already-verified session view when it becomes available.
 */
export function SessionComposition({ children }: SessionCompositionProps) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [authBootstrapPending, setAuthBootstrapPending] = useState(true);
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  const refreshSession = useCallback(async () => {
    setAuthBootstrapPending(true);
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        setUserSession(null);
        return;
      }

      const payload = await response.json().catch(() => null);
      if (payload?.authenticated !== true) {
        setUserSession(null);
        return;
      }

      const user = payload?.user;
      if (
        !user ||
        typeof user.id !== 'string' ||
        typeof user.name !== 'string' ||
        typeof user.email !== 'string' ||
        !isSubscriptionTier(user.subscriptionTier)
      ) {
        console.error('[Auth] Backend returned an invalid session projection.');
        setUserSession(null);
        return;
      }

      setUserSession({
        type: 'registered',
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
      });
      setJustLoggedOut(false);
    } catch (error) {
      console.warn('[Auth] Backend session readback failed:', error);
      setUserSession(null);
    } finally {
      setAuthBootstrapPending(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUserSession(null);
      setAuthBootstrapPending(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const performLogout = async (scope: 'local' | 'global') => {
    // UI logout is immediate and cannot be held hostage by provider/network cleanup.
    setUserSession(null);
    setAuthBootstrapPending(false);
    setJustLoggedOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });
    } catch (error) {
      console.warn('[Auth] Backend logout request failed after local projection was cleared:', error);
    }
  };

  return children({
    userSession,
    authBootstrapPending,
    justLoggedOut,
    clearJustLoggedOut: () => setJustLoggedOut(false),
    handleLogout: () => performLogout('local'),
    handleGlobalLogout: () => performLogout('global'),
    refreshSession,
  });
}
