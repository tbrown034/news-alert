/**
 * ADMIN CONFIGURATION
 * ===================
 * Single source of truth for admin email allowlist.
 * Set ADMIN_EMAILS env var (comma-separated) or falls back to hardcoded list.
 */

const FALLBACK_EMAILS = [
  'tbrown034@gmail.com',
  'trevorbrown.web@gmail.com',
];

export const ADMIN_EMAILS: string[] = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
  : FALLBACK_EMAILS;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
