import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { initSqliteDb } from './sqlite.store.js';
import { registerIpcHandlers } from './ipc.js';
import { createSystemTray } from './tray.js';
import { startScreenshotEngine } from './screenshot.engine.js';
import { initializeSession } from './session.store.js';
import { startRetentionCleanupWorker } from './retention.js';

function logCrash(type: string, error: any) {
  try {
    const userData = app.getPath('userData');
    if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true });
    const logPath = path.join(userData, 'crash_log.txt');
    const msg = `[${new Date().toISOString()}] ${type}: ${error?.stack || error?.message || error}\n`;
    fs.appendFileSync(logPath, msg);
    console.error(msg);
  } catch {}
}

process.on('uncaughtException', (error) => logCrash('UNCAUGHT_EXCEPTION', error));
process.on('unhandledRejection', (reason) => logCrash('UNHANDLED_REJECTION', reason));

let mainWindow: BrowserWindow | null = null;

// Enforce single instance lock: if another instance is running, exit immediately
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.warn('[Main] Another instance is already running. Quitting duplicate instance.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  function createWindow() {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        return;
      }

      const isHiddenStart =
        process.argv.includes('--hidden') ||
        app.getLoginItemSettings().wasOpenedAtLogin;

      const window = new BrowserWindow({
        width: 1150,
        height: 750,
        minWidth: 900,
        minHeight: 600,
        frame: true,
        autoHideMenuBar: true,
        show: !isHiddenStart,
        title: 'ScreenAdvait Enterprise Desktop Client',
        backgroundColor: '#f8fafc',
        webPreferences: {
          preload: path.join(__dirname, '../preload/preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
          webSecurity: false,
        },
      });
      mainWindow = window;

      window.setMenu(null);

      const rendererHtml = path.join(__dirname, '../renderer/index.html');
      const fileUrl = pathToFileURL(rendererHtml).toString();

      console.log(`[Main] Loading renderer HTML: ${rendererHtml} (exists: ${fs.existsSync(rendererHtml)})`);

      if (fs.existsSync(rendererHtml)) {
        window.loadURL(fileUrl);
      } else {
        console.log('[Main] Loading renderer fallback: http://localhost:3000');
        window.loadURL('http://localhost:3000');
      }

      if (!isHiddenStart) {
        window.show();
        window.focus();
      }

      window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        logCrash('DID_FAIL_LOAD', `Code: ${errorCode}, Description: ${errorDescription}`);
        window.show();
      });

      window.webContents.on('render-process-gone', (_event, details) => {
        logCrash('RENDER_PROCESS_GONE', `Reason: ${details.reason}, exitCode: ${details.exitCode}`);
      });

      window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      window.webContents.on('will-navigate', (event, url) => {
        const current = window.webContents.getURL().split('#')[0];
        if (current && url.split('#')[0] !== current) event.preventDefault();
      });

      window.on('close', (event) => {
        if (!(app as any).isQuitting) {
          event.preventDefault();
          window.hide();
        }
      });
    } catch (err) {
      logCrash('CREATE_WINDOW_ERROR', err);
    }
  }

  app.whenReady().then(() => {
    try {
      const db = initSqliteDb();
      const autoStart = db.prepare('SELECT value FROM local_settings WHERE key = ?').get('autoStart') as
        | { value: string }
        | undefined;
      if (app.isPackaged) {
        app.setLoginItemSettings({
          openAtLogin: autoStart?.value !== 'false',
          args: ['--hidden'],
        });
      }
      startRetentionCleanupWorker();
      registerIpcHandlers();
    } catch (err) {
      logCrash('INIT_ERROR', err);
    }

    createWindow();
    if (mainWindow) {
      try {
        createSystemTray(mainWindow);
      } catch (err) {
        logCrash('SYSTEM_TRAY_ERROR', err);
      }
    }

    try {
      const session = initializeSession();
      const db = initSqliteDb();
      const pauseSetting = db.prepare('SELECT value FROM local_settings WHERE key = ?').get('capturePaused') as { value: string } | undefined;
      if (session && pauseSetting?.value !== 'true') {
        startScreenshotEngine();
      }
    } catch (err) {
      logCrash('ENGINE_INIT_ERROR', err);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  });

  app.on('before-quit', () => {
    (app as any).isQuitting = true;
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      // Keep running in system tray
    }
  });
}
