import type { Express, Request, Response, NextFunction } from 'express';

// F-08: Die ersten sechs Muster stammen aus dem WebscanRadar-Audit (02.08.2026). Die folgenden
// wurden aus dem realen Scanner-Verkehr der Produktion ergaenzt (Render-App-Logs, Stichprobe
// 2026-08-19 bis 2026-08-26): sie trafen zuvor kein Muster und liefen deshalb durch die gesamte
// Middleware-Kette inklusive Rate-Limiter, bevor der Soft-404 griff. Ein Informationsabfluss
// entstand nie - die Antwort war immer 404 -, aber die dokumentierte Absicht lautet, solche
// Pfade frueh abzuweisen.
const PROBE_PATH_PATTERNS = [
  /\.php$/i,
  /^\/wp-(admin|login|content|includes|json)(\/|$)/i,
  /^\/(config|wp-config)\.(php|json|ya?ml|ini)$/i,
  /^\/\.env(\.|$)/i,
  /^\/\.git(\/|$)/i,
  /^\/(phpinfo|info|test)\.php$/i,

  // Config-Exfiltration: zuvor nur auf Wurzelebene und ohne .toml erfasst.
  // Beobachtet: /config.toml, /config.yaml, /config.yml, /app/config.toml, /app/config.yaml
  /(^|\/)(app\/)?(config|settings|secrets)\.(toml|ya?ml|ini|json|conf)$/i,

  // Weitere Dotfile-/VCS-Verzeichnisse derselben Klasse wie .git und .env.
  /^\/\.(svn|hg|aws|ssh|docker|vscode|idea)(\/|$)/i,
  /^\/\.(dockerenv|npmrc|netrc|htpasswd|htaccess)$/i,

  // CMS-/Shop-Fingerprinting. Beobachtet: /magento_version, Joomla-Manifest, OpenCart-Extension.
  /^\/magento_version$/i,
  /^\/administrator(\/|$)/i,
  /^\/(core|install|setup)\/install(\.php)?$/i,
  /^\/admin\/controller(\/|$)/i,
  /^\/(typo3|joomla|drupal|opencart|prestashop)(\/|$)/i,

  // Backup-/Dump-Koeder.
  /\.(sql|bak|old|swp|orig)$/i,
  /^\/(backup|dump|db)\.(sql|zip|tar|gz)$/i,
];

export function isKnownProbePath(pathname: string): boolean {
  return PROBE_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Rejects common scanner/probe paths before they reach the SPA fallback.
 * Preserves the existing server.ts behavior: HTTP 404 with an empty body.
 */
export function registerProbeProtection(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isKnownProbePath(req.path)) {
      return res.status(404).end();
    }
    next();
  });
}
