export const API_CONFIG = {
  IDENTITY_URL: import.meta.env.VITE_IDENTITY_URL || '/api/identity',
  AUTHORIZATION_URL: import.meta.env.VITE_AUTHORIZATION_URL || '/api/authorization',
  NAVIGATION_URL: import.meta.env.VITE_NAVIGATION_URL || '/api/navigation',
  MESSAGING_URL: import.meta.env.VITE_MESSAGING_URL || '/api/messaging',
  PII_VAULT_URL: import.meta.env.VITE_PII_VAULT_URL || '/api/pii-vault',
  AUDIT_URL: import.meta.env.VITE_AUDIT_URL || '/api/audit',
  CUSTOMER_URL: import.meta.env.VITE_CUSTOMER_URL || '/api/customer',
};
