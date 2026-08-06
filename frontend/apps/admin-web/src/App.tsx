import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  KeyRound,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  LogOut,
  Bell,
} from 'lucide-react';
import axios from 'axios';
import { CustomerDashboard } from './CustomerDashboard';
import { ConfirmDialog } from './ConfirmDialog';
import { ToastContainer, ToastMessage } from './ToastContainer';

const API_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.origin}/api/v1`;
const auth = (token: string | null) => ({ headers: { Authorization: `Bearer ${token}` } });
const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '—');

function apiErrorMessage(error: any, fallback: string) {
  const details = error.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((item: any) => item.message).join(' ');
  }
  return error.response?.data?.message || error.message || fallback;
}

function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenValid(token: string | null) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now();
}

function restoredSession() {
  try {
    const token = sessionStorage.getItem('portal_token');
    if (!token || !isTokenValid(token)) {
      sessionStorage.removeItem('portal_token');
      sessionStorage.removeItem('portal_session');
      return null;
    }
    return JSON.parse(sessionStorage.getItem('portal_session') || 'null');
  } catch {
    return null;
  }
}

// ── Inline SVG icons for sidebar ──────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
function IconSubscribe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );
}
function IconCompanies() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconKeys() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  );
}

// ── KPI Card icons ──────────────────────────────────────────────────────────
function KpiIconBuilding() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="8" y2="6.01"/>
      <line x1="16" y1="6" x2="16" y2="6.01"/>
      <line x1="8" y1="10" x2="8" y2="10.01"/>
      <line x1="16" y1="10" x2="16" y2="10.01"/>
      <line x1="8" y1="14" x2="8" y2="14.01"/>
      <line x1="16" y1="14" x2="16" y2="14.01"/>
    </svg>
  );
}
function KpiIconSubscription() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function KpiIconKeys() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="4"/>
      <line x1="15" y1="8" x2="22" y2="8"/>
      <line x1="22" y1="8" x2="22" y2="11"/>
      <line x1="19" y1="8" x2="19" y2="11"/>
      <line x1="12" y1="8" x2="15" y2="11"/>
    </svg>
  );
}
function KpiIconDevices() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

type TabType = 'subscription_form' | 'subscriptions_table' | 'licenses_table';

export function App() {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('portal_token'));
  const [session, setSession] = useState<any>(restoredSession());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('subscription_form');
  const [companies, setCompanies] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [newCompanyCredentials, setNewCompanyCredentials] = useState<{
    companyName: string;
    username: string;
    temporaryPassword: string;
  } | null>(null);
  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState<{
    companyName: string;
    plan: string;
    maxEmployees: number | string;
    maxDevices: number | string;
  }>({
    companyName: '',
    plan: 'MONTHLY',
    maxEmployees: 25,
    maxDevices: 25,
  });

  // Subscriptions Table Pagination
  const [subPageSize, setSubPageSize] = useState<number>(10);
  const [subPage, setSubPage] = useState<number>(1);
  const [subDropdownOpen, setSubDropdownOpen] = useState<boolean>(false);
  const subDropdownRef = React.useRef<HTMLDivElement>(null);

  // Licenses Table Pagination
  const [licPageSize, setLicPageSize] = useState<number>(10);
  const [licPage, setLicPage] = useState<number>(1);
  const [licDropdownOpen, setLicDropdownOpen] = useState<boolean>(false);
  const licDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subDropdownRef.current && !subDropdownRef.current.contains(event.target as Node)) {
        setSubDropdownOpen(false);
      }
      if (licDropdownRef.current && !licDropdownRef.current.contains(event.target as Node)) {
        setLicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((current) => [...current, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (token && session?.user?.role === 'SUPER_ADMIN') void fetchAdminData();
  }, [token, session?.user?.role]);

  const fetchAdminData = async (isManual = false) => {
    setLoading(true);
    setError('');
    try {
      const [companyRes, subscriptionRes, licenseRes] = await Promise.all([
        axios.get(`${API_URL}/companies`, auth(token)),
        axios.get(`${API_URL}/subscriptions`, auth(token)),
        axios.get(`${API_URL}/licenses`, auth(token)),
      ]);
      setCompanies(companyRes.data);
      setSubscriptions(subscriptionRes.data);
      setLicenses(licenseRes.data);
      setForm((current) => ({
        ...current,
        companyName: current.companyName || companyRes.data[0]?.name || '',
      }));
      if (isManual) addToast('Platform data refreshed.', 'info');
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Failed to load platform data');
      setError(message);
      addToast(message, 'error');
      if (err.response?.status === 401 || err.response?.status === 403) performLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const response = await axios.post(`${API_URL}/auth/portal-login`, { username, password });
      if (!['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(response.data.user?.role)) {
        throw new Error('Administrator portal access is required');
      }
      sessionStorage.setItem('portal_token', response.data.accessToken);
      sessionStorage.setItem('portal_session', JSON.stringify(response.data));
      setSession(response.data);
      setToken(response.data.accessToken);
      addToast('Welcome back! Signed in successfully.', 'success');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setMsg(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSubscription = async () => {
    setMsg('');
    setError('');
    const trimmedName = form.companyName.trim();
    if (!trimmedName) {
      setError('Please select or type a company name.');
      addToast('Please select or type a company name.', 'error');
      return;
    }
    const maxUsersNum = Math.max(1, Number(form.maxEmployees) || 25);
    const maxDevicesNum = Math.max(1, Number(form.maxDevices) || 25);
    try {
      let company = companies.find(
        (item) => item.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      );
      if (!company) {
        const baseCode = trimmedName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 6) || 'COMP';
        const uniqueSuffix = `${Date.now().toString(36).slice(-4)}${Math.random()
          .toString(36)
          .slice(2, 4)}`.toUpperCase();
        const sanitizedCode = `${baseCode}${uniqueSuffix}`.slice(0, 12);
        const newCompRes = await axios.post(
          `${API_URL}/companies`,
          {
            name: trimmedName,
            code: sanitizedCode,
            contactEmail: `admin+${sanitizedCode.toLowerCase()}@screenadvait.example`,
            maxUsers: maxUsersNum,
          },
          auth(token),
        );
        company = newCompRes.data;
        if (company.adminCredentials) {
          setNewCompanyCredentials({
            companyName: company.name,
            username: company.adminCredentials.username,
            temporaryPassword: company.adminCredentials.temporaryPassword,
          });
        }
      }
      await axios.post(
        `${API_URL}/subscriptions`,
        {
          companyName: trimmedName,
          plan: form.plan,
          maxEmployees: maxUsersNum,
          maxDevices: maxDevicesNum,
          companyId: company.id,
        },
        auth(token),
      );
      const successMessage = `Company "${company.name}" onboarded & subscription assigned under ${form.plan} plan!`;
      setMsg(successMessage);
      addToast(successMessage, 'success');
      await fetchAdminData();
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Could not save company subscription');
      setError(message);
      addToast(message, 'error');
    }
  };

  const renew = async (id: string) => {
    try {
      await axios.post(`${API_URL}/subscriptions/${id}/renew`, { days: 30 }, auth(token));
      setMsg('Subscription renewed for 30 days.');
      addToast('Subscription renewed for 30 days.', 'success');
      await fetchAdminData();
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Renewal failed');
      setError(message);
      addToast(message, 'error');
    }
  };

  const changeStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
    try {
      await axios.post(`${API_URL}/subscriptions/${id}/status`, { status }, auth(token));
      const statusText = status === 'ACTIVE' ? 'Subscription activated.' : 'Subscription suspended.';
      setMsg(statusText);
      addToast(statusText, status === 'ACTIVE' ? 'success' : 'info');
      await fetchAdminData();
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Status update failed');
      setError(message);
      addToast(message, 'error');
    }
  };

  const resetDevices = async (id: string) => {
    try {
      await axios.post(`${API_URL}/licenses/${id}/reset-devices`, {}, auth(token));
      setMsg('Employee device bindings reset.');
      addToast('Employee device bindings reset successfully.', 'success');
      await fetchAdminData();
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Device reset failed');
      setError(message);
      addToast(message, 'error');
    }
  };

  const reactivateLicense = async (id: string) => {
    try {
      await axios.post(`${API_URL}/licenses/${id}/reactivate`, {}, auth(token));
      setMsg('Employee license key reactivated to ACTIVE.');
      addToast('Employee license key reactivated successfully.', 'success');
      await fetchAdminData();
    } catch (err: any) {
      const message = apiErrorMessage(err, 'License reactivation failed');
      setError(message);
      addToast(message, 'error');
    }
  };

  const logout = (notifyUser = false) => {
    sessionStorage.removeItem('portal_token');
    sessionStorage.removeItem('portal_session');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('customer_token');
    sessionStorage.removeItem('customer_session');
    setToken(null);
    setSession(null);
    setUsername('');
    setPassword('');
    if (notifyUser) {
      addToast('Signed out of ScreenAdvait Super Admin.', 'info');
    }
  };

  const performLogout = async () => {
    setLogoutConfirmationOpen(false);
    if (token) {
      await axios.post(`${API_URL}/auth/logout`, {}, auth(token)).catch(() => undefined);
    }
    logout(true);
  };

  // ── Login page ──────────────────────────────────────────────────────────────
  if (!token || !session?.user?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #2d3748 50%, #1a202c 100%)' }}>
        {/* Background dots */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative w-full max-w-[360px] modal-pop-in">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden min-h-[480px] flex flex-col">
            {/* Green accent strip */}
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
                  <p className="text-xs text-gray-500 mt-1">Management Portal Sign In</p>
                </div>
                {msg && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{msg}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                    <input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                    <input required autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all" />
                  </div>
                  <button disabled={loading}
                    className="w-full py-3 rounded-md text-sm font-semibold text-white disabled:opacity-50 transition-all shadow-sm mt-3 hover:shadow-md active:scale-98"
                    style={{ background: loading ? '#15803d' : 'linear-gradient(135deg, #15803d, #166534)' }}>
                    {loading ? 'Authenticating…' : 'Sign In to Portal'}
                  </button>
                </form>
              </div>

              {/* JWT Security Badge Footer */}
              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>JWT Authenticated Bearer Session</span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-green-300 mt-4 opacity-70">Super Admin & Company Admin access</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role === 'COMPANY_ADMIN') {
    return <CustomerDashboard token={token} session={session} onLogout={logout} />;
  }

  const activeSubscriptions = subscriptions.filter((item) => item.status === 'ACTIVE').length;
  const tabLabels: Record<TabType, string> = {
    subscription_form: 'Company Subscription',
    subscriptions_table: 'Company Subscriptions',
    licenses_table: 'Employee License Oversight',
  };

  const navItems: { tab: TabType; label: string; icon: React.ReactNode; iconColor: string }[] = [
    { tab: 'subscription_form', label: 'Company Subscription', icon: <IconSubscribe />, iconColor: '#4ade80' },
    { tab: 'subscriptions_table', label: 'Company Subscriptions', icon: <IconCompanies />, iconColor: '#60a5fa' },
    { tab: 'licenses_table', label: 'License Oversight', icon: <IconKeys />, iconColor: '#fb923c' },
  ];

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#f0f2f5' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #1e2d1e 0%, #2d3748 100%)' }}
      >
        {/* Logo area */}
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md overflow-hidden shadow-lg border border-white/20 shrink-0">
              <img src="/logo.png" alt="ScreenAdvait" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">ScreenAdvait</div>
              <div className="text-green-400 text-[11px] font-medium">Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 px-3 mb-2 tracking-wider">Management</div>
          {navItems.map(({ tab, label, icon, iconColor }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all text-sm font-medium group"
                style={{
                  background: isActive ? 'linear-gradient(135deg, #15803d, #166534)' : 'transparent',
                  color: isActive ? '#ffffff' : '#9ca3af',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'; }}
                onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; } }}
              >
                <span style={{ color: isActive ? '#ffffff' : iconColor }}>{icon}</span>
                <span className="flex-1 truncate">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-3">
            <div className="text-xs text-gray-400 truncate">Signed in as</div>
            <div className="text-sm text-white font-semibold truncate">{session?.user?.username || 'Super Admin'}</div>
          </div>
          <button
            onClick={() => setLogoutConfirmationOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-red-600/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* ── Top header bar ──────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-0 flex items-center justify-between h-14 sticky top-0 z-30 shadow-sm">
          {/* Mobile menu + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-gray-400 hidden sm:inline">Platform</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline" />
              <span className="font-semibold text-gray-800 truncate">{tabLabels[activeTab]}</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchAdminData(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-green-700 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
              {(session?.user?.username?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile nav drawer */}
        <div
          className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className={`absolute left-0 top-0 h-full w-64 flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out shadow-2xl ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ background: 'linear-gradient(180deg, #1e2d1e 0%, #2d3748 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img src="/logo.png" alt="ScreenAdvait" className="w-8 h-8 rounded-md object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-white font-bold text-sm leading-tight truncate">ScreenAdvait</div>
                  <div className="text-green-400 text-[11px] font-medium truncate">Super Admin</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors shrink-0 focus:outline-none"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(({ tab, label, icon, iconColor }) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all text-sm font-medium"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #15803d, #166534)' : 'transparent',
                      color: isActive ? '#fff' : '#9ca3af',
                    }}
                  >
                    <span style={{ color: isActive ? '#fff' : iconColor }}>{icon}</span>
                    {label}
                  </button>
                );
              })}
            </nav>
            <div className="px-3 py-4 border-t border-white/10">
              <button
                onClick={() => setLogoutConfirmationOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-red-600/20 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>

        {/* ── Page content ────────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div key={activeTab} className="mx-auto max-w-[1440px] page-fade-in">

            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{tabLabels[activeTab]}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeTab === 'subscription_form'
                  ? 'Select an existing company or type a new company name to onboard & subscribe in 1 click.'
                  : activeTab === 'subscriptions_table'
                  ? 'Review active company plans, renewals, and subscription statuses.'
                  : 'Monitor active employee keys, hardware device bindings, and license status across all organizations.'}
              </p>
            </div>

            {/* Alerts */}
            {error && <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
            {msg && <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-900 text-xs flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" /><span>{msg}</span></div>}

            {/* ── KPI Cards ──────────────────────────────────────────── */}
            <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Companies', value: companies.length, icon: <KpiIconBuilding />, accent: '#dcfce7', border: '#bbf7d0' },
                { label: 'Active Subscriptions', value: activeSubscriptions, icon: <KpiIconSubscription />, accent: '#ede9fe', border: '#ddd6fe' },
                { label: 'Employee Keys', value: licenses.length, icon: <KpiIconKeys />, accent: '#dbeafe', border: '#bfdbfe' },
                { label: 'Activated Devices', value: licenses.reduce((sum, item) => sum + (item.currentDevices || 0), 0), icon: <KpiIconDevices />, accent: '#ffedd5', border: '#fed7aa' },
              ].map(({ label, value, icon, accent, border }) => (
                <div key={label} className="bg-white rounded-md shadow-sm border border-gray-200 p-4 sm:p-5 flex items-start gap-3 hover:shadow-md transition-shadow">
                  <div className="rounded-md p-2.5 shrink-0" style={{ background: accent, border: `1px solid ${border}` }}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 font-medium truncate">{label}</div>
                    <div className="text-2xl font-bold text-gray-900 mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Company Subscription Form ─────────────────────────── */}
            {activeTab === 'subscription_form' && (
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5 sm:p-6">
                <div className="mb-5 pb-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">Company Onboarding &amp; Subscription</h2>
                  <p className="text-xs text-gray-500 mt-1">Select an existing company or type a new company name to create the organization &amp; assign its subscription limits in 1 click.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                  <label className="text-xs font-semibold text-gray-600 block">
                    Company name
                    <div className="relative mt-1.5">
                      <input
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-xs font-normal text-gray-800 transition-all"
                        placeholder="Type company name"
                      />
                    </div>
                  </label>

                  <label className="text-xs font-semibold text-gray-600 block">
                    Plan
                    <span className="relative mt-1.5 block">
                      <button type="button" aria-haspopup="listbox" aria-expanded={planMenuOpen}
                        onClick={() => setPlanMenuOpen((open) => !open)}
                        className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-left font-normal outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-xs transition-all">
                        {form.plan}
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${planMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {planMenuOpen && (
                        <div role="listbox" className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-xl">
                          {['TRIAL', 'MONTHLY', 'QUARTERLY', 'SIX_MONTHS', 'ONE_YEAR', 'LIFETIME'].map((plan) => (
                            <button type="button" role="option" aria-selected={form.plan === plan} key={plan}
                              onClick={() => { setForm({ ...form, plan }); setPlanMenuOpen(false); }}
                              className={`block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-green-50 transition-colors ${form.plan === plan ? 'bg-green-50 font-semibold text-green-800' : 'text-gray-700'}`}>
                              {plan}
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                  </label>

                  <label className="text-xs font-semibold text-gray-600 block">
                    Employees
                    <input
                      type="number"
                      min={1}
                      value={form.maxEmployees}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, maxEmployees: val });
                      }}
                      onBlur={() => {
                        if (!form.maxEmployees || Number(form.maxEmployees) <= 0) {
                          setForm((f) => ({ ...f, maxEmployees: 25 }));
                        }
                      }}
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-xs transition-all"
                    />
                  </label>

                  <label className="text-xs font-semibold text-gray-600 block">
                    Device Slots
                    <input
                      type="number"
                      min={1}
                      value={form.maxDevices}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({ ...form, maxDevices: val });
                      }}
                      onBlur={() => {
                        if (!form.maxDevices || Number(form.maxDevices) <= 0) {
                          setForm((f) => ({ ...f, maxDevices: 25 }));
                        }
                      }}
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-xs transition-all"
                    />
                  </label>

                  <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                    <button onClick={saveSubscription} disabled={!form.companyName.trim()}
                      className="w-full text-white px-5 py-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
                      <Plus className="w-4 h-4" /> Save Subscription
                    </button>
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] font-normal text-gray-400 truncate">
                  Existing: {companies.map((c) => c.name).join(', ') || 'None'}
                </p>
                {newCompanyCredentials && (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">Company administrator credentials — shown once</div>
                        <p className="mt-1 text-[11px] text-amber-800">
                          Copy these credentials now and send them securely to {newCompanyCredentials.companyName}.
                          The temporary password is never stored in readable form.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewCompanyCredentials(null)}
                        className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        ['Username', newCompanyCredentials.username],
                        ['Temporary password', newCompanyCredentials.temporaryPassword],
                      ].map(([label, value]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(value);
                            addToast(`${label} copied.`, 'info');
                          }}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2 text-left hover:border-amber-400"
                          title={`Copy ${label.toLowerCase()}`}
                        >
                          <span className="min-w-0">
                            <span className="block text-[10px] font-semibold uppercase tracking-wide text-amber-700">{label}</span>
                            <span className="block truncate font-mono text-xs font-bold text-gray-900">{value}</span>
                          </span>
                          <Copy className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Company Subscriptions Table ───────────────────────── */}
            {activeTab === 'subscriptions_table' && (
              <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-sm text-gray-900">Company Subscriptions</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{subscriptions.length} companies on platform</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>
                      {activeSubscriptions} Active
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span className="font-medium">Records per page:</span>
                      <div className="relative" ref={subDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setSubDropdownOpen((prev) => !prev)}
                          className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-green-600 text-gray-800 text-xs font-semibold rounded-md px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-all outline-none"
                        >
                          <span>{subPageSize} records</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${subDropdownOpen ? 'rotate-180 text-green-700' : ''}`} />
                        </button>
                        {subDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 page-fade-in">
                            {[10, 15, 20, 25].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => {
                                  setSubPageSize(size);
                                  setSubPage(1);
                                  setSubDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                                  subPageSize === size
                                    ? 'bg-green-50 text-green-800 font-bold'
                                    : 'text-gray-700 hover:bg-green-50/70 hover:text-green-900'
                                }`}
                              >
                                <span>{size} records</span>
                                {subPageSize === size && <Check className="w-3.5 h-3.5 text-green-700 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const totalSubItems = subscriptions.length;
                  const totalSubPages = Math.max(1, Math.ceil(totalSubItems / subPageSize));
                  const safeSubPage = Math.min(Math.max(1, subPage), totalSubPages);
                  const subStartIndex = (safeSubPage - 1) * subPageSize;
                  const subEndIndex = Math.min(subStartIndex + subPageSize, totalSubItems);
                  const paginatedSubscriptions = subscriptions.slice(subStartIndex, subEndIndex);

                  return (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-[860px] w-full text-left text-xs">
                          <thead style={{ background: '#f8fafc' }}>
                            <tr className="text-gray-500 uppercase text-[11px] font-semibold tracking-wide border-b border-gray-100">
                              <th className="px-5 py-3">Company</th>
                              <th className="px-3 py-3">Plan / Expiry</th>
                              <th className="px-3 py-3">Employees</th>
                              <th className="px-3 py-3">Devices</th>
                              <th className="px-3 py-3">Status</th>
                              <th className="px-3 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedSubscriptions.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 font-semibold text-gray-800 flex items-center gap-2">
                                  <span className="w-7 h-7 rounded-md bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                  </span>
                                  {item.company?.name}
                                </td>
                                <td className="px-3 py-3">
                                  <span className="font-semibold text-gray-700">{item.plan}</span>
                                  <div className="text-gray-400 mt-0.5">{formatDate(item.endDate)}</div>
                                </td>
                                <td className="px-3 py-3 text-gray-600">{item.usage?.employees || 0} / {item.maxEmployees}</td>
                                <td className="px-3 py-3 text-gray-600">{item.usage?.allocatedDeviceSlots || 0} / {item.maxDevices}</td>
                                <td className="px-3 py-3">
                                  <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${item.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-3 py-3 space-x-2 whitespace-nowrap">
                                  <button onClick={() => renew(item.id)} className="px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600 transition-colors text-[11px] font-medium">Renew 30d</button>
                                  {item.status === 'ACTIVE'
                                    ? <button onClick={() => changeStatus(item.id, 'SUSPENDED')} className="px-2.5 py-1 border border-amber-200 rounded-md text-amber-700 hover:bg-amber-50 text-[11px] font-medium transition-colors"><PauseCircle className="inline w-3 h-3 mr-1" />Suspend</button>
                                    : <button onClick={() => changeStatus(item.id, 'ACTIVE')} className="px-2.5 py-1 border border-green-200 rounded-md text-green-700 hover:bg-green-50 text-[11px] font-medium transition-colors"><PlayCircle className="inline w-3 h-3 mr-1" />Activate</button>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {totalSubItems > 0 && (
                        <div className="px-5 py-3.5 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="text-gray-500 font-medium">
                            Showing <span className="font-bold text-gray-800">{subStartIndex + 1}</span> to <span className="font-bold text-gray-800">{subEndIndex}</span> of <span className="font-bold text-gray-800">{totalSubItems}</span> companies
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              disabled={safeSubPage <= 1}
                              onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Previous</span>
                            </button>
                            <div className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-50 rounded-md border border-gray-200">
                              Page {safeSubPage} of {totalSubPages}
                            </div>
                            <button
                              disabled={safeSubPage >= totalSubPages}
                              onClick={() => setSubPage((p) => Math.min(totalSubPages, p + 1))}
                              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── License Oversight Table ───────────────────────────── */}
            {activeTab === 'licenses_table' && (
              <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-sm text-gray-900">Employee License Key Oversight</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{licenses.length} keys issued across all organizations</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span className="font-medium">Records per page:</span>
                    <div className="relative" ref={licDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setLicDropdownOpen((prev) => !prev)}
                        className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-green-600 text-gray-800 text-xs font-semibold rounded-md px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-all outline-none"
                      >
                        <span>{licPageSize} records</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${licDropdownOpen ? 'rotate-180 text-green-700' : ''}`} />
                      </button>
                      {licDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 page-fade-in">
                          {[10, 15, 20, 25].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setLicPageSize(size);
                                setLicPage(1);
                                setLicDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                                licPageSize === size
                                  ? 'bg-green-50 text-green-800 font-bold'
                                  : 'text-gray-700 hover:bg-green-50/70 hover:text-green-900'
                              }`}
                            >
                              <span>{size} records</span>
                              {licPageSize === size && <Check className="w-3.5 h-3.5 text-green-700 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {(() => {
                  const totalLicItems = licenses.length;
                  const totalLicPages = Math.max(1, Math.ceil(totalLicItems / licPageSize));
                  const safeLicPage = Math.min(Math.max(1, licPage), totalLicPages);
                  const licStartIndex = (safeLicPage - 1) * licPageSize;
                  const licEndIndex = Math.min(licStartIndex + licPageSize, totalLicItems);
                  const paginatedLicenses = licenses.slice(licStartIndex, licEndIndex);

                  return (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-[860px] w-full text-left text-xs">
                          <thead style={{ background: '#f8fafc' }}>
                            <tr className="text-gray-500 uppercase text-[11px] font-semibold tracking-wide border-b border-gray-100">
                              <th className="px-5 py-3">License Key</th>
                              <th className="px-3 py-3">Employee</th>
                              <th className="px-3 py-3">Company</th>
                              <th className="px-3 py-3">Devices</th>
                              <th className="px-3 py-3">Key Status</th>
                              <th className="px-3 py-3">Sub. Status</th>
                              <th className="px-3 py-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedLicenses.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 font-mono font-semibold text-green-800 whitespace-nowrap">{item.key}</td>
                                <td className="px-3 py-3 text-gray-700">{item.user?.username || <span className="text-gray-400">Unassigned</span>}</td>
                                <td className="px-3 py-3 text-gray-700">{item.company?.name}</td>
                                <td className="px-3 py-3 text-gray-600">{item.currentDevices} / {item.maxDevices}</td>
                                <td className="px-3 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${item.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${item.subscription?.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    {item.subscription?.status || '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <button onClick={() => resetDevices(item.id)}
                                    className="px-2.5 py-1 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded-md font-semibold text-gray-700 transition-colors whitespace-nowrap text-[11px]">
                                    Reset Devices
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {totalLicItems > 0 && (
                        <div className="px-5 py-3.5 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="text-gray-500 font-medium">
                            Showing <span className="font-bold text-gray-800">{licStartIndex + 1}</span> to <span className="font-bold text-gray-800">{licEndIndex}</span> of <span className="font-bold text-gray-800">{totalLicItems}</span> keys
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              disabled={safeLicPage <= 1}
                              onClick={() => setLicPage((p) => Math.max(1, p - 1))}
                              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Previous</span>
                            </button>
                            <div className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-50 rounded-md border border-gray-200">
                              Page {safeLicPage} of {totalLicPages}
                            </div>
                            <button
                              disabled={safeLicPage >= totalLicPages}
                              onClick={() => setLicPage((p) => Math.min(totalLicPages, p + 1))}
                              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

          </div>
        </main>
      </div>

      <ConfirmDialog open={logoutConfirmationOpen} onCancel={() => setLogoutConfirmationOpen(false)} onConfirm={performLogout} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
