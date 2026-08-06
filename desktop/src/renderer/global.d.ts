export {};

declare global {
  interface Window {
    electronAPI: {
      login: (credentials: { username: string; password: string; licenseKey?: string; rememberMe?: boolean }) => Promise<{ success: boolean; data?: any; error?: string; savedLicenseUsed?: boolean }>;
      logout: () => Promise<{ success: boolean }>;
      getSession: () => Promise<any>;
      getLoginHint: (username?: string) => Promise<{
        username: string;
        hasRememberedLicense: boolean;
        encryptionAvailable: boolean;
      }>;
      triggerCapture: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
      getSettings: () => Promise<Record<string, string>>;
      updateSettings: (settings: Record<string, string>) => Promise<{ success: boolean }>;
      getQueueStatus: () => Promise<{
        pendingCount: number;
        completedCount: number;
        failedCount: number;
        todayCount: number;
        storageBytes: number;
        recentQueue: any[];
      }>;
      getGalleryScreenshots: () => Promise<any[]>;
      getEngineStatus: () => Promise<{
        isRunning: boolean;
        isPaused: boolean;
        isCapturing: boolean;
        apiConnected: boolean;
        entitlementError: string;
        intervalSeconds: number;
        intervalMinutes: number;
        nextCaptureTimestamp: number;
        lastCaptureTimestamp: number;
      }>;
      getScreenshotThumbnail: (id: string) => Promise<string | null>;
      getScreenshotPreview: (id: string) => Promise<string | null>;
      pauseService: () => Promise<any>;
      resumeService: () => Promise<any>;
      getAppVersion: () => Promise<string>;
      getServerUrl: () => Promise<{ apiUrl: string; rawSetting: string; isDefault: boolean }>;
      saveServerUrl: (url: string) => Promise<{ success: boolean; apiUrl: string; error?: string }>;
    };
  }
}
