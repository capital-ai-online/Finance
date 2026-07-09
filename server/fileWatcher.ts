import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';

export interface FileWatcherOptions {
  docsDir?: string;
  allowedExtensions?: string[];
  debounceMs?: number;
  ignoredPrefixes?: string[];
}

export type FileWatcherCallback = (
  eventType: 'add' | 'change' | 'unlink',
  relativePath: string
) => void | Promise<void>;

/**
 * FileWatcher (FA-01 to FA-04)
 * Autonomous Chokidar-based component designed to recursively monitor a target folder,
 * map events, filter items based on file extension and ignore patterns, debounce updates, and execute a callback.
 */
export class FileWatcher {
  private docsDir: string;
  private allowedExtensions: string[];
  private debounceMs: number;
  private ignoredPrefixes: string[];
  private callback: FileWatcherCallback;
  private timers: Record<string, NodeJS.Timeout>;
  private watcher: any;

  constructor(callback: FileWatcherCallback, options: FileWatcherOptions = {}) {
    this.callback = callback;
    this.docsDir = options.docsDir || path.join(process.cwd(), 'docs');
    this.allowedExtensions = options.allowedExtensions || ['.md', '.json', '.txt', '.pdf'];
    this.debounceMs = options.debounceMs !== undefined ? options.debounceMs : 1500;
    this.ignoredPrefixes = options.ignoredPrefixes || ['.history', 'reports'];
    this.timers = {};
    this.watcher = null;
  }

  /**
   * Starts recursive directory monitoring on the target directory (FA-01).
   */
  public start(): void {
    if (!fs.existsSync(this.docsDir)) {
      fs.mkdirSync(this.docsDir, { recursive: true });
    }

    console.log(`[FileWatcher] Starting recursive Chokidar watcher on: ${this.docsDir}`);

    try {
      // FA-01: Chokidar handles stable recursive file watching automatically
      this.watcher = chokidar.watch(this.docsDir, {
        ignored: (filePath, stats) => {
          if (!filePath) return false;
          
          // Get normalized relative path to the docs root folder
          const relativePath = path.relative(this.docsDir, filePath).replace(/\\/g, '/');
          const baseName = path.basename(filePath);

          // Never ignore the root folder itself
          if (filePath === this.docsDir || relativePath === '') {
            return false;
          }

          // Ignore dotfiles and hidden folders (e.g. .git, .history)
          if (baseName.startsWith('.')) {
            return true;
          }

          // If we have stats and it is a directory, decide if we traverse it
          if (stats && stats.isDirectory()) {
            return this.ignoredPrefixes.some(prefix => 
              relativePath === prefix || relativePath.startsWith(prefix + '/')
            );
          }

          // File level checks (FA-04: Allowed extensions and ignore patterns)
          const ext = path.extname(filePath).toLowerCase();
          const isIgnoredPrefix = this.ignoredPrefixes.some(prefix => 
            relativePath === prefix || relativePath.startsWith(prefix + '/')
          );
          
          if (isIgnoredPrefix) {
            return true;
          }

          return !this.allowedExtensions.includes(ext);
        },
        persistent: true,
        ignoreInitial: true, // Do not trigger events for pre-existing files on load
        depth: 99,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100
        }
      });

      const handleEvent = (event: 'add' | 'change' | 'unlink', filePath: string) => {
        const relativePath = path.relative(this.docsDir, filePath).replace(/\\/g, '/');
        if (!relativePath) return;

        // FA-03: Configurable debouncing to aggregate frequent sequential updates
        if (this.timers[relativePath]) {
          clearTimeout(this.timers[relativePath]);
        }

        this.timers[relativePath] = setTimeout(async () => {
          delete this.timers[relativePath];

          console.log(`[FileWatcher] Dispatching mapped event '${event}' for: ${relativePath}`);
          try {
            await this.callback(event, relativePath);
          } catch (callbackErr) {
            console.error(`[FileWatcher] Error executing trigger callback on '${relativePath}':`, callbackErr);
          }
        }, this.debounceMs);
      };

      // FA-02: Map native file system event metadata to simple 'add', 'change', and 'unlink' events
      this.watcher
        .on('add', (filePath: string) => handleEvent('add', filePath))
        .on('change', (filePath: string) => handleEvent('change', filePath))
        .on('unlink', (filePath: string) => handleEvent('unlink', filePath))
        .on('error', (err: any) => {
          console.error('[FileWatcher] Chokidar encountered error:', err);
        });

    } catch (err) {
      console.error(`[FileWatcher] Failed to initialize recursive watcher on ${this.docsDir}:`, err);
    }
  }

  /**
   * Gracefully closes the watcher.
   */
  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log(`[FileWatcher] Stopped Chokidar watcher on: ${this.docsDir}`);
    }

    for (const key of Object.keys(this.timers)) {
      clearTimeout(this.timers[key]);
      delete this.timers[key];
    }
  }
}
