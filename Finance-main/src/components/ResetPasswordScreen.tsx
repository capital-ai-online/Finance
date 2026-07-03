/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ResetPasswordScreenProps {
  onComplete: () => void;
}

export function ResetPasswordScreen({ onComplete }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (password.length < 8) return 'Das Passwort muss mindestens 8 Zeichen lang sein.';
    if (!/[A-Z]/.test(password)) return 'Das Passwort muss mindestens einen Großbuchstaben enthalten.';
    if (!/[0-9]/.test(password)) return 'Das Passwort muss mindestens eine Ziffer enthalten.';
    if (password !== confirmPassword) return 'Die Passwörter stimmen nicht überein.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!supabase) {
      setError('Supabase ist nicht konfiguriert.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess(true);
      // Sign out the temporary recovery session so the user logs in fresh
      // with the new password, rather than silently landing in the dashboard.
      await supabase.auth.signOut();
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      setError(err?.message || 'Unbekannter Fehler beim Zurücksetzen des Passworts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-black/60 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-aif-gold-DEFAULT mx-auto" />
          <h1 className="text-lg font-black text-white">Neues Passwort festlegen</h1>
          <p className="text-xs text-white/50">Bitte vergib ein neues, sicheres Passwort für dein Capital AI Konto.</p>
        </div>

        {success ? (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center text-sm text-green-400">
            Passwort erfolgreich geändert. Du wirst weitergeleitet...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Neues Passwort"
                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-aif-gold-DEFAULT/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort bestätigen"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-aif-gold-DEFAULT/50"
              required
            />

            <p className="text-[10px] text-white/40 leading-relaxed">
              Mind. 8 Zeichen, ein Großbuchstabe, eine Ziffer.
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
