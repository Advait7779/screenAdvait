/**
 * License Key Generator and Format Validator
 * Format: ATS-XXXX-XXXX-XXXX-XXXX
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous 0, O, 1, I

export function generateLicenseKey(prefix = 'ATS'): string {
  const generateSegment = (length: number) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      const value = new Uint32Array(1);
      globalThis.crypto.getRandomValues(value);
      result += CHARS.charAt(value[0] % CHARS.length);
    }
    return result;
  };

  return `${prefix}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;
}

export function validateLicenseKeyFormat(key: string): boolean {
  const pattern = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key.toUpperCase());
}
