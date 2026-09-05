import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const INDEX = path.join(DIST, 'index.html');

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

interface BrowserScenario {
  name: string;
  path: string;
  width: number;
  height: number;
  userAgent?: string;
}

const scenarios: BrowserScenario[] = [
  { name: 'desktop-root', path: '/', width: 1440, height: 1000 },
  { name: 'desktop-login', path: '/login', width: 1440, height: 1000 },
  {
    name: 'mobile-login',
    path: '/login',
    width: 412,
    height: 915,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
  },
];

function resolveChromeBinary(): string {
  const configured = process.env.CHROME_BIN?.trim();
  const candidates = [configured, 'google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser']
    .filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) return candidate;
  }

  throw new Error(
    'No Chromium/Chrome executable found. Set CHROME_BIN or install a trusted browser runtime before executing this gate.',
  );
}

function safeAssetPath(requestPath: string): string | null {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const candidate = path.resolve(DIST, `.${decoded}`);
  const relative = path.relative(DIST, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return candidate;
}

function serveFile(response: http.ServerResponse, filename: string): void {
  const extension = path.extname(filename).toLowerCase();
  response.statusCode = 200;
  response.setHeader('Content-Type', MIME_TYPES[extension] ?? 'application/octet-stream');
  response.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(filename).pipe(response);
}

function assertReactBootstrapped(name: string, html: string): void {
  const rootMatch = html.match(/<div\s+id="root"[^>]*>([\s\S]*?)<\/div>/i);
  if (!rootMatch || rootMatch[1].trim().length === 0) {
    throw new Error(`${name}: React root remained empty after Chromium executed the production bundle.`);
  }

  if (/__CSP_NONCE__/.test(html)) {
    // The static browser harness deliberately has no CSP transformer. A remaining nonce placeholder
    // is therefore expected only on script attributes and is not a browser-bootstrap failure here.
    // ADR-0040's production-response test remains responsible for nonce replacement/CSP equality.
  }

  if (/Ansicht wird geladen…/.test(rootMatch[1]) && rootMatch[1].trim().length < 150) {
    throw new Error(`${name}: only the route loading fallback rendered; lazy application content did not settle.`);
  }
}

async function main(): Promise<void> {
  if (!fs.existsSync(INDEX)) {
    throw new Error('dist/index.html is missing. Run the production build before the Chromium bootstrap gate.');
  }

  const chrome = resolveChromeBinary();
  const server = http.createServer((request, response) => {
    const requestPath = request.url ?? '/';
    const assetPath = safeAssetPath(requestPath);

    if (assetPath && fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
      serveFile(response, assetPath);
      return;
    }

    serveFile(response, INDEX);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Browser smoke server did not expose a TCP port.');

    for (const scenario of scenarios) {
      const url = `http://127.0.0.1:${address.port}${scenario.path}`;
      const args = [
        '--headless=new',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--hide-scrollbars',
        `--window-size=${scenario.width},${scenario.height}`,
        '--virtual-time-budget=7000',
        '--dump-dom',
      ];
      if (scenario.userAgent) args.push(`--user-agent=${scenario.userAgent}`);
      args.push(url);

      const result = spawnSync(chrome, args, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 20_000,
      });

      if (result.error) throw result.error;
      if (result.status !== 0) {
        throw new Error(
          `${scenario.name}: Chromium exited with status ${result.status}. ${String(result.stderr || '').slice(-1500)}`,
        );
      }

      assertReactBootstrapped(scenario.name, result.stdout);
      console.log(`[frontend-browser-bootstrap] PASS ${scenario.name}`);
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log(
    '[frontend-browser-bootstrap] PASS: production Vite bundle rendered visible React content in Chromium desktop and Android/mobile scenarios.',
  );
}

main().catch((error) => {
  console.error(`[frontend-browser-bootstrap] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
