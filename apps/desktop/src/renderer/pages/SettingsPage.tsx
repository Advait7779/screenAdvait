import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronDown, Save, Trash2, Zap } from 'lucide-react';

const intervalOptions = [
  { value: '10', label: 'Every 10 Seconds', detail: 'Fastest testing mode', fast: true },
  { value: '30', label: 'Every 30 Seconds', detail: 'Fast testing mode', fast: true },
  { value: '60', label: 'Every 1 Minute' },
  { value: '300', label: 'Every 5 Minutes', detail: 'Standard default' },
  { value: '600', label: 'Every 10 Minutes' },
  { value: '900', label: 'Every 15 Minutes' },
  { value: '1800', label: 'Every 30 Minutes' },
  { value: '3600', label: 'Every 1 Hour' },
];

interface SettingsPageProps {
  addToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ addToast }) => {
  const [interval, setIntervalVal] = useState('300');
  const [autoStart, setAutoStart] = useState(true);
  const [silentMode, setSilentMode] = useState(true);
  const [deleteAfterUpload, setDeleteAfterUpload] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [entitlementError, setEntitlementError] = useState('');
  const [intervalMenuOpen, setIntervalMenuOpen] = useState(false);
  const intervalMenuRef = useRef<HTMLDivElement>(null);

  const isSuspended = Boolean(entitlementError);

  const selectedInterval = useMemo(
    () => intervalOptions.find((option) => option.value === interval) || intervalOptions[3],
    [interval],
  );

  useEffect(() => {
    const load = async () => {
      if (!window.electronAPI) return;
      try {
        const [settings, status] = await Promise.all([
          window.electronAPI.getSettings(),
          window.electronAPI.getEngineStatus(),
        ]);
        if (settings.screenshotInterval) setIntervalVal(settings.screenshotInterval);
        if (settings.autoStart) setAutoStart(settings.autoStart === 'true');
        if (settings.silentMode) setSilentMode(settings.silentMode === 'true');
        if (settings.deleteAfterUpload) {
          setDeleteAfterUpload(settings.deleteAfterUpload === 'true');
        }
        if (status.entitlementError) setEntitlementError(status.entitlementError);
      } catch {
        // Fallback
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!intervalMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!intervalMenuRef.current?.contains(event.target as Node)) {
        setIntervalMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIntervalMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [intervalMenuOpen]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaved(false);
    setSaveError('');
    if (isSuspended) {
      const errorMsg = 'Settings cannot be saved while your company subscription or license is SUSPENDED.';
      setSaveError(errorMsg);
      addToast?.(errorMsg, 'error');
      return;
    }
    if (window.electronAPI) {
      const res = await window.electronAPI.updateSettings({
        screenshotInterval: interval,
        imageFormat: 'PNG',
        autoStart: String(autoStart),
        silentMode: String(silentMode),
        deleteAfterUpload: String(deleteAfterUpload),
      });
      if (res && (res as any).success === false) {
        const errorMsg = (res as any).error || 'Settings cannot be saved while subscription is suspended.';
        setSaveError(errorMsg);
        addToast?.(errorMsg, 'error');
        return;
      }
    }
    setSaved(true);
    addToast?.('Settings updated and saved successfully!', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-2xl page-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Desktop Client Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure capture intervals, format, and system behavior
        </p>
      </div>

      {isSuspended && (
        <div className="p-3.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Settings Locked: Subscription Suspended</div>
            <p className="mt-0.5 text-amber-800 text-[11px]">
              {entitlementError}. Ask your company administrator to contact the superadmin to activate your subscription.
            </p>
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-900 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {saved && (
        <div className="p-3.5 rounded-md bg-green-50 border border-green-200 text-green-900 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
          <span>Settings saved and applied to the background engine immediately.</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className={`bg-white border border-gray-200 rounded-md p-5 space-y-5 shadow-sm ${
          isSuspended ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
            <span>Screenshot Capture Interval</span>
            <span className="text-green-800 font-bold flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Fast Testing Mode Supported</span>
            </span>
          </label>

          <div ref={intervalMenuRef} className="relative">
            <button
              type="button"
              disabled={isSuspended}
              onClick={() => !isSuspended && setIntervalMenuOpen((open) => !open)}
              className={`w-full min-h-10 bg-gray-50 border rounded-md px-3 py-2 text-left text-xs text-gray-900 font-medium flex items-center justify-between gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-green-700/20 disabled:cursor-not-allowed ${
                intervalMenuOpen
                  ? 'border-green-700 ring-2 ring-green-700/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-haspopup="listbox"
              aria-expanded={intervalMenuOpen}
            >
              <span className="flex items-center gap-2 min-w-0">
                {selectedInterval.fast && (
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-100 shrink-0" />
                )}
                <span className="truncate">{selectedInterval.label}</span>
                {selectedInterval.detail && (
                  <span className="text-gray-400 font-normal hidden sm:inline">
                    ({selectedInterval.detail})
                  </span>
                )}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${
                  intervalMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {intervalMenuOpen && !isSuspended && (
              <div
                className="absolute z-40 mt-1.5 w-full rounded-md border border-gray-200 bg-white p-1.5 shadow-xl shadow-gray-900/10"
                role="listbox"
                aria-label="Screenshot capture interval"
              >
                {intervalOptions.map((option) => {
                  const isSelected = option.value === interval;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setIntervalVal(option.value);
                        setIntervalMenuOpen(false);
                      }}
                      style={isSelected ? { background: 'linear-gradient(135deg, #15803d, #166534)' } : undefined}
                      className={`w-full rounded-md px-3 py-2 text-left flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'text-white'
                          : 'text-gray-700 hover:bg-green-50 hover:text-green-900'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {option.fast ? (
                          <Zap
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected
                                ? 'text-amber-300 fill-amber-300/20'
                                : 'text-amber-500 fill-amber-100'
                            }`}
                          />
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        <span>
                          <span className="block text-xs font-semibold">{option.label}</span>
                          {option.detail && (
                            <span
                              className={`block text-[10px] mt-0.5 ${
                                isSelected ? 'text-green-100' : 'text-gray-400'
                              }`}
                            >
                              {option.detail}
                            </span>
                          )}
                        </span>
                      </span>
                      {isSelected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-1">
            Tip: Select <strong>10 Seconds</strong> or <strong>30 Seconds</strong> to watch
            automatic screenshot captures in real time.
          </p>
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          Screenshots are stored as lossless PNG files to avoid format and quality mismatches.
        </div>

        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2.5 flex items-start gap-2.5">
          <Trash2 className="w-4 h-4 mt-0.5 text-green-700 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-green-900">
              Automatic 7-day screenshot cleanup is active
            </div>
            <div className="text-xs text-green-800/80 mt-0.5">
              Expired images, queue records, and empty date folders are removed automatically
              from this device and server storage.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <div className="text-xs font-semibold text-gray-800">Start with Windows</div>
            <div className="text-xs text-gray-500">
              Launch background engine automatically on boot
            </div>
          </div>
          <input
            type="checkbox"
            disabled={isSuspended}
            checked={autoStart}
            onChange={(event) => setAutoStart(event.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-800 focus:ring-green-700 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <div className="text-xs font-semibold text-gray-800">Silent capture</div>
            <div className="text-xs text-gray-500">
              Do not show an OS notification after every capture
            </div>
          </div>
          <input
            type="checkbox"
            disabled={isSuspended}
            checked={silentMode}
            onChange={(event) => setSilentMode(event.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-800 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <div className="text-xs font-semibold text-gray-800">
              Delete local file after upload
            </div>
            <div className="text-xs text-gray-500">
              Reduce local disk usage after confirmed server storage
            </div>
          </div>
          <input
            type="checkbox"
            disabled={isSuspended}
            checked={deleteAfterUpload}
            onChange={(event) => setDeleteAfterUpload(event.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-800 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={isSuspended}
          style={{ background: isSuspended ? '#9ca3af' : 'linear-gradient(135deg, #15803d, #166534)' }}
          className="text-white px-5 py-2 rounded-md font-semibold text-xs shadow-sm flex items-center space-x-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
};
