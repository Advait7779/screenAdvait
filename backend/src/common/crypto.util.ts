import crypto from 'crypto';

function getMasterKey(): Buffer {
  const secret = process.env.JWT_SECRET || 'screenadvait_default_master_secret_32chars';
  return crypto.scryptSync(secret, 'screenadvait_drive_salt', 32);
}

export function encryptText(text: string): string {
  const iv = crypto.randomBytes(12);
  const key = getMasterKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptText(encryptedHex: string): string {
  const parts = encryptedHex.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted string format');
  const [ivHex, tagHex, contentHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const content = Buffer.from(contentHex, 'hex');
  const key = getMasterKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(content) + decipher.final('utf8');
}
