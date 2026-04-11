// Personal / free email domains that are not allowed.
// Teams must use business / university / organizational emails.
const BLOCKED_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.co.jp',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr',
  'outlook.com', 'outlook.co.uk',
  'live.com', 'live.co.uk',
  'msn.com',
  'aol.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'zoho.com', 'zohomail.com',
  'yandex.com', 'yandex.ru',
  'mail.com', 'email.com',
  'gmx.com', 'gmx.de', 'gmx.net',
  'tutanota.com', 'tuta.io',
  'fastmail.com',
  'hey.com',
  'inbox.com',
  'mail.ru',
  'rediffmail.com',
  'qq.com', '163.com', '126.com',
  'walla.co.il',
]);

/**
 * Validates an email address for business use.
 * Returns null if valid, or an error key string if invalid.
 */
export function validateBusinessEmail(email) {
  if (!email || !email.trim()) return null; // empty is allowed (nullable)

  const trimmed = email.trim().toLowerCase();

  // Basic format check
  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx < 1 || atIdx === trimmed.length - 1) return 'invalidFormat';

  const domain = trimmed.slice(atIdx + 1);
  if (!domain.includes('.')) return 'invalidFormat';

  if (BLOCKED_DOMAINS.has(domain)) return 'personalEmail';

  return null; // valid
}
