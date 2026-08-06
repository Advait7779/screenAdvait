import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import {
  captureDesktopNow,
  getEngineStatus,
  pauseScreenshotEngine,
  resumeScreenshotEngine,
} from './screenshot.engine.js';

let tray: Tray | null = null;

export function createSystemTray(mainWindow: BrowserWindow): Tray {
  let icon = nativeImage.createFromPath(path.join(__dirname, '../../public/icon.ico'));
  if (icon.isEmpty()) icon = nativeImage.createFromPath(path.join(__dirname, '../../public/logo.png'));
  tray = new Tray(icon);

  tray.setToolTip('ScreenAdvait Enterprise Screenshot Platform');

  const updateMenu = () => {
    const isPaused = getEngineStatus().isPaused;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'ScreenAdvait Platform',
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
      {
        label: isPaused ? 'Resume Screenshot Engine' : 'Pause Screenshot Engine',
        click: () => {
          if (isPaused) {
            resumeScreenshotEngine();
          } else {
            pauseScreenshotEngine();
          }
          updateMenu();
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

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}
