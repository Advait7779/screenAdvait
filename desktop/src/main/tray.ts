import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import {
  captureDesktopNow,
  getEngineStatus,
} from './screenshot.engine.js';

let tray: Tray | null = null;

export function createSystemTray(mainWindow: BrowserWindow): Tray {
  let icon = nativeImage.createFromPath(path.join(__dirname, '../../public/icon.ico'));
  if (icon.isEmpty()) icon = nativeImage.createFromPath(path.join(__dirname, '../../public/logo.png'));
  tray = new Tray(icon);

  tray.setToolTip('ScreenAdvait Enterprise Screenshot Platform');

  const updateMenu = () => {
    const status = getEngineStatus();
    const intervalLabel = status.intervalSeconds < 60
      ? `${status.intervalSeconds} sec`
      : `${Math.round(status.intervalSeconds / 60)} min`;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'ScreenAdvait Platform',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: `Capture Interval: ${intervalLabel} (Managed by Admin)`,
        enabled: false,
      },
      {
        label: status.isPaused ? '⏸ Capture Paused by Admin' : '● Capture Active',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Open Dashboard',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: 'Capture Screenshot Now',
        click: async () => {
          await captureDesktopNow();
        },
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray?.setContextMenu(contextMenu);
  };

  updateMenu();
  // Refresh tray menu every 30 seconds to reflect admin changes
  setInterval(updateMenu, 30_000);

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}
