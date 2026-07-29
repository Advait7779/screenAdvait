import { safeStorage } from 'electron';
import crypto from 'crypto';
import { getDb } from './sqlite.store.js';

const LAST_USERNAME_KEY = 'lastLoginUsername';
const LICENSE_CACHE_PREFIX = 'remembered_license:';

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function cacheKey(username: string) {
  const digest = crypto.createHash('sha256').update(normalizeUsername(username)).digest('hex');
  return `${LICENSE_CACHE_PREFIX}${digest}`;
}

export function rememberLicense(username: string, licenseKey: string) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedLicense = licenseKey.trim().toUpperCase();
  if (!normalizedUsername || !normalizedLicense || !safeStorage.isEncryptionAvailable()) {
    return false;
  }

  const encrypted = safeStorage.encryptString(normalizedLicense).toString('base64');
  getDb()
    .prepare('INSERT OR REPLACE INTO local_cache (key, data, expires_at) VALUES (?, ?, ?)')
    .run(cacheKey(normalizedUsername), encrypted, null);
  getDb()
    .prepare('INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)')
    .run(LAST_USERNAME_KEY, username.trim());
  return true;
}

export function getRememberedLicense(username: string) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !safeStorage.isEncryptionAvailable()) return null;
  const row = getDb()
    .prepare('SELECT data FROM local_cache WHERE key = ?')
    .get(cacheKey(normalizedUsername)) as { data: string } | undefined;
  if (!row?.data) return null;

  try {
    return safeStorage.decryptString(Buffer.from(row.data, 'base64'));
  } catch {
    forgetRememberedLicense(normalizedUsername);
    return null;
  }
}

export function getLoginHint(requestedUsername?: string) {
  const lastUsername = (
    getDb().prepare('SELECT value FROM local_settings WHERE key = ?').get(LAST_USERNAME_KEY) as
      | { value: string }
      | undefined
  )?.value;
  const username = requestedUsername?.trim() || lastUsername || '';
  return {
    username,
    hasRememberedLicense: Boolean(username && getRememberedLicense(username)),
    encryptionAvailable: safeStorage.isEncryptionAvailable(),
  };
}

export function forgetRememberedLicense(username: string) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return;
  getDb().prepare('DELETE FROM local_cache WHERE key = ?').run(cacheKey(normalizedUsername));
}
