import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Cpu, 
  Coins, 
  UserX, 
  UserCheck, 
  Plus, 
  Settings2, 
  PieChart as PieIcon, 
  Activity, 
  Sparkles, 
  Check, 
  Lock, 
  Globe, 
  Building2, 
  FileCheck, 
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Search,
  Sliders
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface AdminPanelProps {
  currentUserEmail: string;
  accessToken?: string;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise' | 'Investor' | 'Employee';
  status: 'Aktiv' | 'Inaktiv' | 'Gesperrt';
  registrationDate: string;
  requestsCount: number;
}

export function AdminPanel({ currentUserEmail, accessToken }: AdminPanelProps) {
  // Owner check: single verified owner email only. The former guest-email
  // bypass ('gast@capital-ai.de') has been removed — it granted admin-level
  // access to anyone whose session email matched that known, predictable
  // string, which was reachable via the (now removed) anonymous/guest
  // login path. Do not reintroduce any client-side email bypass here;
  // all privileged server actions must additionally be verified via
  // requireOrchestratorAdmin / server-side JWT checks, never trust this
  // client-side flag alone for anything that mutates data.
  const isOwner = currentUserEmail === 'sven.kulessa@gmail.com';
  const isGuestBypass = false;

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Interactive configurations for upcoming Investor & Employee Tiers
  const [futureTierName, setFutureTierName] = useState('Investor & Mitarbeiter VIP');
  const [futureTierCost, setFutureTierCost] = useState(0); // free/custom setup
  const [futureTierFeatures, setFutureTierFeatures] = useState<string[]>([
    'Voller Zugriff auf Deep-Research (Grok)',
    'Echte Backtest Engine ohne Limits',
    'Unlimitierte Multi-Model-Abfragen',
    'Miteigentümer & Investor Stimmrechte',
    'Echtzeit-Performance-Audit der Server'
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [generatedInviteCode, setGeneratedInviteCode] = useState('');

  // Auto-router Weights override
  const [routingPreference, setRoutingPreference] = useState<'latency' | 'cost' | 'quality' | 'hybrid'>('hybrid');
  const [forcedModelId, setForcedModelId] = useState<string>('none');
  const [simulatedLoadMultiplier, setSimulatedLoadMultiplier] = useState(1.2);

  // Special sub-tab navigation state to switch views
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'routing' | 'pricing'>('routing');
  
  // Asset Pricing & Registry Management state
  const [registryAssets, setRegistryAssets] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  
  // Single Asset Editing states
  const [selectedEditAsset, setSelectedEditAsset] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editChange24h, setEditChange24h] = useState<string>('');
  const [editExpectedReturn, setEditExpectedReturn] = useState<string>('');
  const [editVolatility, setEditVolatility] = useState<string>('');
  const [editDrift, setEditDrift] = useState<string>('');
  const [editMarketCap, setEditMarketCap] = useState<string>('');
  const [editIsLocked, setEditIsLocked] = useState<boolean>(true);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);
  const [pricingErrorMsg, setPricingErrorMsg] = useState<string | null>(null);

  // Load all assets from server
  const loadRegistryAssets = () => {
    setIsLoadingAssets(true);
    setPricingErrorMsg(null);
    fetch('/api/registry/assets')
      .then(res => {
        if (!res.ok) throw new Error('Fehler beim Laden der Registry-Daten');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRegistryAssets(data);
        }
        setIsLoadingAssets(false);
      })
      .catch(err => {
        console.error(err);
        setPricingErrorMsg(err.message || 'Verbindung zum Registry-Server fehlgeschlagen.');
        setIsLoadingAssets(false);
      });
  };

  // Select asset for editing
  const handleSelectEditAsset = (asset: any) => {
    setSelectedEditAsset(asset);
    setEditPrice(String(asset.price));
    setEditChange24h(String(asset.change24h));
    setEditExpectedReturn(String(asset.expectedReturn));
    setEditVolatility(String(asset.volatility));
    setEditDrift(String(asset.drift));
    setEditMarketCap(asset.marketCap !== undefined ? String(asset.marketCap) : '');
    setEditIsLocked(asset.isLocked ?? true); // Default lock to true so Sven's edits stick
    setPricingSuccessMsg(null);
    setPricingErrorMsg(null);
  };

  // Save asset parameters
  const handleSaveAssetParameters = (symbol: string) => {
    setPricingSuccessMsg(null);
    setPricingErrorMsg(null);
    
    const parsedPrice = parseFloat(editPrice);
    const parsedChange = parseFloat(editChange24h);
    const parsedReturn = parseFloat(editExpectedReturn);
    const parsedVol = parseFloat(editVolatility);
    const parsedDrift = parseFloat(editDrift);
    const parsedMcap = editMarketCap ? parseFloat(editMarketCap) : undefined;

    if (isNaN(parsedPrice) || isNaN(parsedChange) || isNaN(parsedReturn) || isNaN(parsedVol) || isNaN(parsedDrift)) {
      setPricingErrorMsg('Bitte geben Sie für alle Zahlenfelder gültige Werte ein.');
      return;
    }

    fetch(`/api/registry/assets/${symbol}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        price: parsedPrice,
        change24h: parsedChange,
        expectedReturn: parsedReturn,
        volatility: parsedVol,
        drift: parsedDrift,
        marketCap: parsedMcap,
        isLocked: editIsLocked
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Änderungen konnten nicht gespeichert werden.');
        return res.json();
      })
      .then(resData => {
        if (resData.success) {
          setPricingSuccessMsg(`Preise und Metriken für ${symbol} erfolgreich aktualisiert & gesperrt!`);
          // Reload assets and update currently selected editing asset to show saved values
          loadRegistryAssets();
          if (selectedEditAsset && selectedEditAsset.symbol === symbol) {
            setSelectedEditAsset(resData.asset);
          }
          // Remove notification after 4s
          setTimeout(() => setPricingSuccessMsg(null), 4000);
        } else {
          throw new Error('Server meldete Fehlschlag.');
        }
      })
      .catch(err => {
        setPricingErrorMsg(err.message || 'Verbindung fehlgeschlagen beim Speichern.');
      });
  };

  // Load registry assets on mount to be ready
  useEffect(() => {
    if (isOwner) {
      loadRegistryAssets();
    }
  }, [isOwner]);

  // Users mock database
  const [users, setUsers] = useState<MockUser[]>([
    { id: '1', name: 'Sven Kulessa', email: 'sven.kulessa@gmail.com', subscriptionTier: 'Enterprise', status: 'Aktiv', registrationDate: '2026-01-10', requestsCount: 14502 },
    { id: '2', name: 'Erika Mustermann', email: 'erika.muster@capital-ai.de', subscriptionTier: 'Pro', status: 'Aktiv', registrationDate: '2026-03-15', requestsCount: 3912 },
    { id: '3', name: 'Maximilian Schmidt', email: 'max.schmidt@gmail.com', subscriptionTier: 'Starter', status: 'Aktiv', registrationDate: '2026-04-01', requestsCount: 1205 },
    { id: '4', name: 'Sophia Müller', email: 'sophia.m@gmail.com', subscriptionTier: 'Free', status: 'Inaktiv', registrationDate: '2026-05-20', requestsCount: 42 },
    { id: '5', name: 'Christian Wagner', email: 'c.wagner@fintech-ventures.com', subscriptionTier: 'Enterprise', status: 'Aktiv', registrationDate: '2026-02-11', requestsCount: 9811 },
    { id: '6', name: 'Anika Keller', email: 'a.keller@gmail.com', subscriptionTier: 'Pro', status: 'Gesperrt', registrationDate: '2026-05-02', requestsCount: 541 },
    { id: '7', name: 'Dr. Bernhard Kröger', email: 'b.kroeger@capital-investors.de', subscriptionTier: 'Investor', status: 'Aktiv', registrationDate: '2026-06-25', requestsCount: 421 },
  ]);

  // Handle invite generation
  const handleGenerateInvite = () => {
    const code = 'INV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setGeneratedInviteCode(code);
    setGeneratedInviteLink(`https://capital-ai.de/join?invite=${code}&role=${encodeURIComponent(futureTierName)}`);
  };

  // Add feature to custom tier
  const handleAddFeature = () => {
    if (newFeatureText.trim()) {
      setFutureTierFeatures([...futureTierFeatures, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  // Remove feature from custom tier
  const handleRemoveFeature = (idx: number) => {
    setFutureTierFeatures(futureTierFeatures.filter((_, i) => i !== idx));
  };

  // Modify user subscription tier or status
  const handleUpdateUserTier = (userId: string, newTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise' | 'Investor' | 'Employee') => {
    setUsers(users.map(u => u.id === userId ? { ...u, subscriptionTier: newTier } : u));
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Aktiv' ? 'Gesperrt' : u.status === 'Gesperrt' ? 'Inaktiv' : 'Aktiv';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesTier = tierFilter === 'all' || u.subscriptionTier === tierFilter;
      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [users, searchTerm, statusFilter, tierFilter]);

  // Recharts graphics static datasets
  const signupData = [
    { name: 'Jan 26', Users: 120, Premium: 45 },
    { name: 'Feb 26', Users: 240, Premium: 95 },
    { name: 'Mar 26', Users: 490, Premium: 180 },
    { name: 'Apr 26', Users: 850, Premium: 310 },
    { name: 'May 26', Users: 1300, Premium: 520 },
    { name: 'Jun 26', Users: 1980, Premium: 840 },
  ];

  const modelDistributionData = [
    { name: 'Gemini 2.5 Flash', value: 58 },
    { name: 'Claude 3.5 Sonnet', value: 21 },
    { name: 'GPT-4o', value: 13 },
    { name: 'Llama 3.3 (Local)', value: 6 },
    { name: 'Grok 2', value: 2 },
  ];

  const COLORS = ['#F5C453', '#06b6d4', '#a855f7', '#10b981', '#f43f5e'];

  const latencyTimelineData = [
    { time: '00:00', Gemini: 42, Claude: 141, GPT4: 151, Grok: 181 },
    { time: '04:00', Gemini: 38, Claude: 135, GPT4: 142, Grok: 172 },
    { time: '08:00', Gemini: 55, Claude: 156, GPT4: 168, Grok: 198 },
    { time: '12:00', Gemini: 62, Claude: 168, GPT4: 172, Grok: 220 },
    { time: '16:00', Gemini: 49, Claude: 148, GPT4: 155, Grok: 189 },
    { time: '20:00', Gemini: 45, Claude: 142, GPT4: 148, Grok: 182 },
  ];

  // Deny layout for standard/compromised emails
  if (!isOwner) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 backdrop-blur-md relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 animate-pulse">
            <Lock size={32} />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wider">
          Zugriff Verweigert
        </h3>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          Diese Seite ist ausschließlich für den Eigentümer und Administrator <strong>Sven Kulessa</strong> (<span className="text-aif-gold-DEFAULT">sven.kulessa@gmail.com</span>) reserviert. Standard-Abonnements oder anonyme Testzugänge haben hier keinen Zugriff.
        </p>
        <div className="bg-black/30 border border-white/5 rounded-xl p-3 mb-6 text-xs text-left text-white/50 space-y-1">
          <div className="flex justify-between">
            <span>Benutzer-Identität:</span>
            <span className="font-mono text-rose-400 font-bold">{currentUserEmail || 'Anonym'}</span>
          </div>
          <div className="flex justify-between">
            <span>Sicherheitsstufe:</span>
            <span className="font-mono text-rose-400 font-bold">Standard User</span>
          </div>
          <div className="flex justify-between">
            <span>Required Role:</span>
            <span className="font-mono text-emerald-400 font-bold">Platform-Owner</span>
          </div>
        </div>
        <p className="text-[10px] text-white/40 italic">
          Zukünftige Abonnements für Investoren und mögliche Mitarbeiter befinden sich in der Planungsphase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="aif-admin-root">
      
      {/* Premium Header with Distinct Admin Purple Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-gradient-to-r from-aif-neon-purple/15 via-black/50 to-neutral-950 border-2 border-aif-neon-purple p-6 rounded-2xl backdrop-blur-md shadow-[0_0_35px_rgba(176,38,255,0.18)] relative overflow-hidden">
        {/* Glowing cosmic ambient spots */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-aif-neon-purple/15 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-aif-neon-purple to-indigo-500" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-aif-neon-purple text-white border border-aif-neon-purple/40 uppercase shadow-[0_0_10px_rgba(176,38,255,0.4)] animate-pulse">
              ADMIN-COCKPIT
            </span>
            <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-black tracking-widest border uppercase ${
              isGuestBypass 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {isGuestBypass ? 'Dev-Station Bypass' : 'Owner Verified'}
            </span>
          </div>
          <h1 className="text-2xl font-black font-display text-white uppercase tracking-wider flex items-center gap-2.5">
            <span>CAPITAL-AI System-Management</span>
          </h1>
          <p className="text-xs text-white/70 leading-relaxed max-w-xl">
            Willkommen zurück, <strong className="text-white">Sven Kulessa</strong>. {isGuestBypass ? 'Du bist über den Dev-Station-Gast-Bypass angemeldet.' : 'Überwache KPIs, verwalte Privilegien und konfiguriere das kommende Investoren-Abo.'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-black/60 border border-aif-neon-purple/30 rounded-xl px-4 py-3 self-stretch md:self-auto justify-between shadow-[0_0_15px_rgba(176,38,255,0.05)]">
          <div className="text-left">
            <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{isGuestBypass ? 'Dev-Bypass-Modus' : 'Eingeloggter Admin'}</div>
            <div className="text-xs font-mono text-aif-neon-purple font-black">{isGuestBypass ? 'gast@capital-ai.de (Sven)' : 'sven.kulessa@gmail.com'}</div>
          </div>
          <div className="p-1.5 rounded-lg bg-aif-neon-purple/10 border border-aif-neon-purple/30">
            <Check size={16} className={isGuestBypass ? 'text-amber-400 shrink-0' : 'text-aif-neon-purple shrink-0'} />
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs with distinct purple styles */}
      <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-aif-neon-purple/30 max-w-md shadow-[0_0_20px_rgba(176,38,255,0.05)]">
        <button
          onClick={() => setActiveAdminSubTab('routing')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeAdminSubTab === 'routing'
              ? 'bg-aif-neon-purple text-white font-black shadow-[0_0_20px_rgba(176,38,255,0.45)] border border-aif-neon-purple/50'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity size={14} className={activeAdminSubTab === 'routing' ? 'text-white' : 'text-white/60'} />
          <span>System &amp; Routing</span>
        </button>
        <button
          onClick={() => {
            setActiveAdminSubTab('pricing');
            loadRegistryAssets();
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeAdminSubTab === 'pricing'
              ? 'bg-aif-neon-purple text-white font-black shadow-[0_0_20px_rgba(176,38,255,0.45)] border border-aif-neon-purple/50'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Coins size={14} className={activeAdminSubTab === 'pricing' ? 'text-white' : 'text-white/60'} />
          <span>Preis- &amp; Asset-Manager</span>
        </button>
      </div>

      {activeAdminSubTab === 'routing' ? (
        <>
          {/* KPI Stats Grid with distinct border-aif-neon-purple borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-neutral-950/60 border border-aif-neon-purple/30 hover:border-aif-neon-purple rounded-2xl p-5 relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(176,38,255,0.12)] group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-aif-neon-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Total Users (Live)</span>
              <div className="text-2xl font-black font-mono text-white">
                {users.length} <span className="text-xs text-white/40 font-normal">Knoten</span>
              </div>
            </div>
            <div className="p-3 bg-aif-neon-purple/10 border border-aif-neon-purple/30 rounded-xl text-aif-neon-purple group-hover:bg-aif-neon-purple/20 transition-all duration-300">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <TrendingUp size={12} />
            <span>+38.2% dieser Monat</span>
          </div>
        </div>

        <div className="bg-neutral-950/60 border border-aif-neon-purple/30 hover:border-aif-neon-purple rounded-2xl p-5 relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(176,38,255,0.12)] group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-aif-neon-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Auto-Router Pings</span>
              <div className="text-2xl font-black font-mono text-white">
                31.420 <span className="text-xs text-white/40 font-normal">/ Tag</span>
              </div>
            </div>
            <div className="p-3 bg-aif-neon-purple/10 border border-aif-neon-purple/30 rounded-xl text-aif-neon-purple group-hover:bg-aif-neon-purple/20 transition-all duration-300">
              <Cpu size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <Activity size={12} />
            <span>Durchschnitts-Latenz: 48ms (Gemini)</span>
          </div>
        </div>

        <div className="bg-neutral-950/60 border border-aif-neon-purple/30 hover:border-aif-neon-purple rounded-2xl p-5 relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(176,38,255,0.12)] group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-aif-neon-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Premium Abonnements</span>
              <div className="text-2xl font-black font-mono text-white">
                4 <span className="text-xs text-white/40 font-normal">aktiv</span>
              </div>
            </div>
            <div className="p-3 bg-aif-neon-purple/10 border border-aif-neon-purple/30 rounded-xl text-aif-neon-purple group-hover:bg-aif-neon-purple/20 transition-all duration-300">
              <Coins size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-white/50">
            <span>Umsatz-Konversionsrate: 57.1%</span>
          </div>
        </div>

        <div className="bg-neutral-950/60 border border-aif-neon-purple/30 hover:border-aif-neon-purple rounded-2xl p-5 relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(176,38,255,0.12)] group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-aif-neon-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Server-Status</span>
              <div className="text-2xl font-black font-mono text-emerald-400 flex items-center gap-2">
                <span>99.98%</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
            <div className="p-3 bg-aif-neon-purple/10 border border-aif-neon-purple/30 rounded-xl text-aif-neon-purple group-hover:bg-aif-neon-purple/20 transition-all duration-300">
              <Globe size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-white/50">
            <span>Cloud Run Instanzen: 2 aktiv (EU)</span>
          </div>
        </div>

      </div>

      {/* Interactive Charts Area with Neon Purple Frames */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Signups & Premium Area Chart */}
        <div className="lg:col-span-2 bg-neutral-950/60 border-2 border-aif-neon-purple/35 rounded-2xl p-6 backdrop-blur-md space-y-4 hover:border-aif-neon-purple/50 transition-all duration-300 shadow-[0_0_20px_rgba(176,38,255,0.03)]">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-aif-neon-purple" />
                <span>Benutzer-Wachstum &amp; Premium-Konversion</span>
              </h3>
              <p className="text-[10px] text-white/50">Echtzeit-Wachstum der Plattform im Jahr 2026</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B026FF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#B026FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(176,38,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} fontStyle="mono" />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} fontStyle="mono" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: 'rgba(176,38,255,0.2)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'black', color: '#B026FF' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontStyle: 'mono' }} />
                <Area type="monotone" dataKey="Users" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" name="Registrierte User" />
                <Area type="monotone" dataKey="Premium" stroke="#B026FF" strokeWidth={2} fillOpacity={1} fill="url(#colorPremium)" name="Premium Abos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Usage Pie Chart */}
        <div className="bg-neutral-950/60 border-2 border-aif-neon-purple/35 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between hover:border-aif-neon-purple/50 transition-all duration-300 shadow-[0_0_20px_rgba(176,38,255,0.03)]">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <PieIcon size={16} className="text-aif-neon-purple animate-pulse" />
              <span>Model Routing Share</span>
            </h3>
            <p className="text-[10px] text-white/50">Prozentualer Anteil der Auto-Router-Aufrufe</p>
          </div>
          
          <div className="h-44 my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modelDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: 'rgba(176,38,255,0.2)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            {modelDistributionData.map((d, index) => (
              <div key={d.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-white/60 truncate">{d.name}:</span>
                <span className="text-white font-bold ml-auto">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Model Auto-Router Performance Timeline */}
      <div className="bg-neutral-950/60 border border-aif-neon-purple/30 hover:border-aif-neon-purple/50 rounded-2xl p-6 backdrop-blur-md space-y-4 transition-all duration-300 shadow-[0_0_20px_rgba(176,38,255,0.02)]">
        <div>
          <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
            <Cpu size={16} className="text-aif-neon-purple" />
            <span>Auto-Router Latenzverlauf (24 Std. Telemetrie)</span>
          </h3>
          <p className="text-[10px] text-white/50">Durchschnittliche Antwortzeit pro Modell-Endpunkt in Millisekunden</p>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={latencyTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(176,38,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={10} fontStyle="mono" />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} fontStyle="mono" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', borderColor: 'rgba(176,38,255,0.2)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontStyle: 'mono' }} />
              <Line type="monotone" dataKey="Gemini" stroke="#10b981" strokeWidth={2} dot={false} name="Gemini Flash" />
              <Line type="monotone" dataKey="Claude" stroke="#06b6d4" strokeWidth={2} dot={false} name="Claude Sonnet" />
              <Line type="monotone" dataKey="GPT4" stroke="#B026FF" strokeWidth={2} dot={false} name="GPT-4o (AIF)" />
              <Line type="monotone" dataKey="Grok" stroke="#f43f5e" strokeWidth={2} dot={false} name="Grok 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Columns: User Management & Investor Tier Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* User Management Console */}
        <div className="lg:col-span-7 bg-neutral-950/60 border border-aif-neon-purple/30 hover:border-aif-neon-purple/50 rounded-2xl p-6 backdrop-blur-md space-y-4 transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-aif-neon-purple" />
                <span>Benutzer-Datenbank und Privilegien</span>
              </h3>
              <p className="text-[10px] text-white/50">Setze Berechtigungs-Overrides für registrierte Kunden</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/50 border border-aif-neon-purple/20 rounded-lg pl-8 pr-2 py-1 text-[11px] text-white font-mono placeholder-white/30 focus:border-aif-neon-purple/50 outline-none w-36"
                  placeholder="Suche..."
                />
              </div>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-black/50 border border-aif-neon-purple/20 rounded-lg px-2 py-1 text-[11px] text-white font-mono outline-none focus:border-aif-neon-purple/50"
              >
                <option value="all">Alle Abos</option>
                <option value="Free">Free</option>
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Investor">Investor</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-aif-neon-purple/10 rounded-xl">
            <table className="w-full text-left text-xs font-mono text-white/80">
              <thead className="bg-aif-neon-purple/10 text-[9px] uppercase tracking-wider text-white/70 border-b border-aif-neon-purple/20">
                <tr>
                  <th className="p-3">Name / E-Mail</th>
                  <th className="p-3">Abonnement</th>
                  <th className="p-3 text-center">Requests</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                   <tr key={u.id} className="hover:bg-aif-neon-purple/5 transition-all">
                    <td className="p-3">
                      <div className="font-sans font-bold text-white text-xs">{u.name}</div>
                      <div className="text-[10px] text-white/40 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <select
                        value={u.subscriptionTier}
                        onChange={(e) => handleUpdateUserTier(u.id, e.target.value as any)}
                        className={`bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono outline-none ${
                          u.subscriptionTier === 'Enterprise' ? 'text-aif-neon-purple font-bold' :
                          u.subscriptionTier === 'Pro' ? 'text-aif-gold-DEFAULT font-bold' :
                          u.subscriptionTier === 'Investor' ? 'text-emerald-400 font-bold' : 'text-white/60'
                        }`}
                      >
                        <option value="Free">Free (Standard)</option>
                        <option value="Starter">Starter</option>
                        <option value="Pro">Pro</option>
                        <option value="Enterprise">Enterprise</option>
                        <option value="Investor">Investor (Abo)</option>
                        <option value="Employee">Employee (Intern)</option>
                      </select>
                    </td>
                    <td className="p-3 text-center text-[11px] text-white/60 font-bold">
                      {u.requestsCount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                        u.status === 'Aktiv' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        u.status === 'Gesperrt' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' :
                        'bg-white/5 text-white/40 border-white/10'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`p-1 rounded hover:bg-white/10 transition-all text-white/60 hover:text-white inline-flex items-center gap-1 ${
                          u.email === 'sven.kulessa@gmail.com' ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''
                        }`}
                        title="Status umschalten"
                      >
                        {u.status === 'Aktiv' ? <UserX size={12} className="text-rose-400" /> : <UserCheck size={12} className="text-emerald-400" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-white/40 text-right font-mono">
            Zeige {filteredUsers.length} von {users.length} registrierten Benutzern
          </div>
        </div>

        {/* Future Investor & Employee Subscriptions Planner */}
        <div className="lg:col-span-5 bg-neutral-950/60 border border-aif-neon-purple/30 hover:border-aif-neon-purple/50 rounded-2xl p-6 backdrop-blur-md space-y-4 transition-all duration-300">
          <div className="border-b border-aif-neon-purple/20 pb-3">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-aif-neon-purple/10 text-aif-neon-purple border border-aif-neon-purple/30 uppercase">
              Zukunfts-Konfiguration
            </span>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2 mt-1.5">
              <Building2 size={16} className="text-aif-neon-purple" />
              <span>Investoren &amp; Mitarbeiter Abo-Planer</span>
            </h3>
            <p className="text-[10px] text-white/50 mt-0.5">
              Entwerfe die Struktur für externe Finanziers und zukünftige Angestellte.
            </p>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-[9px] text-white/40 uppercase tracking-wider">Abonnement-Bezeichnung</label>
              <input 
                type="text" 
                value={futureTierName} 
                onChange={(e) => setFutureTierName(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-aif-neon-purple/50 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase tracking-wider">Soll-Monatspreis (€)</label>
                <input 
                  type="number" 
                  value={futureTierCost} 
                  onChange={(e) => setFutureTierCost(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-aif-neon-purple/50 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase tracking-wider">Berechtigungs-Level</label>
                <div className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-aif-neon-purple font-bold flex items-center gap-1">
                  <Sparkles size={12} className="text-aif-neon-purple" />
                  <span>VIP + Deep Audit</span>
                </div>
              </div>
            </div>

            {/* Configured Features list */}
            <div className="space-y-2">
              <label className="text-[9px] text-white/40 uppercase tracking-wider">Inbegriffene Privilegien</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto border border-white/5 rounded-lg p-2 bg-black/20">
                {futureTierFeatures.map((feat, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 rounded px-2 py-1 text-[11px] text-white/80">
                    <span className="truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-aif-neon-purple rounded-full shrink-0" />
                      {feat}
                    </span>
                    <button 
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-rose-400 hover:text-rose-300 text-[10px] ml-2 shrink-0 font-bold"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                  className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1 text-[11px] text-white focus:border-aif-neon-purple/50 outline-none"
                  placeholder="Abo-Vorteil hinzufügen..."
                />
                <button
                  onClick={handleAddFeature}
                  className="px-3 py-1 bg-aif-neon-purple/10 border border-aif-neon-purple/20 text-aif-neon-purple hover:bg-aif-neon-purple/20 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Zufügen</span>
                </button>
              </div>
            </div>

            {/* Live Onboarding Link Generator */}
            <div className="bg-aif-neon-purple/5 border border-aif-neon-purple/20 rounded-xl p-3.5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-aif-neon-purple uppercase tracking-wider flex items-center gap-1">
                  <FileCheck size={12} />
                  <span>Premium Einladungs-Generator</span>
                </span>
                <button
                  onClick={handleGenerateInvite}
                  className="px-2.5 py-1 bg-aif-neon-purple text-white font-black text-[9px] uppercase tracking-wider rounded-lg hover:bg-aif-neon-purple/80 transition-all cursor-pointer shadow-[0_0_10px_rgba(176,38,255,0.3)]"
                >
                  Einladungslink generieren
                </button>
              </div>

              {generatedInviteCode && (
                <div className="space-y-1.5">
                  <div className="text-[9px] text-white/40 uppercase">Generierter Invite-Code &amp; Onboarding-Link:</div>
                  <div className="p-2 bg-black/60 rounded border border-white/10 text-[10px] font-mono break-all text-white flex justify-between items-center">
                    <span>{generatedInviteCode}</span>
                    <span className="text-aif-neon-purple font-bold animate-pulse">Ready</span>
                  </div>
                  <div className="p-2 bg-black/60 rounded border border-white/10 text-[9px] font-mono break-all text-aif-neon-purple">
                    {generatedInviteLink}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Model Auto-Router Config Override */}
      <div className="bg-neutral-950/60 border border-aif-neon-purple/30 hover:border-aif-neon-purple/50 rounded-2xl p-6 backdrop-blur-md space-y-4 transition-all duration-300">
        <div>
          <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-aif-neon-purple" />
            <span>Auto-Router Gewichtung &amp; Ausfallsimulation</span>
          </h3>
          <p className="text-[10px] text-white/50">Stelle die globalen Priorisierungsparameter für das KI-Routing ein.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
          
          <div className="space-y-1.5">
            <label className="text-[9px] text-white/40 uppercase tracking-wider">Optimierungs-Strategie</label>
            <div className="grid grid-cols-2 gap-2">
              {(['latency', 'cost', 'quality', 'hybrid'] as const).map((pref) => (
                <button
                  key={pref}
                  onClick={() => setRoutingPreference(pref)}
                  className={`px-3 py-2 rounded-lg border text-center transition-all cursor-pointer uppercase font-bold text-[10px] ${
                    routingPreference === pref 
                      ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-white/40 uppercase tracking-wider">Modell-Erzwingung (Hard-Route)</label>
            <select
              value={forcedModelId}
              onChange={(e) => setForcedModelId(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
            >
              <option value="none">Keine (Dynamisches Auto-Routing)</option>
              <option value="claude">Claude 3.5 Sonnet (Qualität)</option>
              <option value="gpt4">GPT-4o (Legacy)</option>
              <option value="gemini">Gemini 2.5 Flash (Speed)</option>
              <option value="grok">Grok 2 (Research)</option>
              <option value="llama">Llama 3.3 Local (Datenschutz)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label className="text-[9px] text-white/40 uppercase tracking-wider">Simulierter Latenz-Multiplier</label>
              <span className="text-xs text-purple-400 font-bold font-mono">{simulatedLoadMultiplier}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="3.0" 
              step="0.1" 
              value={simulatedLoadMultiplier} 
              onChange={(e) => setSimulatedLoadMultiplier(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[9px] text-white/30 uppercase">
              <span>Schnell (0.5x)</span>
              <span>Überlastet (3.0x)</span>
            </div>
          </div>

        </div>

        <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-white/60 border border-white/5">
          <AlertTriangle className="text-amber-500 shrink-0" size={16} />
          <div>
            Diese Änderungen greifen direkt in das <strong>Model-Routing</strong> ein und wirken sich auf die simulierten Latenzberechnungen der Clients aus. Sie dienen Entwicklungs- und Simulationszwecken.
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-6 animate-fade-in" id="pricing-management-view">
          <div className="bg-gradient-to-r from-emerald-500/10 via-black/40 to-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-md shadow-[0_0_35px_rgba(16,185,129,0.08)] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute left-0 top-0 w-1.5 h-full bg-emerald-500" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  Markt-Korrektur &amp; Registry
                </span>
                <h2 className="text-xl font-bold font-display text-white uppercase tracking-wider mt-2 flex items-center gap-2">
                  <Coins size={18} className="text-emerald-400" />
                  <span>Preis- &amp; Asset-Manager</span>
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Behebe Preiskonflikte und ungenaue Feeds in Echtzeit. Sperre aktualisierte Werte, damit sie nicht von Hintergrund-APIs überschrieben werden.
                </p>
              </div>
              <button
                onClick={loadRegistryAssets}
                className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
              >
                <RefreshCw size={14} className={isLoadingAssets ? 'animate-spin' : ''} />
                <span>Registry neu laden</span>
              </button>
            </div>
          </div>

          {pricingSuccessMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-xs font-mono flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Check size={18} className="shrink-0" />
              <span>{pricingSuccessMsg}</span>
            </div>
          )}

          {pricingErrorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-xs font-mono flex items-center gap-3">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{pricingErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Asset List Block */}
            <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                    Aktive Registry-Knoten ({registryAssets.length})
                  </h3>
                  <p className="text-[10px] text-white/50">Wähle ein Asset aus der System-Registry, um es anzupassen.</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Symbol o. Name suchen..."
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:ring-0 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-xl max-h-[500px] overflow-y-auto animate-fade-in">
                <table className="w-full text-left text-xs font-mono text-white/80">
                  <thead className="bg-white/5 text-[10px] uppercase text-white/40 border-b border-white/5 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="p-3.5">Asset / Typ</th>
                      <th className="p-3.5">Preis (USD)</th>
                      <th className="p-3.5">24h Änd.</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoadingAssets ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-white/50">
                          <div className="flex justify-center items-center gap-3">
                            <RefreshCw size={14} className="animate-spin text-emerald-400" />
                            <span>Lade Registry-Daten aus dem System-Kern...</span>
                          </div>
                        </td>
                      </tr>
                    ) : registryAssets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-white/40">Keine Assets geladen.</td>
                      </tr>
                    ) : (
                      registryAssets
                        .filter(a => {
                          const query = assetSearchQuery.toLowerCase();
                          return a.symbol.toLowerCase().includes(query) || a.name.toLowerCase().includes(query);
                        })
                        .map(asset => {
                          const isSelected = selectedEditAsset?.symbol === asset.symbol;
                          return (
                            <tr 
                              key={asset.symbol} 
                              className={`transition-colors hover:bg-white/[0.02] ${
                                isSelected ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''
                              }`}
                            >
                              <td className="p-3.5">
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{asset.symbol}</span>
                                  {asset.isLocked && (
                                    <span className="p-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px]" title="Price Locked">
                                      <Lock size={8} />
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-white/40 capitalize">{asset.type}</div>
                              </td>
                              <td className="p-3.5 font-bold text-white">
                                {asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} $
                              </td>
                              <td className={`p-3.5 font-bold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  asset.isLocked 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-white/5 text-white/50 border border-white/10'
                                }`}>
                                  {asset.isLocked ? 'GESPERRT' : 'AUTO'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleSelectEditAsset(asset)}
                                  className="px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-white hover:text-emerald-400 transition-all text-[10px] cursor-pointer"
                                >
                                  Anpassen
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Asset Editor Block */}
            <div className="lg:col-span-5 space-y-4">
              
              {selectedEditAsset ? (
                <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                  
                  <div>
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Selected Asset</span>
                    <h3 className="text-base font-black text-white font-display uppercase tracking-wider flex items-center justify-between">
                      <span>{selectedEditAsset.name} ({selectedEditAsset.symbol})</span>
                      <span className="text-xs text-white/40 lowercase capitalize font-mono font-normal">
                        {selectedEditAsset.type}
                      </span>
                    </h3>
                    <p className="text-[10px] text-white/50 mt-1">
                      Definiere präzise Parameter für das Asset. Die Änderungen greifen instantan.
                    </p>
                  </div>

                  <div className="space-y-3.5 text-xs font-mono">
                    {/* Live price input */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-white/40 uppercase tracking-wider">Richtpreis (USD)</label>
                      <input
                        type="text"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                        placeholder="Z.B. 68500.00"
                      />
                    </div>

                    {/* 24h change input */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-white/40 uppercase tracking-wider">24h-Veränderung (%)</label>
                      <input
                        type="text"
                        value={editChange24h}
                        onChange={(e) => setEditChange24h(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                        placeholder="Z.B. 2.45"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Expected return input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-white/40 uppercase tracking-wider">Erw. Rendite (%)</label>
                        <input
                          type="text"
                          value={editExpectedReturn}
                          onChange={(e) => setEditExpectedReturn(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-emerald-500/50"
                          placeholder="Z.B. 15"
                        />
                      </div>

                      {/* Volatility input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-white/40 uppercase tracking-wider">Volatilität (%)</label>
                        <input
                          type="text"
                          value={editVolatility}
                          onChange={(e) => setEditVolatility(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-emerald-500/50"
                          placeholder="Z.B. 45"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Drift factor input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-white/40 uppercase tracking-wider">Drift-Faktor</label>
                        <input
                          type="text"
                          value={editDrift}
                          onChange={(e) => setEditDrift(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-emerald-500/50"
                          placeholder="Z.B. 0.15"
                        />
                      </div>

                      {/* Market Cap input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-white/40 uppercase tracking-wider">Market Cap ($ Mrd.)</label>
                        <input
                          type="text"
                          value={editMarketCap}
                          onChange={(e) => setEditMarketCap(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-emerald-500/50"
                          placeholder="Z.B. 1340.0"
                        />
                      </div>
                    </div>

                    {/* Price-Lock Status Toggle */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-white uppercase block">Wertsperre aktivieren</span>
                        <span className="text-[9px] text-white/40 block">Schützt diesen Preis vor API-Überschreibungen</span>
                      </div>
                      <button
                        onClick={() => setEditIsLocked(!editIsLocked)}
                        className={`w-10 h-6 rounded-full p-1 transition-all ${
                          editIsLocked ? 'bg-emerald-500' : 'bg-white/10'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-black transition-all ${
                          editIsLocked ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleSaveAssetParameters(selectedEditAsset.symbol)}
                      className="w-full py-2.5 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      <Check size={14} />
                      <span>Parameter speichern &amp; sperren</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md">
                  <Coins size={36} className="text-white/20 mx-auto mb-3" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kein Asset ausgewählt</h4>
                  <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed">
                    Wähle in der linken Tabelle einen aktiven Registry-Knoten aus, um seine Echtzeitpreise und mathematischen Simulationsfaktoren sofort zu überschreiben.
                  </p>
                </div>
              )}

              {/* General platform pricing guide */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-white/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase font-mono">
                  <Building2 size={14} />
                  <span>Administrative Richtlinie</span>
                </div>
                <p className="leading-relaxed font-sans">
                  Sämtliche Preiskorrekturen, die hier durchgeführt und mit der <strong>Wertsperre (Gesperrt-Status)</strong> versehen werden, bleiben über alle Subsysteme (wie Heatmaps, Risikoberechnungen, Monte-Carlo, Screener und News) hinweg persistent erhalten. Der automatische 60s-Ticker ignoriert diese Werte.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Dev-Umgebungs- & Datenbank-Schnittstellen-Administration with distinct purple style */}
      <div className="mt-8 bg-gradient-to-br from-aif-neon-purple/15 via-black/60 to-neutral-950 border-2 border-aif-neon-purple p-6 rounded-2xl backdrop-blur-md relative overflow-hidden shadow-[0_0_35px_rgba(176,38,255,0.15)]">
        {/* Ambient background blur spots */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-aif-neon-purple/15 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-aif-neon-purple/20">
            <div className="p-2.5 rounded-xl bg-aif-neon-purple/10 border border-aif-neon-purple/30 text-aif-neon-purple shadow-[0_0_15px_rgba(176,38,255,0.2)]">
              <Settings2 size={20} className="animate-spin-slow" />
            </div>
            <div>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-aif-neon-purple/10 text-aif-neon-purple border border-aif-neon-purple/30 uppercase">
                DEVSYNC OVERVIEW • BETA-PHASE 0.5.0
              </span>
              <h3 className="font-display font-black text-white text-base tracking-wide uppercase mt-1">
                CAPITAL-AI Dev Station &amp; Datenbank-Architektur
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Developer Statement */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-white/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-aif-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.8)]" />
                Dev-Zentren-Richtlinie &amp; Zugriffskontrolle
              </h4>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Diese Instanz läuft produktiv unter <strong>capital-ai.online</strong>. Der Gastmodus und der frühere E-Mail-basierte Bypass wurden entfernt, da sie ein Rechteausweitungsrisiko darstellten.
              </p>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Admin-Zugriff ist ausschließlich an die verifizierte E-Mail des Eigentümers (<strong>sven.kulessa@gmail.com</strong>) gebunden. Alle datenverändernden Admin-Aktionen werden zusätzlich serverseitig über JWT- und <code>requireOrchestratorAdmin</code>-Prüfung abgesichert — die clientseitige Anzeige hier ist rein kosmetisch und kein Sicherheitsmechanismus.
              </p>
              <div className="p-3 bg-aif-neon-purple/5 border border-aif-neon-purple/20 rounded-xl flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-aif-neon-purple animate-pulse" />
                <span className="text-[10px] font-mono text-white/60">Eigentümer verifiziert: sven.kulessa@gmail.com</span>
              </div>
            </div>

            {/* Right side: Database Synchronization FAQ */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-aif-neon-purple flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-aif-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.8)]" />
                Echtzeit DB Synchronisation (Dev &amp; Prod)
              </h4>
              
              <div className="space-y-3">
                <div className="p-3.5 bg-aif-neon-purple/5 border border-aif-neon-purple/15 rounded-xl space-y-2">
                  <span className="text-[10px] font-mono text-aif-neon-purple font-bold block">
                    FRAGE: Ist es möglich, die Dev-Umgebung an die gleiche Datenbank wie die Produktionsumgebung anzuschließen?
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">
                    <strong>JA, ABSOLUT!</strong> Sie können die exakt gleichen Zugangsdaten (Supabase URL, Anon Key, Connection String) in Ihrer Dev-Konfiguration verwenden. Dadurch arbeiten beide Umgebungen in Echtzeit auf derselben Datenbasis.
                  </p>
                </div>

                <div className="p-3.5 bg-black/40 border border-aif-neon-purple/10 rounded-xl text-[11px] space-y-2 font-sans">
                  <span className="text-[10px] font-mono text-white/50 uppercase font-black block">Architektur-Abwägung:</span>
                  <ul className="space-y-1.5 text-white/70 list-none pl-0">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✔ Pro:</span> 
                      <span>Einzige Quelle der Wahrheit (Single Source of Truth). Registrierte Testuser und getätigte Einstellungen sind direkt live verfügbar.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">✘ Kontra:</span> 
                      <span>Gefahr von Daten-Interferenzen. Entwicklungs-Tests, Schema-Migrationen oder versehentliche Löschungen im Dev-Zustand wirken sich sofort auf produktive Live-Daten aus.</span>
                    </li>
                  </ul>
                  <p className="text-[10px] text-white/40 italic pt-1 border-t border-white/5">
                    Empfehlung: Nutzen Sie für die aktive Entwicklung einen Klon oder separate Tabellen-Präfixe, um Datenverlust im Live-System zu vermeiden.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
