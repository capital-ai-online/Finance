import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { syncBuiltinESMExports } from 'node:module';

/**
 * R-002 / DC-005 / DC-006
 *
 * Production web containers must not mutate repository-style documentation or
 * local release-governance state. The guard is intentionally narrow: uploads
 * that belong to normal application workflows remain writable, while docs/**
 * and the two legacy governance JSON files are fail-closed.
 */

const cwd = path.resolve(process.cwd());
const docsRoot = path.resolve(cwd, 'docs');
const protectedFiles = new Set([
  path.resolve(cwd, 'uploads', 'document_hygiene.json'),
  path.resolve(cwd, 'uploads', 'version_manager.json'),
]);

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
  syncBuiltinESMExports();
  console.info('[RuntimeArtifactGuard] R-002 production read-only artifact boundary enabled.');
}

installGuard();
