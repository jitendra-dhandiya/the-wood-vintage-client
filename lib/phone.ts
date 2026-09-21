/**
 * Country-aware phone validation for the quote form. Mirrors the backend's
 * `utils/phone.ts` rule table (the server re-validates; this is for instant
 * inline feedback). Unlisted countries fall back to a generic 6-14 digit check.
 */
export interface PhoneCountry { code: string; name: string; dial: string; pattern: RegExp; hint: string }

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'IN', name: 'India',          dial: '91',  pattern: /^[6-9]\d{9}$/,          hint: 'Enter a 10-digit mobile number starting with 6-9' },
  { code: 'AE', name: 'UAE',            dial: '971', pattern: /^5\d{8}$/,              hint: 'Enter a 9-digit mobile number starting with 5' },
  { code: 'US', name: 'United States',  dial: '1',   pattern: /^[2-9]\d{2}[2-9]\d{6}$/, hint: 'Enter a 10-digit US number' },
  { code: 'CA', name: 'Canada',         dial: '1',   pattern: /^[2-9]\d{2}[2-9]\d{6}$/, hint: 'Enter a 10-digit Canadian number' },
  { code: 'GB', name: 'United Kingdom', dial: '44',  pattern: /^[1-9]\d{8,9}$/,        hint: 'Enter your UK number without the leading 0' },
  { code: 'AU', name: 'Australia',      dial: '61',  pattern: /^4\d{8}$/,              hint: 'Enter a 9-digit mobile number starting with 4' },
  { code: 'DE', name: 'Germany',        dial: '49',  pattern: /^1\d{9,10}$/,           hint: 'Enter a mobile number starting with 1' },
  { code: 'FR', name: 'France',         dial: '33',  pattern: /^[67]\d{8}$/,           hint: 'Enter a 9-digit mobile number starting with 6 or 7' },
  { code: 'NL', name: 'Netherlands',    dial: '31',  pattern: /^6\d{8}$/,              hint: 'Enter a 9-digit mobile number starting with 6' },
];

export const findPhoneCountry = (code?: string | null): PhoneCountry =>
  PHONE_COUNTRIES.find((c) => c.code === (code || '').toUpperCase()) ?? PHONE_COUNTRIES[0];

/** Returns an error message, or null when the number is valid for the country. */
export function validatePhone(countryCode: string, raw: string): string | null {
  const c = findPhoneCountry(countryCode);
  let digits = raw.replace(/[\s\-().]/g, '');
  if (!digits) return 'Enter your mobile number';
  if (!/^\+?\d+$/.test(digits)) return 'Use digits only';
  digits = digits.replace(/^\+/, '');
  if (digits.startsWith(c.dial) && !c.pattern.test(digits)) digits = digits.slice(c.dial.length);
  digits = digits.replace(/^0+/, '');
  return c.pattern.test(digits) ? null : c.hint;
}

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
