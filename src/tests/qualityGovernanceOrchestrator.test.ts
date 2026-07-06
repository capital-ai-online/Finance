import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QualityGovernanceOrchestrator } from '../orchestrator/qualityGovernanceOrchestrator';
import fs from 'fs';
import path from 'path';

describe('QualityGovernanceOrchestrator Unit Tests', () => {
  let orchestrator: QualityGovernanceOrchestrator;

  beforeEach(() => {
    orchestrator = new QualityGovernanceOrchestrator(null);
  });

  it('should run a successful quality governance audit', async () => {
    const report = await orchestrator.runGovernanceAudit('Unit Test Run');
    
    expect(report).toBeDefined();
    expect(report.trigger).toBe('Unit Test Run');
    expect(report.auditedFilesCount).toBeGreaterThan(0);
    expect(report.metrics).toBeDefined();
    
    // Check key scores exist and are numbers between 0 and 100
    expect(report.metrics.architectureScore).toBeGreaterThanOrEqual(0);
    expect(report.metrics.architectureScore).toBeLessThanOrEqual(100);
    expect(report.metrics.maintainabilityScore).toBeGreaterThanOrEqual(0);
    expect(report.metrics.securityScore).toBeGreaterThanOrEqual(0);
    expect(report.metrics.uxScore).toBeGreaterThanOrEqual(0);
    expect(report.metrics.accessibilityScore).toBeGreaterThanOrEqual(0);
    expect(report.metrics.documentationScore).toBeGreaterThanOrEqual(0);
    expect(report.metrics.productionScore).toBeGreaterThanOrEqual(0);

    // Verify file creation in both /reports and /docs/reports
    const reportsDir = path.join(process.cwd(), 'reports');
    const docsReportsDir = path.join(process.cwd(), 'docs', 'reports');

    expect(fs.existsSync(path.join(reportsDir, 'quality-report.md'))).toBe(true);
    expect(fs.existsSync(path.join(docsReportsDir, 'quality-report.md'))).toBe(true);
    expect(fs.existsSync(path.join(reportsDir, 'security-report.md'))).toBe(true);
    expect(fs.existsSync(path.join(reportsDir, 'architecture-report.md'))).toBe(true);
    expect(fs.existsSync(path.join(reportsDir, 'performance-report.md'))).toBe(true);
    expect(fs.existsSync(path.join(reportsDir, 'maintainability-report.md'))).toBe(true);
    expect(fs.existsSync(path.join(reportsDir, 'uiux-report.md'))).toBe(true);
    expect(fs.existsSync(path.join(reportsDir, 'production-readiness.md'))).toBe(true);
  });

  it('should correctly score naming suffix deviations', () => {
    // Run naming audit with mocked files list containing suffix mismatch
    const badFiles = ['src/services/wrongName.ts', 'src/orchestrator/wrongOrch.ts'];
    // Access private naming method for deep granular testing
    const result = (orchestrator as any).auditNamingConventions(badFiles);
    
    expect(result.score).toBeLessThan(100);
    expect(result.issues.length).toBe(2);
    expect(result.issues[0].id).toBe('NAM_SRV_SUFFIX');
    expect(result.issues[1].id).toBe('NAM_ORCH_SUFFIX');
  });

  it('should detect hardcoded security key issues', () => {
    // Mock temporary file creation to simulate security scan
    const tmpFile = 'src/test_secrets_violation.ts';
    const absoluteTmpPath = path.join(process.cwd(), tmpFile);
    fs.writeFileSync(absoluteTmpPath, "const key = 'AIzaSy_fake_key_123';", 'utf-8');

    try {
      const result = (orchestrator as any).auditSecurity([tmpFile]);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBe(1);
      expect(result.issues[0].id).toBe('SEC_HARDCODED_KEY');
    } finally {
      if (fs.existsSync(absoluteTmpPath)) {
        fs.unlinkSync(absoluteTmpPath);
      }
    }
  });
});
