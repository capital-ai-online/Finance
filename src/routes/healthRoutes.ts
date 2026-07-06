import express from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../server/logger';
import { AuthenticationError, AuthorizationError } from '../server/errors';

/**
 * CAPITAL-AI Secure Health & Diagnostics Router
 * Version 0.5.5 (Beta-Phase)
 */
export function createHealthRouter(
  isSupabaseConfigured: () => boolean,
  getServerSupabase: () => any
): express.Router {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      // 1. Secure authorization check using central tokens
      const adminToken = process.env.ORCHESTRATOR_ADMIN_TOKEN || 'aif-admin-2026';
      const providedToken = req.headers['x-health-check-token'] || 
                            req.headers['x-orchestrator-admin-token'] || 
                            req.headers['authorization']?.toString().replace('Bearer ', '');

      if (!providedToken) {
        throw new AuthenticationError('Authentication token is missing. Access denied.');
      }

      if (providedToken !== adminToken) {
        throw new AuthorizationError('Invalid authentication token. Access denied.');
      }

      logger.info('Secure health check execution initiated', { module: 'health', function: 'check' });

      const startTime = process.hrtime();
      let supabaseStatus = 'unconfigured';
      let supabaseConfigured = false;
      let supabaseLatencyMs: number | null = null;
      let supabaseError: string | null = null;

      // 2. Perform live Supabase check if configured
      if (isSupabaseConfigured()) {
        supabaseConfigured = true;
        try {
          const supabaseInstance = getServerSupabase();
          const dbStartTime = process.hrtime();
          
          // Fast query to check database connectivity
          const { error } = await supabaseInstance
            .from('subscriptions')
            .select('email')
            .limit(1);

          const dbDiff = process.hrtime(dbStartTime);
          supabaseLatencyMs = Math.round((dbDiff[0] * 1e9 + dbDiff[1]) / 1e6);

          if (error) {
            supabaseStatus = 'error';
            supabaseError = error.message || JSON.stringify(error);
            logger.warn('Supabase health check returned query error status', { 
              module: 'health', 
              function: 'check', 
              error: supabaseError 
            });
          } else {
            supabaseStatus = 'connected';
          }
        } catch (err: any) {
          supabaseStatus = 'disconnected';
          supabaseError = err.message || String(err);
          logger.error('Supabase connection failed during health check', {
            module: 'health',
            function: 'check',
            error: supabaseError,
            stack: err.stack
          });
        }
      }

      // 3. Verify local directory write capabilities (uploads folder)
      let writableUploads = false;
      const uploadsDir = path.join(process.cwd(), 'uploads');
      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const testFile = path.join(uploadsDir, '.health_test');
        fs.writeFileSync(testFile, 'ok', 'utf8');
        fs.unlinkSync(testFile);
        writableUploads = true;
      } catch (err: any) {
        logger.error('Failed to verify local storage write capabilities', {
          module: 'health',
          function: 'check',
          error: err.message || err
        });
      }

      // 4. Calculate compound health status
      let systemStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (!writableUploads) {
        systemStatus = 'unhealthy';
      } else if (supabaseConfigured && supabaseStatus !== 'connected') {
        systemStatus = 'degraded';
      }

      // 5. Gather process system resource metrics
      const memory = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptimeSeconds = process.uptime();

      const healthPayload = {
        success: true,
        status: systemStatus,
        timestamp: new Date().toISOString(),
        version: '0.5.5', // Pinned to 0.5.5 (Beta-Phase) per directives
        uptimeSeconds: Math.round(uptimeSeconds * 100) / 100,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: {
            heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
            heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
            rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
            externalMb: Math.round((memory.external / 1024 / 1024) * 100) / 100,
          },
          cpuUsage: {
            user: cpuUsage.user,
            system: cpuUsage.system
          }
        },
        services: {
          supabase: {
            status: supabaseStatus,
            configured: supabaseConfigured,
            latencyMs: supabaseLatencyMs,
            error: supabaseError
          },
          stripe: {
            status: !!process.env.STRIPE_SECRET_KEY ? 'configured' : 'unconfigured',
            configured: !!process.env.STRIPE_SECRET_KEY
          },
          gemini: {
            status: !!process.env.GEMINI_API_KEY ? 'configured' : 'unconfigured',
            configured: !!process.env.GEMINI_API_KEY
          }
        },
        diagnostics: {
          writableUploads
        }
      };

      const diffTime = process.hrtime(startTime);
      const totalDurationMs = Math.round((diffTime[0] * 1e9 + diffTime[1]) / 1e6);

      logger.info(`Health check completed in ${totalDurationMs}ms - Status: ${systemStatus}`, {
        module: 'health',
        function: 'check',
        durationMs: totalDurationMs,
        status: systemStatus
      });

      res.json(healthPayload);
    } catch (error: any) {
      next(error);
    }
  });

  return router;
}
