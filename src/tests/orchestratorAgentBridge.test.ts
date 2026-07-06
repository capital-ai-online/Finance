import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { orchestratorAgentBridge, OrchestratorAgentBridge, AgentTask } from '../utils/orchestratorAgentBridge';
import { ValidationError, NotFoundError } from '../utils/errors';
import fs from 'fs';
import path from 'path';

// Mock dependencies if needed, or verify them directly
describe('OrchestratorAgentBridge Unit Tests', () => {
  let bridge: OrchestratorAgentBridge;

  beforeEach(() => {
    bridge = OrchestratorAgentBridge.getInstance();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialization and Directive Loading', () => {
    it('should implement the singleton pattern and return the same instance', () => {
      const instance1 = OrchestratorAgentBridge.getInstance();
      const instance2 = OrchestratorAgentBridge.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(orchestratorAgentBridge);
    });

    it('should correctly load directives and return them as an array', () => {
      const directives = bridge.getDirectives();
      expect(Array.isArray(directives)).toBe(true);
      expect(directives.length).toBeGreaterThan(0);
    });

    it('should correctly format a system instruction block containing compliance directives', () => {
      const block = bridge.getSystemInstructionBlock();
      expect(block).toContain('MANDATORY COMPLIANCE DIRECTIVES');
      expect(block).toContain('Version 0.5.5');
      expect(block).toContain('CRITICAL');
    });

    it('should fall back to robust defaults if AGENTS.md is missing or unreadable', () => {
      // Mock fs.existsSync to return false to force fallback branch
      const existsMock = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      // Since it's a singleton, we need to bypass constructor access or test loadDirectives indirectly.
      // We can inspect the code of loadDirectives or invoke the private loadDirectives method dynamically.
      const testBridge = Object.create(OrchestratorAgentBridge.prototype);
      testBridge.tasks = new Map();
      testBridge.systemDirectives = [];
      testBridge.totalInitiated = 0;
      testBridge.totalCompleted = 0;
      testBridge.totalFailed = 0;
      testBridge.totalSanitizedFields = 0;
      
      // Trigger loadDirectives on mock-created object
      testBridge.loadDirectives();
      
      expect(testBridge.getDirectives().length).toBe(4);
      expect(testBridge.getDirectives()[0]).toContain('Strict Data Integrity');
      
      existsMock.mockRestore();
    });
  });

  describe('PII and Secret Sanitization (sanitizePayload)', () => {
    it('should preserve null, undefined, and non-string/non-object types', () => {
      expect(bridge.sanitizePayload(null)).toBeNull();
      expect(bridge.sanitizePayload(undefined)).toBeUndefined();
      expect(bridge.sanitizePayload(42)).toBe(42);
      expect(bridge.sanitizePayload(true)).toBe(true);
    });

    it('should scrub and mask email addresses', () => {
      const email = 'user.name@example.com';
      const sanitized = bridge.sanitizePayload(email);
      expect(sanitized).not.toBe(email);
      expect(sanitized).toContain('use***@***.com');
    });

    it('should scrub IPv4 addresses while preserving loopback/broadcast', () => {
      const externalIP = '198.51.100.42';
      const localhostIP = '127.0.0.1';
      const broadcastIP = '0.0.0.0';

      expect(bridge.sanitizePayload(externalIP)).toBe('198.51.100.***');
      expect(bridge.sanitizePayload(localhostIP)).toBe('127.0.0.1');
      expect(bridge.sanitizePayload(broadcastIP)).toBe('0.0.0.0');
    });

    it('should redact sensitive keys such as password, secrets, and api_keys', () => {
      const payload = {
        username: 'fintech_admin',
        password: 'super_secret_password',
        stripe_secret: 'sk_live_12345',
        gemini_api_key: 'AIzaSy_SomeSecret',
        regularField: 'Some public data'
      };

      const sanitized = bridge.sanitizePayload(payload);
      expect(sanitized.username).toBe('fintech_admin');
      expect(sanitized.password).toBe('[REDACTED_SECURE]');
      expect(sanitized.stripe_secret).toBe('[REDACTED_SECURE]');
      expect(sanitized.gemini_api_key).toBe('[REDACTED_SECURE]');
      expect(sanitized.regularField).toBe('Some public data');
    });

    it('should recursively sanitize deeply nested objects and arrays', () => {
      const complexPayload = {
        users: [
          { email: 'first@test.com', secretToken: 'tkn_1' },
          { email: 'second@test.com', profile: { password: 'pass', ip: '185.12.34.56' } }
        ]
      };

      const sanitized = bridge.sanitizePayload(complexPayload);
      expect(sanitized.users[0].email).toContain('fir***@***.com');
      expect(sanitized.users[0].secretToken).toBe('[REDACTED_SECURE]');
      expect(sanitized.users[1].email).toContain('sec***@***.com');
      expect(sanitized.users[1].profile.password).toBe('[REDACTED_SECURE]');
      expect(sanitized.users[1].profile.ip).toBe('185.12.34.***');
    });
  });

  describe('Task Lifecycle Management', () => {
    it('should successfully initiate tasks and set running states', async () => {
      const payload = { email: 'client@bank.com', balance: 5000 };
      const task = await bridge.initiateTask('CreditScoreCheck', payload);

      expect(task.id).toBeDefined();
      expect(task.name).toBe('CreditScoreCheck');
      expect(task.status).toBe('RUNNING');
      expect(task.inputPayload.email).toContain('cli***@***.com');
      expect(task.startTime).toBeLessThanOrEqual(Date.now());
      expect(task.version).toBe('0.5.5');
    });

    it('should successfully complete running tasks and apply defensive schema guards', async () => {
      const input = { userId: '123' };
      const task = await bridge.initiateTask('PortfolioAnalysis', input);

      const output = { score: 95, piiContact: 'advisor@bank.com' };
      // Validating schema guard
      const guard = (data: any) => typeof data.score === 'number';

      const completedTask = await bridge.completeTask(task.id, output, guard);
      expect(completedTask.status).toBe('COMPLETED');
      expect(completedTask.endTime).toBeDefined();
      expect(completedTask.durationMs).toBeGreaterThanOrEqual(0);
      expect(completedTask.outputPayload.piiContact).toContain('adv***@***.com');
    });

    it('should throw a ValidationError if output payload fails schema checks', async () => {
      const task = await bridge.initiateTask('RiskScoring', { item: 'BTC' });
      const invalidOutput = { status: 'bad_format_missing_score' };
      
      const guard = (data: any) => typeof data.score === 'number';

      await expect(
        bridge.completeTask(task.id, invalidOutput, guard)
      ).rejects.toThrow(ValidationError);

      const failedTask = bridge.getTaskList().find(t => t.id === task.id);
      expect(failedTask?.status).toBe('FAILED');
      expect(failedTask?.error).toContain('Defensive contract verification failed');
    });

    it('should throw a NotFoundError if completing a non-existent task', async () => {
      await expect(
        bridge.completeTask('non_existent_id', {})
      ).rejects.toThrow(NotFoundError);
    });

    it('should correctly capture failures and transition tasks to FAILED state', async () => {
      const task = await bridge.initiateTask('OnChainVerification', { hash: '0x123' });
      const errorObj = new Error('RPC Endpoint Unreachable');

      const failedTask = await bridge.failTask(task.id, errorObj);
      expect(failedTask.status).toBe('FAILED');
      expect(failedTask.error).toBe('RPC Endpoint Unreachable');
    });

    it('should execute a task inside a managed execution block utilizing trackExecution telemetry', async () => {
      const input = { key: 'test-value' };
      const result = await bridge.executeManagedTask(
        'ManagedQuery',
        input,
        (sanitizedInput) => {
          expect(sanitizedInput.key).toBe('test-value');
          return { success: true };
        },
        (data) => data.success === true
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Compliance Analytics & Telemetry Metrics', () => {
    it('should accumulate correct statistics for completed, failed, and sanitized transactions', async () => {
      // Re-create isolated instance logic for clean stats
      const testBridge = Object.create(OrchestratorAgentBridge.prototype);
      testBridge.tasks = new Map();
      testBridge.systemDirectives = [];
      testBridge.totalInitiated = 0;
      testBridge.totalCompleted = 0;
      testBridge.totalFailed = 0;
      testBridge.totalSanitizedFields = 0;

      // 1. Initiate 2 tasks
      const t1 = await testBridge.initiateTask('T1', { password: '123' }); // 1 sanitized field
      const t2 = await testBridge.initiateTask('T2', { email: 'test@mail.com' }); // 1 sanitized field

      expect(testBridge.getStats().activeTasksCount).toBe(2);

      // 2. Complete 1 successfully
      await testBridge.completeTask(t1.id, { result: 'ok' });

      // 3. Fail 1
      await testBridge.failTask(t2.id, new Error('Test Fail'));

      const stats = testBridge.getStats();
      expect(stats.totalInitiated).toBe(2);
      expect(stats.totalCompleted).toBe(1);
      expect(stats.totalFailed).toBe(1);
      expect(stats.complianceRating).toBe(50); // 1 completed out of 2 processed
      expect(stats.activeTasksCount).toBe(0);
      expect(stats.totalSanitizedFields).toBe(2);
    });
  });
});
