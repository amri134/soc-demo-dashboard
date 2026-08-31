import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { label, relativeTime, useWorkspaceData } from '../features/workspace/WorkspaceDataContext';

export function OverviewPage() {
  const { alerts, incidents, loading, error } = useWorkspaceData();
  const critical = alerts.filter((alert) => alert.severity === 'critical').length;
  const active = incidents.filter((incident) => incident.status !== 'resolved').length;
  const resolved = incidents.filter((incident) => incident.status === 'resolved').length;
  const metrics = [['Total alerts', alerts.length, 'Data workspace Anda', 'blue'], ['Critical alerts', critical, 'Perlu triage', 'red'], ['Active incidents', active, 'Sedang diproses', 'amber'], ['Resolved', resolved, 'Workspace ini', 'green']];
  const statusCounts = ['new', 'investigating', 'resolved'].map((status) => [status, incidents.filter((item) => item.status === status).length] as const);
  const total = Math.max(incidents.length, 1);
  return <><PageHeader title="Overview" description="Ringkasan aktivitas keamanan pada workspace demo pribadi Anda." />
    {loading ? <p className="data-state">Memuat data demo…</p> : error ? <p className="data-state error-message">{error}</p> : <>
      <section className="metric-grid">{metrics.map(([labelText, value, detail, tone]) => <article className={`metric-card tone-${tone}`} key={labelText}><p>{labelText}</p><strong>{value}</strong><small>{detail}</small></article>)}</section>
      <section className="content-grid"><article className="panel"><div className="panel-heading"><div><h3>Alert terbaru</h3><p>Aktivitas simulasi yang memerlukan perhatian.</p></div><Link to="/alerts">Lihat semua</Link></div><div className="table-wrap"><table><thead><tr><th>Alert</th><th>Severity</th><th>Source IP</th><th>Waktu</th></tr></thead><tbody>{alerts.slice(0, 4).map((alert) => <tr key={alert.$id}><td><strong>{alert.title}</strong></td><td><span className={`severity severity-${alert.severity}`}>{label(alert.severity)}</span></td><td><code>{alert.sourceIp}</code></td><td>{relativeTime(alert.simulatedAt)}</td></tr>)}</tbody></table></div></article>
      <article className="panel"><div className="panel-heading"><div><h3>Incident status</h3><p>Distribusi status saat ini.</p></div></div><div className="status-bars">{statusCounts.map(([status, count]) => <div key={status}><span>{label(status)} <b>{count}</b></span><i><em style={{ width: `${(count / total) * 100}%` }} /></i></div>)}</div></article></section>
    </>}</>;
}
