import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Mail, User, Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, X, HelpCircle, ChevronDown } from 'lucide-react';
import { CapitalAiLogo } from './common/CapitalAiLogo';
import { supabase } from '../supabaseClient';

interface LandingPageProps {
  onLoginEmail: (email: string, password: string) => Promise<void>;
  onGuestLogin: () => void;
  onRegisterEmail: (name: string, email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

export function LandingPage({ onLoginEmail, onGuestLogin, onRegisterEmail, justLoggedOut }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Collapsible FAQ states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqData = [
    {
      category: 'Finanzanalyse-Tools',
      question: 'Welche quantitativen Analyse-Werkzeuge stehen auf CAPITAL-AI zur Verfügung?',
      answer: 'Unsere Plattform bietet eine hochentwickelte Suite quantitativer Instrumente: Graham-DCF-Modelle zur Berechnung des fairen inneren Werts von Aktien, stochastische Monte-Carlo-Risikosimulationen mit tausenden Zukunftspfaden, automatisiertes Multi-Asset-Scoring (Skala 0.0 bis 10.0), KI-Agenten zur Stimmungsanalyse (Sentiment Grounding via Google Search) sowie historische Backtesting-Engines zur Validierung von Handelsstrategien.'
    },
    {
      category: 'Abonnements & Tarife',
      question: 'Welche Abonnement-Stufen gibt es und wie unterscheiden sie sich?',
      answer: 'Wir bieten drei klar strukturierte Tarife an:\n• Free (Gast-Zugang): Eingeschränkter Zugriff auf grundlegende Markt-Daten und Ad-hoc-Screener mit täglichem Abfragen-Limit.\n• Pro: Unbegrenzter Zugriff auf fortgeschrittene quantitative Modelle (Graham-DCF, historische Backtests) und Echtzeit-Preisalarme.\n• Enterprise: Unbegrenzte Vollausstattung mit dedizierten Server-Ressourcen, benutzerdefinierten API-Pipelines, parallelisiertem Multi-Agent-Scoring und exklusiven Rohstoff-Analysen.'
    },
    {
      category: 'Datensicherheit',
      question: 'Wie werden meine persönlichen Daten und Portfolio-Informationen geschützt?',
      answer: 'Datenschutz steht bei uns an oberster Stelle. CAPITAL-AI arbeitet streng konform mit der EU-DSGVO. Wir verfolgen eine konsequente "No-Demo-Data-Policy" (keine gefälschten Platzhalter) und speichern sensible Daten verschlüsselt auf sicheren Cloud-Servern oder rein lokal in Ihrem Browser via kryptografisch gesichertem LocalStorage. Es erfolgt kein Tracking oder unbefugter Verkauf an Dritte.'
    }
  ];

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  // Forgot Password Modal States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = () => {
    setForgotEmail(loginEmail || '');
    setForgotError(null);
    setForgotSuccess(null);
    setIsForgotModalOpen(true);
  };

  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    if (!forgotEmail) {
      setForgotError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }
    if (!supabase) {
      setForgotError('Supabase ist nicht konfiguriert.');
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) {
        setForgotError(error.message);
      } else {
        setForgotSuccess('Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet. Bitte überprüfen Sie Ihr Postfach.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Ein Fehler ist beim Senden der Passwort-Zurücksetzen-E-Mail aufgetreten.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
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
    setSuccessMessage(null);
    if (!regName || !regEmail || !regPassword) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    // Password complexity check: min 8 chars, one uppercase, one number, one special character
    if (regPassword.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (!/[A-Z]/.test(regPassword)) {
      setError('Das Passwort muss mindestens einen Großbuchstaben enthalten.');
      return;
    }
    if (!/[0-9]/.test(regPassword)) {
      setError('Das Passwort muss mindestens eine Zahl enthalten.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(regPassword)) {
      setError('Das Passwort muss mindestens ein Sonderzeichen enthalten.');
      return;
    }

    if (!agreeTerms) {
      setError('Bitte stimmen Sie den AGB und Datenschutzbestimmungen zu.');
      return;
    }
    setLoading(true);
    try {
      await onRegisterEmail(regName, regEmail, regPassword);
      setSuccessMessage('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail auf einen Bestätigungslink.');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist bei der Registrierung aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'azure' | 'github' | 'apple' | 'discord') => {
    setError(null);
    setSuccessMessage(null);
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert. Bitte legen Sie die entsprechenden Umgebungsvariablen fest.");
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
      setError(err.message || 'Ein OAuth-Verbindungsfehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main role="main" id="main-content" className="relative min-h-screen bg-black overflow-y-auto flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8">
      {/* Neural Network Background (Highly Active Neural Lines & Nodes) */}
      <div className="absolute inset-0 z-0 opacity-75">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0" aria-hidden="true">
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
            {/* Brand Logo & Slogan reflecting the uploaded CAPITAL-AI logo */}
            <CapitalAiLogo size={120} showText={true} />
            
            <p className="text-white/40 font-mono text-[9px] uppercase tracking-wider mt-3">
              Smarter Tools. Better Systems.
            </p>
          </div>

          {/* Success Banner when logged out */}
          {justLoggedOut && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center gap-2 font-mono"
            >
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span>Erfolgreich abgemeldet!</span>
            </motion.div>
          )}

          {/* Toggle Tabs between Sign In and Register */}
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 mb-6">
            <button
              onClick={() => { setActiveTab('login'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'login'
                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_10px_rgba(245,196,83,0.2)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'register'
                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_10px_rgba(245,196,83,0.2)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Registrieren
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-mono">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
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
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Passwort</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[9px] font-mono text-[#0DDDDD] hover:underline focus:outline-none cursor-pointer"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 focus:outline-none transition-colors"
                      title={showLoginPassword ? "Passwort ausblenden" : "Passwort anzeigen"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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

                <div className="space-y-1.5 relative">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">E-Mail-Adresse</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      placeholder="name@beispiel.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>

                  <AnimatePresence>
                    {(isEmailFocused || (regEmail !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail))) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 w-full mb-2.5 p-3 rounded-xl bg-neutral-950/95 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md space-y-1.5 text-[10px] font-mono leading-relaxed z-30"
                      >
                        <div className="text-white/40 font-sans font-medium mb-1 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-aif-gold-DEFAULT animate-pulse" />
                          E-Mail Formatprüfung:
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${regEmail.includes('@') ? 'bg-[#0DDDDD] shadow-[0_0_8px_rgba(13,221,221,0.5)]' : 'bg-white/20'}`} />
                          <span className={regEmail.includes('@') ? 'text-white' : 'text-white/40'}>Enthält "@"-Zeichen</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${/[^\s@]+@[^\s@]+\.[^\s@]+/.test(regEmail) ? 'bg-[#0DDDDD] shadow-[0_0_8px_rgba(13,221,221,0.5)]' : 'bg-white/20'}`} />
                          <span className={/[^\s@]+@[^\s@]+\.[^\s@]+/.test(regEmail) ? 'text-white' : 'text-white/40'}>Gültige Domain (z.B. .de / .com)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${(regEmail.length > 0 && !/\s/.test(regEmail)) ? 'bg-[#0DDDDD] shadow-[0_0_8px_rgba(13,221,221,0.5)]' : 'bg-white/20'}`} />
                          <span className={(regEmail.length > 0 && !/\s/.test(regEmail)) ? 'text-white' : 'text-white/40'}>Keine Leerzeichen</span>
                        </div>
                        <div className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45 bg-neutral-950 border-r border-b border-white/10 pointer-events-none" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Sicheres Passwort wählen"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 focus:outline-none transition-colors"
                      title={showRegPassword ? "Passwort ausblenden" : "Passwort anzeigen"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {(isPasswordFocused || (regPassword !== '' && (
                      regPassword.length < 8 ||
                      !/[A-Z]/.test(regPassword) ||
                      !/[0-9]/.test(regPassword) ||
                      !/[^A-Za-z0-9]/.test(regPassword)
                    ))) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 w-full mb-2.5 p-3 rounded-xl bg-neutral-950/95 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md space-y-1.5 text-[10px] font-mono leading-relaxed z-30"
                      >
                        <div className="text-white/40 font-sans font-medium mb-1 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-aif-gold-DEFAULT animate-pulse" />
                          Passwort-Anforderungen:
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${regPassword.length >= 8 ? 'bg-[#0DDDDD] shadow-[0_0_8px_rgba(13,221,221,0.5)]' : 'bg-white/20'}`} />
                          <span className={regPassword.length >= 8 ? 'text-white' : 'text-white/40'}>Mindestens 8 Zeichen</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${/[A-Z]/.test(regPassword) ? 'bg-[#0DDDDD] shadow-[0_0_8px_rgba(13,221,221,0.5)]' : 'bg-white/20'}`} />
                          <span className={/[A-Z]/.test(regPassword) ? 'text-white' : 'text-white/40'}>Ein Großbuchstabe (A-Z)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${/[0-9]/.test(regPassword) ? 'bg-[#0DDDDD] shadow-[0_0_8px_rgba(13,221,221,0.5)]' : 'bg-white/20'}`} />
                          <span className={/[0-9]/.test(regPassword) ? 'text-white' : 'text-white/40'}>Eine Ziffer (0-9)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${/[^A-Za-z0-9]/.test(regPassword) ? 'bg-[#0DDDDD] shadow-[0_0_8px_rgba(13,221,221,0.5)]' : 'bg-white/20'}`} />
                          <span className={/[^A-Za-z0-9]/.test(regPassword) ? 'text-white' : 'text-white/40'}>Ein Sonderzeichen</span>
                        </div>
                        <div className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45 bg-neutral-950 border-r border-b border-white/10 pointer-events-none" />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                    Ich erkläre mich mit den Nutzungsbedingungen (AGB) und Datenschutzbestimmungen des CAPITAL-AI Netzwerks einverstanden.
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

          <div className="space-y-4 mt-6">
            
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
                  aria-label="Mit Google anmelden"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.83z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z" />
                    <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.32-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.39l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z" />
                  </svg>
                  <span>Google</span>
                </button>
 
                {/* Apple OAuth Button */}
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleOAuthLogin('apple')}
                  className="py-2 px-3 bg-[#111111] hover:bg-[#222222] disabled:opacity-50 text-white font-sans font-bold text-[10px] rounded-lg border border-white/10 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
                  title="Apple"
                  aria-label="Mit Apple anmelden"
                >
                  <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.1.08.2.12.31.12.87 0 1.96-.54 2.51-1.45z"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-white/50 flex flex-col items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-aif-gold-DEFAULT animate-pulse" />
            <p className="font-mono text-[9px] tracking-wider text-white/60">Strict No Demo Data Policy</p>
            <p className="text-[8px] text-white/40">EU GDPR Compliant • MiFID II Ready</p>
          </div>
        </div>
      </motion.div>

      {/* Collapsible FAQ Section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative z-10 w-full max-w-md mx-auto mt-6 bg-[#06070B]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2.5">
          <HelpCircle className="w-4 h-4 text-aif-gold-DEFAULT" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Häufig gestellte Fragen (FAQ)</h3>
        </div>

        <div className="space-y-3">
          {faqData.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx} 
                className={`rounded-xl border transition-all duration-300 ${
                  isOpen ? 'bg-white/[0.04] border-aif-gold-DEFAULT/30 shadow-[0_0_15px_rgba(245,196,83,0.05)]' : 'bg-transparent border-white/5 hover:border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left p-3.5 flex items-start justify-between gap-3 text-xs font-bold text-white/90 hover:text-white transition-colors focus:outline-none"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-aif-gold-DEFAULT font-mono block">
                      {item.category}
                    </span>
                    <span>{item.question}</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 mt-1 ${
                      isOpen ? 'rotate-180 text-aif-gold-DEFAULT' : ''
                    }`} 
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 pt-0 border-t border-white/5 text-[11px] text-white/60 leading-relaxed whitespace-pre-line font-sans">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {isForgotModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative w-full max-w-md bg-neutral-950/90 border border-white/10 rounded-2xl p-6 overflow-hidden shadow-[0_0_50px_rgba(13,221,221,0.15)]"
            >
              {/* Subtle background gradients inside modal */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors focus:outline-none cursor-pointer"
                title="Schließen"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-aif-gold-DEFAULT animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-widest">
                  Sicherheits-Center
                </span>
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                Passwort zurücksetzen
              </h3>
              <p className="text-xs text-white/60 leading-relaxed mb-5">
                Geben Sie Ihre registrierte E-Mail-Adresse ein. Wir senden Ihnen umgehend einen sicheren Link zu, mit dem Sie ein neues Passwort erstellen können.
              </p>

              {forgotError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono">
                  <AlertCircle size={14} className="shrink-0 text-red-400" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {!forgotSuccess && (
                <form onSubmit={handleForgotResetSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">E-Mail-Adresse</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="email"
                        placeholder="name@beispiel.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-black font-sans font-bold text-xs uppercase tracking-widest rounded-lg border border-transparent shadow-[0_0_15px_rgba(13,221,221,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sende Link...</span>
                      </>
                    ) : (
                      <span>Reset-Link senden</span>
                    )}
                  </button>
                </form>
              )}

              {forgotSuccess && (
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-sans font-bold text-xs uppercase tracking-widest rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Schließen
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
