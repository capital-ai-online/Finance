import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Echte Passkey-Verwaltung auf Basis der nativen Supabase-Auth-Passkey-API (Beta, seit Mai 2026).
 * Ersetzt die vorherige rein client-seitige Simulation (SicherheitsmanagementPoC.tsx),
 * nachdem die Architektur-Integration damit erfolgreich verifiziert wurde.
 *
 * Voraussetzungen (müssen VOR der Nutzung erfüllt sein):
 * 1. Dashboard: Authentication -> Passkeys -> "Enable Passkey authentication" aktiv
 * 2. Relying Party ID / Origins auf die echte Produktionsdomain gesetzt
 * 3. Nutzer ist eingeloggt (Passkey-Registrierung setzt eine bestehende, bestätigte Session voraus)
 */

interface PasskeyEntry {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
}

export default function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<PasskeyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    void loadPasskeys();
    void loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    setCurrentUserEmail(data.user?.email ?? null);
  }

  async function loadPasskeys() {
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase-Client ist nicht konfiguriert (fehlende ENV-Variablen).' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.passkey.list();
      if (error) throw error;
      setPasskeys(data ?? []);
    } catch (e: any) {
      setMessage({ type: 'error', text: `Passkeys konnten nicht geladen werden: ${e.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!supabase) return;
    setMessage(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) {
        // Bekannte Fehlercodes laut Supabase-Doku sauber behandeln
        if ((error as any).code === 'passkey_disabled') {
          setMessage({ type: 'error', text: 'Passkey-Anmeldung ist im Supabase-Dashboard noch nicht aktiviert (Authentication → Passkeys).' });
        } else if ((error as any).code === 'too_many_passkeys') {
          setMessage({ type: 'error', text: 'Maximale Anzahl an Passkeys für dieses Konto erreicht.' });
        } else if ((error as any).code === 'webauthn_credential_exists') {
          setMessage({ type: 'info', text: 'Dieser Passkey (Gerät/Authenticator) ist bereits registriert.' });
        } else {
          setMessage({ type: 'error', text: `Registrierung fehlgeschlagen oder abgebrochen: ${error.message}` });
        }
        return;
      }
      setMessage({ type: 'success', text: `Passkey erfolgreich registriert: ${data.friendly_name ?? data.id}` });
      await loadPasskeys();
    } catch (e: any) {
      setMessage({ type: 'error', text: `Unerwarteter Fehler bei der Passkey-Registrierung: ${e.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleRename(passkeyId: string, currentName?: string) {
    if (!supabase) return;
    const newName = window.prompt('Neuer Name für diesen Passkey:', currentName ?? '');
    if (!newName) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.passkey.update({ passkeyId, friendlyName: newName.slice(0, 120) });
      if (error) throw error;
      await loadPasskeys();
    } catch (e: any) {
      setMessage({ type: 'error', text: `Umbenennen fehlgeschlagen: ${e.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(passkeyId: string) {
    if (!supabase) return;
    if (!window.confirm('Diesen Passkey wirklich entfernen? Er kann danach nicht mehr zum Anmelden genutzt werden.')) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Passkey entfernt.' });
      await loadPasskeys();
    } catch (e: any) {
      setMessage({ type: 'error', text: `Löschen fehlgeschlagen: ${e.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return <div className="text-red-400 text-sm">Supabase ist nicht konfiguriert.</div>;
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-white/10 bg-black/20">
      <div>
        <h3 className="text-white font-semibold">Passkeys</h3>
        <p className="text-white/50 text-sm">
          {currentUserEmail ? `Konto: ${currentUserEmail}` : 'Nicht eingeloggt'}
        </p>
      </div>

      {message && (
        <div
          className={`text-sm rounded px-3 py-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400'
              : message.type === 'error'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading || !currentUserEmail}
        className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium"
      >
        {loading ? 'Bitte warten…' : 'Neuen Passkey auf diesem Gerät registrieren'}
      </button>
      {!currentUserEmail && (
        <p className="text-amber-400 text-xs">Du musst eingeloggt sein, um einen Passkey zu registrieren.</p>
      )}

      <div className="space-y-2">
        {passkeys.length === 0 && <p className="text-white/40 text-sm">Noch keine Passkeys registriert.</p>}
        {passkeys.map((pk) => (
          <div key={pk.id} className="flex items-center justify-between rounded border border-white/10 px-3 py-2">
            <div>
              <p className="text-white text-sm">{pk.friendly_name || 'Unbenannter Passkey'}</p>
              <p className="text-white/40 text-xs">
                Erstellt: {new Date(pk.created_at).toLocaleString('de-DE')}
                {pk.last_used_at && ` · Zuletzt genutzt: ${new Date(pk.last_used_at).toLocaleString('de-DE')}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleRename(pk.id, pk.friendly_name)} className="text-xs text-white/60 hover:text-white">
                Umbenennen
              </button>
              <button onClick={() => handleDelete(pk.id)} className="text-xs text-red-400 hover:text-red-300">
                Entfernen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Eigenständige Sign-in-Funktion für die Login-Seite (außerhalb einer bestehenden Session).
 * Nutzt discoverable credentials -> Nutzer muss keine E-Mail eingeben, der Browser/Authenticator
 * löst das Konto anhand des gespeicherten Credentials selbst auf.
 */
export async function signInWithPasskey() {
  if (!supabase) return { error: new Error('Supabase nicht konfiguriert') };
  return supabase.auth.signInWithPasskey();
}
