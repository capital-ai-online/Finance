// Audit ARCH-AUDIT-0002 (H4): Testabdeckung fuer die reale Supervisor-Komponente.

import { describe, it, expect } from 'vitest';
import {
  routeTask,
  getRoutingTable,
  executeSupervised,
  getRecentExecutions,
  getSupervisorStatus,
} from '../../src/platform/Supervisor/supervisor';

describe('supervisor', () => {
  describe('routeTask / getRoutingTable', () => {
    it('routet Crypto auf den Crypto-Orchestrator mit dedizierter Engine', () => {
      const route = routeTask('crypto');
      expect(route?.engineId).toBe('crypto_orchestrator');
      expect(route?.hasDedicatedEngine).toBe(true);
    });

    it('routet Aktien, Forex und Indizes auf die traditionelle Engine', () => {
      expect(routeTask('stock')?.engineId).toBe('traditional_asset_engine');
      expect(routeTask('forex')?.engineId).toBe('traditional_asset_engine');
      expect(routeTask('index')?.engineId).toBe('traditional_asset_engine');
      expect(routeTask('index')?.hasDedicatedEngine).toBe(true);
    });

    it('kennzeichnet Anleihen weiterhin ehrlich als ohne dedizierte Engine', () => {
      expect(routeTask('bond')?.hasDedicatedEngine).toBe(false);
    });

    it('liefert undefined fuer eine unbekannte Anlageklasse', () => {
      expect(routeTask('unknown-asset-class')).toBeUndefined();
    });

    it('getRoutingTable() enthaelt alle sechs Anlageklassen', () => {
      const table = getRoutingTable();
      expect(Object.keys(table).sort()).toEqual(['bond', 'commodity', 'crypto', 'forex', 'index', 'stock']);
    });
  });

  describe('executeSupervised', () => {
    it('liefert das Ergebnis direkt zurueck, wenn der erste Versuch erfolgreich ist', async () => {
      const result = await executeSupervised('test-task-success', async () => 42);
      expect(result).toBe(42);
    });

    it('versucht es nach einem Fehlschlag erneut und gibt bei Erfolg das Ergebnis zurueck', async () => {
      let calls = 0;
      const result = await executeSupervised('test-task-retry', async () => {
        calls += 1;
        if (calls < 2) throw new Error('transienter Fehler');
        return 'ok';
      }, { retries: 2, backoffMs: 1 });
      expect(result).toBe('ok');
      expect(calls).toBe(2);
    });

    it('wirft nach Ausschoepfung aller Versuche den letzten Fehler', async () => {
      let calls = 0;
      await expect(executeSupervised('test-task-fail', async () => {
        calls += 1;
        throw new Error('dauerhafter Fehler');
      }, { retries: 1, backoffMs: 1 })).rejects.toThrow('dauerhafter Fehler');
      expect(calls).toBe(2);
    });

    it('zeichnet erfolgreiche und fehlgeschlagene Ausfuehrungen im Ringpuffer auf', async () => {
      await executeSupervised('test-task-record-ok', async () => 'x');
      await executeSupervised('test-task-record-fail', async () => { throw new Error('boom'); }, { retries: 0, backoffMs: 1 }).catch(() => {});
      const recent = getRecentExecutions(10);
      expect(recent.find(r => r.taskName === 'test-task-record-ok')?.succeeded).toBe(true);
      expect(recent.find(r => r.taskName === 'test-task-record-fail')?.succeeded).toBe(false);
    });
  });

  describe('getSupervisorStatus', () => {
    it('meldet conflictResolution ehrlich als nicht implementiert und AI Governance als aktiv', () => {
      const status = getSupervisorStatus();
      expect(status.capabilities.conflictResolution).toBe(false);
      expect(status.capabilities.taskRouting).toBe(true);
      expect(status.capabilities.retry).toBe(true);
      expect(status.capabilities.aiGovernance).toBe(true);
      expect(status.aiGovernance.providerRoles).toBeGreaterThanOrEqual(3);
      expect(status.aiGovernance.registeredPrompts).toBeGreaterThan(0);
    });

    it('enthaelt die Routing-Tabelle und juengste Ausfuehrungen', async () => {
      await executeSupervised('test-task-status', async () => 'y');
      const status = getSupervisorStatus();
      expect(status.routingTable.crypto.engineId).toBe('crypto_orchestrator');
      expect(status.recentExecutions.some(r => r.taskName === 'test-task-status')).toBe(true);
    });
  });
});
