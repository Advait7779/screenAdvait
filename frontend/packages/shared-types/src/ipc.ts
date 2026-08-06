export const IPC_CHANNELS = {
  // Auth
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  GET_SESSION: 'auth:get-session',
  GET_LOGIN_HINT: 'auth:get-login-hint',

  // Screenshot Engine
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

  // License & Device
  VERIFY_LICENSE: 'license:verify',

  // System & Tray
  TOGGLE_AUTOSTART: 'system:autostart',
  MINIMIZE_TO_TRAY: 'system:minimize-to-tray',
  GET_APP_VERSION: 'system:get-version',

  // Server Config
  GET_SERVER_URL: 'server:get-url',
  SAVE_SERVER_URL: 'server:save-url',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
