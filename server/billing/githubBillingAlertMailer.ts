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
    <h2>CAPITAL-AI · GitHub Billing Cost Watch</h2>
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
