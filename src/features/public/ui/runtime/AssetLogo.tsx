import React from 'react';
import type { MainCategory, MarketAsset } from '../frontend-port/types';

interface AssetLogoProps {
  asset?: Pick<MarketAsset, 'symbol' | 'name' | 'mainCategory'>;
  symbol?: string;
  name?: string;
  category?: MainCategory;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'h-5 w-5 rounded-md text-[8px]',
  sm: 'h-7 w-7 rounded-lg text-[9px]',
  md: 'h-9 w-9 rounded-xl text-[10px]',
  lg: 'h-12 w-12 rounded-2xl text-[12px]',
} as const;

function symbolKey(rawSymbol: string): string {
  return rawSymbol.toUpperCase().replaceAll(' ', '').split('/')[0].replace(/^\^/, '');
}

function fallbackLabel(symbol: string, name: string): string {
  if (symbol) return symbol.slice(0, 4);
  return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase() || 'AI';
}

export function AssetLogo({ asset, symbol = '', name = '', category, size = 'md', className = '' }: AssetLogoProps) {
  const rawSymbol = asset?.symbol ?? symbol;
  const cleanSymbol = symbolKey(rawSymbol);
  const assetName = asset?.name ?? name;
  const assetCategory = asset?.mainCategory ?? category;

  const content = (() => {
    if (cleanSymbol === 'BTC') {
      return <div className="flex h-full w-full items-center justify-center bg-[#F7931A] font-serif text-[1.25em] font-black text-white">₿</div>;
    }
    if (cleanSymbol === 'ETH') {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#627EEA] p-[18%]">
          <svg viewBox="0 0 100 162" className="h-full w-full" aria-hidden="true">
            <path fill="#fff" fillOpacity=".95" d="M50 0 8 82l42 25 42-25L50 0Z" />
            <path fill="#fff" fillOpacity=".65" d="M50 116 8 91l42 71 42-71-42 25Z" />
            <path fill="#627EEA" fillOpacity=".38" d="m50 96 42-14-42-23V96Z" />
          </svg>
        </div>
      );
    }
    if (cleanSymbol === 'SOL') {
      return (
        <div className="flex h-full w-full items-center justify-center bg-black p-[18%]">
          <svg viewBox="0 0 100 82" className="h-full w-full" aria-hidden="true">
            <defs><linearGradient id="solana-logo-gradient" x1="0" x2="1"><stop stopColor="#9945FF"/><stop offset=".5" stopColor="#14F195"/><stop offset="1" stopColor="#00C2FF"/></linearGradient></defs>
            <path fill="url(#solana-logo-gradient)" d="M18 0h72L72 18H0L18 0Zm0 32h72L72 50H0l18-18Zm0 32h72L72 82H0l18-18Z" />
          </svg>
        </div>
      );
    }
    if (cleanSymbol === 'AAPL') {
      return <div className="flex h-full w-full items-center justify-center bg-white font-black text-black"><span className="text-[1.45em] leading-none">●</span></div>;
    }
    if (cleanSymbol === 'MSFT') {
      return (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[7%] bg-white p-[18%]">
          <span className="bg-[#F25022]"/><span className="bg-[#7FBA00]"/><span className="bg-[#00A4EF]"/><span className="bg-[#FFB900]"/>
        </div>
      );
    }
    if (cleanSymbol === 'NVDA') {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#76B900] p-[16%] text-white">
          <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="5" aria-hidden="true">
            <path d="M8 31c13-17 33-18 48 0-9 15-30 20-43 6 9-11 24-10 32-1-7 8-20 9-28 2" />
            <circle cx="33" cy="31" r="6" fill="currentColor" stroke="none" />
          </svg>
        </div>
      );
    }
    if (cleanSymbol === 'XAU' || cleanSymbol === 'GOLD') {
      return <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFF0A8] via-[#F9BF21] to-[#B97800] font-black text-[#231600]">Au</div>;
    }
    if (cleanSymbol === 'XAG' || cleanSymbol === 'SILVER') {
      return <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white via-slate-300 to-slate-500 font-black text-slate-950">Ag</div>;
    }
    if (cleanSymbol === 'BRENT' || cleanSymbol === 'WTI') {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#111827] text-amber-300">
          <svg viewBox="0 0 24 24" className="h-[62%] w-[62%]" fill="currentColor" aria-hidden="true"><path d="M12 2c3 4 6 7 6 12a6 6 0 1 1-12 0c0-3 2-6 6-12Zm0 7c-2 3-3 4-3 6a3 3 0 1 0 6 0c0-2-1-3-3-6Z"/></svg>
        </div>
      );
    }
    if (cleanSymbol === 'DAX' || cleanSymbol === 'GDAXI') {
      return <div className="flex h-full w-full items-center justify-center bg-[#0B2D5B] font-black tracking-[-0.08em] text-white">DAX</div>;
    }
    if (cleanSymbol === 'NDX' || cleanSymbol === 'NASDAQ') {
      return <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#5C2D91] to-[#00AEEF] font-black text-white">N</div>;
    }
    if (cleanSymbol === 'GSPC' || cleanSymbol === 'SPX' || cleanSymbol === 'SP500' || rawSymbol.toUpperCase().includes('S&P')) {
      return <div className="flex h-full w-full items-center justify-center bg-[#153B6D] font-black text-white">S&amp;P</div>;
    }
    if (rawSymbol.includes('/')) {
      const [base, quote] = rawSymbol.toUpperCase().split('/');
      return (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-500/25 to-purple-600/20 font-black text-fuchsia-100">
          <span>{base?.slice(0, 1)}{quote?.slice(0, 1)}</span>
        </div>
      );
    }

    const categoryClass = assetCategory === 'AKTIEN'
      ? 'from-emerald-500/25 to-emerald-700/10 text-emerald-200 border-emerald-400/30'
      : assetCategory === 'FOREX'
        ? 'from-fuchsia-500/25 to-purple-700/10 text-fuchsia-200 border-fuchsia-400/30'
        : assetCategory === 'ROHSTOFFE'
          ? 'from-amber-400/25 to-yellow-700/10 text-amber-200 border-amber-400/30'
          : assetCategory === 'INDIZIES'
            ? 'from-sky-500/25 to-indigo-700/10 text-sky-200 border-sky-400/30'
            : 'from-violet-500/25 to-purple-700/10 text-violet-200 border-violet-400/30';
    return <div className={`flex h-full w-full items-center justify-center border bg-gradient-to-br font-mono font-black ${categoryClass}`}>{fallbackLabel(cleanSymbol, assetName)}</div>;
  })();

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden shadow-sm select-none ${sizeClasses[size]} ${className}`}
      aria-label={assetName ? `${assetName} Logo` : `${rawSymbol} Logo`}
      title={assetName || rawSymbol}
    >
      {content}
    </div>
  );
}
