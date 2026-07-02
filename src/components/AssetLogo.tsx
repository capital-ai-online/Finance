import React from 'react';

interface AssetLogoProps {
  symbol: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
}

export function AssetLogo({ symbol, className = "", size = 'sm' }: AssetLogoProps) {
  const cleanSymbol = symbol.toUpperCase().trim();

  // Determine actual pixel dimensions based on shorthand size or custom number
  let dimClass = "w-7 h-7 text-xs";
  let iconSize = 14;

  if (typeof size === 'number') {
    dimClass = `w-[${size}px] h-[${size}px]`;
    iconSize = Math.max(10, Math.floor(size * 0.5));
  } else {
    switch (size) {
      case 'xs':
        dimClass = "w-5 h-5 text-[9px]";
        iconSize = 10;
        break;
      case 'sm':
        dimClass = "w-7 h-7 text-xs";
        iconSize = 14;
        break;
      case 'md':
        dimClass = "w-9 h-9 text-sm";
        iconSize = 18;
        break;
      case 'lg':
        dimClass = "w-12 h-12 text-lg";
        iconSize = 24;
        break;
    }
  }

  // Dual overlay rendering for Forex Pairs
  if (cleanSymbol.length === 6 && (cleanSymbol.includes('USD') || cleanSymbol.includes('EUR') || cleanSymbol.includes('GBP') || cleanSymbol.includes('JPY') || cleanSymbol.includes('CAD') || cleanSymbol.includes('CHF') || cleanSymbol.includes('AUD'))) {
    // It's a forex pair, let's split it into base and quote currencies and render overlapping flags
    const base = cleanSymbol.substring(0, 3);
    const quote = cleanSymbol.substring(3, 6);

    const getFlagEmoji = (cur: string) => {
      switch (cur) {
        case 'EUR': return '🇪🇺';
        case 'USD': return '🇺🇸';
        case 'GBP': return '🇬🇧';
        case 'JPY': return '🇯🇵';
        case 'CAD': return '🇨🇦';
        case 'CHF': return '🇨🇭';
        case 'AUD': return '🇦🇺';
        default: return '🏳️';
      }
    };

    return (
      <div className={`relative flex items-center justify-center shrink-0 select-none ${className}`} style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}>
        {/* Base Currency Flag (Top-Left) */}
        <span className="absolute z-10 -left-1 -top-1 filter drop-shadow-md text-[13px] md:text-[15px] leading-none">
          {getFlagEmoji(base)}
        </span>
        {/* Quote Currency Flag (Bottom-Right) */}
        <span className="absolute z-0 -right-0.5 -bottom-0.5 filter drop-shadow-sm text-[12px] md:text-[14px] leading-none">
          {getFlagEmoji(quote)}
        </span>
      </div>
    );
  }

  // Individual assets rendering (Cryptos, Stocks, Commodities)
  switch (cleanSymbol) {
    // CRYPTOCURRENCIES
    case 'BTC':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-400/30 flex items-center justify-center shrink-0 text-white font-extrabold font-mono shadow-[0_0_12px_rgba(245,158,11,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <span className="font-sans leading-none">₿</span>
        </div>
      );
    case 'ETH':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 border border-purple-500/30 flex items-center justify-center shrink-0 text-white font-mono shadow-[0_0_12px_rgba(168,85,247,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <svg viewBox="0 0 256 417" className="w-[45%] h-[45%] fill-white">
            <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fillOpacity=".85" />
            <path d="M127.962 0L0 212.32l127.962 75.638V124.715z" />
            <path d="M127.961 312.187l-1.575 1.92v98.4l1.575 4.59 128.038-180.22z" fillOpacity=".85" />
            <path d="M127.962 417.097v-104.91L0 236.31z" />
            <path d="M127.961 287.958l127.96-75.637-127.96-58.162z" fillOpacity=".7" />
            <path d="M0 212.32l127.962 75.638V154.158z" fillOpacity=".5" />
          </svg>
        </div>
      );
    case 'SOL':
      return (
        <div 
          className={`rounded-full bg-black border border-neutral-800 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(20,241,149,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Solana stylized wave gradient */}
          <div className="w-[50%] h-[50%] flex flex-col justify-between">
            <div className="h-[20%] w-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-[1px] transform -skew-x-12" />
            <div className="h-[20%] w-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-[1px] transform skew-x-12" />
            <div className="h-[20%] w-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-[1px] transform -skew-x-12" />
          </div>
        </div>
      );
    case 'ADA':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/20 flex items-center justify-center shrink-0 text-white font-extrabold shadow-[0_0_12px_rgba(37,99,235,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <span className="font-sans leading-none">₳</span>
        </div>
      );
    case 'XRP':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-blue-500 via-sky-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center shrink-0 text-white font-extrabold shadow-[0_0_12px_rgba(59,130,246,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <span className="font-sans leading-none tracking-tight">✕</span>
        </div>
      );
    case 'DOT':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700 border border-pink-400/30 flex items-center justify-center shrink-0 text-white font-extrabold shadow-[0_0_12px_rgba(236,72,153,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <div className="flex gap-0.5 items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white block" />
            <span className="w-1.5 h-1.5 rounded-full bg-white block" />
            <span className="w-1.5 h-1.5 rounded-full bg-white block" />
          </div>
        </div>
      );
    case 'AVAX':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-red-500 via-rose-600 to-red-700 border border-red-400/30 flex items-center justify-center shrink-0 text-white font-extrabold shadow-[0_0_12px_rgba(239,68,68,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <span className="font-mono leading-none">▲</span>
        </div>
      );
    case 'LINK':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-blue-600 via-sky-600 to-blue-800 border border-blue-400/30 flex items-center justify-center shrink-0 text-white font-extrabold shadow-[0_0_12px_rgba(37,99,235,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <span className="font-mono text-xs leading-none">⛓</span>
        </div>
      );
    case 'BNB':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 border border-yellow-300/30 flex items-center justify-center shrink-0 text-black font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <span className="font-mono leading-none text-xs">◆</span>
        </div>
      );
    case 'MATIC':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-800 border border-purple-400/30 flex items-center justify-center shrink-0 text-white font-extrabold shadow-[0_0_12px_rgba(168,85,247,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <span className="font-sans leading-none">⬢</span>
        </div>
      );
    
    // MEME COINS
    case 'DOGE':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border border-yellow-300/40 flex items-center justify-center shrink-0 text-white font-black shadow-[0_0_15px_rgba(234,179,8,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Dogecoin"
        >
          <span className="font-sans leading-none text-sm md:text-base">Ð</span>
        </div>
      );
    case 'SHIB':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-orange-500 via-red-600 to-yellow-500 border border-orange-400/30 flex items-center justify-center shrink-0 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Shiba Inu"
        >
          <span className="text-xs leading-none filter drop-shadow-sm">🐕</span>
        </div>
      );
    case 'PEPE':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-green-400 via-emerald-600 to-green-700 border border-emerald-500/30 flex items-center justify-center shrink-0 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Pepe"
        >
          <span className="text-xs leading-none">🐸</span>
        </div>
      );
    case 'WIF':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 border border-pink-400/30 flex items-center justify-center shrink-0 text-white shadow-[0_0_15px_rgba(219,39,119,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="dogwifhat"
        >
          <span className="text-xs leading-none">👒</span>
        </div>
      );
    case 'BONK':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-600 border border-amber-400/30 flex items-center justify-center shrink-0 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Bonk"
        >
          <span className="text-xs leading-none">🏏</span>
        </div>
      );
    case 'FLOKI':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-amber-600 via-yellow-600 to-zinc-900 border border-amber-500/30 flex items-center justify-center shrink-0 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Floki"
        >
          <span className="text-xs leading-none">🛡️</span>
        </div>
      );
    case 'POPCAT':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-zinc-100 via-neutral-300 to-zinc-400 border border-neutral-300/30 flex items-center justify-center shrink-0 text-black shadow-[0_0_15px_rgba(255,255,255,0.15)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Popcat"
        >
          <span className="text-xs leading-none">🐱</span>
        </div>
      );
    case 'BRETT':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-700 border border-blue-400/30 flex items-center justify-center shrink-0 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Brett"
        >
          <span className="text-xs leading-none">👕</span>
        </div>
      );
    case 'MOG':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-zinc-800 via-neutral-900 to-zinc-950 border border-white/10 flex items-center justify-center shrink-0 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Mog Coin"
        >
          <span className="text-xs leading-none">🕶️</span>
        </div>
      );
    case 'BOME':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-green-900 via-emerald-800 to-black border border-green-500/20 flex items-center justify-center shrink-0 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Book of Meme"
        >
          <span className="text-xs leading-none">📖</span>
        </div>
      );

    // STOCKS
    case 'AAPL':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-zinc-700 via-neutral-800 to-zinc-900 border border-neutral-600/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Inline clean SVG representing Apple logo */}
          <svg viewBox="0 0 170 170" className="w-[45%] h-[45%] fill-white">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.37-6.15-2.9-2.39-6.67-6.86-11.33-13.39-7.14-10.15-12.75-21.49-16.83-34.02-4.08-12.53-6.13-24.16-6.13-34.88 0-14.05 3.66-25.59 10.98-34.6 7.32-9.02 16.51-13.59 27.56-13.72 5.17 0 10.74 1.57 16.71 4.7 5.97 3.13 10.02 4.69 12.14 4.69 2.12 0 6.37-1.63 12.73-4.89 6.36-3.26 11.66-4.78 15.89-4.57 15.22.75 26.65 6.46 34.28 17.11-13.43 8.16-20.02 19.34-19.78 33.53.25 10.27 4.14 18.77 11.68 25.5 7.53 6.73 16.38 10.35 26.54 10.86-2.12 6.13-5.06 12.14-8.81 18.03zM119.22 34.74c0-7.72 2.76-14.88 8.27-21.49 5.51-6.61 12.35-10.45 20.52-11.54 0.13 0.88.2 1.63.2 2.25 0 7.6-2.83 14.7-8.5 21.29-5.67 6.59-12.63 10.42-20.88 11.49-0.12-0.63-0.21-1.38-0.21-2z"/>
          </svg>
        </div>
      );
    case 'MSFT':
      return (
        <div 
          className={`rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(242,80,34,0.1)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Microsoft 4 colored grid squares */}
          <div className="w-[45%] h-[45%] grid grid-cols-2 gap-0.5">
            <div className="bg-[#f25022]" />
            <div className="bg-[#7fba00]" />
            <div className="bg-[#00a4ef]" />
            <div className="bg-[#ffb900]" />
          </div>
        </div>
      );
    case 'GOOGL':
      return (
        <div 
          className={`rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(66,133,244,0.15)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Google iconic colorful "G" */}
          <svg viewBox="0 0 24 24" className="w-[50%] h-[50%]">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22-.03-.6z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" />
          </svg>
        </div>
      );
    case 'AMZN':
      return (
        <div 
          className={`rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(255,153,0,0.15)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Amazon arrow smiley */}
          <div className="relative w-[60%] h-[40%] flex flex-col justify-between items-center">
            <span className="text-[10px] md:text-[11px] font-sans font-black text-white leading-none">a</span>
            <svg viewBox="0 0 100 25" className="w-[85%] fill-[#ff9900]">
              <path d="M1.3 5.4C15.8 19 39.5 24 61.5 24c16.2 0 31.8-2.6 40.5-6.8.8-.4.7-1-.2-.8-13 3.3-33.3 5-55.8 4.2C24.4 20 8 13.5 1.7 5c-.4-.5-1 .1-.4.4z" />
              <path d="M99.6 12.3c-2.4-.3-10.4 1-13.2 2.2-1 .4-1.2 1.3-.3 1.5 3 1 10.2.7 11.7-.5 1-1 .7-4.2 1.8-3.2z" />
            </svg>
          </div>
        </div>
      );
    case 'NVDA':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-emerald-500 via-green-600 to-zinc-950 border border-emerald-500/30 flex items-center justify-center shrink-0 text-white shadow-[0_0_12px_rgba(118,185,0,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* NVIDIA claw-shaped circular spiral */}
          <svg viewBox="0 0 100 100" className="w-[50%] h-[50%] fill-white">
            <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90c-22.1 0-40-17.9-40-40S27.9 10 50 10s40 17.9 40 40-17.9 40-40 40z" />
            <path d="M50 20c-16.6 0-30 13.4-30 30s13.4 30 30 30 30-13.4 30-30-13.4-30-30-30zm0 50c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z" />
            <circle cx="50" cy="50" r="10" />
          </svg>
        </div>
      );
    case 'TSLA':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-red-600 to-rose-900 border border-red-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(227,25,55,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Tesla shield-like stylized T logo */}
          <svg viewBox="0 0 100 100" className="w-[50%] h-[50%] fill-white">
            <path d="M8 12c22 3.5 44 3.5 66 0C55 24 37 38 37 68h8c0-26 15-38 33-51 0 26-10 47-30 59v8h8c14-9 22-25 24-48 0 0 0-1 0-1-26 3.5-52 3.5-78 0 0 0 0 1 0 1 2 23 10 39 24 48h8v-8C35 63 25 42 25 17c18 13 33 25 33 51h8C66 38 48 24 8 12z"/>
          </svg>
        </div>
      );
    case 'META':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-blue-500 via-sky-600 to-indigo-700 border border-blue-400/20 flex items-center justify-center shrink-0 text-white shadow-[0_0_10px_rgba(6,104,226,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Meta Infinity Loop logo */}
          <svg viewBox="0 0 144 80" className="w-[50%] h-[50%] fill-white">
            <path d="M104.7 0C92.2 0 81 6.5 72 17 63 6.5 51.8 0 39.3 0 17.6 0 0 17.9 0 40s17.6 40 39.3 40c12.5 0 23.7-6.5 32.7-17 9 10.5 20.2 17 32.7 40 21.7 0 39.3-17.9 39.3-40S126.4 0 104.7 0zm0 63.8c-13.4 0-24.2-10.7-24.2-23.8S91.3 16.2 104.7 16.2c13.4 0 24.2 10.7 24.2 23.8s-10.8 23.8-24.2 23.8zm-65.4 0C25.9 63.8 15.1 53.1 15.1 40s10.8-23.8 24.2-23.8c13.4 0 24.2 10.7 24.2 23.8S52.7 63.8 39.3 63.8z" />
          </svg>
        </div>
      );
    case 'NFLX':
      return (
        <div 
          className={`rounded-full bg-black border border-neutral-900 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(229,9,20,0.25)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Netflix Red bold ribbon "N" */}
          <svg viewBox="0 0 100 150" className="w-[45%] h-[50%]">
            <path fill="#e50914" d="M15 0h22v150H15z" />
            <path fill="#b20710" d="M63 0h22v150H63z" />
            <path fill="#e50914" d="M15 0l70 150h-22L15 25z" />
          </svg>
        </div>
      );
    case 'AMD':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-neutral-800 to-black border border-neutral-700 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(243,156,18,0.1)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* AMD arrow pointing right */}
          <svg viewBox="0 0 100 100" className="w-[50%] h-[50%] fill-white">
            <path d="M85 50L45 10v25H15v30h30v25z" fill="#f39c12" />
            <path d="M15 15h70v70H15z" fillOpacity="0.1" />
          </svg>
        </div>
      );
    case 'INTC':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 border border-blue-400/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,113,197,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          {/* Intel typography style "i" */}
          <span className="font-sans font-black italic text-white leading-none tracking-tighter">intel</span>
        </div>
      );

    // COMMODITIES
    case 'GLD':
      return (
        <div 
          className={`rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-300/40 flex flex-col items-center justify-center shrink-0 shadow-[0_0_14px_rgba(217,119,6,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined, borderRadius: '6px' }}
          title="Goldbarren Spot"
        >
          {/* Gold Bar vector line */}
          <span className="font-mono font-black text-[9px] md:text-[10px] text-amber-950 leading-none">Au</span>
          <div className="w-[60%] h-[12%] bg-yellow-100/50 rounded-full mt-0.5" />
        </div>
      );
    case 'SLV':
      return (
        <div 
          className={`rounded-lg bg-gradient-to-br from-slate-200 via-neutral-300 to-slate-500 border border-slate-300/40 flex flex-col items-center justify-center shrink-0 shadow-[0_0_14px_rgba(150,150,150,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined, borderRadius: '6px' }}
          title="Silber Spot"
        >
          {/* Silver Bar vector line */}
          <span className="font-mono font-black text-[9px] md:text-[10px] text-slate-900 leading-none">Ag</span>
          <div className="w-[60%] h-[12%] bg-white/70 rounded-full mt-0.5" />
        </div>
      );
    case 'USO':
    case 'WTI':
    case 'BRENT':
      return (
        <div 
          className={`rounded-lg bg-gradient-to-br from-neutral-700 via-neutral-800 to-black border border-neutral-600/30 flex flex-col items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined, borderRadius: '6px' }}
          title={`${cleanSymbol} Crude Oil`}
        >
          {/* Oil Barrel styling */}
          <div className="w-[50%] h-[60%] border border-neutral-500 rounded-sm relative flex flex-col justify-between p-[1px]">
            <div className="h-[2px] bg-neutral-500 w-full" />
            <div className="h-[3px] w-[3px] bg-amber-500 rounded-full mx-auto" />
            <div className="h-[2px] bg-neutral-500 w-full" />
          </div>
        </div>
      );
    case 'NG=F':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-blue-700 via-sky-600 to-neutral-900 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(2,132,199,0.3)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Erdgas"
        >
          {/* Cyan/Blue gas flame */}
          <svg viewBox="0 0 24 24" className="w-[50%] h-[50%] fill-none stroke-cyan-400 stroke-2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="rgba(34,211,238,0.2)" />
          </svg>
        </div>
      );
    case 'COPPER':
      return (
        <div 
          className={`rounded-lg bg-gradient-to-br from-orange-600 via-amber-700 to-amber-900 border border-orange-500/30 flex flex-col items-center justify-center shrink-0 shadow-[0_0_14px_rgba(217,119,6,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined, borderRadius: '6px' }}
          title="Kupfer Spot"
        >
          <span className="font-mono font-black text-[9px] md:text-[10px] text-amber-200 leading-none">Cu</span>
          <div className="w-[60%] h-[12%] bg-orange-300/40 rounded-full mt-0.5" />
        </div>
      );
    case 'PALL':
      return (
        <div 
          className={`rounded-lg bg-gradient-to-br from-slate-400 via-neutral-400 to-zinc-600 border border-slate-300/30 flex flex-col items-center justify-center shrink-0 shadow-[0_0_12px_rgba(148,163,184,0.15)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined, borderRadius: '6px' }}
          title="Palladium Spot"
        >
          <span className="font-mono font-black text-[9px] md:text-[10px] text-slate-100 leading-none">Pd</span>
          <div className="w-[60%] h-[12%] bg-slate-200/30 rounded-full mt-0.5" />
        </div>
      );
    case 'PLAT':
      return (
        <div 
          className={`rounded-lg bg-gradient-to-br from-slate-100 via-zinc-300 to-slate-400 border border-slate-200/30 flex flex-col items-center justify-center shrink-0 shadow-[0_0_12px_rgba(203,213,225,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined, borderRadius: '6px' }}
          title="Platin Spot"
        >
          <span className="font-mono font-black text-[9px] md:text-[10px] text-zinc-800 leading-none">Pt</span>
          <div className="w-[60%] h-[12%] bg-white/50 rounded-full mt-0.5" />
        </div>
      );
    case 'CORN':
      return (
        <div 
          className={`rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-green-700 border border-yellow-400/30 flex items-center justify-center shrink-0 text-white shadow-[0_0_12px_rgba(234,179,8,0.2)] select-none ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
          title="Mais Futures"
        >
          <span className="text-xs leading-none">🌽</span>
        </div>
      );

    // DETERMINISTIC FALLBACK
    default: {
      const firstChar = cleanSymbol.substring(0, 1) || '?';
      const secondChar = cleanSymbol.substring(1, 2) || '';
      
      // Seeded index to select a stunning dark gradient
      const charCode = cleanSymbol.charCodeAt(0) + (cleanSymbol.charCodeAt(1) || 0);
      const gradients = [
        "from-indigo-600 via-indigo-700 to-slate-900",
        "from-cyan-600 via-teal-700 to-zinc-900",
        "from-purple-600 via-fuchsia-700 to-neutral-900",
        "from-emerald-600 via-green-700 to-slate-900",
        "from-blue-600 via-sky-700 to-neutral-900"
      ];
      const grad = gradients[charCode % gradients.length];

      return (
        <div 
          className={`rounded-full bg-gradient-to-br ${grad} border border-white/10 flex items-center justify-center shrink-0 text-white font-mono font-bold leading-none tracking-tight select-none shadow-[0_2px_8px_rgba(0,0,0,0.3)] ${dimClass} ${className}`}
          style={{ width: typeof size === 'number' ? size : undefined, height: typeof size === 'number' ? size : undefined }}
        >
          <span>{firstChar}{secondChar.toLowerCase()}</span>
        </div>
      );
    }
  }
}
