import type { UserSession } from '../types/UserSession';
import { Dashboard as LegacyDashboard } from '../../components/Dashboard';

export interface DashboardProps {
  userSession: UserSession;
  onLogout: () => void;
  onRegister: (name: string, email: string) => void;
  onLoginEmail?: (email: string, password: string) => Promise<void>;
  onRegisterEmail?: (name: string, email: string, password: string) => Promise<void>;
}

/**
 * Canonical dashboard composition entry for BB-2.
 *
 * The legacy implementation remains the bounded strangler target until the
 * internal view/router/navigation slices are migrated. Application routing
 * must depend on this app-layer entry rather than importing src/components
 * directly.
 */
export function Dashboard(props: DashboardProps) {
  return <LegacyDashboard {...props} />;
}
