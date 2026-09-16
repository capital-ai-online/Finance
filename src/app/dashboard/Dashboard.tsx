import type { UserSession } from '../types/UserSession';
import { Dashboard as LegacyDashboard } from '../../components/Dashboard';

export interface DashboardProps {
  userSession: UserSession;
  onLogout: () => void;
  onGlobalLogout?: () => Promise<void>;
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
export function Dashboard({ onGlobalLogout, ...props }: DashboardProps) {
  const handleGlobalLogoutClick = async () => {
    if (!onGlobalLogout) return;

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Von allen Geräten abmelden? Bestehende Sitzungen werden serverseitig abgemeldet. Bereits ausgestellte Access-Tokens können bis zu ihrem Ablauf gültig bleiben.',
      );
      if (!confirmed) return;
    }

    await onGlobalLogout();
  };

  return (
    <LegacyDashboard
      {...props}
      onGlobalLogout={onGlobalLogout ? handleGlobalLogoutClick : undefined}
    />
  );
}
