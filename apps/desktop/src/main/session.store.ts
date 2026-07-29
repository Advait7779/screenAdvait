import { getDb } from './sqlite.store.js';

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
    const session = JSON.parse(cached.data) as DesktopSession;
    const expiresAt = cached.expires_at ? new Date(cached.expires_at).getTime() : 0;
    if (!session.refreshToken || expiresAt <= Date.now() || isJwtExpired(session.refreshToken)) {
      clearSession();
      return null;
    }
    activeSession = session;
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(session: DesktopSession, remember: boolean) {
  activeSession = session;
  const db = getDb();
  if (!remember) {
    db.prepare('DELETE FROM local_cache WHERE key = ?').run('auth_session');
    return;
  }
  const refreshExpiry = getJwtExpiry(session.refreshToken) || Date.now() + 7 * 24 * 60 * 60_000;
  db.prepare('INSERT OR REPLACE INTO local_cache (key, data, expires_at) VALUES (?, ?, ?)').run(
    'auth_session',
    JSON.stringify(session),
    new Date(refreshExpiry).toISOString(),
  );
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
