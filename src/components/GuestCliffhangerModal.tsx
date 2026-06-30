import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Mail, User, Lock, X, Sparkles, Trophy, HelpCircle, ArrowRight } from 'lucide-react';
import { AifCoreLogo } from './AifCoreLogo';

interface GuestCliffhangerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (name: string, email: string) => void;
  actionName: string;
}

const CLIFFHANGER_SLOGANS = [
  "Der erste neuronale Rechenvektor war erfolgreich... Doch um den vollständigen Code der globalen Märkte zu knacken, fehlt dir noch der Masterkey.",
  "Die Algorithmen haben gerade eine hochpräzise Markt-Anomalie detektiert... Das wahre Potenzial von AIF-CORE Modul 1 offenbart sich jedoch nur registrierten Pionieren.",
  "Du hast die Oberfläche der stochastischen Matrix berührt. Darunter liegt das unbegrenzte Potenzial paralleler API-Pipelines und historischer Backtests.",
  "Ein einzelner Versuch zeigt dir die Richtung. Eine Registrierung zeigt dir das Ziel. Gehe den nächsten Schritt, bevor das Markt-Momentum verblasst!"
];

export function GuestCliffhangerModal({ isOpen, onClose, onRegister, actionName }: GuestCliffhangerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick a slogan based on the action name or deterministically
  const sloganIndex = Math.abs(actionName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % CLIFFHANGER_SLOGANS.length;
  const slogan = CLIFFHANGER_SLOGANS[sloganIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    if (!agree) {
      setError('Bitte stimmen Sie den AGB und Datenschutzbestimmungen zu.');
      return;
    }
    onRegister(name, email);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Animated Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl p-[2px] shadow-[0_0_50px_rgba(245,196,83,0.25)] border border-white/15 bg-black"
        >
          {/* Glowing brand corner light */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-aif-gold-DEFAULT/10 blur-[60px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-aif-neon-cyan/10 blur-[60px] rounded-full pointer-events-none" />

          {/* Color border accent strip */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-aif-gold-DEFAULT via-aif-neon-cyan to-aif-neon-purple" />

          <div className="relative z-10 bg-[#06070B]/95 p-6 sm:p-8 rounded-2xl flex flex-col">
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Logo and feature badge */}
            <div className="flex flex-col items-center text-center mb-6">
              <AifCoreLogo size={64} showText={false} />
              
              <span className="mt-4 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/35 tracking-wider uppercase">
                Gast-Limit Erreicht ({actionName})
              </span>
            </div>

            {/* Cliffhanger Slogan Box */}
            <div className="bg-gradient-to-r from-white/5 to-transparent border-l-2 border-aif-gold-DEFAULT p-4 mb-6 rounded-r-lg">
              <p className="text-sm font-medium italic text-aif-gold-light leading-relaxed">
                "{slogan}"
              </p>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-base font-bold text-white font-display">Sichere dir dauerhaft unbegrenzten Zugriff</h3>
              <p className="text-xs text-white/50 mt-1">
                Registriere dich in wenigen Sekunden völlig kostenlos und schalte das volle Potenzial von AIF-CORE frei (inkl. PRO-Status).
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Voller Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Max Mustermann"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-black border border-white/25 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-black border border-white/25 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="password"
                    placeholder="Wähle ein sicheres Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black border border-white/25 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 mb-2">
                <input
                  type="checkbox"
                  id="modal-terms-check"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-black/40 text-aif-gold-DEFAULT focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                />
                <label htmlFor="modal-terms-check" className="text-[9px] text-white/50 leading-tight cursor-pointer select-none">
                  Ich akzeptiere die Allgemeinen Geschäftsbedingungen (AGB) und Datenschutzbestimmungen des AIF-CORE Netzwerks.
                </label>
              </div>

              <button 
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 text-black font-black font-mono text-xs rounded-lg uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,196,83,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Kostenlos registrieren & weiterrechnen</span>
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-white/5 text-center flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] uppercase font-bold">
                <Trophy size={11} />
                <span>Geschenk: Starter-Plan permanent freigeschaltet</span>
              </div>
              <p className="text-[11px] text-white/70">Datenschutzkonforme EU-Speicherung • Jederzeit kündbar</p>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
