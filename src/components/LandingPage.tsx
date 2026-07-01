import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Mail, User, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AifCoreLogo } from './AifCoreLogo';
import { supabase } from '../supabaseClient';

interface LandingPageProps {
  onLoginEmail: (email: string, password: string) => Promise<void>;
  onGuestLogin: () => void;
  onRegisterEmail: (name: string, email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

export function LandingPage({ onLoginEmail, onGuestLogin, onRegisterEmail, justLoggedOut }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    setLoading(true);
    try {
      await onLoginEmail(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist beim Einloggen aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName || !regEmail || !regPassword) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    if (!agreeTerms) {
      setError('Bitte stimmen Sie den AGB und Datenschutzbestimmungen zu.');
      return;
    }
    setLoading(true);
    try {
      await onRegisterEmail(regName, regEmail, regPassword);
      setError('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail auf einen Bestätigungslink.');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist bei der Registrierung aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'azure' | 'github' | 'apple' | 'discord') => {
    setError(null);
    if (!supabase) {
      setError('Supabase ist nicht konfiguriert. Bitte setzen Sie die Umgebungsvariablen VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'OAuth Login-Fehler.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Neural Network Background (Highly Active Neural Lines & Nodes) */}
      <div className="absolute inset-0 z-0 opacity-75">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
          <defs>
            <linearGradient id="neural-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5C453" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0DDDDD" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#B026FF" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="neural-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B026FF" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#0DDDDD" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F5C453" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Active Neural Intersecting Lines and Pathways */}
          <path d="M 50,50 L 250,150 L 450,80 L 700,220 L 950,120 L 1200,300 L 1400,180" fill="none" stroke="url(#neural-grad-1)" strokeWidth="2" className="opacity-40 animate-pulse" />
          <path d="M 100,500 L 350,380 L 600,450 L 850,300 L 1100,520 L 1350,420" fill="none" stroke="url(#neural-grad-2)" strokeWidth="1.5" className="opacity-30 animate-pulse" />
          <path d="M 150,800 L 400,680 L 750,750 L 1050,600 L 1250,780 L 1500,650" fill="none" stroke="url(#neural-grad-1)" strokeWidth="1.5" className="opacity-40" />

          {/* Connected Grid-free Neural Lines */}
          <line x1="20%" y1="30%" x2="35%" y2="25%" stroke="#F5C453" strokeWidth="1.5" strokeDasharray="5 5" className="opacity-50 animate-pulse" />
          <line x1="35%" y1="25%" x2="50%" y2="40%" stroke="#0DDDDD" strokeWidth="2" className="opacity-40" />
          <line x1="50%" y1="40%" x2="65%" y2="30%" stroke="#B026FF" strokeWidth="1.5" className="opacity-40" />
          <line x1="65%" y1="30%" x2="80%" y2="45%" stroke="#0DDDDD" strokeWidth="2" strokeDasharray="4 4" className="opacity-60 animate-pulse" />
          
          <line x1="15%" y1="70%" x2="30%" y2="60%" stroke="#B026FF" strokeWidth="1.5" className="opacity-40" />
          <line x1="30%" y1="60%" x2="45%" y2="75%" stroke="#F5C453" strokeWidth="2" className="opacity-50" />
          <line x1="45%" y1="75%" x2="60%" y2="65%" stroke="#0DDDDD" strokeWidth="1.5" className="opacity-30" />
          <line x1="60%" y1="65%" x2="75%" y2="80%" stroke="#F5C453" strokeWidth="2.5" className="opacity-40" />
          <line x1="75%" y1="80%" x2="90%" y2="65%" stroke="#B026FF" strokeWidth="1.5" strokeDasharray="6 3" className="opacity-50 animate-pulse" />

          {/* Dynamic pulsing neural connection lines */}
          <line x1="20%" y1="30%" x2="30%" y2="60%" stroke="rgba(13, 221, 221, 0.5)" strokeWidth="1" />
          <line x1="50%" y1="40%" x2="45%" y2="75%" stroke="rgba(245, 196, 83, 0.4)" strokeWidth="1" />
          <line x1="65%" y1="30%" x2="60%" y2="65%" stroke="rgba(176, 38, 255, 0.4)" strokeWidth="1" />
          <line x1="80%" y1="45%" x2="75%" y2="80%" stroke="rgba(13, 221, 221, 0.5)" strokeWidth="1" />

          {/* Animated active neural nodes */}
          <circle cx="20%" cy="30%" r="6" fill="#F5C453" className="animate-gold-pulse" />
          <circle cx="35%" cy="25%" r="4" fill="#0DDDDD" className="animate-neural-pulse-fast" />
          <circle cx="50%" cy="40%" r="7" fill="#B026FF" className="animate-neural-pulse" />
          <circle cx="65%" cy="30%" r="5" fill="#0DDDDD" className="animate-neural-pulse-fast" />
          <circle cx="80%" cy="45%" r="6" fill="#F5C453" className="animate-gold-pulse" />

          <circle cx="15%" cy="70%" r="5" fill="#0DDDDD" className="animate-neural-pulse-fast" />
          <circle cx="30%" cy="60%" r="7" fill="#B026FF" className="animate-neural-pulse" />
          <circle cx="45%" cy="75%" r="6" fill="#F5C453" className="animate-gold-pulse" />
          <circle cx="60%" cy="65%" r="5" fill="#0DDDDD" className="animate-neural-pulse-fast" />
          <circle cx="75%" cy="80%" r="8" fill="#F5C453" className="animate-gold-pulse" />
          <circle cx="90%" cy="65%" r="4" fill="#B026FF" className="animate-neural-pulse" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md mx-auto p-[2px] rounded-2xl overflow-hidden animate-brand-border-pulse"
      >
        {/* Circulating rotating color gradient layer representing all brand colors (Gold, Cyan, Purple) */}
        <div className="absolute inset-[-400%] bg-[conic-gradient(from_0deg,#F5C453_0deg,#0DDDDD_120deg,#B026FF_240deg,#F5C453_360deg)] animate-brand-border-rotate" />
        
        {/* Main inner dark card container */}
        <div className="relative z-10 w-full rounded-[14px] bg-[#06070B]/95 backdrop-blur-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            {/* Brand Logo & Slogan reflecting the uploaded AIF-CORE Modul 1 logo */}
            <AifCoreLogo size={120} showText={true} />
            
            <p className="text-white/40 font-mono text-[9px] uppercase tracking-wider mt-3">
              Smarter Tools. Better Systems.
            </p>
          </div>

          {/* Toggle Tabs between Sign In and Register */}
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 mb-6">
            <button
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'login'
                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_10px_rgba(245,196,83,0.2)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'register'
                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_10px_rgba(245,196,83,0.2)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Registrieren
            </button>
          </div>

          {/* Success Banner when logged out */}
          {justLoggedOut && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center gap-2 font-mono"
            >
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span>Erfolgreich abgemeldet!</span>
            </motion.div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-mono">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">E-Mail-Adresse</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      placeholder="name@beispiel.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-black font-black font-mono text-xs rounded-lg uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,196,83,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Einloggen'}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Voller Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Max Mustermann"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">E-Mail-Adresse</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      placeholder="name@beispiel.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      placeholder="Sicheres Passwort wählen"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-black/40 text-aif-gold-DEFAULT focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                  />
                  <label htmlFor="terms-check" className="text-[10px] text-white/50 leading-tight cursor-pointer">
                    Ich erkläre mich mit den Nutzungsbedingungen (AGB) und Datenschutzbestimmungen des AIF-CORE Netzwerks einverstanden.
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-black font-black font-mono text-xs rounded-lg uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,196,83,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konto erstellen & Starten'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#06070B] px-3 font-mono text-[9px] uppercase tracking-widest text-white/30">ODER</span>
          </div>

          <div className="space-y-4">
            {/* Gast-Modus button */}
            <button 
              type="button"
              disabled={loading}
              onClick={onGuestLogin}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-xs rounded-lg border border-white/10 hover:border-white/20 disabled:brightness-75 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Gast-Modus betreten
            </button>
            
            <div className="space-y-2">
              <span className="block text-[10px] font-mono text-white/40 uppercase tracking-widest text-center">Mit Social Account anmelden</span>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Google OAuth Button */}
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleOAuthLogin('google')}
                  className="py-2 px-3 bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-800 font-sans font-bold text-[10px] rounded-lg border border-neutral-300 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                  title="Google"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.83z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z" />
                    <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.32-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.39l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z" />
                  </svg>
                  <span>Google</span>
                </button>

                {/* Microsoft Azure OAuth Button */}
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleOAuthLogin('azure')}
                  className="py-2 px-3 bg-[#2F2F2F] hover:bg-[#3F3F3F] disabled:opacity-50 text-white font-sans font-bold text-[10px] rounded-lg border border-white/10 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                  title="Microsoft"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#f35325" d="M0 0h11v11H0z" />
                    <path fill="#80bb0a" d="M12 0h11v11H12z" />
                    <path fill="#00a4ef" d="M0 12h11v11H0z" />
                    <path fill="#ffb900" d="M12 12h11v11H12z" />
                  </svg>
                  <span>Microsoft</span>
                </button>

                {/* GitHub OAuth Button */}
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleOAuthLogin('github')}
                  className="py-2 px-3 bg-[#18191B] hover:bg-[#24292E] disabled:opacity-50 text-white font-sans font-bold text-[10px] rounded-lg border border-white/10 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                  title="GitHub"
                >
                  <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>

                {/* Apple OAuth Button */}
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleOAuthLogin('apple')}
                  className="py-2 px-3 bg-black hover:bg-neutral-900 disabled:opacity-50 text-white font-sans font-bold text-[10px] rounded-lg border border-white/20 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                  title="Apple"
                >
                  <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.58 2.94-1.39" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Discord OAuth Button centered below */}
              <button 
                type="button"
                disabled={loading}
                onClick={() => handleOAuthLogin('discord')}
                className="w-full py-2 px-3 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-sans font-bold text-[10px] rounded-lg border border-transparent transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                title="Discord"
              >
                <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.45-5c.56-.41,1.11-.84,1.64-1.28a75.48,75.48,0,0,0,74.52,0c.53.44,1.08.87,1.64,1.28a68.43,68.43,0,0,1-10.45,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.5,47.88,122.52,25.13,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
                </svg>
                <span>Mit Discord anmelden</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-white/50 flex flex-col items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-aif-gold-DEFAULT animate-pulse" />
            <p className="font-mono text-[9px] tracking-wider text-white/60">Strict No Demo Data Policy</p>
            <p className="text-[8px] text-white/40">EU GDPR Compliant • MiFID II Ready</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
