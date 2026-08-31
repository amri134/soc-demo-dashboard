import { Query, TablesDB, type Models } from 'appwrite';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { client, functions } from '../../lib/appwrite';

type Row = Models.Row & { workspaceId: string; severity?: string; title?: string; description?: string; sourceIp?: string; status?: string; simulatedAt?: string; priority?: string; summary?: string; updatedAt?: string; message?: string; createdAt?: string; isRead?: boolean; incidentId?: string; authorId?: string; body?: string; action?: string; metadata?: string };
type WorkspaceRow = Models.Row & { ownerId: string; status: string; expiresAt: string };
type WorkspaceData = { workspace: WorkspaceRow | null; alerts: Row[]; incidents: Row[]; notifications: Row[]; notes: Row[]; auditLogs: Row[]; loading: boolean; error: string | null; actionLoading: boolean; refresh: () => Promise<void>; runAction: (action: Record<string, string>) => Promise<void> };

const tablesDB = new TablesDB(client);
const WorkspaceDataContext = createContext<WorkspaceData | null>(null);
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const tableIds = { workspaces: import.meta.env.VITE_APPWRITE_WORKSPACES_TABLE_ID, alerts: import.meta.env.VITE_APPWRITE_ALERTS_TABLE_ID, incidents: import.meta.env.VITE_APPWRITE_INCIDENTS_TABLE_ID, notes: import.meta.env.VITE_APPWRITE_NOTES_TABLE_ID, notifications: import.meta.env.VITE_APPWRITE_NOTIFICATIONS_TABLE_ID, auditLogs: import.meta.env.VITE_APPWRITE_AUDIT_LOGS_TABLE_ID };

export function WorkspaceDataProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null); const [alerts, setAlerts] = useState<Row[]>([]); const [incidents, setIncidents] = useState<Row[]>([]); const [notifications, setNotifications] = useState<Row[]>([]); const [notes, setNotes] = useState<Row[]>([]); const [auditLogs, setAuditLogs] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [actionLoading, setActionLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  async function refresh() {
    if (!databaseId || Object.values(tableIds).some((value) => !value)) { setError('Konfigurasi tabel Appwrite belum lengkap.'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const workspaces = await tablesDB.listRows<WorkspaceRow>({ databaseId, tableId: tableIds.workspaces, queries: [Query.orderDesc('$createdAt'), Query.limit(1)] });
      const activeWorkspace = workspaces.rows[0] ?? null; setWorkspace(activeWorkspace);
      if (!activeWorkspace) { setAlerts([]); setIncidents([]); setNotifications([]); setNotes([]); setAuditLogs([]); setError('Workspace demo belum tersedia. Muat ulang halaman untuk menjalankan provisioning.'); return; }
      const workspaceQuery = Query.equal('workspaceId', [activeWorkspace.$id]);
      const [alertResult, incidentResult, notificationResult, noteResult, auditResult] = await Promise.all([
        tablesDB.listRows<Row>({ databaseId, tableId: tableIds.alerts, queries: [workspaceQuery, Query.orderDesc('simulatedAt')] }),
        tablesDB.listRows<Row>({ databaseId, tableId: tableIds.incidents, queries: [workspaceQuery, Query.orderDesc('updatedAt')] }),
        tablesDB.listRows<Row>({ databaseId, tableId: tableIds.notifications, queries: [workspaceQuery, Query.orderDesc('$createdAt')] }),
        tablesDB.listRows<Row>({ databaseId, tableId: tableIds.notes, queries: [workspaceQuery, Query.orderDesc('createdAt')] }),
        tablesDB.listRows<Row>({ databaseId, tableId: tableIds.auditLogs, queries: [workspaceQuery, Query.orderDesc('createdAt')] })
      ]);
      setAlerts(alertResult.rows); setIncidents(incidentResult.rows); setNotifications(notificationResult.rows); setNotes(noteResult.rows); setAuditLogs(auditResult.rows);
    } catch { setError('Data demo tidak dapat dimuat dari Appwrite. Periksa sesi login dan permission tabel.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  async function runAction(action: Record<string, string>) {
    const functionId = import.meta.env.VITE_APPWRITE_PROVISION_FUNCTION_ID;
    if (!functionId) { setError('Function aksi demo belum dikonfigurasi.'); return; }
    setActionLoading(true); setError(null);
    try { const execution = await functions.createExecution({ functionId, body: JSON.stringify(action), async: false }); if (execution.responseStatusCode >= 400) throw new Error('Function action failed.'); await refresh(); }
    catch { setError('Aksi demo tidak dapat diproses. Coba lagi nanti.'); }
    finally { setActionLoading(false); }
  }
  const value = useMemo(() => ({ workspace, alerts, incidents, notifications, notes, auditLogs, loading, actionLoading, error, refresh, runAction }), [workspace, alerts, incidents, notifications, notes, auditLogs, loading, actionLoading, error]);
  return <WorkspaceDataContext.Provider value={value}>{children}</WorkspaceDataContext.Provider>;
}
export function useWorkspaceData() { const value = useContext(WorkspaceDataContext); if (!value) throw new Error('useWorkspaceData harus dipakai di dalam WorkspaceDataProvider.'); return value; }
export function label(value?: string) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : '—'; }
export function relativeTime(value?: string) { if (!value) return '—'; const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000)); if (minutes < 1) return 'baru saja'; if (minutes < 60) return `${minutes} min lalu`; const hours = Math.round(minutes / 60); if (hours < 24) return `${hours} jam lalu`; return `${Math.round(hours / 24)} hari lalu`; }
