// =============================================================================
// PII Masking Utility
// =============================================================================
// Field-aware masking for PII-sensitive columns.
// Masking happens in the frontend for display. Backend should also enforce.
// =============================================================================

export function maskPiiValue(value: unknown, columnName: string): string {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);
  if (str.length === 0) return '';

  const key = columnName.toLowerCase();

  // Email pattern: contains @
  if (key.includes('email') || str.includes('@')) {
    const [local, domain] = str.split('@');
    if (domain) {
      return `${local.charAt(0)}***@${domain}`;
    }
    return `${str.charAt(0)}***`;
  }

  // Phone pattern: mostly digits, 7+ chars
  if (key.includes('phone') || key.includes('mobile') || /^\+?\d[\d\s\-()]{6,}$/.test(str)) {
    const digits = str.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `***-***-${digits.slice(-4)}`;
    }
    return '***';
  }

  // Name pattern
  if (key.includes('name') || key.includes('first') || key.includes('last')) {
    const parts = str.split(/\s+/);
    return parts.map((p) => (p.length > 0 ? `${p.charAt(0)}***` : '')).join(' ');
  }

  // ID patterns (passport, emirates_id, SSN, etc.)
  if (key.includes('passport') || key.includes('ssn') || key.includes('emirates')) {
    if (str.length >= 4) {
      return `****${str.slice(-4)}`;
    }
    return '***';
  }

  // Generic fallback: first + **** + last
  if (str.length <= 2) return '***';
  return `${str.charAt(0)}****${str.charAt(str.length - 1)}`;
}
