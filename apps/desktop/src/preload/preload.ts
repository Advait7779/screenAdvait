import { contextBridge, ipcRenderer } from 'electron';

// Sandboxed Electron preload scripts cannot require arbitrary node_modules.
// Keep these literal channel names aligned with packages/shared-types/src/ipc.ts.
const IPC_CHANNELS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  GET_SESSION: 'auth:get-session',
  GET_LOGIN_HINT: 'auth:get-login-hint',
  TRIGGER_CAPTURE: 'screenshot:trigger',
  GET_SETTINGS: 'screenshot:get-settings',
  UPDATE_SETTINGS: 'screenshot:update-settings',
  GET_QUEUE_STATUS: 'screenshot:get-queue-status',
  GET_GALLERY_SCREENSHOTS: 'screenshot:get-gallery',
  GET_ENGINE_STATUS: 'screenshot:get-engine-status',
  GET_SCREENSHOT_THUMBNAIL: 'screenshot:get-thumbnail',
  GET_SCREENSHOT_PREVIEW: 'screenshot:get-preview',
  PAUSE_SERVICE: 'screenshot:pause',
  RESUME_SERVICE: 'screenshot:resume',
  VERIFY_LICENSE: 'license:verify',
  TOGGLE_AUTOSTART: 'system:autostart',
  MINIMIZE_TO_TRAY: 'system:minimize-to-tray',
  GET_APP_VERSION: 'system:get-version',
  GET_SERVER_URL: 'server:get-url',
  SAVE_SERVER_URL: 'server:save-url',
} as const;

contextBridge.exposeInMainWorld('electronAPI', {
  login: (credentials: any) => ipcRenderer.invoke(IPC_CHANNELS.LOGIN, credentials),
  logout: () => ipcRenderer.invoke(IPC_CHANNELS.LOGOUT),
  getSession: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SESSION),
  getLoginHint: (username?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_LOGIN_HINT, username),
  triggerCapture: () => ipcRenderer.invoke(IPC_CHANNELS.TRIGGER_CAPTURE),
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  updateSettings: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SETTINGS, settings),
  getQueueStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_QUEUE_STATUS),
  getGalleryScreenshots: () => ipcRenderer.invoke(IPC_CHANNELS.GET_GALLERY_SCREENSHOTS),
  getEngineStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_ENGINE_STATUS),
  getScreenshotThumbnail: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_SCREENSHOT_THUMBNAIL, id),
  getScreenshotPreview: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_SCREENSHOT_PREVIEW, id),
  pauseService: () => ipcRenderer.invoke(IPC_CHANNELS.PAUSE_SERVICE),
  resumeService: () => ipcRenderer.invoke(IPC_CHANNELS.RESUME_SERVICE),
  verifyLicense: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.VERIFY_LICENSE, key),
  toggleAutostart: (enable: boolean) => ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_AUTOSTART, enable),
  minimizeToTray: () => ipcRenderer.invoke(IPC_CHANNELS.MINIMIZE_TO_TRAY),
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_VERSION),
  getServerUrl: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SERVER_URL),
  saveServerUrl: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_SERVER_URL, url),
});
