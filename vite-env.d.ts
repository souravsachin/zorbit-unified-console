/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IDENTITY_URL: string;
  readonly VITE_AUTHORIZATION_URL: string;
  readonly VITE_NAVIGATION_URL: string;
  readonly VITE_MESSAGING_URL: string;
  readonly VITE_PII_VAULT_URL: string;
  readonly VITE_AUDIT_URL: string;
  readonly VITE_CUSTOMER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
