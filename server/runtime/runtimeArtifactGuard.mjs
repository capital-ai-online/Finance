import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { EventEmitter } from 'node:events';
import { syncBuiltinESMExports } from 'node:module';

/**
 * R-002 / DC-005 / DC-006
 *
 * Production web containers must not mutate repository-style documentation or
 * local release-governance state. The guard is intentionally narrow: uploads
 * that belong to normal application workflows remain writable, while docs/**
 * and the two legacy governance JSON files are fail-closed.
 *
 * The same production boundary also owns the compatibility contract for legacy
 * Documentary / Version Manager HTTP routes. Mutations are rejected before
 * Express can execute filesystem-writing handlers, while GET /api/admin/version
 * is served from immutable package/deploy metadata instead of version_manager.json.
 */

const cwd = path.resolve(process.cwd());
const docsRoot = path.resolve(cwd, 'docs');
const protectedFiles = new Set([
  path.resolve(cwd, 'uploads', 'document_hygiene.json'),
  path.resolve(cwd, 'uploads', 'version_manager.json'),
]);

function readPackageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' && pkg.version.trim() ? pkg.version.trim() : 'unknown';
  } catch {
    return 'unknown';
  }
}

const immutableReleaseIdentity = Object.freeze({
  version: readPackageVersion(),
  commitSha:
    process.env.RENDER_GIT_COMMIT ||
    process.env.GIT_COMMIT ||
    process.env.SOURCE_VERSION ||
    null,
  serviceId: process.env.RENDER_SERVICE_ID || null,
  instanceId: process.env.RENDER_INSTANCE_ID || null,
  hostname: process.env.RENDER_EXTERNAL_HOSTNAME || null,
  source: 'immutable-build-metadata',
});

function resolveFsPath(value) {
  if (typeof value === 'string' || Buffer.isBuffer(value)) {
    return path.resolve(cwd, String(value));
  }
  if (value instanceof URL && value.protocol === 'file:') {
    return path.resolve(value.pathname);
  }
  return null;
}

export function isProtectedRuntimeArtifactPath(value) {
  const resolved = resolveFsPath(value);
  if (!resolved) return false;
  return resolved === docsRoot || resolved.startsWith(`${docsRoot}${path.sep}`) || protectedFiles.has(resolved);
}

export function assertRuntimeArtifactWritable(value, operation = 'write') {
  if (!isProtectedRuntimeArtifactPath(value)) return;
  const resolved = resolveFsPath(value);
  const error = new Error(
    `R-002 runtime artifact immutability: ${operation} denied for ${resolved}. ` +
    'Repository documentation and release-governance artifacts are read-only in the production web runtime.',
  );
  error.code = 'CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY';
  throw error;
}

function wrapSync(name, targetArg = 0) {
  const original = fs[name];
  if (typeof original !== 'function') return;
  fs[name] = function guardedFsMutation(...args) {
    assertRuntimeArtifactWritable(args[targetArg], name);
    return original.apply(this, args);
  };
}

function wrapDualPathSync(name) {
  const original = fs[name];
  if (typeof original !== 'function') return;
  fs[name] = function guardedFsDualMutation(source, destination, ...rest) {
    assertRuntimeArtifactWritable(source, `${name}:source`);
    assertRuntimeArtifactWritable(destination, `${name}:destination`);
    return original.call(this, source, destination, ...rest);
  };
}

function wrapPromise(name, targetArg = 0) {
  const original = fs.promises?.[name];
  if (typeof original !== 'function') return;
  fs.promises[name] = async function guardedPromiseMutation(...args) {
    assertRuntimeArtifactWritable(args[targetArg], `promises.${name}`);
    return original.apply(this, args);
  };
}

function createInertWatcher() {
  const watcher = new EventEmitter();
  watcher.close = () => {};
  watcher.ref = () => watcher;
  watcher.unref = () => watcher;
  return watcher;
}

function installProtectedPathWatcherBoundary() {
  const originalWatch = fs.watch;
  if (typeof originalWatch === 'function') {
    fs.watch = function guardedWatch(filename, ...rest) {
      if (isProtectedRuntimeArtifactPath(filename)) {
        console.info(`[RuntimeArtifactGuard] R-002 suppressed production watcher for ${resolveFsPath(filename)}.`);
        return createInertWatcher();
      }
      return originalWatch.call(this, filename, ...rest);
    };
  }

  const originalWatchFile = fs.watchFile;
  if (typeof originalWatchFile === 'function') {
    fs.watchFile = function guardedWatchFile(filename, ...rest) {
      if (isProtectedRuntimeArtifactPath(filename)) {
        console.info(`[RuntimeArtifactGuard] R-002 suppressed production watchFile for ${resolveFsPath(filename)}.`);
        return createInertWatcher();
      }
      return originalWatchFile.call(this, filename, ...rest);
    };
  }
}

function writeJsonResponse(res, statusCode, payload) {
  if (res.headersSent || res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

function getRequestPath(req) {
  try {
    return new URL(req.url || '/', 'http://capital-ai.runtime').pathname;
  } catch {
    return req.url || '/';
  }
}

function isControlPlaneMutation(method, pathname) {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;
  if (pathname === '/api/docs-file') return true;
  if (pathname === '/api/admin/version/bump') return true;
  if (pathname.startsWith('/api/admin/hygiene/')) return true;
  return false;
}

function installControlPlaneHttpBoundary() {
  const originalEmit = http.Server.prototype.emit;
  http.Server.prototype.emit = function guardedServerEmit(eventName, ...args) {
    if (eventName !== 'request') {
      return originalEmit.call(this, eventName, ...args);
    }

    const [req, res] = args;
    const method = String(req?.method || 'GET').toUpperCase();
    const pathname = getRequestPath(req);

    if (method === 'GET' && pathname === '/api/admin/version') {
      writeJsonResponse(res, 200, {
        success: true,
        state: {
          version: immutableReleaseIdentity.version,
          buildNumber: null,
          releaseDate: null,
          gitTag: immutableReleaseIdentity.commitSha ? `git:${immutableReleaseIdentity.commitSha}` : null,
          dockerTag: null,
          releaseNotes: 'Immutable production release identity derived from package/deploy metadata.',
          history: [],
          source: immutableReleaseIdentity.source,
          commitSha: immutableReleaseIdentity.commitSha,
          serviceId: immutableReleaseIdentity.serviceId,
          instanceId: immutableReleaseIdentity.instanceId,
          hostname: immutableReleaseIdentity.hostname,
          readOnly: true,
        },
        workspace: {
          source: 'production-runtime-read-only',
          mutationAuthority: 'ci-or-authenticated-control-plane',
        },
      });
      return true;
    }

    if (isControlPlaneMutation(method, pathname)) {
      writeJsonResponse(res, 409, {
        error: 'Production runtime is read-only for Documentary and release-governance mutations.',
        code: 'READ_ONLY_CONTROL_PLANE_REQUIRED',
        mutationAuthority: 'ci-or-authenticated-control-plane',
        path: pathname,
      });
      return true;
    }

    return originalEmit.call(this, eventName, ...args);
  };
}

function installGuard() {
  const enabled = process.env.NODE_ENV === 'production' && process.env.CAPITAL_AI_RUNTIME_ARTIFACT_MODE === 'readonly';
  if (!enabled) return;

  for (const name of ['writeFileSync', 'appendFileSync', 'truncateSync', 'unlinkSync', 'rmSync', 'rmdirSync', 'mkdirSync']) {
    wrapSync(name);
  }
  wrapSync('copyFileSync', 1);
  wrapDualPathSync('renameSync');

  for (const name of ['writeFile', 'appendFile', 'truncate', 'unlink', 'rm', 'rmdir', 'mkdir']) {
    wrapPromise(name);
  }
  wrapPromise('copyFile', 1);

  installProtectedPathWatcherBoundary();
  installControlPlaneHttpBoundary();
  syncBuiltinESMExports();
  console.info(
    `[RuntimeArtifactGuard] R-002 production read-only boundary enabled for release ${immutableReleaseIdentity.version}.`,
  );
}

installGuard();
