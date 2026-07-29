import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  Server,
  Settings2,
  ShieldCheck,
  User,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (sessionData: any) => void;
  addToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, addToast }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hintLoaded, setHintLoaded] = useState(false);
  const [licenseRemembered, setLicenseRemembered] = useState(false);
  const [enterDifferentLicense, setEnterDifferentLicense] = useState(false);

  // Server IP / URL Settings State
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [serverConfigMsg, setServerConfigMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [testingServer, setTestingServer] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.getServerUrl) return;
    window.electronAPI.getServerUrl().then((res) => {
      setCurrentApiUrl(res.apiUrl);
      setServerUrlInput(res.rawSetting);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const loadInitialHint = async () => {
      if (!window.electronAPI) return;
      try {
        const hint = await window.electronAPI.getLoginHint();
        if (!active) return;
        if (hint.username) setUsername(hint.username);
        setLicenseRemembered(hint.hasRememberedLicense);
      } catch {
        if (active) setLicenseRemembered(false);
      } finally {
        if (active) setHintLoaded(true);
      }
    };
    void loadInitialHint();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hintLoaded) return;
    if (!window.electronAPI) return;
    if (!username.trim()) {
      setLicenseRemembered(false);
      setEnterDifferentLicense(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const hint = await window.electronAPI.getLoginHint(username);
        if (!active) return;
        setLicenseRemembered(hint.hasRememberedLicense);
        setEnterDifferentLicense(false);
        setLicenseKey('');
      } catch {
        if (active) setLicenseRemembered(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [hintLoaded, username]);

  const handleSaveServerUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.electronAPI?.saveServerUrl) return;
    setTestingServer(true);
    setServerConfigMsg(null);
    try {
      const res = await window.electronAPI.saveServerUrl(serverUrlInput);
      if (res.success) {
        setCurrentApiUrl(res.apiUrl);
        setServerConfigMsg({ text: `Connected successfully to ${res.apiUrl}`, isError: false });
        setError('');
      } else {
        setServerConfigMsg({ text: res.error || 'Connection failed', isError: true });
      }
    } catch (err: any) {
      setServerConfigMsg({ text: err.message || 'Connection test failed', isError: true });
    } finally {
      setTestingServer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!window.electronAPI) {
        setError('The desktop client must be opened through Electron. Browser demo authentication is disabled.');
        return;
      }

      const res = await window.electronAPI.login({
        username,
        password,
        licenseKey,
        rememberMe,
      });

      if (res.success) {
        onLoginSuccess(res.data);
      } else {
        const errorMsg = res.savedLicenseUsed
          ? 'Login failed. Check the password, or enter a different license key if the saved key was changed or revoked.'
          : res.error || 'Login failed';
        setError(errorMsg);
        addToast?.(errorMsg, 'error');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      addToast?.(err.message || 'An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden page-fade-in"
      style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d3748 50%, #1a202c 100%)' }}
    >
      {/* Background forest glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-700/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-md shadow-md z-10 overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #15803d, #4ade80, #15803d)' }}
        />
        <div className="p-6">
          <div className="text-center mb-5">
            <img src="./logo.png" alt="ScreenAdvait" className="w-14 h-14 rounded-md shadow-sm mx-auto mb-3 object-cover" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">ScreenAdvait Client</h1>
            <p className="text-xs text-gray-500 mt-0.5">Enterprise Screenshot & License Platform</p>
          </div>

          {/* Server Config Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="w-full py-1.5 px-3 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[11px] font-semibold text-gray-700 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-green-700" />
                <span>Server: <strong className="font-mono text-gray-900">{currentApiUrl || 'http://localhost:5000/api/v1'}</strong></span>
              </span>
              <Settings2 className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showServerConfig && (
              <form onSubmit={handleSaveServerUrl} className="mt-2.5 p-3 rounded-md bg-gray-50 border border-gray-200 space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Server IP / URL Configuration
                  </label>
                  <p className="text-[10px] text-gray-500 mb-2">
                    Enter the IP address of the laptop/server running the NestJS API (e.g., <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">http://192.168.1.15:5000</code>).
                  </p>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={serverUrlInput}
                      onChange={(e) => setServerUrlInput(e.target.value)}
                      placeholder="http://192.168.1.15:5000"
                      className="w-full bg-white border border-gray-300 rounded pl-8 pr-2 py-1.5 text-xs font-mono text-gray-800 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                    />
                  </div>
                </div>

                {serverConfigMsg && (
                  <div className={`p-2 rounded text-[11px] flex items-start gap-1.5 ${serverConfigMsg.isError ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-900'}`}>
                    {serverConfigMsg.isError ? <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />}
                    <span>{serverConfigMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={testingServer}
                    className="flex-1 py-1.5 px-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {testingServer ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    <span>Save &amp; Test Connection</span>
                  </button>
                  {serverUrlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setServerUrlInput('');
                        if (window.electronAPI?.saveServerUrl) {
                          window.electronAPI.saveServerUrl('').then((res) => {
                            setCurrentApiUrl(res.apiUrl);
                            setServerConfigMsg({ text: 'Reset to default localhost URL', isError: false });
                          });
                        }
                      }}
                      className="py-1.5 px-2.5 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded text-xs transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 transition-all"
                />
              </div>
            </div>

            {licenseRemembered && !enterDifferentLicense ? (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2.5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-green-900">
                    License activated on this device
                  </div>
                  <p className="text-[11px] leading-4 text-green-700 mt-0.5">
                    The saved key is verified securely at every login.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEnterDifferentLicense(true);
                    setError('');
                  }}
                  className="text-[11px] font-semibold text-green-800 hover:text-green-950 underline underline-offset-2 shrink-0"
                >
                  Change key
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    License Key
                  </label>
                  {licenseRemembered && (
                    <button
                      type="button"
                      onClick={() => {
                        setEnterDifferentLicense(false);
                        setLicenseKey('');
                        setError('');
                      }}
                      className="text-[11px] font-semibold text-green-800 hover:text-green-950"
                    >
                      Use saved key
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="ATS-XXXX-XXXX-XXXX-XXXX"
                    className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-3 py-2 text-xs tracking-wider font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 transition-all uppercase font-semibold"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Required once on this Windows device for each username.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-green-800 focus:ring-green-700"
                />
                <span>Remember Device</span>
              </label>
              <span className="text-xs text-green-800 font-semibold cursor-pointer">Hardware Locked</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}
              className="w-full mt-4 text-white font-semibold py-2.5 rounded-md shadow-sm text-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Hardware...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {licenseRemembered && !enterDifferentLicense
                      ? 'Access Desktop'
                      : 'Activate & Access Desktop'}
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-gray-400 border-t border-gray-100 pt-3">
            Licensed under Enterprise SaaS terms &bull; Device GUID auto-verified
          </div>
        </div>
      </div>
    </div>
  );
};
