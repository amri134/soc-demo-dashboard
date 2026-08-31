/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_PROVISION_FUNCTION_ID: string;
  readonly VITE_APPWRITE_DATABASE_ID: string;
  readonly VITE_APPWRITE_WORKSPACES_TABLE_ID: string;
  readonly VITE_APPWRITE_ALERTS_TABLE_ID: string;
  readonly VITE_APPWRITE_INCIDENTS_TABLE_ID: string;
  readonly VITE_APPWRITE_NOTIFICATIONS_TABLE_ID: string;
  readonly VITE_APPWRITE_NOTES_TABLE_ID: string;
  readonly VITE_APPWRITE_AUDIT_LOGS_TABLE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
