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
  Trash2,
  Eye,
  EyeOff,
  Power,
} from 'lucide-react';
import axios from 'axios';
import { ConfirmDialog } from './ConfirmDialog';
import { ActionIconButton } from './ActionIconButton';
import { ToastContainer, ToastMessage } from './ToastContainer';

const API_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.origin}/api/v1`;
const DESKTOP_DOWNLOAD_URL =
  import.meta.env.VITE_DESKTOP_DOWNLOAD_URL ||
  '/download/ScreenAdvait-Desktop-Setup.zip';
const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

async function fetchCompanyDayScreenshots(token: string, day: string, search = '') {
  const items: any[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 1000; page += 1) {
    const response: any = await axios.get(`${API_URL}/screenshots/company`, {
      ...auth(token),
      params: { limit: 1000, day, search, timeZone, ...(cursor ? { cursor } : {}) },
    });
    if (Array.isArray(response.data)) return response.data;
    const pageItems = Array.isArray(response.data?.items) ? response.data.items : [];
    items.push(...pageItems);
    cursor = response.data?.nextCursor || null;
    if (!cursor) return items;
  }
  throw new Error('This date folder is too large to load.');
}

function apiErrorMessage(error: any, fallback: string) {
  const details = error.response?.data?.errors;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((item: any) => item.message).join(' ');
  }
  return error.response?.data?.message || error.message || fallback;
}

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

function isStrongPassword(value: string) {
  return value.length >= 6;
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

// ── SVG KPI icons ─────────────────────────────────────────────────────────────
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
interface CustomerDashboardProps {
  token: string;
  session: any;
  onLogout: () => void;
}

type PendingAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: 'danger' | 'warning' | 'success' | 'info';
  icon: React.ReactNode;
  run: () => Promise<void>;
};

export function CustomerDashboard({ token, session, onLogout }: CustomerDashboardProps) {
  const [recentDays, setRecentDays] = useState<any[]>([]);
  const [archiveDays, setArchiveDays] = useState<any[]>([]);
  const [archiveTotalDays, setArchiveTotalDays] = useState(0);
  const [archiveTotalScreenshots, setArchiveTotalScreenshots] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const daysRequest = React.useRef(0);
  const employeesRequest = React.useRef(0);
  const loadedDays = React.useRef(new Set<string>());
  const loadingDays = React.useRef(new Set<string>());
  const [overview, setOverview] = useState<any>(null);
  const [view, setView] = useState<'captures' | 'all-screenshots' | 'employees' | 'capture-settings'>('employees');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [archivePageSize, setArchivePageSize] = useState<number>(10);
  const [archivePage, setArchivePage] = useState<number>(1);
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archiveDropdownOpen, setArchiveDropdownOpen] = useState<boolean>(false);
  const archiveDropdownRef = React.useRef<HTMLDivElement>(null);

  // Capture Settings state for explicit Save
  const [selectedInterval, setSelectedInterval] = useState<number>(900);
  const [selectedPaused, setSelectedPaused] = useState<boolean>(false);
  const [savingCaptureSettings, setSavingCaptureSettings] = useState<boolean>(false);
  const [showResetPass, setShowResetPass] = useState<boolean>(false);

  // Google Drive Connection State
  const [driveConn, setDriveConn] = useState<{
    connected: boolean;
    accountEmail?: string | null;
    rootFolderName?: string | null;
    lastVerifiedAt?: string | null;
  } | null>(null);
  const [driveRefreshToken, setDriveRefreshToken] = useState('');
  const [driveClientId, setDriveClientId] = useState('');
  const [driveClientSecret, setDriveClientSecret] = useState('');
  const [driveRootFolder, setDriveRootFolder] = useState('ScreenAdvait Screenshots');
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveTesting, setDriveTesting] = useState(false);

  const loadDriveConnection = async () => {
    try {
      const res = await axios.get(`${API_URL}/company-admin/drive-connection`, auth(token));
      setDriveConn(res.data);
      if (res.data?.rootFolderName) setDriveRootFolder(res.data.rootFolderName);
    } catch {
      // ignore
    }
  };

  const handleSaveDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/company-admin/drive-connection`,
        {
          refreshToken: driveRefreshToken,
          clientId: driveClientId || undefined,
          clientSecret: driveClientSecret || undefined,
          rootFolderName: driveRootFolder,
        },
        auth(token),
      );
      setDriveConn(res.data);
      addToast('Google Drive connected successfully!', 'success');
      setDriveRefreshToken('');
    } catch (err: any) {
      addToast(apiErrorMessage(err, 'Failed to connect Google Drive'), 'error');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleTestDrive = async () => {
    setDriveTesting(true);
    try {
      const res = await axios.post(`${API_URL}/company-admin/drive-connection/test`, {}, auth(token));
      addToast(`Google Drive verified for ${res.data.accountEmail}!`, 'success');
      await loadDriveConnection();
    } catch (err: any) {
      addToast(apiErrorMessage(err, 'Google Drive health check failed'), 'error');
    } finally {
      setDriveTesting(false);
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      await axios.post(`${API_URL}/company-admin/drive-connection/disconnect`, {}, auth(token));
      setDriveConn({ connected: false });
      addToast('Google Drive disconnected.', 'info');
    } catch (err: any) {
      addToast(apiErrorMessage(err, 'Failed to disconnect Google Drive'), 'error');
    }
  };

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

  const [employee, setEmployee] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });
  const [passwordResetTarget, setPasswordResetTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [replacementPassword, setReplacementPassword] = useState('');

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((current) => [...current, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  };

  useEffect(() => {
    void fetchSummary().catch((error) => handleLoadError(error, 'Could not load company data'));
  }, [token]);

  useEffect(() => {
    if (view === 'employees') void fetchEmployeePage().catch((error) => handleLoadError(error, 'Could not load employees'));
  }, [token, view, empPage, empPageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(archiveSearch), 300);
    return () => window.clearTimeout(timer);
  }, [archiveSearch]);

  useEffect(() => {
    if (view === 'captures' || view === 'all-screenshots') void fetchDays().catch((error) => handleLoadError(error, 'Could not load screenshot folders'));
  }, [token, view, archivePage, archivePageSize, debouncedSearch]);

  const show = (value: string, isError = false) => {
    setMessage(value);
    setMessageIsError(isError);
    if (value) addToast(value, isError ? 'error' : 'success');
  };

  const handleLoadError = (error: any, fallback: string) => {
    show(apiErrorMessage(error, fallback), true);
    if (error.response?.status === 401 || error.response?.status === 403) onLogout();
  };

  const fetchSummary = async () => {
    const response = await axios.get(`${API_URL}/company-admin/summary`, auth(token));
    setOverview(response.data);
    if (response.data?.captureSettings) {
      setSelectedInterval(response.data.captureSettings.captureIntervalSeconds ?? 900);
      setSelectedPaused(response.data.captureSettings.isCapturePaused ?? false);
    }
  };

  const fetchEmployeePage = async () => {
    const request = ++employeesRequest.current;
    const response = await axios.get(`${API_URL}/company-admin/employees`, {
      ...auth(token), params: { page: empPage, pageSize: empPageSize },
    });
    if (request !== employeesRequest.current) return;
    setEmployees(response.data.items);
    setTotalEmployees(response.data.total);
    const lastPage = Math.max(1, Math.ceil(response.data.total / empPageSize));
    if (empPage > lastPage) setEmpPage(lastPage);
  };

  const fetchDays = async () => {
    const request = ++daysRequest.current;
    const recent = view === 'captures';
    const response = await axios.get(`${API_URL}/screenshots/company/days`, {
      ...auth(token),
      params: { page: recent ? 1 : archivePage, pageSize: recent ? 5 : archivePageSize,
        search: recent ? '' : debouncedSearch, timeZone },
    });
    if (request !== daysRequest.current) return;
    const days = response.data.items.map((day: any) => ({ ...day, items: [], employees: [] }));
    loadedDays.current.clear();
    loadingDays.current.clear();
    setExpandedDates({});
    setExpandedEmployees({});
    if (recent) setRecentDays(days);
    else {
      setArchiveDays(days);
      setArchiveTotalDays(response.data.totalDays);
      setArchiveTotalScreenshots(response.data.totalScreenshots);
      const lastPage = Math.max(1, Math.ceil(response.data.totalDays / archivePageSize));
      if (archivePage > lastPage) setArchivePage(lastPage);
    }
  };

  const [employees, setEmployees] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const fetchCustomerData = async (isManual = false) => {
    setLoading(true);
    try {
      await Promise.all([fetchSummary(), ...(view === 'employees' ? [fetchEmployeePage()] : view === 'captures' || view === 'all-screenshots' ? [fetchDays()] : [])]);
      if (isManual) addToast('Workspace data refreshed.', 'info');
    } catch (error: any) {
      show(apiErrorMessage(error, 'Could not load company data'), true);
      if (error.response?.status === 401 || error.response?.status === 403) onLogout();
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    if (employee.fullName.trim().length < 2) { show('Full name must be at least 2 characters.', true); return; }
    if (employee.username.trim().length < 3) { show('Username must be at least 3 characters.', true); return; }
    if (!/^\S+@\S+\.\S+$/.test(employee.email.trim())) { show('Enter a valid employee email address.', true); return; }
    if (!isStrongPassword(employee.password)) {
      show('Temporary password must be at least 6 characters.', true);
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/company-admin/employees`, {
        ...employee,
        fullName: employee.fullName.trim(),
        username: employee.username.trim(),
        email: employee.email.trim().toLowerCase(),
      }, auth(token));
      const licenseKey = response.data?.licenseKey;
      if (licenseKey) {
        await navigator.clipboard?.writeText(licenseKey).catch(() => undefined);
        show(`Employee ${employee.username} created. Their activation key was copied: ${licenseKey}`);
      } else {
        show(`Employee ${employee.username} created.`);
      }
      setEmployee({ fullName: '', username: '', email: '', password: '' });
      await fetchCustomerData();
    } catch (error: any) {
      show(apiErrorMessage(error, 'Could not create employee'), true);
    }
  };

  const setEmployeeStatus = async (item: any, isActive: boolean) => {
    try {
      await axios.post(
        `${API_URL}/company-admin/employees/${item.id}/status`,
        { isActive },
        auth(token),
      );
      show(`${item.username} ${isActive ? 'enabled' : 'disabled'}.`);
      await fetchCustomerData();
    } catch (error: any) {
      show(apiErrorMessage(error, 'Could not update employee status'), true);
    }
  };

  const deleteEmployee = async (item: any) => {
    try {
      await axios.post(
        `${API_URL}/company-admin/employees/${item.id}/delete`,
        {},
        auth(token),
      );
      show(`Employee ${item.fullName || item.username} permanently deleted.`);
      await fetchCustomerData();
    } catch (error: any) {
      show(apiErrorMessage(error, 'Could not delete employee'), true);
    }
  };

  const resetEmployeePassword = async () => {
    if (!passwordResetTarget) return;
    try {
      await axios.post(
        `${API_URL}/company-admin/employees/${passwordResetTarget.id}/reset-password`,
        { newPassword: replacementPassword },
        auth(token),
      );
      show(`Password reset for ${passwordResetTarget.username}. Existing sessions were signed out.`);
      setPasswordResetTarget(null);
      setReplacementPassword('');
    } catch (error: any) {
      show(apiErrorMessage(error, 'Could not reset employee password'), true);
    }
  };

  const requestPasswordReset = (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordResetTarget) return;
    if (replacementPassword.length < 6) {
      show('New password must be at least 6 characters.', true);
      return;
    }
    setPendingAction({
      title: `Reset ${passwordResetTarget.username}'s password?`,
      description: 'Their current sessions will be signed out and the new temporary password will take effect.',
      confirmLabel: 'Reset password', tone: 'warning', icon: <KeyRound className="h-4 w-4" />,
      run: resetEmployeePassword,
    });
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
    } catch (error: any) {
      show(apiErrorMessage(error, 'Could not create employee key'), true);
    }
  };

  const licenseAction = async (licenseId: string, action: 'reset-devices' | 'revoke' | 'reactivate') => {
    try {
      await axios.post(
        `${API_URL}/company-admin/licenses/${licenseId}/${action}`,
        {},
        auth(token),
      );
      show(action === 'revoke' ? 'Employee key revoked.' : action === 'reactivate' ? 'Employee key reactivated!' : 'Employee device binding reset.');
      await fetchCustomerData();
    } catch (error: any) {
      show(apiErrorMessage(error, 'License action failed'), true);
    }
  };

  const openScreenshot = (item: any) => {
    const fileUrl = `${API_URL}/screenshots/${item.id}/file?token=${encodeURIComponent(token)}`;
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const subscription = overview?.subscription;
  const isActive =
    subscription?.status === 'ACTIVE' &&
    new Date(subscription.endDate).getTime() > Date.now();
  const buildGroupedDays = (itemsList: any[]) => {
    return Object.values(
      itemsList.reduce(
        (days: Record<string, { key: string; capturedAt: string; items: any[]; employees: Record<string, { name: string; items: any[] }> }>, item) => {
          const dayKey = screenshotDayKey(item.capturedAt);
          const employeeName = item.user?.username || 'Unknown employee';
          const day = days[dayKey] || (days[dayKey] = { key: dayKey, capturedAt: item.capturedAt, items: [], employees: {} });
          day.items.push(item);
          const employeeFolder = day.employees[employeeName] || (day.employees[employeeName] = { name: employeeName, items: [] });
          employeeFolder.items.push(item);
          return days;
        },
        {},
      ),
    )
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .map((day) => ({
        ...day,
        employees: Object.values(day.employees)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((employeeFolder) => ({
            ...employeeFolder,
            items: [...employeeFolder.items].sort(
              (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
            ),
          })),
      }));
  };

  const screenshotDays = recentDays;

  const toggleDate = (dayKey: string) => {
    setExpandedDates((current) => ({ ...current, [dayKey]: !current[dayKey] }));
    if (loadedDays.current.has(dayKey) || loadingDays.current.has(dayKey)) return;
    loadingDays.current.add(dayKey);
    const request = daysRequest.current;
    const archive = dayKey.startsWith('archive::');
    const day = archive ? dayKey.slice('archive::'.length) : dayKey;
    void fetchCompanyDayScreenshots(token, day, archive ? debouncedSearch : '')
      .then((items) => {
        if (request !== daysRequest.current) return;
        const grouped = buildGroupedDays(items)[0];
        const update = (days: any[]) => days.map((item) => item.key === day
          ? { ...item, items, employees: grouped?.employees || [] }
          : item);
        if (archive) setArchiveDays(update);
        else setRecentDays(update);
        loadedDays.current.add(dayKey);
      })
      .catch((error) => handleLoadError(error, 'Could not load date folder'))
      .finally(() => loadingDays.current.delete(dayKey));
  };

  const toggleEmployee = (folderKey: string) => {
    setExpandedEmployees((current) => ({ ...current, [folderKey]: !current[folderKey] }));
  };

  const performLogout = () => {
    setLogoutConfirmationOpen(false);
    onLogout();
  };

  const navItems = [
    { id: 'employees' as const, label: 'Employees & Keys', icon: <IconEmployees />, iconColor: '#60a5fa' },
    { id: 'captures' as const, label: 'Employee Captures', icon: <IconCaptures />, iconColor: '#4ade80' },
    { id: 'all-screenshots' as const, label: 'All Screenshots', icon: <IconAllScreenshots />, iconColor: '#a78bfa' },
    { id: 'capture-settings' as const, label: 'Capture Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m8.66-14.66l-4.24 4.24M7.76 16.24l-4.24 4.24M23 12h-6m-6 0H1m20.66 8.66l-4.24-4.24M7.76 7.76 3.52 3.52"/></svg>, iconColor: '#f59e0b' },
  ];

  const kpiItems = [
    { label: 'Subscription', value: subscription?.status || 'NOT CONFIGURED', icon: <KpiIconStatus />, accent: '#dcfce7', border: '#bbf7d0' },
    { label: 'Expires', value: subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : '—', icon: <KpiIconExpiry />, accent: '#ede9fe', border: '#ddd6fe' },
    { label: 'Employees', value: `${overview?.usage?.employees || 0} / ${subscription?.maxEmployees || 0}`, icon: <KpiIconEmployees />, accent: '#dbeafe', border: '#bfdbfe' },
    { label: 'Screenshots', value: overview?.usage?.screenshots || 0, icon: <Image className="h-[22px] w-[22px] text-orange-600" />, accent: '#ffedd5', border: '#fed7aa' },
  ];

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#f0f2f5' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #1a2e24 0%, #2d3748 100%)' }}
      >
        {/* Brand */}
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 px-3 mb-2 tracking-wider">Workspace</div>
          {navItems.map(({ id, label, icon, iconColor }) => {
            const isActive = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all text-sm font-medium"
                style={{
                  background: isActive ? 'linear-gradient(135deg, #15803d, #166534)' : 'transparent',
                  color: isActive ? '#ffffff' : '#9ca3af',
                }}
                onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'; } }}
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

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* ── Top header bar ─────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between h-14 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button className="lg:hidden p-1.5 rounded-md hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-gray-400 hidden sm:inline truncate max-w-[120px]">{session?.company?.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline shrink-0" />
              <span className="font-semibold text-gray-800 truncate">
                {view === 'captures' ? 'Employee Captures' : view === 'all-screenshots' ? 'All Screenshots' : 'Employees & Keys'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {DESKTOP_DOWNLOAD_URL && (
              <a href={DESKTOP_DOWNLOAD_URL}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white shadow-sm transition-all"
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

        {/* Mobile sidebar */}
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
                const isActive = view === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setView(id);
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
          <div key={view} className="mx-auto max-w-[1440px] page-fade-in">

            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {view === 'captures' ? 'Employee Screenshot Management' : view === 'all-screenshots' ? 'All Employee Screenshots' : 'Employees & License Keys'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {view === 'captures' ? 'Review latest team desktop activity captures.' : view === 'all-screenshots' ? 'Full organization screenshot archive with search & custom pagination.' : 'Create employees and issue one-time activation keys for the desktop app.'}
              </p>
            </div>

            {/* Alerts */}
            {message && (
              <div className={`mb-5 rounded-md border px-4 py-3 text-xs flex items-start gap-2 ${messageIsError ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-900'}`}>
                {messageIsError
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                }
                {message}
              </div>
            )}
            {!isActive && (
              <div className="mb-5 flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Company subscription is <strong>{subscription?.status || 'NOT CONFIGURED'}</strong>. Screenshots remain viewable, but new employees, keys, desktop logins, captures, and uploads are blocked until the superadmin renews or activates it.</span>
              </div>
            )}

            {/* ── KPI Cards ────────────────────────────────────────── */}
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

            {/* ── Captures view ────────────────────────────────────── */}
            {view === 'captures' ? (
              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Latest Captured Employee Screenshots</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Showing recent date folders and employee captures. Open a folder to view details.</p>
                  </div>
                  {(overview?.usage?.screenshots || 0) > 5 && (
                    <button
                      type="button"
                      onClick={() => setView('all-screenshots')}
                      className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>View All ({overview?.usage?.screenshots || 0})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {screenshotDays.length ? (
                  <div className="space-y-3">
                    {screenshotDays.slice(0, 5).map((day: any) => {
                      const dateOpen = Boolean(expandedDates[day.key] ?? false);
                      return (
                        <section key={day.key} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                          <button
                            type="button"
                            aria-expanded={dateOpen}
                            onClick={() => toggleDate(day.key)}
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 sm:px-5"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-green-200 bg-green-50 text-green-700">
                              <Folder className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-gray-900">
                                {isToday(day.capturedAt) ? 'Today — ' : ''}{screenshotDayLabel(day.capturedAt)}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-400">
                                {day.employeeCount} employee{day.employeeCount === 1 ? '' : 's'} · {day.screenshotCount} screenshot{day.screenshotCount === 1 ? '' : 's'}
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
                                    <button
                                      type="button"
                                      aria-expanded={employeeOpen}
                                      onClick={() => toggleEmployee(folderKey)}
                                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-green-50/50"
                                    >
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
                                      <div className="max-h-[420px] overflow-y-auto border-t border-gray-100 bg-gray-50/70 p-3 sm:p-4">
                                        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 sm:gap-2.5">
                                          {employeeFolder.items.map((item: any) => (
                                            <button
                                              key={item.id}
                                              type="button"
                                              onClick={() => openScreenshot(item)}
                                              title={`Click to view ${item.fileName} (${new Date(item.capturedAt).toLocaleTimeString()})`}
                                              className="group flex flex-col justify-between rounded-md border border-gray-200 bg-white p-2 text-left transition-all hover:border-green-600 hover:bg-green-50/60 hover:shadow-sm"
                                            >
                                              <div className="flex w-full items-center justify-between gap-1 text-[11px] font-bold text-gray-800 group-hover:text-green-900">
                                                <span className="truncate">{new Date(item.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                <ExternalLink className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-green-700" />
                                              </div>
                                              <div className="mt-1.5 flex min-w-0 items-center justify-between text-[10px] font-mono text-gray-500">
                                                <span className="max-w-[70px] truncate" title={item.fileName}>{item.fileName}</span>
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
                        Showing <b>latest {Math.min(5, screenshotDays.length)}</b> date folders ({overview?.usage?.screenshots || 0} total screenshots).
                      </div>
                      <button
                        type="button"
                        onClick={() => setView('all-screenshots')}
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span>View All Screenshots ({overview?.usage?.screenshots || 0})</span>
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
                    <span className="font-medium">Folders per page:</span>
                    <div className="relative" ref={archiveDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setArchiveDropdownOpen((prev) => !prev)}
                        className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-green-600 text-gray-800 text-xs font-semibold rounded-md px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-all outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      >
                        <span>{archivePageSize} date folders</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${archiveDropdownOpen ? 'rotate-180 text-green-700' : ''}`} />
                      </button>

                      {archiveDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 page-fade-in">
                          {[5, 10, 15, 20, 30].map((size) => (
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
                              <span>{size} folders</span>
                              {archivePageSize === size && <Check className="w-3.5 h-3.5 text-green-700 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {(() => {
                  const totalDays = archiveTotalDays;
                  const totalScreenshots = archiveTotalScreenshots;
                  const totalPages = Math.max(1, Math.ceil(totalDays / archivePageSize));
                  const safePage = Math.min(Math.max(1, archivePage), totalPages);
                  const startIndex = (safePage - 1) * archivePageSize;
                  const endIndex = Math.min(startIndex + archivePageSize, totalDays);
                  const paginatedDays = archiveDays;

                  return (
                    <>
                      {paginatedDays.length > 0 ? (
                        <div className="space-y-3">
                          {paginatedDays.map((day: any) => {
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
                                      {day.employeeCount} employee{day.employeeCount === 1 ? '' : 's'} · {day.screenshotCount} screenshot{day.screenshotCount === 1 ? '' : 's'}
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
                                            <div className="max-h-[420px] overflow-y-auto border-t border-gray-100 bg-gray-50/70 p-3 sm:p-4">
                                              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 sm:gap-2.5">
                                                {employeeFolder.items.map((item: any) => (
                                                  <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => openScreenshot(item)}
                                                    title={`Click to view ${item.fileName} (${new Date(item.capturedAt).toLocaleTimeString()})`}
                                                    className="group flex flex-col justify-between rounded-md border border-gray-200 bg-white p-2 text-left transition-all hover:border-green-600 hover:bg-green-50/60 hover:shadow-md"
                                                  >
                                                    <div className="flex w-full items-center justify-between gap-1 text-[11px] font-bold text-gray-800 group-hover:text-green-900">
                                                      <span className="truncate">{new Date(item.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                      <ExternalLink className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-green-700" />
                                                    </div>
                                                    <div className="mt-1.5 flex min-w-0 items-center justify-between text-[10px] font-mono text-gray-500">
                                                      <span className="max-w-[70px] truncate" title={item.fileName}>{item.fileName}</span>
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

                      {totalDays > 0 && (
                        <div className="p-4 bg-white border border-gray-200 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                          <div className="text-gray-500 font-medium">
                            Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to <span className="font-bold text-gray-800">{endIndex}</span> of <span className="font-bold text-gray-800">{totalDays}</span> date folder{totalDays === 1 ? '' : 's'} ({totalScreenshots} total screenshot{totalScreenshots === 1 ? '' : 's'})
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
            ) : view === 'employees' ? (
              <>
                {/* ── Create Employee form ──────────────────────────── */}
                <section className="mb-6 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <h2 className="font-bold text-sm text-gray-900">Create New Employee</h2>
                    <p className="text-xs text-gray-400 mt-0.5">New employees automatically receive a unique activation key upon creation.</p>
                  </div>
                  <form onSubmit={createEmployee} autoComplete="off" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 items-end">
                    <Field label="Full name" value={employee.fullName} onChange={(value) => setEmployee({ ...employee, fullName: value })} />
                    <Field label="Username" value={employee.username} onChange={(value) => setEmployee({ ...employee, username: value })} />
                    <Field label="Email" value={employee.email} onChange={(value) => setEmployee({ ...employee, email: value })} type="email" />
                    <Field label="Temporary password" value={employee.password} onChange={(value) => setEmployee({ ...employee, password: value })} type="password" />
                    <button
                      disabled={!isActive}
                      className="w-full flex justify-center items-center gap-2 rounded-md py-2.5 text-xs font-semibold text-white disabled:opacity-40 transition-all shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}
                    >
                      <Plus className="h-4 w-4" />
                      Create Employee
                    </button>
                  </form>
                </section>

                {/* ── Employees table ───────────────────────────────── */}
                <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-sm text-gray-900">Company Employees &amp; Licenses</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{totalEmployees} employees registered</p>
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
                    const allEmps = employees;
                    const totalEmpItems = totalEmployees;
                    const totalEmpPages = Math.max(1, Math.ceil(totalEmpItems / empPageSize));
                    const safeEmpPage = Math.min(Math.max(1, empPage), totalEmpPages);
                    const empStartIndex = (safeEmpPage - 1) * empPageSize;
                    const empEndIndex = Math.min(empStartIndex + empPageSize, totalEmpItems);
                    const paginatedEmployees = allEmps;

                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[980px] text-left text-xs">
                            <thead style={{ background: '#f8fafc' }}>
                              <tr className="text-gray-500 uppercase text-[11px] font-semibold tracking-wide border-b border-gray-100">
                                <th className="px-5 py-3">Employee</th>
                                <th className="px-3 py-3">Username</th>
                                <th className="px-3 py-3">License Key</th>
                                <th className="px-3 py-3">Devices</th>
                                <th className="px-3 py-3">Device Status</th>
                                <th className="px-3 py-3">Status / Expiry</th>
                                <th className="px-3 py-3">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {paginatedEmployees.map((item: any) => {
                                const license = item.licenses?.[0];
                                const latestDevice = license?.devices?.[0];
                                const lastSeen = latestDevice?.lastSeenAt ? new Date(latestDevice.lastSeenAt) : null;
                                const isOnline = lastSeen && (Date.now() - lastSeen.getTime()) < 15 * 60 * 1000;
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
                                        <button
                                          onClick={() => navigator.clipboard?.writeText(license.key)}
                                          className="flex gap-1.5 font-mono text-xs text-green-800 hover:underline items-center"
                                          title="Click to copy key"
                                        >
                                          <span>{license.key}</span>
                                          <Copy className="h-3 w-3 text-gray-400" />
                                        </button>
                                      ) : (
                                        <span className="text-gray-400 italic">Not generated</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">{license ? `${license.currentDevices} / ${license.maxDevices}` : '—'}</td>
                                    <td className="px-3 py-3">
                                      {license ? (
                                        lastSeen ? (
                                          <div>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-[11px] border ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                              {isOnline ? 'Active' : 'Disconnected'}
                                            </span>
                                            <div className="text-gray-400 text-[10px] mt-0.5">
                                              Last seen: {lastSeen.toLocaleString()}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 italic text-[11px]">Never connected</span>
                                        )
                                      ) : '—'}
                                    </td>
                                    <td className="px-3 py-3">
                                      {license ? (
                                        <>
                                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] border ${license.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {license.status}
                                          </span>
                                          <div className="text-gray-400 text-[11px] mt-0.5">{new Date(license.expiryDate).toLocaleDateString()}</div>
                                          <div className={`mt-1 text-[10px] font-semibold ${item.isActive ? 'text-green-700' : 'text-red-600'}`}>
                                            Employee {item.isActive ? 'enabled' : 'disabled'}
                                          </div>
                                        </>
                                      ) : '—'}
                                    </td>
                                    <td className="px-3 py-3 space-x-1.5 whitespace-nowrap">
                                      {!license && (
                                        <ActionIconButton
                                          label={`Generate license key for ${item.username}`}
                                          tone="success"
                                          disabled={!isActive}
                                          onClick={() => setPendingAction({
                                            title: `Generate a key for ${item.username}?`,
                                            description: 'A new activation key will be issued and one device slot allocated.',
                                            confirmLabel: 'Generate key', tone: 'success', icon: <KeyRound className="h-4 w-4" />,
                                            run: () => createLicense(item.id),
                                          })}
                                        >
                                          <KeyRound className="h-4 w-4" />
                                        </ActionIconButton>
                                      )}
                                      {license && (
                                        <ActionIconButton
                                          label={`Reset device binding for ${item.username}`}
                                          onClick={() => setPendingAction({
                                            title: `Reset ${item.username}'s device binding?`,
                                            description: 'Their current device will be disconnected and must be activated again.',
                                            confirmLabel: 'Reset device', tone: 'warning', icon: <RotateCcw className="h-4 w-4" />,
                                            run: () => licenseAction(license.id, 'reset-devices'),
                                          })}
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                        </ActionIconButton>
                                      )}
                                      {license && license.status !== 'ACTIVE' && (
                                        <ActionIconButton
                                          label={`Reactivate license for ${item.username}`}
                                          tone="success"
                                          onClick={() => setPendingAction({
                                            title: `Reactivate ${item.username}'s key?`,
                                            description: 'The license will be available again if the company subscription is active.',
                                            confirmLabel: 'Reactivate key', tone: 'success', icon: <Check className="h-4 w-4" />,
                                            run: () => licenseAction(license.id, 'reactivate'),
                                          })}
                                        >
                                          <Check className="h-4 w-4" />
                                        </ActionIconButton>
                                      )}
                                      {license && license.status !== 'REVOKED' && (
                                        <ActionIconButton
                                          label={`Revoke license for ${item.username}`}
                                          tone="danger"
                                          onClick={() => setPendingAction({
                                            title: `Revoke ${item.username}'s key?`,
                                            description: 'Their desktop access and future captures will be blocked until the key is reactivated.',
                                            confirmLabel: 'Revoke key', tone: 'danger', icon: <XCircle className="h-4 w-4" />,
                                            run: () => licenseAction(license.id, 'revoke'),
                                          })}
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </ActionIconButton>
                                      )}
                                      <ActionIconButton
                                        label={`Reset password for ${item.username}`}
                                        onClick={() => {
                                          setPasswordResetTarget(item);
                                          setReplacementPassword('');
                                        }}
                                      >
                                        <KeyRound className="h-4 w-4" />
                                      </ActionIconButton>
                                      <ActionIconButton
                                        label={`${item.isActive ? 'Disable' : 'Enable'} ${item.username}`}
                                        tone={item.isActive ? 'warning' : 'success'}
                                        onClick={() => setPendingAction({
                                          title: `${item.isActive ? 'Disable' : 'Enable'} ${item.username}?`,
                                          description: item.isActive
                                            ? 'Their current sessions will end and they will be unable to sign in.'
                                            : 'They will be able to sign in again if their license and subscription are active.',
                                          confirmLabel: item.isActive ? 'Disable employee' : 'Enable employee',
                                          tone: item.isActive ? 'warning' : 'success', icon: <Power className="h-4 w-4" />,
                                          run: () => setEmployeeStatus(item, !item.isActive),
                                        })}
                                      >
                                        <Power className="h-4 w-4" />
                                      </ActionIconButton>
                                      <ActionIconButton
                                        label={`Delete ${item.username}`}
                                        tone="danger"
                                        onClick={() => setDeleteTarget(item)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </ActionIconButton>
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
            ) : view === 'capture-settings' ? (
              <section className="max-w-xl">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-gray-900">Capture Settings</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Configure screenshot interval and pause status for all employee devices.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 space-y-6">
                  {/* Interval selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Screenshot Capture Interval
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { value: 300, label: '5 min' },
                        { value: 900, label: '15 min' },
                        { value: 1800, label: '30 min' },
                      ].map((opt) => {
                        const isSelected = selectedInterval === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSelectedInterval(opt.value)}
                            className={`px-3 py-3 rounded-md text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'bg-green-700 text-white border-green-700 shadow-sm ring-2 ring-green-200'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-green-600 hover:bg-green-50'
                            }`}
                          >
                            {opt.label}
                            {opt.value === 900 && <span className="block text-[10px] font-normal opacity-80">(Default)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Global pause toggle */}
                  <div className="border-t border-gray-100 pt-5">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Global Capture Status</label>
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-4">
                      <div>
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${selectedPaused ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                          {selectedPaused ? 'Capture Paused' : 'Capture Active'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedPaused
                            ? 'All employee desktop apps will stop capturing screenshots.'
                            : 'All employee desktop apps will capture screenshots on interval.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPaused(!selectedPaused)}
                        className={`px-4 py-2 rounded-md text-xs font-semibold transition-all shadow-sm ${
                          selectedPaused
                            ? 'bg-green-700 hover:bg-green-800 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {selectedPaused ? '▶ Set to Active' : '⏸ Set to Paused'}
                      </button>
                    </div>
                  </div>

                  {/* Save Capture Settings Button */}
                  <div className="border-t border-gray-100 pt-5 flex items-center justify-between gap-4">
                    <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs">
                      💡 Click Save below to apply these settings across all connected employee devices.
                    </p>
                    <button
                      type="button"
                      disabled={savingCaptureSettings}
                      onClick={async () => {
                        setSavingCaptureSettings(true);
                        try {
                          await axios.post(
                            `${API_URL}/company-admin/capture-settings`,
                            {
                              captureIntervalSeconds: selectedInterval,
                              isCapturePaused: selectedPaused,
                            },
                            auth(token),
                          );
                          addToast('Capture settings saved successfully!', 'success');
                          fetchCustomerData();
                        } catch (err: any) {
                          addToast(apiErrorMessage(err, 'Failed to save capture settings'), 'error');
                        } finally {
                          setSavingCaptureSettings(false);
                        }
                      }}
                      className="px-5 py-2.5 rounded-md text-xs font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all shrink-0"
                      style={{ background: 'linear-gradient(135deg, #15803d, #166534)' }}
                    >
                      {savingCaptureSettings ? 'Saving...' : '💾 Save Capture Settings'}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

          </div>
        </main>
      </div>

      <ConfirmDialog
        open={logoutConfirmationOpen}
        onCancel={() => setLogoutConfirmationOpen(false)}
        onConfirm={performLogout}
      />
      <ConfirmDialog
        open={Boolean(pendingAction)}
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          await pendingAction.run();
          setPendingAction(null);
        }}
        title={pendingAction?.title}
        description={pendingAction?.description}
        confirmLabel={pendingAction?.confirmLabel}
        tone={pendingAction?.tone}
        icon={pendingAction?.icon}
      />
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Delete Employee Account</h2>
                <p className="text-xs text-gray-500">Permanent Removal & License Slot Release</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              Are you sure you want to permanently delete employee <strong className="text-gray-900">{deleteTarget.fullName || deleteTarget.username}</strong> ({deleteTarget.email})? This action cannot be undone and will immediately release their license slot.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteLoading) return;
                  setDeleteLoading(true);
                  try {
                    await deleteEmployee(deleteTarget);
                    setDeleteTarget(null);
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                disabled={deleteLoading}
                className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {passwordResetTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPasswordResetTarget(null);
          }}
        >
          <form
            onSubmit={requestPasswordReset}
            className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-2xl"
          >
            <h2 id="reset-password-title" className="text-base font-bold text-gray-900">
              Reset employee password
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Set a temporary password for {passwordResetTarget.username}. Their existing sessions will be signed out.
            </p>
            <label className="mt-4 block text-xs font-semibold text-gray-700">
              New temporary password
              <div className="relative mt-1.5">
                <input
                  autoFocus
                  type={showResetPass ? 'text' : 'password'}
                  minLength={6}
                  required
                  autoComplete="new-password"
                  value={replacementPassword}
                  onChange={(event) => setReplacementPassword(event.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPass(!showResetPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
                  tabIndex={-1}
                >
                  {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordResetTarget(null)}
                className="rounded-md border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800"
              >
                Reset password
              </button>
            </div>
          </form>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const [showPass, setShowPass] = useState(false);
  const isPasswordType = type === 'password';
  const effectiveType = isPasswordType ? (showPass ? 'text' : 'password') : type;

  return (
    <label className="text-xs font-semibold text-gray-600 block relative">
      {label}
      <div className="relative mt-1.5">
        <input
          required
          minLength={isPasswordType ? 6 : undefined}
          type={effectiveType}
          autoComplete={isPasswordType ? 'new-password' : 'off'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-normal outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all pr-9"
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
            tabIndex={-1}
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </label>
  );
}
