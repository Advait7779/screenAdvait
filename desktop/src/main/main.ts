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

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  Menu.setApplicationMenu(null);

  const window = new BrowserWindow({
    width: 1150,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    autoHideMenuBar: true,
    show: false,
    title: 'ScreenAdvait Enterprise Desktop Client',
    icon: path.join(__dirname, '../../public/logo.png'),
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow = window;

  window.setMenu(null);

  const rendererHtml = path.join(__dirname, '../renderer/index.html');
  const fileUrl = pathToFileURL(rendererHtml).toString();

  const devServerUrl = process.env.SCREENADVAIT_RENDERER_URL;
  if (devServerUrl && !app.isPackaged) {
    window.loadURL(devServerUrl);
  } else if (fs.existsSync(rendererHtml)) {
    console.log(`[Main] Loading renderer from file URL: ${fileUrl}`);
    window.loadURL(fileUrl);
  } else {
    console.log('[Main] Loading renderer from dev server: http://localhost:3000');
    window.loadURL('http://localhost:3000');
  }

  let hasShown = false;
  const showWindow = () => {
    if (hasShown || window.isDestroyed()) return;
    hasShown = true;
    window.show();
    window.focus();
    window.setAlwaysOnTop(true);
    setTimeout(() => {
      if (!window.isDestroyed()) window.setAlwaysOnTop(false);
    }, 800);
  };

  window.once('ready-to-show', showWindow);
  window.webContents.once('did-finish-load', showWindow);
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Main] Renderer failed to load (${errorCode}): ${errorDescription}`);
    showWindow();
  });
  setTimeout(showWindow, 3000);

  let recoveryAttempts = 0;
  let recoveryResetTimer: NodeJS.Timeout | null = null;
  const recoverRenderer = (reason: string) => {
    if (window.isDestroyed() || recoveryAttempts >= 1) return;
    recoveryAttempts += 1;
    console.error(`[Main] Recovering renderer after ${reason}`);
    setTimeout(() => {
      if (!window.isDestroyed()) window.webContents.reloadIgnoringCache();
    }, 250);
  };

  window.webContents.on('unresponsive', () => recoverRenderer('it became unresponsive'));
  window.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason !== 'clean-exit') {
      recoverRenderer(`the process exited (${details.reason})`);
    }
  });
  window.webContents.on('did-finish-load', () => {
    if (recoveryResetTimer) clearTimeout(recoveryResetTimer);
    recoveryResetTimer = setTimeout(() => {
      recoveryAttempts = 0;
      recoveryResetTimer = null;
    }, 30_000);
  });
  window.on('closed', () => {
    if (recoveryResetTimer) clearTimeout(recoveryResetTimer);
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    const current = window.webContents.getURL().split('#')[0];
    if (current && url.split('#')[0] !== current) event.preventDefault();
  });

  window.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === 'r') {
      event.preventDefault();
      window.reload();
    }
  });

  // Minimize to tray on close
  window.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    const db = initSqliteDb();
    const autoStart = db.prepare('SELECT value FROM local_settings WHERE key = ?').get('autoStart') as
      | { value: string }
      | undefined;
    if (app.isPackaged) {
      app.setLoginItemSettings({ openAtLogin: autoStart?.value !== 'false' });
    }
    startRetentionCleanupWorker();
    registerIpcHandlers();

    createWindow();
    if (mainWindow) {
      createSystemTray(mainWindow);
    }

    const session = initializeSession();
    const pauseSetting = db.prepare('SELECT value FROM local_settings WHERE key = ?').get('capturePaused') as { value: string } | undefined;
    if (session && pauseSetting?.value !== 'true') {
      startScreenshotEngine();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('before-quit', () => {
  (app as any).isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in system tray
  }
});
