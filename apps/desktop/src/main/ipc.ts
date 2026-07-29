import { app, ipcMain, IpcMainInvokeEvent, nativeImage } from 'electron';
import fs from 'fs';
import axios from 'axios';
import { IPC_CHANNELS } from '@screenadvait/shared-types';
import { getDb } from './sqlite.store.js';
import {
  captureDesktopNow,
  getEngineStatus,
  pauseScreenshotEngine,
  resumeScreenshotEngine,
  startScreenshotEngine,
  stopScreenshotEngine,
} from './screenshot.engine.js';
import { getDeviceDetails } from './device.js';
import { clearSession, getSession, setSession } from './session.store.js';
import {
  getLoginHint,
  getRememberedLicense,
  rememberLicense,
} from './license.store.js';

export function getApiUrl(): string {
  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM local_settings WHERE key = ?').get('serverUrl') as
      | { value: string }
      | undefined;
    if (row?.value?.trim()) {
      let url = row.value.trim().replace(/\/+$/, '');
      if (!url.endsWith('/api/v1')) {
        if (url.endsWith('/api')) {
          url = `${url}/v1`;
        } else {
          url = `${url}/api/v1`;
        }
      }
      return url;
    }
  } catch (e) {
    // Fallback if db is uninitialized
  }
  return process.env.SCREENADVAIT_API_URL || 'http://localhost:5000/api/v1';
}

const SETTINGS = new Set([
  'screenshotInterval',
  'imageFormat',
  'autoStart',
  'silentMode',
  'deleteAfterUpload',
  'serverUrl',
]);

export function registerIpcHandlers() {
  const db = getDb();

  secureHandle(IPC_CHANNELS.GET_SERVER_URL, async () => {
    const row = db.prepare('SELECT value FROM local_settings WHERE key = ?').get('serverUrl') as
      | { value: string }
      | undefined;
    const rawSetting = row?.value || '';
    const apiUrl = getApiUrl();
    return {
      apiUrl,
      rawSetting,
      isDefault: !rawSetting.trim(),
    };
  });

  secureHandle(IPC_CHANNELS.SAVE_SERVER_URL, async (rawUrl: string) => {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) {
      db.prepare('DELETE FROM local_settings WHERE key = ?').run('serverUrl');
      return { success: true, apiUrl: getApiUrl() };
    }

    let formatted = trimmed.replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `http://${formatted}`;
    }
    let targetApiUrl = formatted;
    if (!targetApiUrl.endsWith('/api/v1')) {
      if (targetApiUrl.endsWith('/api')) {
        targetApiUrl = `${targetApiUrl}/v1`;
      } else {
        targetApiUrl = `${targetApiUrl}/api/v1`;
      }
    }

    try {
      await axios.get(`${targetApiUrl}/health`, { timeout: 5000 });
    } catch (err: any) {
      return {
        success: false,
        apiUrl: targetApiUrl,
        error: `Could not connect to server at ${targetApiUrl}. Verify IP address and port 5000.`,
      };
    }

    db.prepare('INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)').run('serverUrl', formatted);
    return { success: true, apiUrl: targetApiUrl };
  });

  secureHandle(
    IPC_CHANNELS.LOGIN,
    async (payload: { username: string; password: string; licenseKey?: string; rememberMe?: boolean }) => {
      const submittedLicense = payload.licenseKey?.trim().toUpperCase() || '';
      const rememberedLicense = submittedLicense
        ? null
        : getRememberedLicense(payload.username);
      const effectiveLicense = submittedLicense || rememberedLicense;
      if (!effectiveLicense) {
        return {
          success: false,
          error: 'Enter the license key for this username on its first activation.',
          savedLicenseUsed: false,
        };
      }
      try {
        const device = getDeviceDetails();
        const currentApiUrl = getApiUrl();
        const response = await axios.post(`${currentApiUrl}/auth/login`, {
          ...payload,
          licenseKey: effectiveLicense,
          deviceId: device.deviceId,
          machineGuid: device.machineGuid,
          os: device.os,
          computerName: device.computerName,
        }, { timeout: 15_000 });
        setSession(response.data, payload.rememberMe ?? true);
        rememberLicense(payload.username, effectiveLicense);
        db.prepare(
          "UPDATE upload_queue SET status = ?, retry_count = 0, error_message = ? WHERE status = 'FAILED'",
        ).run('PENDING', null);
        startScreenshotEngine(true);
        return { success: true, data: response.data };
      } catch (error: any) {
        if (axios.isAxiosError(error) && !error.response) {
          return {
            success: false,
            error: `Cannot connect to server at ${getApiUrl()}. Please check that Laptop #2 is on the same Wi-Fi and verify the Server IP in Server Settings.`,
          };
        }
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return {
            success: false,
            error: 'The username, password, or license key is incorrect.',
            savedLicenseUsed: Boolean(rememberedLicense),
          };
        }
        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Login failed',
        };
      }
    },
  );

  secureHandle(IPC_CHANNELS.GET_SESSION, async () => {
    const session = getSession();
    const username = session?.user?.username;
    const licenseKey = session?.licenseStatus?.key;
    if (username && licenseKey) rememberLicense(username, licenseKey);
    return session;
  });

  secureHandle(IPC_CHANNELS.GET_LOGIN_HINT, async (username?: string) =>
    getLoginHint(typeof username === 'string' ? username.slice(0, 100) : undefined),
  );

  secureHandle(IPC_CHANNELS.LOGOUT, async () => {
    const session = getSession();
    if (session?.user?.username && session?.licenseStatus?.key) {
      rememberLicense(session.user.username, session.licenseStatus.key);
    }
    clearSession();
    stopScreenshotEngine();
    return { success: true };
  });

  secureHandle(IPC_CHANNELS.TRIGGER_CAPTURE, async () => captureDesktopNow());

  secureHandle(IPC_CHANNELS.GET_SETTINGS, async () => {
    const rows = db.prepare('SELECT key, value FROM local_settings').all() as Array<{
      key: string;
      value: string;
    }>;
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  });

  secureHandle(IPC_CHANNELS.UPDATE_SETTINGS, async (settings: Record<string, string>) => {
    const status = getEngineStatus();
    if (status.entitlementError || (status.isPaused && status.entitlementError)) {
      return {
        success: false,
        error: status.entitlementError || 'Settings cannot be modified while your company subscription or license is SUSPENDED.',
      };
    }
    const statement = db.prepare('INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(settings)) {
      if (!SETTINGS.has(key)) continue;
      if (key === 'screenshotInterval' && ![10, 30, 60, 300, 600, 900, 1800, 3600].includes(Number(value))) {
        throw new Error('Unsupported screenshot interval');
      }
      if (key === 'imageFormat' && value !== 'PNG') throw new Error('Only PNG capture is supported');
      statement.run(key, String(value));
    }
    if ('autoStart' in settings) {
      app.setLoginItemSettings({ openAtLogin: String(settings.autoStart) === 'true' });
    }
    if (settings.screenshotInterval) startScreenshotEngine(true);
    return { success: true };
  });

  secureHandle(IPC_CHANNELS.GET_QUEUE_STATUS, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      pendingCount: (db.prepare("SELECT COUNT(*) as count FROM upload_queue WHERE status = 'PENDING'").get() as any).count,
      completedCount: (db.prepare("SELECT COUNT(*) as count FROM upload_queue WHERE status = 'COMPLETED'").get() as any).count,
      failedCount: (db.prepare("SELECT COUNT(*) as count FROM upload_queue WHERE status = 'FAILED'").get() as any).count,
      todayCount: (db.prepare('SELECT COUNT(*) as count FROM upload_queue WHERE captured_at >= ?').get(today.toISOString()) as any).count,
      storageBytes: (db.prepare('SELECT COALESCE(SUM(file_size), 0) as total FROM upload_queue').get() as any).total,
      recentQueue: db.prepare('SELECT * FROM upload_queue ORDER BY created_at DESC LIMIT 20').all(),
    };
  });

  secureHandle(IPC_CHANNELS.GET_GALLERY_SCREENSHOTS, async () => {
    const rows = db
      .prepare('SELECT * FROM upload_queue ORDER BY captured_at DESC LIMIT 2000')
      .all() as any[];
    return rows.map(({ file_path: _filePath, ...row }) => row);
  });

  secureHandle(IPC_CHANNELS.GET_ENGINE_STATUS, async () => {
    let apiConnected = false;
    try {
      await axios.get(`${getApiUrl()}/health`, { timeout: 2_000 });
      apiConnected = true;
    } catch {
      apiConnected = false;
    }
    return { ...getEngineStatus(), apiConnected };
  });

  secureHandle(IPC_CHANNELS.GET_SCREENSHOT_PREVIEW, async (id: string) => {
    if (!/^queue_[a-f0-9-]+$/i.test(id)) return null;
    const row = db.prepare('SELECT file_path, mime_type FROM upload_queue WHERE id = ?').get(id) as
      | { file_path: string; mime_type: string }
      | undefined;
    if (!row || !fs.existsSync(row.file_path)) return null;
    const buffer = fs.readFileSync(row.file_path);
    if (buffer.length > 15 * 1024 * 1024) return null;
    return `data:${row.mime_type};base64,${buffer.toString('base64')}`;
  });

  secureHandle(IPC_CHANNELS.GET_SCREENSHOT_THUMBNAIL, async (id: string) => {
    if (!/^queue_[a-f0-9-]+$/i.test(id)) return null;
    const row = db.prepare('SELECT file_path FROM upload_queue WHERE id = ?').get(id) as
      | { file_path: string }
      | undefined;
    if (!row || !fs.existsSync(row.file_path)) return null;
    const thumbnail = await nativeImage.createThumbnailFromPath(row.file_path, {
      width: 320,
      height: 180,
    });
    return thumbnail.isEmpty() ? null : thumbnail.toDataURL();
  });

  secureHandle(IPC_CHANNELS.PAUSE_SERVICE, async () => {
    pauseScreenshotEngine();
    return getEngineStatus();
  });
  secureHandle(IPC_CHANNELS.RESUME_SERVICE, async () => {
    resumeScreenshotEngine();
    return getEngineStatus();
  });
  secureHandle(IPC_CHANNELS.VERIFY_LICENSE, async (key: string) => {
    const device = getDeviceDetails();
    const response = await axios.post(`${getApiUrl()}/licenses/verify`, {
      licenseKey: key,
      deviceId: device.deviceId,
      machineGuid: device.machineGuid,
    });
    return response.data;
  });
  secureHandle(IPC_CHANNELS.TOGGLE_AUTOSTART, async (enable: boolean) => {
    app.setLoginItemSettings({ openAtLogin: Boolean(enable) });
    db.prepare('INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)').run('autoStart', String(enable));
    return { success: true };
  });
  secureHandle(IPC_CHANNELS.MINIMIZE_TO_TRAY, async () => {
    return { success: true };
  });
  secureHandle(IPC_CHANNELS.GET_APP_VERSION, async () => app.getVersion());
}

function secureHandle(channel: string, handler: (...args: any[]) => any) {
  ipcMain.handle(channel, (event, ...args) => {
    validateSender(event);
    return handler(...args);
  });
}

function validateSender(event: IpcMainInvokeEvent) {
  const rawUrl = event.senderFrame?.url || event.sender.getURL();
  const url = new URL(rawUrl);
  const trustedFile = url.protocol === 'file:';
  const trustedDev = url.protocol === 'http:' && url.hostname === 'localhost' && url.port === '3000';
  if (!trustedFile && !trustedDev) throw new Error('Untrusted IPC sender');
}
