import { PageHeader } from '../components/ui/PageHeader';
import { label, relativeTime, useWorkspaceData } from '../features/workspace/WorkspaceDataContext';

export function AuditLogsPage() {
  const { auditLogs, loading, error } = useWorkspaceData();
  return <><PageHeader title="Audit log" description="Jejak aktivitas keamanan di workspace demo pribadi Anda." />{loading ? <p className="data-state">Memuat audit log…</p> : error ? <p className="data-state error-message">{error}</p> : <article className="panel"><div className="table-wrap"><table><thead><tr><th>Action</th><th>Metadata</th><th>Waktu</th></tr></thead><tbody>{auditLogs.map((log) => <tr key={log.$id}><td><strong>{label(log.action?.replaceAll('.', ' '))}</strong></td><td><code>{log.metadata || '—'}</code></td><td>{relativeTime(log.createdAt)}</td></tr>)}{auditLogs.length === 0 && <tr><td colSpan={3}>Belum ada aktivitas.</td></tr>}</tbody></table></div></article>}</>;
}
