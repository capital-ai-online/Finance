import type { UserSession } from '../types/UserSession';
import { Dashboard as LegacyDashboard } from '../../components/Dashboard';

export interface DashboardProps {
  userSession: UserSession;
  onLogout: () => void;
  onGlobalLogout: () => Promise<void>;
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
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Von allen Geräten abmelden? Bestehende Sitzungen werden serverseitig abgemeldet. Bereits ausgestellte Access-Tokens können bis zu ihrem Ablauf gültig bleiben.',
      );
      if (!confirmed) return;
    }

    await onGlobalLogout();
  };

  return (
    <>
      <LegacyDashboard {...props} />
      <button
        type="button"
        data-testid="global-logout-action"
        onClick={() => void handleGlobalLogoutClick()}
        className="fixed bottom-4 right-4 z-20 min-h-11 rounded-lg border border-red-500/30 bg-neutral-950/95 px-4 py-2 text-xs font-bold text-red-200 shadow-lg backdrop-blur transition hover:bg-red-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        Von allen Geräten abmelden
      </button>
    </>
  );
}
