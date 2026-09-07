import React from 'react';
import { AdminPortal as LegacyAdminPortal } from '../../../components/AdminPortal';
import { CapitalAiProcessGraph } from './processGraph/CapitalAiProcessGraph';

type AdminPortalTab =
  | 'users'
  | 'auth'
  | 'markdown'
  | 'requests'
  | 'performance'
  | 'logs'
  | 'hygiene'
  | 'supervisor'
  | 'seo'
  | 'compliance';

export interface AdminPortalProps {
  currentUserEmail: string;
  activeTab: AdminPortalTab;
  onChangeTab: (tab: AdminPortalTab) => void;
}

/**
 * GOV-08 Strangler integration.
 * The existing AdminPortal remains the legacy implementation boundary while the
 * read-only process graph is composed through the canonical governance feature facade.
 */
export function AdminPortal(props: AdminPortalProps) {
  return (
    <div className="space-y-6">
      <CapitalAiProcessGraph />
      <LegacyAdminPortal {...props} />
    </div>
  );
}
