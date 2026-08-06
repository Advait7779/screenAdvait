import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ShieldCheck,
  Download,
} from 'lucide-react';
import axios from 'axios';
import { CustomerDashboard } from './CustomerDashboard';
import { ToastContainer, ToastMessage } from './ToastContainer';

const API_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.origin}/api/v1`;
const DESKTOP_DOWNLOAD_URL =
  import.meta.env.VITE_DESKTOP_DOWNLOAD_URL ||
  '/download/ScreenAdvait-Enterprise-Desktop-Setup.exe';

function apiErrorMessage(error: any, fallback: string) {
  const details = error.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((item: any) => item.message).join(' ');
  }
  return error.response?.data?.message || error.message || fallback;
}

export function App() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('customer_token'));
  const [session, setSession] = useState<any>(() => {
    const saved = sessionStorage.getItem('customer_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((current) => [...current, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const response = await axios.post(`${API_URL}/auth/portal-login`, {
        username: username.trim(),
        password,
      });
      const data = response.data;
      if (data.user?.role !== 'COMPANY_ADMIN') {
        setMsg('Company Admin credentials are required for this portal.');
        addToast('Company Admin access required.', 'error');
        return;
      }
      sessionStorage.setItem('customer_token', data.accessToken);
      sessionStorage.setItem('customer_session', JSON.stringify(data));
      setToken(data.accessToken);
      setSession(data);
      addToast(`Welcome back, ${data.user.fullName || data.user.username}!`);
    } catch (err: any) {
      const errorMsg = apiErrorMessage(err, 'Sign in failed');
      setMsg(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const logout = (notifyUser = false) => {
    sessionStorage.removeItem('customer_token');
    sessionStorage.removeItem('customer_session');
    setToken(null);
    setSession(null);
    setUsername('');
    setPassword('');
    if (notifyUser) {
      addToast('Signed out of Company Admin Portal.', 'info');
    }
  };

  if (token && session?.user?.role === 'COMPANY_ADMIN') {
    return (
      <>
        <CustomerDashboard token={token} session={session} onLogout={() => logout(true)} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d3748 50%, #1a202c 100%)' }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="relative w-full max-w-[360px] modal-pop-in">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden min-h-[480px] flex flex-col">
          <div className="h-1.5 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #15803d, #4ade80, #15803d)' }} />
          <div className="py-10 px-7 sm:px-8 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                    <img src="/logo.png" alt="ScreenAdvait" className="w-9 h-9 rounded-lg object-cover" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">ScreenAdvait</h1>
                <p className="text-xs text-gray-500 mt-1">Company Admin Portal</p>
              </div>

              {msg && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {msg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                  <input
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="kgsoftware"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <input
                    required
                    autoComplete="current-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-md text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Customer Portal'}
                </button>
              </form>

              {/* Direct Desktop Client Download Link */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <a
                  href={DESKTOP_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border border-green-200 bg-green-50 hover:bg-green-100 text-xs font-semibold text-green-800 transition-all shadow-sm group"
                >
                  <Download className="w-4 h-4 text-green-700 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Download Desktop App (.exe)</span>
                </a>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span>Company Admin Customer Portal</span>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
