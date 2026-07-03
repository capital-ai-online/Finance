/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PriceAlertItem {
  id: string;
  symbol: string;
  assetName: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  targetPrice: number;
  condition: 'above' | 'below';
  initialPrice: number;
  currentPrice: number;
  createdAt: string;
  triggeredAt?: string;
  isTriggered: boolean;
  soundEnabled: boolean;
}

export interface AlertLogItem {
  id: string;
  alertId: string;
  symbol: string;
  assetName: string;
  message: string;
  time: string;
}

const getAlertsKey = (email?: string) => {
  const sanitized = email ? email.replace(/[^a-zA-Z0-9]/g, '_') : 'guest';
  return `aif_price_alerts_${sanitized}`;
};

const getLogsKey = (email?: string) => {
  const sanitized = email ? email.replace(/[^a-zA-Z0-9]/g, '_') : 'guest';
  return `aif_alert_logs_${sanitized}`;
};

/**
 * Loads all price alerts for the current user session
 */
export function getSessionAlerts(email?: string): PriceAlertItem[] {
  try {
    const key = getAlertsKey(email);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Fallback to legacy key to preserve existing alerts for seamless upgrades
    const legacy = localStorage.getItem('aif_price_alerts');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      // Migrate to user key
      localStorage.setItem(key, legacy);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load session alerts:', e);
  }
  return [];
}

/**
 * Saves price alerts for the current user session and dispatches sync event
 */
export function saveSessionAlerts(alerts: PriceAlertItem[], email?: string): void {
  try {
    const key = getAlertsKey(email);
    localStorage.setItem(key, JSON.stringify(alerts));
    
    // Mirror to legacy key for any unmigrated components
    localStorage.setItem('aif_price_alerts', JSON.stringify(alerts));
    
    // Dispatch custom event to notify all active views/components to refresh their states
    window.dispatchEvent(new CustomEvent('aif-alerts-updated', { detail: { email, alerts } }));
  } catch (e) {
    console.error('Failed to save session alerts:', e);
  }
}

/**
 * Loads alert notification history logs for the current user session
 */
export function getSessionLogs(email?: string): AlertLogItem[] {
  try {
    const key = getLogsKey(email);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    
    const legacy = localStorage.getItem('aif_alert_logs');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      localStorage.setItem(key, legacy);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load session logs:', e);
  }
  return [];
}

/**
 * Saves alert logs for the current user session and dispatches sync event
 */
export function saveSessionLogs(logs: AlertLogItem[], email?: string): void {
  try {
    const key = getLogsKey(email);
    localStorage.setItem(key, JSON.stringify(logs));
    localStorage.setItem('aif_alert_logs', JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('aif-logs-updated', { detail: { email, logs } }));
  } catch (e) {
    console.error('Failed to save session logs:', e);
  }
}

/**
 * Toggles an alert for a specific symbol on or off.
 * If active alerts exist for the symbol, deletes them all.
 * If none exists, creates a default alert.
 * Returns true if alert was enabled, false if disabled.
 */
export function toggleSessionAlert(
  symbol: string,
  currentPrice: number,
  assetName: string,
  type: 'crypto' | 'stock' | 'forex' | 'commodity',
  email?: string
): boolean {
  const currentAlerts = getSessionAlerts(email);
  const activeAlertsForSymbol = currentAlerts.filter(a => a.symbol.toUpperCase() === symbol.toUpperCase() && !a.isTriggered);
  
  if (activeAlertsForSymbol.length > 0) {
    // Alert exists: disable/remove all active alerts for this symbol
    const updated = currentAlerts.filter(a => !(a.symbol.toUpperCase() === symbol.toUpperCase() && !a.isTriggered));
    saveSessionAlerts(updated, email);
    return false;
  } else {
    // No active alert exists: create a default threshold alert (steigt über +5% by default)
    const factor = type === 'forex' ? 1.01 : 1.05; // 1% for forex, 5% for others
    const targetPrice = Number((currentPrice * factor).toFixed(currentPrice < 5 ? 4 : 2));
    
    const newAlert: PriceAlertItem = {
      id: `alert-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      assetName,
      type,
      targetPrice,
      condition: 'above',
      initialPrice: currentPrice,
      currentPrice,
      createdAt: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      isTriggered: false,
      soundEnabled: true
    };
    
    saveSessionAlerts([newAlert, ...currentAlerts], email);
    return true;
  }
}
