import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  Folder,
  Image,
  KeyRound,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  UserRound,
  Users,
  XCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import { ConfirmDialog } from './ConfirmDialog';
import { ToastContainer, ToastMessage } from './ToastContainer';

const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname || 'localhost'}:5000/api/v1`;
const DESKTOP_DOWNLOAD_URL = import.meta.env.VITE_DESKTOP_DOWNLOAD_URL || '';
const auth = (token: string | null) => ({ headers: { Authorization: `Bearer ${token}` } });

function screenshotDayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function screenshotDayLabel(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function fileSizeLabel(value: number | string | undefined) {
  const bytes = Number(value || 0);
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
    const token = sessionStorage.getItem('customer_token');
    if (!token || !isTokenValid(token)) {
      sessionStorage.removeItem('customer_token');
      sessionStorage.removeItem('customer_session');
      return null;
    }
    return JSON.parse(sessionStorage.getItem('customer_session') || 'null');
  } catch {
    return null;
  }
}

// ── SVG icons for sidebar nav ─────────────────────────────────────────────────
function IconCaptures() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}
function IconEmployees() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconAllScreenshots() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

// ── KPI icons ─────────────────────────────────────────────────────────────────
function KpiIconStatus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
function KpiIconExpiry() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function KpiIconEmployees() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function KpiIconStorage() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  );
}

export function App() {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('customer_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<any>(restoredSession());
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [view, setView] = useState<'captures' | 'all-screenshots' | 'employees'>('employees');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgError, setMsgError] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [employee, setEmployee] = useState({ fullName: '', username: '', email: '', password: '' });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [archivePageSize, setArchivePageSize] = useState<number>(10);
  const [archivePage, setArchivePage] = useState<number>(1);
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archiveDropdownOpen, setArchiveDropdownOpen] = useState<boolean>(false);
  const archiveDropdownRef = React.useRef<HTMLDivElement>(null);

  // Employees Table Pagination
  const [empPageSize, setEmpPageSize] = useState<number>(10);
  const [empPage, setEmpPage] = useState<number>(1);
  const [empDropdownOpen, setEmpDropdownOpen] = useState<boolean>(false);
  const empDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (archiveDropdownRef.current && !archiveDropdownRef.current.contains(event.target as Node)) {
        setArchiveDropdownOpen(false);
      }
      if (empDropdownRef.current && !empDropdownRef.current.contains(event.target as Node)) {
        setEmpDropdownOpen(false);
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

  useEffect(() => { if (token) void fetchCustomerData(); }, [token]);

  const show = (message: string, isError = false) => {
    setMsg(message);
    setMsgError(isError);
    if (message) addToast(message, isError ? 'error' : 'success');
  };

  const fetchCustomerData = async (isManual = false) => {
    setLoading(true);
    try {
      const [shots, company] = await Promise.all([
        axios.get(`${API_URL}/screenshots/company`, auth(token)),
        axios.get(`${API_URL}/company-admin/overview`, auth(token)),
      ]);
      setScreenshots(shots.data);
      setOverview(company.data);
      if (isManual) addToast('Workspace data refreshed.', 'info');
    } catch (err: any) {
      show(err.response?.data?.message || 'Could not load company data', true);
      if (err.response?.status === 401 || err.response?.status === 403) logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    show('');
    try {
      const response = await axios.post(`${API_URL}/auth/portal-login`, { username, password });
      if (response.data.user?.role !== 'COMPANY_ADMIN') throw new Error('This portal requires a Company Admin account');
      sessionStorage.setItem('customer_token', response.data.accessToken);
      sessionStorage.setItem('customer_session', JSON.stringify(response.data));
      setSession(response.data);
      setToken(response.data.accessToken);
      addToast('Welcome back! Signed in to Customer Portal.', 'success');
    } catch (err: any) {
      show(err.response?.data?.message || err.message || 'Login failed', true);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/company-admin/employees`, employee, auth(token));
      const createdKey = res.data.licenseKey;
      show(`Employee ${employee.username} created! ${createdKey ? `Activation Key: ${createdKey}` : ''}`);
      setEmployee({ fullName: '', username: '', email: '', password: '' });
      await fetchCustomerData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Could not create employee', true);
    }
  };

  const createLicense = async (employeeId: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/company-admin/employees/${employeeId}/license`,
        { maxDevices: 1 },
        auth(token),
      );
      show(`Employee key created: ${response.data.key}`);
      await navigator.clipboard?.writeText(response.data.key).catch(() => undefined);
      await fetchCustomerData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Could not create employee key', true);
    }
  };

  const licenseAction = async (licenseId: string, action: 'reset-devices' | 'revoke' | 'reactivate') => {
    try {
      await axios.post(`${API_URL}/company-admin/licenses/${licenseId}/${action}`, {}, auth(token));
      show(action === 'revoke' ? 'Employee key revoked.' : action === 'reactivate' ? 'Employee key reactivated!' : 'Employee device binding reset.');
      await fetchCustomerData();
    } catch (err: any) {
      show(err.response?.data?.message || 'License action failed', true);
    }
  };

  const openScreenshot = async (item: any) => {
    try {
      const response = await axios.get(`${API_URL}/screenshots/${item.id}/file`, {
        ...auth(token), responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      show(err.response?.data?.message || 'Could not open screenshot', true);
    }
  };

  const logout = (notifyUser = false) => {
    sessionStorage.removeItem('customer_token');
    sessionStorage.removeItem('customer_session');
    setToken(null);
    setSession(null);
    if (notifyUser) {
      addToast('Signed out of Customer Portal.', 'info');
    }
  };

  const performLogout = () => {
    setLogoutConfirmationOpen(false);
    logout(true);
  };

  const toggleDate = (dayKey: string) => {
    setExpandedDates((current) => ({ ...current, [dayKey]: !current[dayKey] }));
  };

  const toggleEmployee = (folderKey: string) => {
    setExpandedEmployees((current) => ({ ...current, [folderKey]: !current[folderKey] }));
  };

  // ── Login page ────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ background: 'linear-gradient(135deg, #1a2e24 0%, #2d3748 50%, #1a202c 100%)' }}>
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
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">Customer Admin Portal</h1>
                  <p className="text-xs text-gray-500 mt-1">Organisation Screenshots &amp; Employee Licenses</p>
                </div>
                {msg && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">{msg}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Admin Username</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all" />
                  </div>
                  <button disabled={loading}
                    className="w-full py-3 rounded-md text-sm font-semibold text-white disabled:opacity-50 transition-all shadow-sm mt-3 hover:shadow-md active:scale-98"
                    style={{ background: loading ? '#15803d' : 'linear-gradient(135deg, #15803d, #166534)' }}>
                    {loading ? 'Logging in…' : 'Sign In to Portal'}
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
          <p className="text-center text-xs text-green-300 mt-4 opacity-70">Company Admin access only</p>
        </div>
      </div>
    );
  }

  const subscription = overview?.subscription;
  const isActive = subscription?.status === 'ACTIVE' && new Date(subscription.endDate).getTime() > Date.now();
  const storageBytes = screenshots.reduce((total, item) => total + Number(item.fileSize || 0), 0);
  const buildGroupedDays = (itemsList: any[]) => {
    return Object.values(
      itemsList.reduce((days: Record<string, any>, item) => {
        const dayKey = screenshotDayKey(item.capturedAt);
        const employeeName = item.user?.username || 'Unknown employee';
        const day = days[dayKey] || (days[dayKey] = { key: dayKey, capturedAt: item.capturedAt, items: [], employees: {} });
        day.items.push(item);
        const empFolder = day.employees[employeeName] || (day.employees[employeeName] = { name: employeeName, items: [] });
        empFolder.items.push(item);
        return days;
      }, {}),
    ).sort((a: any, b: any) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
     .map((day: any) => ({
        ...day,
        employees: Object.values(day.employees)
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
          .map((folder: any) => ({
            ...folder,
            items: [...folder.items].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()),
          })),
      }));
  };

  const screenshotDays = buildGroupedDays(screenshots);

  const navItems = [
    { id: 'employees' as const, label: 'Employees & Keys', icon: <IconEmployees />, iconColor: '#60a5fa' },
    { id: 'captures' as const, label: 'Employee Captures', icon: <IconCaptures />, iconColor: '#4ade80' },
    { id: 'all-screenshots' as const, label: 'All Screenshots', icon: <IconAllScreenshots />, iconColor: '#a78bfa' },
  ];

  const kpiItems = [
    { label: 'Subscription', value: subscription?.status || 'NOT CONFIGURED', icon: <KpiIconStatus />, accent: '#dcfce7', border: '#bbf7d0' },
    { label: 'Expires', value: subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : '—', icon: <KpiIconExpiry />, accent: '#ede9fe', border: '#ddd6fe' },
    { label: 'Employees', value: `${overview?.usage?.employees || 0} / ${subscription?.maxEmployees || 0}`, icon: <KpiIconEmployees />, accent: '#dbeafe', border: '#bfdbfe' },
    { label: 'Storage', value: `${(storageBytes / 1024 / 1024).toFixed(1)} MB / ${subscription ? (subscription.maxStorageMb / 1024).toFixed(1) : 0} GB`, icon: <KpiIconStorage />, accent: '#ffedd5', border: '#fed7aa' },
  ];

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#f0f2f5' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #1a2e24 0%, #2d3748 100%)' }}
      >
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md overflow-hidden shadow-lg border border-white/20 shrink-0">
              <img src="/logo.png" alt="ScreenAdvait" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">ScreenAdvait</div>
              <div className="text-green-400 text-[11px] font-medium truncate max-w-[130px]">
                {session?.company?.name || 'Customer Portal'}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 px-3 mb-2 tracking-wider">Workspace</div>
          {navItems.map(({ id, label, icon, iconColor }) => {
            const isActiveNav = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all text-sm font-medium"
                style={{
                  background: isActiveNav ? 'linear-gradient(135deg, #15803d, #166534)' : 'transparent',
                  color: isActiveNav ? '#ffffff' : '#9ca3af',
                }}
                onMouseEnter={(e) => { if (!isActiveNav) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'; } }}
                onMouseLeave={(e) => { if (!isActiveNav) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; } }}
              >
                <span style={{ color: isActiveNav ? '#ffffff' : iconColor }}>{icon}</span>
                <span className="flex-1 truncate">{label}</span>
                {isActiveNav && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-3">
            <div className="text-xs text-gray-400">Signed in as</div>
            <div className="text-sm text-white font-semibold truncate">{session?.user?.username || 'Company Admin'}</div>
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

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* ── Header bar ─────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between h-14 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1.5 rounded-md hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-gray-400 hidden sm:inline truncate max-w-[100px]">{session?.company?.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline shrink-0" />
              <span className="font-semibold text-gray-800 truncate">{view === 'captures' ? 'Employee Captures' : 'Employees & Keys'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {DESKTOP_DOWNLOAD_URL && (
              <a href={DESKTOP_DOWNLOAD_URL}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
                <Download className="w-3.5 h-3.5" />
                Download App
              </a>
            )}
            <button onClick={() => fetchCustomerData(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 text-green-700 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
              {(session?.user?.username?.[0] || session?.company?.name?.[0] || 'C').toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile sidebar drawer */}
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
            style={{ background: 'linear-gradient(180deg, #1a2e24 0%, #2d3748 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img src="/logo.png" alt="ScreenAdvait" className="w-8 h-8 rounded-md object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-white font-bold text-sm leading-tight truncate">ScreenAdvait</div>
                  <div className="text-green-400 text-[11px] font-medium truncate max-w-[110px]">{session?.company?.name}</div>
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
              {navItems.map(({ id, label, icon, iconColor }) => {
                const isActiveNav = view === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setView(id);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm font-medium transition-all"
                    style={{
                      background: isActiveNav ? 'linear-gradient(135deg, #15803d, #166534)' : 'transparent',
                      color: isActiveNav ? '#fff' : '#9ca3af',
                    }}
                  >
                    <span style={{ color: isActiveNav ? '#fff' : iconColor }}>{icon}</span>
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

        {/* ── Page content ──────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div key={view} className="mx-auto max-w-[1440px] page-fade-in">

            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {view === 'captures' ? 'Employee Screenshot Management' : view === 'all-screenshots' ? 'All Employee Screenshots' : 'Employees & License Keys'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {view === 'captures' ? 'Review latest team desktop activity captures.' : view === 'all-screenshots' ? 'Full organization screenshot archive with search & custom pagination.' : 'Create employees and issue one-time activation keys for the desktop app.'}
              </p>
            </div>

            {msg && (
              <div className={`mb-5 rounded-md border px-4 py-3 text-xs flex items-start gap-2 ${msgError ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-900'}`}>
                {msgError
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                }
                {msg}
              </div>
            )}
            {!isActive && (
              <div className="mb-5 flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Company subscription is <strong>{subscription?.status || 'NOT CONFIGURED'}</strong>. Screenshots remain viewable, but new employees, keys, desktop logins, captures, and uploads are blocked until the superadmin renews or activates it.</span>
              </div>
            )}

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiItems.map(({ label, value, icon, accent, border }) => (
                <div key={label} className="bg-white rounded-md shadow-sm border border-gray-200 p-4 sm:p-5 flex items-start gap-3 hover:shadow-md transition-shadow">
                  <div className="rounded-md p-2.5 shrink-0" style={{ background: accent, border: `1px solid ${border}` }}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 font-medium truncate">{label}</div>
                    <div className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 break-words">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Captures view */}
            {view === 'captures' ? (
              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Latest Captured Employee Screenshots</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Showing recent 5 screenshot records. Open a folder to view details.</p>
                  </div>
                  {screenshots.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setView('all-screenshots')}
                      className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>View All ({screenshots.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {screenshots.length ? (
                  <div className="space-y-3">
                    {buildGroupedDays(screenshots.slice(0, 5)).map((day: any) => {
                      const dateOpen = Boolean(expandedDates[day.key] ?? false);
                      return (
                        <section key={day.key} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                          <button type="button" aria-expanded={dateOpen} onClick={() => toggleDate(day.key)}
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 sm:px-5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-green-200 bg-green-50 text-green-700">
                              <Folder className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-gray-900">
                                {isToday(day.capturedAt) ? 'Today — ' : ''}{screenshotDayLabel(day.capturedAt)}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-400">
                                {day.employees.length} employee{day.employees.length === 1 ? '' : 's'} · {day.items.length} screenshot{day.items.length === 1 ? '' : 's'}
                              </span>
                            </span>
                            {dateOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
                          </button>
                          {dateOpen && (
                            <div className="space-y-2 border-t border-gray-100 bg-gray-50 p-3 sm:p-4">
                              {day.employees.map((employeeFolder: any) => {
                                const folderKey = `${day.key}::${employeeFolder.name}`;
                                const employeeOpen = Boolean(expandedEmployees[folderKey] ?? false);
                                return (
                                  <section key={folderKey} className="overflow-hidden rounded-md border border-gray-200 bg-white">
                                    <button type="button" aria-expanded={employeeOpen} onClick={() => toggleEmployee(folderKey)}
                                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-green-50/50">
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 border border-blue-100 text-blue-600">
                                        <UserRound className="h-4 w-4" />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-bold text-gray-900">{employeeFolder.name}</span>
                                        <span className="block text-[11px] text-gray-400">{employeeFolder.items.length} screenshot{employeeFolder.items.length === 1 ? '' : 's'}</span>
                                      </span>
                                      <span className="hidden rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 sm:inline">
                                        Employee folder
                                      </span>
                                      {employeeOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
                                    </button>
                                     {employeeOpen && (
                                       <div className="max-h-[380px] overflow-y-auto border-t border-gray-100 bg-gray-50/70 p-3">
                                         <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
                                           {employeeFolder.items.map((item: any) => (
                                             <button
                                               key={item.id}
                                               type="button"
                                               onClick={() => openScreenshot(item)}
                                               title={`Click to view ${item.fileName} (${new Date(item.capturedAt).toLocaleTimeString()})`}
                                               className="group flex flex-col justify-between rounded-md border border-gray-200 bg-white p-1.5 px-2 text-left transition-all hover:border-green-600 hover:bg-green-50/60 hover:shadow-md"
                                             >
                                               <div className="flex w-full items-center justify-between gap-1 text-[10px] font-bold text-gray-800 group-hover:text-green-900">
                                                 <span className="truncate">{new Date(item.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                 <ExternalLink className="h-2.5 w-2.5 shrink-0 text-gray-400 group-hover:text-green-700" />
                                               </div>
                                               <div className="mt-1 flex min-w-0 items-center justify-between text-[9px] font-mono text-gray-500">
                                                 <span className="max-w-[50px] truncate" title={item.fileName}>{item.fileName}</span>
                                                 <span className="shrink-0 font-sans font-medium text-gray-400">{fileSizeLabel(item.fileSize)}</span>
                                               </div>
                                             </button>
                                           ))}
                                         </div>
                                       </div>
                                     )}
                                  </section>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      );
                    })}

                    <div className="mt-5 p-4 bg-white border border-gray-200 rounded-md flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div className="text-xs text-gray-600 font-medium">
                        Showing <b>latest 5</b> employee captures out of <b>{screenshots.length} total</b>.
                      </div>
                      <button
                        type="button"
                        onClick={() => setView('all-screenshots')}
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span>View All Screenshots ({screenshots.length})</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-200 bg-white py-16 text-center shadow-sm">
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <Image className="w-7 h-7 text-gray-300" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-400">No screenshots captured yet</p>
                    <p className="text-xs text-gray-300 mt-1">Screenshots will appear here once employees run the desktop app.</p>
                  </div>
                )}
              </section>
            ) : view === 'all-screenshots' ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-md shadow-sm">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={archiveSearch}
                      onChange={(e) => {
                        setArchiveSearch(e.target.value);
                        setArchivePage(1);
                      }}
                      placeholder="Filter by employee username or filename..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-md pl-9 pr-3 py-2 text-xs text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span className="font-medium">Records per page:</span>
                    <div className="relative" ref={archiveDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setArchiveDropdownOpen((prev) => !prev)}
                        className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-green-600 text-gray-800 text-xs font-semibold rounded-md px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-all outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      >
                        <span>{archivePageSize} records</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${archiveDropdownOpen ? 'rotate-180 text-green-700' : ''}`} />
                      </button>

                      {archiveDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 page-fade-in">
                          {[10, 15, 20, 25].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setArchivePageSize(size);
                                setArchivePage(1);
                                setArchiveDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                                archivePageSize === size
                                  ? 'bg-green-50 text-green-800 font-bold'
                                  : 'text-gray-700 hover:bg-green-50/70 hover:text-green-900'
                              }`}
                            >
                              <span>{size} records</span>
                              {archivePageSize === size && <Check className="w-3.5 h-3.5 text-green-700 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {(() => {
                  const matching = screenshots.filter((item) => {
                    if (!archiveSearch) return true;
                    const q = archiveSearch.toLowerCase();
                    const user = (item.user?.username || '') + ' ' + (item.user?.fullName || '');
                    return user.toLowerCase().includes(q) || (item.fileName || '').toLowerCase().includes(q);
                  });

                  const totalItems = matching.length;
                  const totalPages = Math.max(1, Math.ceil(totalItems / archivePageSize));
                  const safePage = Math.min(Math.max(1, archivePage), totalPages);
                  const startIndex = (safePage - 1) * archivePageSize;
                  const endIndex = Math.min(startIndex + archivePageSize, totalItems);
                  const paginatedItems = matching.slice(startIndex, endIndex);
                  const archiveDays = buildGroupedDays(paginatedItems);

                  return (
                    <>
                      {archiveDays.length > 0 ? (
                        <div className="space-y-3">
                          {archiveDays.map((day: any) => {
                            const dateOpen = Boolean(expandedDates[`archive::${day.key}`] ?? false);
                            return (
                              <section key={day.key} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                                <button type="button" aria-expanded={dateOpen} onClick={() => toggleDate(`archive::${day.key}`)}
                                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 sm:px-5">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-green-200 bg-green-50 text-green-700">
                                    <Folder className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-bold text-gray-900">
                                      {isToday(day.capturedAt) ? 'Today — ' : ''}{screenshotDayLabel(day.capturedAt)}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-gray-400">
                                      {day.employees.length} employee{day.employees.length === 1 ? '' : 's'} · {day.items.length} screenshot{day.items.length === 1 ? '' : 's'}
                                    </span>
                                  </span>
                                  {dateOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
                                </button>
                                {dateOpen && (
                                  <div className="space-y-2 border-t border-gray-100 bg-gray-50 p-3 sm:p-4">
                                    {day.employees.map((employeeFolder: any) => {
                                      const folderKey = `archive::${day.key}::${employeeFolder.name}`;
                                      const employeeOpen = Boolean(expandedEmployees[folderKey] ?? false);
                                      return (
                                        <section key={folderKey} className="overflow-hidden rounded-md border border-gray-200 bg-white">
                                          <button type="button" aria-expanded={employeeOpen} onClick={() => toggleEmployee(folderKey)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-green-50/50">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 border border-blue-100 text-blue-600">
                                              <UserRound className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                              <span className="block truncate text-xs font-bold text-gray-900">{employeeFolder.name}</span>
                                              <span className="block text-[11px] text-gray-400">{employeeFolder.items.length} screenshot{employeeFolder.items.length === 1 ? '' : 's'}</span>
                                            </span>
                                            <span className="hidden rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 sm:inline">
                                              Employee folder
                                            </span>
                                            {employeeOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
                                          </button>
                                          {employeeOpen && (
                                            <div className="max-h-[380px] overflow-y-auto border-t border-gray-100 bg-gray-50/70 p-3">
                                              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
                                                {employeeFolder.items.map((item: any) => (
                                                  <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => openScreenshot(item)}
                                                    title={`Click to view ${item.fileName} (${new Date(item.capturedAt).toLocaleTimeString()})`}
                                                    className="group flex flex-col justify-between rounded-md border border-gray-200 bg-white p-1.5 px-2 text-left transition-all hover:border-green-600 hover:bg-green-50/60 hover:shadow-md"
                                                  >
                                                    <div className="flex w-full items-center justify-between gap-1 text-[10px] font-bold text-gray-800 group-hover:text-green-900">
                                                      <span className="truncate">{new Date(item.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                      <ExternalLink className="h-2.5 w-2.5 shrink-0 text-gray-400 group-hover:text-green-700" />
                                                    </div>
                                                    <div className="mt-1 flex min-w-0 items-center justify-between text-[9px] font-mono text-gray-500">
                                                      <span className="max-w-[50px] truncate" title={item.fileName}>{item.fileName}</span>
                                                      <span className="shrink-0 font-sans font-medium text-gray-400">{fileSizeLabel(item.fileSize)}</span>
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </section>
                                      );
                                    })}
                                  </div>
                                )}
                              </section>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-md border border-gray-200 bg-white py-16 text-center shadow-sm">
                          <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-medium text-gray-500">No screenshots match your search query.</p>
                        </div>
                      )}

                      {totalItems > 0 && (
                        <div className="p-4 bg-white border border-gray-200 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                          <div className="text-gray-500 font-medium">
                            Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to <span className="font-bold text-gray-800">{endIndex}</span> of <span className="font-bold text-gray-800">{totalItems}</span> screenshots
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              disabled={safePage <= 1}
                              onClick={() => setArchivePage((p) => Math.max(1, p - 1))}
                              className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Previous</span>
                            </button>

                            <div className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-50 rounded-md border border-gray-200">
                              Page {safePage} of {totalPages}
                            </div>

                            <button
                              disabled={safePage >= totalPages}
                              onClick={() => setArchivePage((p) => Math.min(totalPages, p + 1))}
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
              </section>
            ) : (
              <>
                <section className="mb-6 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <h2 className="font-bold text-sm text-gray-900">Create New Employee</h2>
                    <p className="text-xs text-gray-400 mt-0.5">New employees automatically receive a unique activation key upon creation.</p>
                  </div>
                  <form onSubmit={createEmployee} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                    <Field label="Full name" value={employee.fullName} onChange={(value) => setEmployee({ ...employee, fullName: value })} />
                    <Field label="Username" value={employee.username} onChange={(value) => setEmployee({ ...employee, username: value })} />
                    <Field label="Email" value={employee.email} onChange={(value) => setEmployee({ ...employee, email: value })} type="email" />
                    <Field label="Temporary password" value={employee.password} onChange={(value) => setEmployee({ ...employee, password: value })} type="password" />
                    <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                      <button disabled={!isActive}
                        className="w-full text-white py-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
                        <Plus className="w-4 h-4" />Create Employee
                      </button>
                    </div>
                  </form>
                </section>

                <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-sm text-gray-900">Company Employees &amp; Licenses</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{overview?.employees?.length || 0} employees registered</p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span className="font-medium">Records per page:</span>
                      <div className="relative" ref={empDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setEmpDropdownOpen((prev) => !prev)}
                          className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-green-600 text-gray-800 text-xs font-semibold rounded-md px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-all outline-none"
                        >
                          <span>{empPageSize} records</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${empDropdownOpen ? 'rotate-180 text-green-700' : ''}`} />
                        </button>
                        {empDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 page-fade-in">
                            {[10, 15, 20, 25].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => {
                                  setEmpPageSize(size);
                                  setEmpPage(1);
                                  setEmpDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                                  empPageSize === size
                                    ? 'bg-green-50 text-green-800 font-bold'
                                    : 'text-gray-700 hover:bg-green-50/70 hover:text-green-900'
                                }`}
                              >
                                <span>{size} records</span>
                                {empPageSize === size && <Check className="w-3.5 h-3.5 text-green-700 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const allEmps = overview?.employees || [];
                    const totalEmpItems = allEmps.length;
                    const totalEmpPages = Math.max(1, Math.ceil(totalEmpItems / empPageSize));
                    const safeEmpPage = Math.min(Math.max(1, empPage), totalEmpPages);
                    const empStartIndex = (safeEmpPage - 1) * empPageSize;
                    const empEndIndex = Math.min(empStartIndex + empPageSize, totalEmpItems);
                    const paginatedEmployees = allEmps.slice(empStartIndex, empEndIndex);

                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-[860px] w-full text-left text-xs">
                            <thead style={{ background: '#f8fafc' }}>
                              <tr className="text-gray-500 uppercase text-[11px] font-semibold tracking-wide border-b border-gray-100">
                                <th className="px-5 py-3">Employee</th>
                                <th className="px-3 py-3">Username</th>
                                <th className="px-3 py-3">License Key</th>
                                <th className="px-3 py-3">Devices</th>
                                <th className="px-3 py-3">Status / Expiry</th>
                                <th className="px-3 py-3">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {paginatedEmployees.map((item: any) => {
                                const license = item.licenses?.[0];
                                return (
                                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-[11px] font-bold shrink-0">
                                          {(item.fullName?.[0] || item.username?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-gray-800">{item.fullName}</div>
                                          <div className="text-gray-400 text-[11px]">{item.email}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 font-mono text-gray-600">{item.username}</td>
                                    <td className="px-3 py-3">
                                      {license ? (
                                        <button onClick={() => navigator.clipboard?.writeText(license.key)}
                                          className="flex gap-1.5 font-mono text-xs text-green-800 hover:underline items-center" title="Click to copy key">
                                          <span>{license.key}</span>
                                          <Copy className="h-3 w-3 text-gray-400" />
                                        </button>
                                      ) : <span className="text-gray-400 italic">Not generated</span>}
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">{license ? `${license.currentDevices} / ${license.maxDevices}` : '—'}</td>
                                    <td className="px-3 py-3">
                                      {license ? (
                                        <>
                                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] border ${license.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {license.status}
                                          </span>
                                          <div className="text-gray-400 text-[11px] mt-0.5">{new Date(license.expiryDate).toLocaleDateString()}</div>
                                        </>
                                      ) : '—'}
                                    </td>
                                    <td className="px-3 py-3 space-x-2 whitespace-nowrap">
                                      {!license && (
                                        <button disabled={!isActive} onClick={() => createLicense(item.id)}
                                          className="rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                                          style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}>
                                          <KeyRound className="mr-1 inline h-3 w-3" />Generate Key
                                        </button>
                                      )}
                                      {license && (
                                        <button onClick={() => licenseAction(license.id, 'reset-devices')}
                                          className="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 transition-colors">
                                          <RotateCcw className="mr-1 inline h-3 w-3" />Reset
                                        </button>
                                      )}
                                      {license && license.status === 'REVOKED' && (
                                        <button onClick={() => licenseAction(license.id, 'reactivate')}
                                          className="rounded-md bg-green-700 hover:bg-green-800 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all">
                                          <Check className="mr-1 inline h-3 w-3" />Activate Key
                                        </button>
                                      )}
                                      {license && license.status !== 'REVOKED' && (
                                        <button onClick={() => licenseAction(license.id, 'revoke')}
                                          className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">
                                          <XCircle className="mr-1 inline h-3 w-3" />Revoke
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {totalEmpItems > 0 && (
                          <div className="px-5 py-3.5 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="text-gray-500 font-medium">
                              Showing <span className="font-bold text-gray-800">{empStartIndex + 1}</span> to <span className="font-bold text-gray-800">{empEndIndex}</span> of <span className="font-bold text-gray-800">{totalEmpItems}</span> employees
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <button
                                disabled={safeEmpPage <= 1}
                                onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Previous</span>
                              </button>
                              <div className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-50 rounded-md border border-gray-200">
                                Page {safeEmpPage} of {totalEmpPages}
                              </div>
                              <button
                                disabled={safeEmpPage >= totalEmpPages}
                                onClick={() => setEmpPage((p) => Math.min(totalEmpPages, p + 1))}
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
                </section>
              </>
            )}

          </div>
        </main>
      </div>

      <ConfirmDialog open={logoutConfirmationOpen} onCancel={() => setLogoutConfirmationOpen(false)} onConfirm={performLogout} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="text-xs font-semibold text-gray-600">
      {label}
      <input required minLength={type === 'password' ? 10 : undefined} type={type} autoComplete={type === 'password' ? 'new-password' : 'off'} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5 text-xs font-normal outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all" />
    </label>
  );
}
