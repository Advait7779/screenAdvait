import os from 'os';
import crypto from 'crypto';
import { getDb } from './sqlite.store.js';

export function getDeviceDetails() {
  const computerName = os.hostname();
  const platform = `${os.type()} ${os.release()} (${os.arch()})`;
  const networkIds = Object.values(os.networkInterfaces())
    .flat()
    .filter((entry) => entry && !entry.internal)
    .map((entry) => entry!.mac)
    .filter((mac) => mac && mac !== '00:00:00:00:00:00')
    .sort()
    .join('|');
  const db = getDb();
  const existing = db.prepare('SELECT value FROM local_settings WHERE key = ?').get('installationId') as
    | { value: string }
    | undefined;
  const installationId = existing?.value || crypto.randomUUID();
  if (!existing) {
    db.prepare('INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)').run(
      'installationId',
      installationId,
    );
  }
  const rawGuid = `${installationId}|${computerName}|${os.platform()}|${os.cpus()[0]?.model || 'CPU'}|${networkIds}`;
  const machineGuid = crypto.createHash('sha256').update(rawGuid).digest('hex');
  return {
    computerName,
    os: platform,
    machineGuid,
    deviceId: `dev_${machineGuid.substring(0, 24)}`,
  };
}
