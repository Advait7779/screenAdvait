import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getDb } from './sqlite.store.js';

export const SCREENSHOT_RETENTION_DAYS = 15;
const RETENTION_INTERVAL_MS = 60 * 60 * 1000;
const RETENTION_BATCH_SIZE = 1000;
let retentionTimer: NodeJS.Timeout | null = null;

function isInsideDirectory(candidate: string, root: string) {
  const relative = path.relative(root, candidate);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function pruneEmptyParents(startDirectory: string, root: string, maximumLevels = 4) {
  let current = path.resolve(startDirectory);
  for (let level = 0; level < maximumLevels && isInsideDirectory(current, root); level += 1) {
    try {
      if (!fs.existsSync(current) || fs.readdirSync(current).length > 0) return;
      fs.rmdirSync(current);
      current = path.dirname(current);
    } catch {
      return;
    }
  }
}

export function cleanupExpiredLocalScreenshots(now = Date.now()) {
  const screenshotsRoot = path.resolve(app.getPath('userData'), 'screenshots');
  const cutoff = new Date(
    now - SCREENSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const expired = getDb()
    .prepare(
      `SELECT id, file_path FROM upload_queue
       WHERE captured_at < ? AND status != 'UPLOADING'
       ORDER BY captured_at ASC LIMIT ${RETENTION_BATCH_SIZE}`,
    )
    .all(cutoff) as Array<{ id: string; file_path: string }>;

  let deleted = 0;
  for (const item of expired) {
    const absolutePath = path.resolve(item.file_path);
    try {
      if (isInsideDirectory(absolutePath, screenshotsRoot)) {
        fs.rmSync(absolutePath, { force: true });
        pruneEmptyParents(path.dirname(absolutePath), screenshotsRoot);
      }
      getDb().prepare('DELETE FROM upload_logs WHERE queue_id = ?').run(item.id);
      getDb().prepare('DELETE FROM upload_queue WHERE id = ?').run(item.id);
      deleted += 1;
    } catch (error) {
      console.warn(`[Retention] Could not remove expired screenshot ${item.id}`, error);
    }
  }

  if (deleted > 0) {
    console.log(
      `[Retention] Removed ${deleted} local screenshot(s) older than ${SCREENSHOT_RETENTION_DAYS} days`,
    );
  }
  return deleted;
}

export function startRetentionCleanupWorker() {
  if (retentionTimer) return;
  const runCleanup = () => {
    try {
      cleanupExpiredLocalScreenshots();
    } catch (error) {
      console.warn('[Retention] Automatic local cleanup will retry later', error);
    }
  };
  const initialCleanup = setTimeout(runCleanup, 5000);
  initialCleanup.unref?.();
  retentionTimer = setInterval(runCleanup, RETENTION_INTERVAL_MS);
  retentionTimer.unref?.();
}
