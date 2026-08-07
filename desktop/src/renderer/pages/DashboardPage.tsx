import React, { useState, useEffect, useRef } from 'react';
import { Camera, CloudUpload, Clock, HardDrive, CheckCircle2, RefreshCw, Timer, Shield } from 'lucide-react';

interface DashboardPageProps {
  session: any;
  addToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (path: '/gallery') => void;
}

let cachedQueueStatus: any = { pendingCount: 0, completedCount: 0, failedCount: 0, todayCount: 0, storageBytes: 0, recentQueue: [] };
let cachedEngineStatus: any = { isRunning: false, isPaused: false, isCapturing: false, apiConnected: false, entitlementError: '', intervalSeconds: 300, nextCaptureTimestamp: 0, lastCaptureTimestamp: 0 };

function calculateCountdownText(engineStatus: any): string {
  if (engineStatus.isPaused) return 'Paused';
  if (engineStatus.isCapturing) return 'Capturing...';
  if (!engineStatus.nextCaptureTimestamp) return '--:--';

  const diffSec = Math.max(0, Math.ceil((engineStatus.nextCaptureTimestamp - Date.now()) / 1000));
  if (diffSec <= 0) return '00:00 (Capturing...)';

  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ session, addToast, onNavigate }) => {
  const [queueStatus, setQueueStatus] = useState<any>(cachedQueueStatus);
  const [engineStatus, setEngineStatus] = useState<any>(cachedEngineStatus);
  const [countdownText, setCountdownText] = useState<string>(() => calculateCountdownText(cachedEngineStatus));
  const [capturing, setCapturing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [captureError, setCaptureError] = useState(false);
  const [recentLimit, setRecentLimit] = useState(4);
  const recentListRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    if (window.electronAPI) {
      try {
        const [queueRes, engineRes] = await Promise.all([
          window.electronAPI.getQueueStatus(),
          window.electronAPI.getEngineStatus(),
        ]);
        cachedQueueStatus = queueRes;
        cachedEngineStatus = engineRes;
        setQueueStatus(queueRes);
        setEngineStatus(engineRes);
        setCountdownText(calculateCountdownText(engineRes));
      } catch {
        setEngineStatus((current: any) => ({ ...current, apiConnected: false }));
      }
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!recentListRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setRecentLimit(Math.max(1, Math.floor(entry.contentRect.height / 53)));
    });
    observer.observe(recentListRef.current);
    return () => observer.disconnect();
  }, []);

  // Continuous ticking clock that calculates remaining time synchronously
  useEffect(() => {
    const updateClock = () => {
      setCountdownText(calculateCountdownText(engineStatus));
    };

    updateClock();
    const timer = setInterval(updateClock, 500);
    return () => clearInterval(timer);
  }, [engineStatus]);

  const handleCaptureNow = async () => {
    setCapturing(true);
    setToastMessage('');
    setCaptureError(false);
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.triggerCapture();
        if (res.success) {
          addToast?.('Desktop screenshot captured & queued for upload!', 'success');
          fetchStatus();
        } else {
          setCaptureError(true);
          addToast?.(`Capture failed: ${res.error}`, 'error');
        }
      } else {
        setCaptureError(true);
        addToast?.('Capture is only available in the desktop application.', 'error');
      }
    } catch (err: any) {
      setCaptureError(true);
      addToast?.(err.message, 'error');
    } finally {
      setCapturing(false);
    }
  };

  const user = session?.user || { fullName: 'Employee', role: 'EMPLOYEE' };
  const company = session?.company || { name: 'Demo Enterprise Inc.' };
  const intervalDisplay = (engineStatus.intervalSeconds || 300) < 60 
    ? `${engineStatus.intervalSeconds} sec` 
    : `${Math.round((engineStatus.intervalSeconds || 300) / 60)} min`;

  return (
    <div className="h-full min-h-0 flex flex-col gap-5 page-fade-in overflow-hidden">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Welcome, {user.fullName}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {company.name} &bull;{' '}
            <span className={engineStatus.isRunning ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>
              {engineStatus.isRunning ? '● Background Capture Engine Active' : '● Background Capture Engine Paused'}
            </span>{' '}
            &bull; <span className={engineStatus.apiConnected ? 'text-green-700' : 'text-red-600'}>
              API {engineStatus.apiConnected ? 'Connected' : 'Offline'}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live Countdown Badge */}
          <div className="bg-green-50 border border-green-200 px-3.5 py-2 rounded-md flex items-center space-x-2 text-green-900 shadow-xs">
            <Timer className="w-4 h-4 text-green-700 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="text-xs font-semibold">
              <span className="text-gray-600">Next Capture: </span>
              <span className="font-mono text-sm font-black text-green-950 ml-1">{countdownText}</span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-md flex items-center space-x-2 text-gray-600">
            <Shield className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium">Managed by Admin</span>
          </div>

          <button
            onClick={handleCaptureNow}
            disabled={capturing || Boolean(engineStatus.entitlementError)}
            style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}
            className="hover:opacity-90 active:scale-98 text-white px-4 py-2 rounded-md font-medium text-xs shadow-sm flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {capturing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <span>Capture Desktop Now</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className={`p-3.5 rounded-md border text-xs flex items-center space-x-2 scale-in ${
          captureError
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-green-50 border-green-200 text-green-900'
        }`}>
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${captureError ? 'text-red-600' : 'text-green-700'}`} />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {engineStatus.entitlementError && (
        <div className="p-3.5 rounded-md border border-red-200 bg-red-50 text-red-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-medium">
            Capture paused: {engineStatus.entitlementError}. Ask your company administrator to contact the superadmin.
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Today's Captures</span>
            <Camera className="w-4 h-4 text-green-700" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{queueStatus.todayCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">
            Interval: <span className="text-green-800 font-bold">{intervalDisplay} automatic</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Successfully Uploaded</span>
            <CloudUpload className="w-4 h-4 text-green-700" />
          </div>
          <div className="text-2xl font-bold text-green-800">{queueStatus.completedCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {queueStatus.pendingCount > 0 ? `${queueStatus.pendingCount} pending in queue` : 'All queued files uploaded'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Live Countdown</span>
            <Clock className="w-4 h-4 text-green-800" />
          </div>
          <div className="text-2xl font-bold text-green-900 font-mono tracking-wide">{countdownText}</div>
          <div className="text-xs text-gray-500 mt-1">Every {intervalDisplay}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Storage Usage</span>
            <HardDrive className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{(queueStatus.storageBytes / 1024 / 1024).toFixed(1)} MB</div>
          <div className="text-xs text-gray-500 mt-1">Quota: {Math.round((session?.company?.maxStorageMb || 0) / 1024)} GB Allocated</div>
        </div>
      </div>

      {/* Recent Captures List */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-base font-bold text-gray-900">Recent Desktop Screenshots</h3>
          <button
            type="button"
            onClick={() => onNavigate?.('/gallery')}
            className="text-xs font-semibold text-green-800 hover:text-green-950"
          >
            View the full day in Gallery →
          </button>
        </div>
        {queueStatus.recentQueue && queueStatus.recentQueue.length > 0 ? (
          <div ref={recentListRef} className="divide-y divide-gray-100 flex-1 min-h-0 overflow-hidden">
            {queueStatus.recentQueue.slice(0, recentLimit).map((item: any) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-gray-50 px-2 rounded-md transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-md bg-green-50 text-green-800 border border-green-100">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-mono text-gray-800 font-medium">{item.file_name}</div>
                    <div className="text-xs text-gray-400">{new Date(item.captured_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500 font-mono">{(item.file_size / 1024).toFixed(1)} KB</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.status === 'COMPLETED'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div ref={recentListRef} className="flex-1 min-h-0 flex items-center justify-center text-center text-gray-400 text-xs">
            No screenshots captured yet. Click "Capture Desktop Now" above.
          </div>
        )}
      </div>
    </div>
  );
};
