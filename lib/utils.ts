import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  INTL_DATE_LOCALE,
  INTL_TIME_LOCALE,
  defaultLocale,
  type Locale,
} from '@/i18n/config';

/** Merge Tailwind classes without conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Uploads live on the API server, not in Next's public folder, so a stored
 * path like `/uploads/abc.jpg` has to be resolved against the backend origin
 * or the browser asks :3000 for a file that isn't there. Absolute URLs and
 * local object previews pass through untouched.
 */
export function fileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/**
 * Date and number helpers take an optional locale that defaults to English, so
 * every existing caller in the four English-only roles keeps working unchanged
 * and produces byte-identical output.
 *
 * `bn-BD` gives Bengali month names and Bengali digits from Intl directly, so
 * there is nothing to translate by hand here.
 */
export function formatDate(iso?: string, locale: Locale = defaultLocale): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(INTL_DATE_LOCALE[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso?: string, locale: Locale = defaultLocale): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(INTL_TIME_LOCALE[locale], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(iso?: string, locale: Locale = defaultLocale): string {
  if (!iso) return '—';
  return `${formatDate(iso, locale)} · ${formatTime(iso, locale)}`;
}

/**
 * The two halves of the little calendar tile - big day number over a short month
 * - used by the appointment lists and the CHW schedule.
 *
 * Split into a helper because the day has to come from Intl rather than
 * `getDate()`: the number itself needs Bengali digits, and hand-converting it at
 * three call sites is how one of them ends up still in ASCII.
 */
export function dateTile(
  iso?: string,
  locale: Locale = defaultLocale,
): { day: string; month: string } {
  if (!iso) return { day: '—', month: '' };
  const date = new Date(iso);
  const intl = INTL_DATE_LOCALE[locale];
  return {
    day: date.toLocaleDateString(intl, { day: 'numeric' }),
    month: date.toLocaleDateString(intl, { month: 'short' }),
  };
}

/**
 * Relative time via Intl.RelativeTimeFormat, which supplies the wording in both
 * languages - so "5 minutes ago" and "৫ মিনিট আগে" need no translation keys.
 * Anything older than a week falls back to an absolute date, as before.
 */
export function timeAgo(iso?: string, locale: Locale = defaultLocale): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat(INTL_DATE_LOCALE[locale], { numeric: 'auto' });
  if (mins < 1) return rtf.format(0, 'minute');
  if (mins < 60) return rtf.format(-mins, 'minute');
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 7) return rtf.format(-days, 'day');
  return formatDate(iso, locale);
}

/** Numeric display. Bengali digits come from the locale, not a lookup table. */
export function formatNumber(
  value?: number | null,
  locale: Locale = defaultLocale,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(INTL_DATE_LOCALE[locale]).format(value);
}

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts digits that sit *inside* a string - "MRN-000123", "#12", "120/80",
 * "2 x daily" - which Intl.NumberFormat cannot reach because they are not
 * numbers. Display only: never run this over a value that gets submitted, and
 * never over the contents of a number or date input, which reject these
 * codepoints outright.
 */
export function toBengaliDigits(value?: string | number | null): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]);
}

/** Applies Bengali digits only when reading in Bangla. */
export function localizeDigits(
  value?: string | number | null,
  locale: Locale = defaultLocale,
): string {
  if (value === null || value === undefined) return '';
  return locale === 'bn' ? toBengaliDigits(value) : String(value);
}

export function ageFrom(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}
