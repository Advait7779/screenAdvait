import path from 'path';
import fs from 'fs';
import { app, desktopCapturer, Notification, screen } from 'electron';
import axios from 'axios';
import crypto from 'crypto';
import { getDb } from './sqlite.store.js';
import {
  clearSession,
  getSession,
  isAccessTokenExpired,
  updateSessionLicenseStatus,
  updateSessionTokens,
} from './session.store.js';
import { getDeviceDetails } from './device.js';
import { getApiUrl } from './ipc.js';

let captureTimer: NodeJS.Timeout | null = null;
let uploadTimer: NodeJS.Timeout | null = null;
let captureInProgress = false;
let uploadInProgress = false;
let targetNextCaptureTime = 0;
let lastCaptureTime = 0;
let currentIntervalSeconds = 300;
let paused = false;
let apiConnected = false;
let entitlementError = '';
let lastEntitlementCheck = 0;
let entitlementPaused = false;

const ALLOWED_INTERVALS = new Set([60, 300, 600, 900, 1800, 3600]);

async function capturePrimaryDisplayPng() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const width = Math.max(
    1,
    Math.round(primaryDisplay.size.width * primaryDisplay.scaleFactor),
  );
  const height = Math.max(
    1,
    Math.round(primaryDisplay.size.height * primaryDisplay.scaleFactor),
  );
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height },
    fetchWindowIcons: false,
  });
  const source =
    sources.find((candidate) => candidate.display_id === String(primaryDisplay.id)) ||
    sources[0];
  if (!source || source.thumbnail.isEmpty()) {
    throw new Error('Windows did not return a desktop capture source');
  }
  return source.thumbnail.toPNG();
}

function safeEmployeeFolder(value: unknown) {
  const cleaned = String(value || 'employee')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^[. ]+|[. ]+$/g, '')
    .slice(0, 100);
  return cleaned || 'employee';
}

function readSetting(key: string, fallback: string) {
  const row = getDb().prepare('SELECT value FROM local_settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? fallback;
}

function parseIntervalSeconds(value: string) {
  const parsed = Number.parseInt(value, 10);
  return ALLOWED_INTERVALS.has(parsed) ? parsed : 300;
}

export function getEngineStatus() {
  return {
    isRunning: captureTimer !== null && !paused,
    isPaused: paused,
    isCapturing: captureInProgress,
    apiConnected,
    entitlementError,
    intervalSeconds: currentIntervalSeconds,
    intervalMinutes: Math.round((currentIntervalSeconds / 60) * 10) / 10,
    nextCaptureTimestamp: paused ? 0 : targetNextCaptureTime,
    lastCaptureTimestamp: lastCaptureTime,
  };
}

export async function startScreenshotEngine(forceReset = false) {
  if (!getSession()) return;
  const interval = parseIntervalSeconds(readSetting('screenshotInterval', '300'));
  currentIntervalSeconds = interval;
  if (forceReset) {
    entitlementError = '';
    entitlementPaused = false;
    lastEntitlementCheck = 0;
  }
  if (!(await ensureEntitlementActive())) {
    paused = true;
    targetNextCaptureTime = 0;
    clearCaptureTimer();
    return;
  }
  if (captureTimer && interval === currentIntervalSeconds && !forceReset && !paused) return;
  clearCaptureTimer();
  paused = false;
  writeSetting('capturePaused', 'false');
  scheduleNextCapture();
  startResilientUploadWorker();
}

export function pauseScreenshotEngine() {
  entitlementPaused = false;
  paused = true;
  targetNextCaptureTime = 0;
  writeSetting('capturePaused', 'true');
  clearCaptureTimer();
}

export async function resumeScreenshotEngine() {
  if (!getSession()) return;
  entitlementError = '';
  entitlementPaused = false;
  lastEntitlementCheck = 0;
  paused = false;
  writeSetting('capturePaused', 'false');
  const active = await ensureEntitlementActive();
  if (active) {
    scheduleNextCapture();
    startResilientUploadWorker();
  }
}

export function stopScreenshotEngine() {
  clearCaptureTimer();
  if (uploadTimer) clearInterval(uploadTimer);
  uploadTimer = null;
  targetNextCaptureTime = 0;
}

function clearCaptureTimer() {
  if (captureTimer) clearTimeout(captureTimer);
  captureTimer = null;
}

function scheduleNextCapture() {
  if (paused || !getSession()) return;
  clearCaptureTimer();
  const delay = currentIntervalSeconds * 1000;
  targetNextCaptureTime = Date.now() + delay;
  captureTimer = setTimeout(async () => {
    captureTimer = null;
    await captureDesktopNow();
    scheduleNextCapture();
  }, delay);
}

export async function captureDesktopNow(): Promise<{
  success: boolean;
  filePath?: string;
  error?: string;
}> {
  if (!getSession()) return { success: false, error: 'Sign in before capturing screenshots' };
  entitlementError = '';
  entitlementPaused = false;
  lastEntitlementCheck = 0;
  if (!(await ensureEntitlementActive())) {
    return {
      success: false,
      error: entitlementError || 'Company subscription or employee license is inactive',
    };
  }
  if (captureInProgress) return { success: false, error: 'A screenshot capture is already running' };
  captureInProgress = true;
  try {
    const now = new Date();
    const session = getSession();
    lastCaptureTime = now.getTime();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const storageDir = path.join(
      app.getPath('userData'),
      'screenshots',
      String(year),
      String(month).padStart(2, '0'),
      String(day).padStart(2, '0'),
      safeEmployeeFolder(session?.user?.username),
    );
    fs.mkdirSync(storageDir, { recursive: true });

    const fileName = `${now.toISOString().replace(/[-:T.Z]/g, '')}-${crypto.randomBytes(3).toString('hex')}.png`;
    const filePath = path.join(storageDir, fileName);
    const png = await capturePrimaryDisplayPng();
    await fs.promises.writeFile(filePath, png, { flag: 'wx' });
    const stats = fs.statSync(filePath);
    const queueId = `queue_${crypto.randomUUID()}`;
    getDb()
      .prepare(`
        INSERT INTO upload_queue (id, file_path, file_name, file_size, mime_type, captured_at, year, month, day, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        queueId,
        filePath,
        fileName,
        stats.size,
        'image/png',
        now.toISOString(),
        year,
        month,
        day,
        'PENDING',
        now.toISOString(),
      );

    if (readSetting('silentMode', 'true') !== 'true' && Notification.isSupported()) {
      new Notification({
        title: 'ScreenAdvait Desktop',
        body: `Desktop screenshot captured at ${now.toLocaleTimeString()}`,
        silent: true,
      }).show();
    }
    void processPendingUploads();
    return { success: true, filePath };
  } catch (error: any) {
    return { success: false, error: error.message || 'Screenshot capture failed' };
  } finally {
    captureInProgress = false;
  }
}

export function startResilientUploadWorker() {
  if (uploadTimer) return;
  getDb()
    .prepare("UPDATE upload_queue SET status = 'FAILED', error_message = ? WHERE status = 'UPLOADING'")
    .run('Recovered after application restart');
  getDb()
    .prepare(
      "UPDATE upload_queue SET status = 'PENDING', retry_count = 0, error_message = ? WHERE status = 'FAILED' AND retry_count >= 10",
    )
    .run('Retrying after application restart');
  void processPendingUploads();
  uploadTimer = setInterval(() => void processPendingUploads(), 15_000);
}

export async function processPendingUploads() {
  if (uploadInProgress || !getSession()) return;
  uploadInProgress = true;
  try {
    if (!(await ensureEntitlementActive())) return;
    if (isAccessTokenExpired() && !(await refreshAccessToken())) return;
    const session = getSession();
    if (!session) return;
    const items = getDb()
      .prepare(
        "SELECT * FROM upload_queue WHERE status IN ('PENDING', 'FAILED') AND retry_count < 10 ORDER BY created_at ASC LIMIT 5",
      )
      .all() as any[];

    for (const item of items) {
      if (!fs.existsSync(item.file_path)) {
        markFailed(item.id, 'Local screenshot file is missing');
        continue;
      }
      getDb().prepare('UPDATE upload_queue SET status = ? WHERE id = ?').run('UPLOADING', item.id);
      try {
        let response;
        try {
          response = await upload(item, getSession()!.accessToken);
        } catch (error: any) {
          if (error.response?.status !== 401 || !(await refreshAccessToken())) throw error;
          response = await upload(item, getSession()!.accessToken);
        }

        getDb().prepare('UPDATE upload_queue SET status = ?, error_message = ? WHERE id = ?').run(
          'COMPLETED',
          null,
          item.id,
        );
        getDb()
          .prepare(
            'INSERT INTO upload_logs (id, queue_id, file_name, uploaded_at, drive_file_id, status) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .run(
            `log_${crypto.randomUUID()}`,
            item.id,
            item.file_name,
            new Date().toISOString(),
            response.data.driveFileId,
            'SUCCESS',
          );
        apiConnected = true;
        if (readSetting('deleteAfterUpload', 'false') === 'true') fs.rmSync(item.file_path, { force: true });
      } catch (error: any) {
        apiConnected = Boolean(error.response) && error.response.status < 500;
        const message = error.response?.data?.message || error.message || 'Upload failed';
        if (error.response?.status === 403 && /subscription|license/i.test(message)) {
          blockForEntitlement(message);
        }
        markFailed(item.id, message);
      }
    }
  } finally {
    uploadInProgress = false;
  }
}

async function upload(item: any, token: string) {
  const fileBuffer = fs.readFileSync(item.file_path);
  const blob = new Blob([fileBuffer], { type: item.mime_type || 'image/png' });
  const form = new FormData();
  form.append('file', blob, item.file_name);
  form.append('deviceId', getDeviceDetails().deviceId);
  form.append('capturedAt', item.captured_at);
  form.append('idempotencyKey', item.id);
  form.append(
    'timezoneOffsetMinutes',
    String(-new Date(item.captured_at).getTimezoneOffset()),
  );
  return axios.post(`${getApiUrl()}/screenshots/upload`, form, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30_000,
    maxContentLength: 16 * 1024 * 1024,
    maxBodyLength: 16 * 1024 * 1024,
  });
}

async function refreshAccessToken() {
  const session = getSession();
  if (!session?.refreshToken) return false;
  try {
    const response = await axios.post(`${getApiUrl()}/auth/refresh`, {
      refreshToken: session.refreshToken,
    });
    updateSessionTokens(response.data.accessToken, response.data.refreshToken);
    apiConnected = true;
    return true;
  } catch (error: any) {
    apiConnected = false;
    const message = error.response?.data?.message || '';
    if (error.response?.status === 403 && /subscription|license/i.test(message)) {
      blockForEntitlement(message);
      return false;
    }
    clearSession();
    stopScreenshotEngine();
    return false;
  }
}

async function ensureEntitlementActive() {
  const session = getSession();
  if (!session) return false;

  const knownEndDate = session.licenseStatus?.effectiveExpiryDate
    || session.licenseStatus?.subscriptionEndDate
    || session.licenseStatus?.expiryDate;
  const CLOCK_SKEW_GRACE_MS = 12 * 60 * 60_000;
  if (knownEndDate && new Date(knownEndDate).getTime() + CLOCK_SKEW_GRACE_MS <= Date.now()) {
    if (!entitlementError) {
      blockForEntitlement('Company subscription or employee license has expired');
    }
  }
  if (entitlementError && Date.now() - lastEntitlementCheck < 30_000) return false;
  if (!entitlementError && Date.now() - lastEntitlementCheck < 60_000) return true;

  try {
    if (isAccessTokenExpired() && !(await refreshAccessToken())) return false;
    const current = getSession();
    if (!current) return false;
    const response = await axios.get(`${getApiUrl()}/licenses/current-status`, {
      headers: { Authorization: `Bearer ${current.accessToken}` },
      timeout: 8_000,
    });
    lastEntitlementCheck = Date.now();
    apiConnected = true;
    updateSessionLicenseStatus(response.data);
    if (!response.data.active) {
      blockForEntitlement(response.data.message || 'Company subscription or employee license is inactive');
      return false;
    }
    entitlementError = '';
    if (entitlementPaused) {
      entitlementPaused = false;
      paused = false;
      writeSetting('capturePaused', 'false');
      scheduleNextCapture();
    }
    return true;
  } catch (error: any) {
    lastEntitlementCheck = Date.now();
    if (error.response) {
      apiConnected = error.response.status < 500;
      const message = error.response?.data?.message || 'License validation failed';
      if (error.response.status === 401) {
        clearSession();
        stopScreenshotEngine();
      } else if (error.response.status === 403) {
        blockForEntitlement(message);
      }
      return false;
    }
    apiConnected = false;
    // Offline captures remain queued as long as the last known expiry is still valid.
    return true;
  }
}

function blockForEntitlement(message: string) {
  entitlementError = message;
  entitlementPaused = true;
  paused = true;
  targetNextCaptureTime = 0;
  clearCaptureTimer();
  writeSetting('capturePaused', 'true');
}

function markFailed(id: string, message: string) {
  getDb()
    .prepare(
      'UPDATE upload_queue SET status = ?, retry_count = retry_count + 1, error_message = ? WHERE id = ?',
    )
    .run('FAILED', message.slice(0, 500), id);
}

function writeSetting(key: string, value: string) {
  getDb().prepare('INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)').run(key, value);
}
