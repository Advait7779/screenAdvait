import { getDb } from './sqlite.store.js';
import { safeStorage } from 'electron';

export interface DesktopSession {
  accessToken: string;
  refreshToken: string;
  user: Record<string, any>;
  company: Record<string, any>;
  licenseStatus: Record<string, any>;
}

let activeSession: DesktopSession | null = null;

export function initializeSession() {
  const db = getDb();
  const cached = db
    .prepare('SELECT data, expires_at FROM local_cache WHERE key = ?')
    .get('auth_session') as { data: string; expires_at?: string } | undefined;
  if (!cached) return null;
  try {
    const session = deserializeSession(cached.data);
    // As long as a refresh token is present, restore the session.
    // The server will be the single authority on token validity —
    // if truly expired/revoked, it returns 401 and the app cleanly logs out.
    if (!session.refreshToken) {
      clearSession();
      return null;
    }
    activeSession = session;
    if (!cached.data.startsWith('encrypted:v1:') && safeStorage.isEncryptionAvailable()) {
      setSession(session, true);
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(session: DesktopSession, remember: boolean) {
  activeSession = session;
  const db = getDb();
  if (!remember || !safeStorage.isEncryptionAvailable()) {
    db.prepare('DELETE FROM local_cache WHERE key = ?').run('auth_session');
    return;
  }
  const refreshExpiry = getJwtExpiry(session.refreshToken) || Date.now() + 7 * 24 * 60 * 60_000;
  db.prepare('INSERT OR REPLACE INTO local_cache (key, data, expires_at) VALUES (?, ?, ?)').run(
    'auth_session',
    serializeSession(session),
    new Date(refreshExpiry).toISOString(),
  );
}

function serializeSession(session: DesktopSession) {
  const encrypted = safeStorage.encryptString(JSON.stringify(session)).toString('base64');
  return `encrypted:v1:${encrypted}`;
}

function deserializeSession(data: string): DesktopSession {
  if (data.startsWith('encrypted:v1:')) {
    const encrypted = Buffer.from(data.slice('encrypted:v1:'.length), 'base64');
    return JSON.parse(safeStorage.decryptString(encrypted)) as DesktopSession;
  }
  // One-time compatibility with sessions written by older releases.
  return JSON.parse(data) as DesktopSession;
}

export function updateSessionTokens(accessToken: string, refreshToken: string) {
  if (!activeSession) return;
  const persisted = Boolean(
    getDb().prepare('SELECT data FROM local_cache WHERE key = ?').get('auth_session'),
  );
  setSession({ ...activeSession, accessToken, refreshToken }, persisted);
}

export function updateSessionLicenseStatus(licenseStatus: Record<string, any>) {
  if (!activeSession) return;
  const persisted = Boolean(
    getDb().prepare('SELECT data FROM local_cache WHERE key = ?').get('auth_session'),
  );
  setSession({ ...activeSession, licenseStatus: { ...activeSession.licenseStatus, ...licenseStatus } }, persisted);
}

export function getSession() {
  return activeSession;
}

export function clearSession() {
  activeSession = null;
  getDb().prepare('DELETE FROM local_cache WHERE key = ?').run('auth_session');
}

export function isAccessTokenExpired() {
  return !activeSession?.accessToken || isJwtExpired(activeSession.accessToken, 30);
}

function isJwtExpired(token: string, skewSeconds = 0) {
  const expiry = getJwtExpiry(token);
  return !expiry || expiry <= Date.now() + skewSeconds * 1000;
}

function getJwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
