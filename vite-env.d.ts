/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __GIT_SHA__: string;

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
