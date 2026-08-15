import React from 'react';
import { AlertTriangle, BarChart3, FileText, RefreshCw, Search, Wifi, WifiOff } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import {
  normalizeSeoDashboardPayloads,
  seoSourceStatus,
  type SeoDashboardData,
} from '../platform/SeoEngine/dashboard';

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    const message = response.status === 403
      ? 'Keine Berechtigung für das SEO-Dashboard.'
      : `SEO-Daten konnten nicht geladen werden (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return response.json();
}

export function SeoDashboard() {
  const [data, setData] = React.useState<SeoDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([
        authFetch('/api/seo/summary'),
        authFetch('/api/seo/keywords'),
        authFetch('/api/seo/ranks'),
        authFetch('/api/seo/content'),
      ]);
      const payloads = await Promise.all(responses.map(readJson));
      setData(normalizeSeoDashboardPayloads(payloads[0], payloads[1], payloads[2], payloads[3]));
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler beim Laden der SEO-Daten.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-white/60">
        SEO-Management wird geladen …
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6">
        <div className="flex items-center gap-2 text-rose-300 font-bold"><AlertTriangle size={18} /> SEO-Dashboard nicht verfügbar</div>
        <p className="mt-2 text-sm text-white/60">{error}</p>
        <button onClick={() => void load()} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/5">
          Erneut laden
        </button>
      </div>
    );
  }

  const sources = seoSourceStatus(data);
  const cards = [
    { label: 'Keywords', value: data.summary.keywordCount, icon: Search },
    { label: 'Rank-Snapshots', value: data.summary.rankSnapshotCount, icon: BarChart3 },
    { label: 'Content-Seiten', value: data.summary.contentCount, icon: FileText },
    { label: 'Veröffentlicht', value: data.summary.publishedContentCount, icon: Wifi },
  ];

  return (
    <section className="space-y-6" aria-labelledby="seo-dashboard-title">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-aif-gold-DEFAULT">SEO-ROADMAP-0001 / S3</p>
          <h2 id="seo-dashboard-title" className="mt-2 text-2xl font-black text-white">SEO Management Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Validierte SeoEngine-Daten. Fehlende externe Messquellen werden nicht geschätzt oder simuliert.
          </p>
        </div>
        <button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/5">
          <RefreshCw size={14} /> Aktualisieren
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-[#151519]/90 p-5">
            <Icon size={18} className="text-aif-gold-DEFAULT" />
            <div className="mt-4 text-3xl font-black text-white">{value}</div>
            <div className="mt-1 text-xs font-mono uppercase tracking-wider text-white/45">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SourceCard label="Search Console" connected={sources.searchConsole === 'connected'} detail={sources.searchConsole === 'connected' ? 'Messwerte vorhanden' : 'Keine Search-Console-Rankings vorhanden'} />
        <SourceCard label="Google Analytics 4" connected={false} detail="Kein produktiver Dashboard-Datenadapter verbunden" />
        <SourceCard label="Manuelle Importe" connected={sources.manualImports > 0} detail={`${sources.manualImports} verifizierte Snapshots`} />
      </div>

      {!data.summary.hasMeasuredRanks && (
        <div className="flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm text-amber-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>Es liegen noch keine gemessenen Rankings vor. Das Dashboard zeigt bewusst keine Demo- oder Schätzwerte.</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Keyword-Register"
          empty="Keine Keywords registriert."
          headers={['Keyword', 'Sprache', 'Ziel', 'Priorität']}
          rows={data.keywords.slice(0, 12).map((item) => [item.phrase, item.locale.toUpperCase(), item.targetPath, String(item.priority)])}
        />
        <DataTable
          title="Content-Inventar"
          empty="Keine Content-Seiten registriert."
          headers={['Pfad', 'Titel', 'Status']}
          rows={data.content.slice(0, 12).map((item) => [item.path, item.title, item.status])}
        />
      </div>
    </section>
  );
}

function SourceCard({ label, connected, detail }: { label: string; connected: boolean; detail: string }) {
  const Icon = connected ? Wifi : WifiOff;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151519]/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-white">{label}</span>
        <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/45'}`}>
          <Icon size={12} /> {connected ? 'Verbunden' : 'Nicht verbunden'}
        </span>
      </div>
      <p className="mt-3 text-xs text-white/45">{detail}</p>
    </div>
  );
}

function DataTable({ title, headers, rows, empty }: { title: string; headers: string[]; rows: string[][]; empty: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#151519]/90">
      <div className="border-b border-white/10 px-5 py-4 font-bold text-white">{title}</div>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-white/45">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-white/40">
              <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-mono uppercase tracking-wider">{header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.join('|') + rowIndex} className="border-t border-white/5 text-white/70">
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
