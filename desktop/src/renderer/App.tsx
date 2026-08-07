import React, { useState, useEffect } from 'react';
import { LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GalleryPage } from './pages/GalleryPage';
import { QueuePage } from './pages/QueuePage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ToastContainer, ToastMessage } from './ToastContainer';

function maskedLicenseKey(value?: string) {
  if (!value) return 'Protected';
  const parts = value.split('-');
  return parts.length >= 2
    ? `${parts[0]}-****-****-****-${parts.at(-1)?.slice(-4) || '****'}`
    : `****${value.slice(-4)}`;
}

type PagePath = '/' | '/gallery' | '/queue' | '/settings' | '/profile';
const VALID_PAGE_PATHS = new Set<PagePath>([
  '/',
  '/gallery',
  '/queue',
  '/settings',
  '/profile',
]);

function currentPagePath(): PagePath {
  const value = window.location.hash.replace(/^#/, '') || '/';
  return VALID_PAGE_PATHS.has(value as PagePath) ? (value as PagePath) : '/';
}

// ── Colorful SVG nav icons ────────────────────────────────────────────────────
function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#4ade80'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
function IconGallery({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#60a5fa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}
function IconUpload({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#a78bfa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
      <path d="M12 12v9"/>
      <path d="m16 16-4-4-4 4"/>
    </svg>
  );
}
function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#fb923c'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#f472b6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

export function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [page, setPage] = useState<PagePath>(currentPagePath);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((current) => [...current, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (window.electronAPI) {
          const cached = await window.electronAPI.getSession();
          if (cached && (cached.accessToken || cached.user)) {
            setSession(cached);
          }
        }
      } catch (e) {
        console.error('Session restore error:', e);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!session || !window.electronAPI) return;
    const timer = window.setInterval(async () => {
      const current = await window.electronAPI.getSession();
      if (!current) setSession(null);
      else if (current.accessToken !== session.accessToken) setSession(current);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!logoutConfirmationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLogoutConfirmationOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [logoutConfirmationOpen]);

  useEffect(() => {
    const handleHashChange = () => setPage(currentPagePath());
    window.addEventListener('hashchange', handleHashChange);
    if (!VALID_PAGE_PATHS.has(window.location.hash.replace(/^#/, '') as PagePath)) {
      window.location.hash = '/';
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (destination: PagePath) => {
    if (page === destination) return;
    window.location.hash = destination;
    setPage(destination);
  };

  const requestLogout = () => setLogoutConfirmationOpen(true);

  const performLogout = async () => {
    setLogoutConfirmationOpen(false);
    if (window.electronAPI) {
      await window.electronAPI.logout();
    }
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm" style={{ background: '#f0f2f5' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-md overflow-hidden shadow-md border border-gray-200">
            <img src="./logo.png" alt="" className="w-full h-full object-cover" />
          </div>
          <span>Loading Desktop Platform…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <LoginPage onLoginSuccess={(data) => {
          addToast(`Welcome back, ${data.user?.fullName || data.user?.username}!`, 'success');
          setSession(data);
        }} addToast={addToast} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  const navLinks = [
    { to: '/', label: 'Dashboard', Icon: IconDashboard },
    { to: '/gallery', label: 'Gallery', Icon: IconGallery },
    { to: '/queue', label: 'Upload Queue', Icon: IconUpload },
    { to: '/profile', label: 'Profile', Icon: IconProfile },
  ];

  return (
    <>
      <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#f0f2f5' }}>

        {/* ── Dark sidebar ──────────────────────────────────────────── */}
        <div
          className="w-56 flex flex-col shrink-0 overflow-y-auto"
          style={{ background: 'linear-gradient(180deg, #1e2d1e 0%, #2d3748 100%)' }}
        >
          {/* Brand */}
          <div className="px-4 py-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md overflow-hidden shadow-lg border border-white/20 shrink-0">
                <img src="./logo.png" alt="ScreenAdvait" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">ScreenAdvait</div>
                <div className="text-green-400 text-[10px] font-medium">Desktop Client</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2.5 py-4 space-y-0.5">
            <div className="text-[9px] uppercase font-bold text-gray-500 px-3 mb-2.5 tracking-widest">Navigation</div>
            {navLinks.map(({ to, label, Icon }) => {
              const isActive = page === to;
              return (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to as PagePath)}
                className="block w-full text-left"
              >
                  <span
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #15803d, #166534)' : 'transparent',
                      color: isActive ? '#ffffff' : '#9ca3af',
                    }}
                    onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLSpanElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLSpanElement).style.color = '#e5e7eb'; } }}
                    onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLSpanElement).style.background = 'transparent'; (e.currentTarget as HTMLSpanElement).style.color = '#9ca3af'; } }}
                  >
                    <Icon active={isActive} />
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </span>
              </button>
            )})}
          </nav>

          {/* User card */}
          <div className="px-2.5 py-3 border-t border-white/10">
            <div className="flex items-center justify-between px-2.5 py-2">
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">{session?.user?.fullName || 'Employee'}</div>
                <div className="text-[10px] text-green-400 font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Tray Active</span>
                </div>
              </div>
              <button onClick={requestLogout} title="Sign Out"
                className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-red-600/20 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Main workspace ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <header className="h-11 border-b border-gray-200 bg-white px-5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="text-[11px] font-semibold tracking-wide text-gray-500 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
              <span>Hardware GUID Lock Verified</span>
              <span className="text-gray-300">•</span>
              <span className="text-green-700 font-mono">
                License: {maskedLicenseKey(session?.licenseStatus?.key)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
              Desktop Service Ready
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-5" style={{ background: '#f0f2f5' }}>
            {page === '/' && <DashboardPage session={session} addToast={addToast} onNavigate={navigate} />}
            {page === '/gallery' && <GalleryPage />}
            {page === '/queue' && <QueuePage addToast={addToast} />}
            {page === '/profile' && <ProfilePage session={session} onLogout={requestLogout} />}
          </main>
        </div>
      </div>

      {/* ── Logout confirmation dialog ──────────────────────────────── */}
      {logoutConfirmationOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          onMouseDown={() => setLogoutConfirmationOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-md border border-gray-200 bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="p-5">
              <div className="w-10 h-10 rounded-md bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <h2 id="logout-dialog-title" className="text-base font-bold text-gray-900">
                Sign out of ScreenAdvait?
              </h2>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Background captures will stop until you sign in again. Your saved license will
                remain protected on this device.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-md flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmationOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void performLogout()}
                className="px-4 py-2 rounded-md bg-red-600 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
}
