import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock3,
  Cookie,
  Database,
  Download,
  FileText,
  Globe2,
  Lock,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { openCookieHubSettings } from '../services/cookieHubConsentBridge';
import {
  CONTROLLER,
  PRIVACY_COMPLIANCE_STATUS,
  PRIVACY_NOTICE_VERSION,
  PRIVACY_REQUEST_TYPES,
  PROCESSING_ACTIVITIES,
  type PrivacyRequestType,
} from '../privacy/privacyPolicy';

const REQUEST_LABELS: Record<PrivacyRequestType, string> = {
  access: 'Auskunft',
  rectification: 'Berichtigung',
  erasure: 'Löschung',
  restriction: 'Einschränkung',
  objection: 'Widerspruch',
  portability: 'Datenübertragbarkeit',
};

export function Datenschutz() {
  const [requestType, setRequestType] = useState<PrivacyRequestType>('access');
  const [details, setDetails] = useState('');
  const [requestState, setRequestState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [requestMessage, setRequestMessage] = useState('');
  const [exporting, setExporting] = useState(false);

  async function submitPrivacyRequest() {
    setRequestState('submitting');
    setRequestMessage('');
    try {
      const response = await authFetch('/api/privacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType, details: details.trim() || undefined }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      setRequestState('success');
      setRequestMessage(
        `Anfrage „${REQUEST_LABELS[requestType]}“ wurde erfasst. Status: ${body.request?.status || 'received'}.`,
      );
      setDetails('');
    } catch (error: any) {
      setRequestState('error');
      setRequestMessage(error?.message || 'Anfrage konnte nicht gespeichert werden.');
    }
  }

  async function downloadAccountData() {
    setExporting(true);
    setRequestMessage('');
    try {
      const response = await authFetch('/api/privacy/export');
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/i);
      const filename = match?.[1] || 'capital-ai-datenauszug.json';
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setRequestMessage('Datenexport wurde erstellt. Ein formelles Auskunftsersuchen kann darüber hinaus weitere Kontextinformationen umfassen.');
    } catch (error: any) {
      setRequestMessage(error?.message || 'Datenexport konnte nicht erstellt werden.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-cyan-500/25 bg-cyan-500/10 text-cyan-300 text-[10px] font-mono uppercase tracking-widest">
              <ShieldCheck size={13} /> Datenschutz & Transparenz
            </div>
            <h1 className="text-2xl font-black text-white font-display">Datenschutzhinweise nach Art. 13 DSGVO</h1>
            <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
              Diese Seite beschreibt die im Repository dokumentierten personenbezogenen Verarbeitungen von CAPITAL-AI.
              CAPITAL-AI ist eine Projekt-/Produktbezeichnung und keine eigenständige juristische Person.
            </p>
          </div>

          <div className="lg:max-w-sm rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle size={15} /> {PRIVACY_COMPLIANCE_STATUS.label}
            </div>
            <p className="text-[11px] text-white/65 leading-relaxed">{PRIVACY_COMPLIANCE_STATUS.disclaimer}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <FileText size={16} className="text-cyan-400" /> Verantwortlicher
            </div>
            <div className="text-sm text-white/70 leading-relaxed">
              <strong className="text-white">{CONTROLLER.name}</strong> ({CONTROLLER.legalStatus})<br />
              {CONTROLLER.street}<br />
              {CONTROLLER.postalCode} {CONTROLLER.city}<br />
              {CONTROLLER.country}
            </div>
            <div className="text-xs text-white/55">
              Datenschutzkontakt: <a className="text-cyan-300 hover:underline" href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a><br />
              Support: <a className="text-cyan-300 hover:underline" href={`mailto:${CONTROLLER.supportEmail}`}>{CONTROLLER.supportEmail}</a>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Clock3 size={16} className="text-purple-400" /> Dokumentstatus
            </div>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between gap-3"><dt className="text-white/45">Version</dt><dd className="text-white font-mono">{PRIVACY_NOTICE_VERSION}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/45">Geltungsbereich</dt><dd className="text-white text-right">Web-App & Backend</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/45">Zertifizierung</dt><dd className="text-white text-right">keine behauptet</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <div>
          <h2 className="text-lg font-black text-white font-display flex items-center gap-2">
            <Database size={18} className="text-purple-400" /> Verarbeitungstätigkeiten
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Die folgende Registry bildet die derzeit im Code identifizierten personenbezogenen Kernverarbeitungen ab. Vertragsnachweise zu Providern werden separat geführt.
          </p>
        </div>

        <div className="space-y-3">
          {PROCESSING_ACTIVITIES.map((activity) => (
            <details key={activity.id} className="group bg-white/[0.025] border border-white/10 rounded-xl overflow-hidden">
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03]">
                <span className="font-bold text-sm text-white">{activity.title}</span>
                <span className="text-[10px] font-mono text-cyan-300 uppercase">Details</span>
              </summary>
              <div className="border-t border-white/5 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs leading-relaxed">
                <div className="space-y-3">
                  <div><span className="block text-white/40 font-mono uppercase text-[9px] mb-1">Zweck</span><p className="text-white/70">{activity.purpose}</p></div>
                  <div><span className="block text-white/40 font-mono uppercase text-[9px] mb-1">Datenkategorien</span><p className="text-white/70">{activity.dataCategories.join(' · ')}</p></div>
                  <div><span className="block text-white/40 font-mono uppercase text-[9px] mb-1">Rechtsgrundlage</span><p className="text-white/70">{activity.legalBasis}</p></div>
                </div>
                <div className="space-y-3">
                  <div><span className="block text-white/40 font-mono uppercase text-[9px] mb-1">Empfänger</span><p className="text-white/70">{activity.recipients.join(' · ')}</p></div>
                  <div><span className="block text-white/40 font-mono uppercase text-[9px] mb-1">Drittland / Transfer</span><p className="text-white/70">{activity.transfer}</p></div>
                  <div><span className="block text-white/40 font-mono uppercase text-[9px] mb-1">Speicherung / Löschung</span><p className="text-white/70">{activity.retention}</p></div>
                  <div><span className="block text-white/40 font-mono uppercase text-[9px] mb-1">Technische Kontrollen</span><p className="text-emerald-300/80">{activity.technicalControls.join(' · ')}</p></div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div>
            <h2 className="text-lg font-black text-white font-display flex items-center gap-2">
              <Lock size={18} className="text-emerald-400" /> Ihre Datenschutzrechte
            </h2>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">
              Sie können Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch oder Datenübertragbarkeit anfragen. Eine Löschanfrage wird kontrolliert bearbeitet; gesetzlich oder sicherheitsbedingt aufzubewahrende Daten können vorübergehend eingeschränkt statt sofort gelöscht werden.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRIVACY_REQUEST_TYPES.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setRequestType(type)}
                className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  requestType === type
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {REQUEST_LABELS[type]}
              </button>
            ))}
          </div>

          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value.slice(0, 2000))}
            placeholder="Optionale Angaben zur Anfrage (keine Passwörter, MFA-Secrets oder Zahlungsdaten eingeben)."
            className="w-full min-h-24 bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />

          <button
            type="button"
            onClick={submitPrivacyRequest}
            disabled={requestState === 'submitting'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-200 text-xs font-bold hover:bg-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Send size={14} /> {requestState === 'submitting' ? 'Anfrage wird erfasst…' : `${REQUEST_LABELS[requestType]} anfragen`}
          </button>

          {requestMessage && (
            <div className={`text-xs rounded-lg border px-3 py-2 ${requestState === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'}`}>
              {requestMessage}
            </div>
          )}

          <p className="text-[10px] text-white/35 leading-relaxed">
            Der Self-Service erfordert ein angemeldetes Konto. Alternativ können Anfragen über die oben angegebene Datenschutzkontaktadresse gestellt werden. Vor Herausgabe oder Änderung personenbezogener Daten kann eine Identitätsprüfung erforderlich sein.
          </p>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div>
            <h2 className="text-lg font-black text-white font-display flex items-center gap-2">
              <Download size={18} className="text-cyan-400" /> Self-Service-Datenauszug
            </h2>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">
              Angemeldete Nutzer können einen JSON-Auszug der direkt dem Konto zuordenbaren Standarddaten abrufen. Der technische Export ersetzt kein weitergehendes formelles Auskunftsersuchen, wenn zusätzlicher Kontext erforderlich ist.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadAccountData}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white/80 text-xs font-bold hover:bg-white/10 disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} /> {exporting ? 'Export wird erstellt…' : 'Meine Kontodaten als JSON exportieren'}
          </button>

          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Cookie size={14} className="text-amber-300" /> Cookie- und Analytics-Einstellungen
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Google Analytics und AdSense werden erst nach der jeweils passenden CookieHub-Einwilligung geladen. Eine bereits erteilte Entscheidung kann hier erneut geöffnet und widerrufen werden.
            </p>
            <button
              type="button"
              onClick={() => openCookieHubSettings()}
              className="text-xs text-amber-200 underline underline-offset-4 cursor-pointer"
            >
              Cookie-Einstellungen ändern
            </button>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Globe2 size={14} /> Drittanbieter und Drittländer
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Bei Google-, Stripe-, Supabase- und verbundenen Social-Media-Diensten können internationale Datenflüsse oder Subprozessoren relevant sein. Diese Seite behauptet keinen bestimmten AVV-, SCC-, Angemessenheits- oder Hostingstatus ohne aktuellen Vertragsnachweis.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md text-xs text-white/50 leading-relaxed">
        <strong className="text-white/75">Beschwerderecht:</strong> Sie haben das Recht, sich bei einer zuständigen Datenschutzaufsichtsbehörde zu beschweren. Die für Ihren Fall zuständige Behörde richtet sich nach den gesetzlichen Zuständigkeitsregeln; diese Anwendung behauptet keine behördliche Vorprüfung oder Freigabe.
      </section>
    </div>
  );
}
