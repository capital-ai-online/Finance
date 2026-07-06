/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { QualityGovernanceOrchestrator } from '../orchestrator/qualityGovernanceOrchestrator';
import { logger } from '../server/logger';

export function createQualityGovernanceRouter(aiClient: GoogleGenAI | null) {
  const router = express.Router();
  const orchestrator = new QualityGovernanceOrchestrator(aiClient);

  /**
   * Run the quality governance audit pipeline.
   * Can accept optional body parameters for trigger and additional parameters.
   */
  router.post('/run', async (req, res, next) => {
    try {
      const { trigger } = req.body;
      const activeTrigger = trigger || 'Manual Quality Check';

      logger.info(`[QualityGovernanceRoutes] Triggering EQGA audit pipeline on request. Trigger: "${activeTrigger}"`);
      const report = await orchestrator.runGovernanceAudit(activeTrigger);

      res.status(200).json({
        success: true,
        message: 'Quality Governance Audit successfully completed.',
        report,
      });
    } catch (err: any) {
      logger.error(`[QualityGovernanceRoutes] Audit execution failed: ${err.message || err}`);
      next(err);
    }
  });

  /**
   * Quick status or metrics fetch for the dashboard UI.
   */
  router.get('/status', async (req, res, next) => {
    try {
      // Runs an audit to get up-to-date metrics
      const report = await orchestrator.runGovernanceAudit('System Status Fetch');
      res.status(200).json({
        success: true,
        metrics: report.metrics,
        totalIssues: report.totalIssuesBySeverity,
        timestamp: report.timestamp,
      });
    } catch (err: any) {
      logger.error(`[QualityGovernanceRoutes] Status fetch failed: ${err.message || err}`);
      next(err);
    }
  });

  return router;
}
