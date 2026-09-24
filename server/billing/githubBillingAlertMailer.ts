import { escapeHtml } from '../../src/platform/Security/safeIo';
import { sendMail } from '../mailer';

export const GITHUB_BILLING_ALERT_RECIPIENT = 'sven.kulessa@capital-ai.online';

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function rows(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function text(value: unknown, fallback = '—'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function amount(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '') : '0';
}
function minutes(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value)
    : '0';
}

function majorMoney(value: unknown, currency: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function minorMoney(value: unknown, currency: unknown): string {
  const code = typeof currency === 'string' && currency.trim() ? currency.trim() : 'eur';
  return typeof value === 'number' && Number.isFinite(value)
    ? majorMoney(value / 100, code)
    : '—';
}

function renderServiceRows(items: JsonRecord[]): string {
  if (items.length === 0) {
    return '<tr><td colspan="5">Keine aktiven Render-Services beobachtet oder Provider-Read nicht konfiguriert.</td></tr>';
  }
  return items.map((item) => `<tr>
    <td>${escapeHtml(text(item.name))}</td>
    <td>${escapeHtml(text(item.type))}</td>
    <td>${escapeHtml(text(item.plan))}</td>
    <td style="text-align:right">${escapeHtml(minutes(item.instances))}</td>
    <td style="text-align:right"><strong>${escapeHtml(majorMoney(item.monthlyListPriceUsd, 'USD'))}</strong></td>
  </tr>`).join('');
}

function stripeSubscriptionRows(items: JsonRecord[]): string {
  if (items.length === 0) {
    return '<tr><td colspan="6">Keine aktiven Stripe-Abonnementpositionen beobachtet oder Provider-Read nicht konfiguriert.</td></tr>';
  }
  return items.map((item) => `<tr>
    <td>${escapeHtml(text(item.planLabel))}</td>
    <td>${escapeHtml(text(item.status))}</td>
    <td style="text-align:right">${escapeHtml(minorMoney(item.amountMinor, item.currency))}</td>
    <td>${escapeHtml(`${minutes(item.intervalCount)} × ${text(item.interval)}`)}</td>
    <td style="text-align:right"><strong>${escapeHtml(minorMoney(item.monthlyEquivalentMinor, item.currency))}</strong></td>
    <td>${item.cancelAtPeriodEnd === true ? 'ja' : 'nein'}</td>
  </tr>`).join('');
}

function monthlyEquivalentRows(totals: JsonRecord): string {
  const entries = Object.entries(totals)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value));
  if (entries.length === 0) return '—';
  return entries
    .map(([currency, value]) => minorMoney(value, currency))
    .join(' · ');
}


function tableRows(items: JsonRecord[]): string {
  if (items.length === 0) {
    return '<tr><td colspan="7">Keine Positionen von GitHub gemeldet.</td></tr>';
  }
  return items.map((item) => `<tr>
    <td>${escapeHtml(text(item.source))}</td>
    <td>${escapeHtml(text(item.product))}</td>
    <td>${escapeHtml(text(item.sku))}</td>
    <td>${escapeHtml(text(item.unitType))}</td>
    <td style="text-align:right">${escapeHtml(amount(item.grossAmount))}</td>
    <td style="text-align:right">${escapeHtml(amount(item.discountAmount))}</td>
    <td style="text-align:right"><strong>${escapeHtml(amount(item.netAmount))}</strong></td>
  </tr>`).join('');
}

function attributionRows(items: JsonRecord[]): string {
  if (items.length === 0) {
    return '<tr><td colspan="8">Keine Repository-/Organisationszuordnung von GitHub gemeldet.</td></tr>';
  }
  return items.map((item) => `<tr>
    <td>${escapeHtml(text(item.source))}</td>
    <td>${escapeHtml(text(item.date))}</td>
    <td>${escapeHtml(text(item.organizationName))}</td>
    <td>${escapeHtml(text(item.repositoryName))}</td>
    <td>${escapeHtml(text(item.product))}</td>
    <td>${escapeHtml(text(item.sku))}</td>
    <td>${escapeHtml(text(item.unitType))}</td>
    <td style="text-align:right"><strong>${escapeHtml(amount(item.netAmount))}</strong></td>
  </tr>`).join('');
}

function catalogRows(items: JsonRecord[]): string {
  return items.map((item) => {
    const units = Array.isArray(item.units) ? item.units.filter((unit) => typeof unit === 'string').join(', ') : 'provider-defined';
    return `<tr>
      <td>${escapeHtml(text(item.label))}</td>
      <td>${escapeHtml(units)}</td>
      <td>${escapeHtml(text(item.policy))}</td>
    </tr>`;
  }).join('');
}

export function buildGitHubBillingCostWatchEmail(reportInput: unknown): { subject: string; html: string } {
  const report = record(reportInput);
  const mode = text(report.mode, 'monitor');
  const status = text(report.status, 'UNKNOWN');
  const coverage = record(report.coverage);
  const organizationAttributionCoverage = record(coverage.organizationAttribution);
  const personalCoverage = record(coverage.personal);
  const totals = record(report.totals);
  const actionsMinutes = record(report.actionsMinutes);
  const allRows = rows(report.rows);
  const alertRows = rows(report.alertRows);
  const detailRows = rows(report.detailRows);
  const alertDetailRows = rows(report.alertDetailRows);
  const surfaces = rows(report.potentialCostSurfaces);
  const providers = record(report.providers);
  const renderProvider = record(providers.render);
  const renderCoverage = record(renderProvider.coverage);
  const renderPipeline = record(renderProvider.pipeline);
  const renderWorkflows = record(renderProvider.workflows);
  const renderWorkflowPricing = record(renderWorkflows.pricing);
  const renderServices = rows(renderProvider.activeServices);
  const stripeProvider = record(providers.stripeSubscriptions);
  const stripeCoverage = record(stripeProvider.coverage);
  const stripeItems = rows(stripeProvider.recurringItems);
  const stripeMonthlyEquivalent = record(stripeProvider.monthlyEquivalentByCurrency);

  const actionsMinuteState = text(actionsMinutes.state, 'BELOW_WARNING');
  const subject = mode === 'test'
    ? '[CAPITAL-AI] GitHub Billing – vollständige Kostenübersicht (Test)'
    : actionsMinuteState === 'BLOCKED'
      ? '[CAPITAL-AI][ACTIONS-BLOCKER] 45.000 Minuten erreicht'
      : actionsMinuteState === 'WARNING'
        ? '[CAPITAL-AI][ACTIONS-WARNUNG] 5.000 Minuten erreicht'
        : status === 'PARTIAL_COVERAGE'
          ? '[CAPITAL-AI][BILLING] Kostenüberwachung unvollständig'
          : '[CAPITAL-AI][KOSTENALARM] GitHub Zusatzkosten erkannt';

  const html = `<!doctype html>
<html lang="de">
  <body style="font-family:Arial,sans-serif;color:#111;line-height:1.45">
    <h2>CAPITAL-AI · Cost Watch</h2>
    <p><strong>Modus:</strong> ${escapeHtml(mode)} · <strong>Status:</strong> ${escapeHtml(status)} · <strong>Zeit:</strong> ${escapeHtml(text(report.generatedAt))}</p>

    <h3>GitHub Actions Minuten-Schutz</h3>
    <ul>
      <li>Verbrauchte Enterprise-Actions-Minuten: <strong>${escapeHtml(minutes(actionsMinutes.consumedGrossMinutes))}</strong></li>
      <li>SMTP-Warnschwelle: <strong>${escapeHtml(minutes(actionsMinutes.warningThresholdMinutes))}</strong></li>
      <li>Hard-Blocker-Schwelle: <strong>${escapeHtml(minutes(actionsMinutes.blockerThresholdMinutes))}</strong></li>
      <li>Verbleibend bis Hard-Blocker: <strong>${escapeHtml(minutes(actionsMinutes.remainingToBlockerMinutes))}</strong></li>
      <li>Status: <strong>${escapeHtml(actionsMinuteState)}</strong></li>
    </ul>
    <p><small>Die Minuten werden aus der monatlichen Enterprise-Billing-Usage-Summary als Actions grossQuantity mit unitType=minutes ermittelt.</small></p>

    <h3>Kostenübersicht</h3>
    <ul>
      <li>Enterprise netto: <strong>${escapeHtml(amount(totals.enterpriseNet))}</strong></li>
      <li>Persönliches Billing netto: <strong>${escapeHtml(amount(totals.personalNet))}</strong></li>
      <li>Global netto (additive Billing-Ebenen): <strong>${escapeHtml(amount(totals.globalNet))}</strong></li>
      <li>Erwartete GHEC-Basis: <strong>${escapeHtml(amount(totals.expectedEnterpriseLicenseNet))}</strong></li>
      <li>Alarmrelevante Zusatzkosten: <strong>${escapeHtml(amount(totals.additionalNet))}</strong></li>
    </ul>
    <p><small>Beträge entsprechen den von GitHub gelieferten Billing-Beträgen. Organisations-/Repository-Sichten innerhalb des Enterprise werden nicht doppelt addiert.</small></p>

    <h3>Überwachungsabdeckung</h3>
    <ul>
      <li>Enterprise: ${escapeHtml(text(record(coverage.enterprise).status))}</li>
      <li>Organisation/Repository-Zuordnung: ${escapeHtml(text(organizationAttributionCoverage.status))}</li>
      ${organizationAttributionCoverage.reason ? `<li>Hinweis Organisation: ${escapeHtml(text(organizationAttributionCoverage.reason))}</li>` : ''}
      <li>Persönliches Billing außerhalb Enterprise: ${escapeHtml(text(personalCoverage.status))}</li>
      ${personalCoverage.reason ? `<li>Hinweis: ${escapeHtml(text(personalCoverage.reason))}</li>` : ''}
    </ul>

    <h3>Aktuelle von GitHub gemeldete Einheiten</h3>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Quelle</th><th>Produkt</th><th>SKU</th><th>Einheit</th><th>Brutto</th><th>Rabatt</th><th>Netto</th></tr></thead>
      <tbody>${tableRows(allRows)}</tbody>
    </table>

    <h3>Kostenursprung nach Organisation / Repository</h3>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Quelle</th><th>Datum</th><th>Organisation</th><th>Repository</th><th>Produkt</th><th>SKU</th><th>Einheit</th><th>Netto</th></tr></thead>
      <tbody>${attributionRows(detailRows)}</tbody>
    </table>

    <h3>Alarmrelevanter Kostenursprung</h3>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Quelle</th><th>Datum</th><th>Organisation</th><th>Repository</th><th>Produkt</th><th>SKU</th><th>Einheit</th><th>Netto</th></tr></thead>
      <tbody>${attributionRows(alertDetailRows)}</tbody>
    </table>

    <h3>Alarmrelevante Positionen</h3>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Quelle</th><th>Produkt</th><th>SKU</th><th>Einheit</th><th>Brutto</th><th>Rabatt</th><th>Netto</th></tr></thead>
      <tbody>${tableRows(alertRows)}</tbody>
    </table>

    <h3>Render · laufende Infrastrukturkosten</h3>
    <ul>
      <li>Provider-Read: <strong>${escapeHtml(text(renderCoverage.status, 'NOT_CONFIGURED'))}</strong></li>
      ${renderCoverage.reason ? `<li>Hinweis: ${escapeHtml(text(renderCoverage.reason))}</li>` : ''}
      <li>Aktive Services: <strong>${escapeHtml(minutes(renderServices.length))}</strong></li>
      <li>Öffentliche Full-Month-Listenpreis-Basis: <strong>${escapeHtml(majorMoney(renderProvider.monthlyListPriceBaselineUsd, 'USD'))}</strong></li>
      <li>Nicht bepreiste aktive Services: <strong>${escapeHtml(minutes(renderProvider.unpricedActiveServiceCount))}</strong></li>
    </ul>
    <p><small>Die Render-Summe ist eine öffentliche Listenpreis-Basis für aktuell beobachtete Services, keine Provider-Rechnung. Tatsächliche Compute-Kosten können zeitanteilig oder durch weitere Nutzungsflächen abweichen.</small></p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Service</th><th>Typ</th><th>Compute-Plan</th><th>Instanzen</th><th>Listenpreis/Monat</th></tr></thead>
      <tbody>${renderServiceRows(renderServices)}</tbody>
    </table>

    <h4>Render Build Pipeline</h4>
    <ul>
      <li>Beobachteter Pipeline-Tier: <strong>${escapeHtml(text(renderPipeline.observedTier))}</strong></li>
      <li>Workspace-Plan: <strong>${escapeHtml(text(renderPipeline.workspacePlan, 'nicht konfiguriert'))}</strong></li>
      <li>Inklusive Starter-Pipeline-Minuten: <strong>${renderPipeline.includedMinutes == null ? 'nicht aufgelöst' : escapeHtml(minutes(renderPipeline.includedMinutes))}</strong></li>
      <li>Aktueller Monatsverbrauch: <strong>nicht über die verwendete öffentliche Render-API belegbar</strong></li>
      <li>Kontingent laut aktuellem Render-Modell: Hobby 500 · Pro 1.000 · Scale 5.000 Minuten/Monat.</li>
    </ul>

    <h4>Render Workflows</h4>
    <ul>
      <li>Beobachtete Workflows: <strong>${renderWorkflows.count == null ? 'nicht aufgelöst' : escapeHtml(minutes(renderWorkflows.count))}</strong></li>
      <li>Default-Plan: <strong>${escapeHtml(text(renderWorkflowPricing.plan, 'flex'))}</strong></li>
      <li>Flex CPU: <strong>${escapeHtml(majorMoney(renderWorkflowPricing.cpuUsdPerActiveHour, 'USD'))} / aktive CPU-Stunde</strong></li>
      <li>Flex RAM: <strong>${escapeHtml(majorMoney(renderWorkflowPricing.ramUsdPerActiveGbHour, 'USD'))} / aktive GB-Stunde</strong></li>
      <li>Maximal bei voller Flex-Auslastung: <strong>${escapeHtml(majorMoney(renderWorkflowPricing.maxUsdPerHourAtFullUsage, 'USD'))} / Stunde</strong></li>
      <li>Task-State-Retention: <strong>${escapeHtml(majorMoney(renderWorkflowPricing.taskStateRetentionUsdPerGbMonth, 'USD'))} / GB-Monat</strong></li>
    </ul>
    <p><small>Workflow-Compute ist eine eigene nutzungsabhängige Kostenfläche und keine Nutzung der inkludierten Build-Pipeline-Minuten.</small></p>

    <h3>Stripe · aktive Kundenabonnements</h3>
    <ul>
      <li>Provider-Read: <strong>${escapeHtml(text(stripeCoverage.status, 'NOT_CONFIGURED'))}</strong></li>
      ${stripeCoverage.reason ? `<li>Hinweis: ${escapeHtml(text(stripeCoverage.reason))}</li>` : ''}
      <li>Aktive Abonnements: <strong>${stripeProvider.activeSubscriptionCount == null ? 'nicht aufgelöst' : escapeHtml(minutes(stripeProvider.activeSubscriptionCount))}</strong></li>
      <li>Monatliches Vertragswert-Äquivalent: <strong>${escapeHtml(monthlyEquivalentRows(stripeMonthlyEquivalent))}</strong></li>
    </ul>
    <p><small>Diese Stripe-Werte sind laufende Kundenentgelte/Umsatzprojektion und ausdrücklich keine Betriebskosten des CAPITAL-AI-Stripe-Kontos. Sie werden nicht zu GitHub- oder Render-Kosten addiert. Kundenname, E-Mail, Adresse und Zahlungsdaten werden nicht in den Report übernommen.</small></p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Plan</th><th>Status</th><th>Periodischer Betrag</th><th>Intervall</th><th>Monatsäquivalent</th><th>Kündigung vorgemerkt</th></tr></thead>
      <tbody>${stripeSubscriptionRows(stripeItems)}</tbody>
    </table>

    <h3>Überwachte mögliche Kostenflächen</h3>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead><tr><th>Kostenfläche</th><th>Mögliche Einheiten</th><th>Policy</th></tr></thead>
      <tbody>${catalogRows(surfaces)}</tbody>
    </table>
    <p><small>Zusätzlich greift ein dynamischer Catch-all: jede neue GitHub-SKU mit positivem netAmount außerhalb der erwarteten GHEC-Lizenz löst einen Alarm aus.</small></p>
  </body>
</html>`;

  return { subject, html };
}

export async function processGitHubBillingAlertMailJob(payload: Record<string, unknown>): Promise<void> {
  const report = payload.report;
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error('[GitHubBillingAlertMailer] report payload fehlt.');
  }

  const message = buildGitHubBillingCostWatchEmail(report);
  const result = await sendMail({
    to: GITHUB_BILLING_ALERT_RECIPIENT,
    subject: message.subject,
    html: message.html,
  });
  if (!result.success) {
    throw new Error(result.error || '[GitHubBillingAlertMailer] SMTP send failed');
  }
}
