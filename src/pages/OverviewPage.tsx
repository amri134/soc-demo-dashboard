import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
  const severityData = ['critical', 'high', 'medium', 'low'].map((name) => ({ name: label(name), value: alerts.filter((alert) => alert.severity === name).length, color: { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6' }[name] }));
  const incidentData = statusCounts.map(([name, value]) => ({ name: label(name), value }));
  const timeline = alerts.reduce<Record<string, number>>((buckets, alert) => { const date = new Date(alert.simulatedAt || Date.now()); const labelText = `${date.getDate()}/${date.getMonth() + 1} ${String(date.getHours()).padStart(2, '0')}:00`; buckets[labelText] = (buckets[labelText] || 0) + 1; return buckets; }, {});
  const timelineData = Object.entries(timeline).map(([time, alertsCount]) => ({ time, alerts: alertsCount })).reverse();
  return <><PageHeader title="Overview" description="Ringkasan aktivitas keamanan pada workspace demo pribadi Anda." />
    {loading ? <p className="data-state">Memuat data demo…</p> : error ? <p className="data-state error-message">{error}</p> : <>
      <section className="metric-grid">{metrics.map(([labelText, value, detail, tone]) => <article className={`metric-card tone-${tone}`} key={labelText}><p>{labelText}</p><strong>{value}</strong><small>{detail}</small></article>)}</section>
      <section className="content-grid"><article className="panel"><div className="panel-heading"><div><h3>Alert terbaru</h3><p>Aktivitas simulasi yang memerlukan perhatian.</p></div><Link to="/alerts">Lihat semua</Link></div><div className="table-wrap"><table><thead><tr><th>Alert</th><th>Severity</th><th>Source IP</th><th>Waktu</th></tr></thead><tbody>{alerts.slice(0, 4).map((alert) => <tr key={alert.$id}><td><strong>{alert.title}</strong></td><td><span className={`severity severity-${alert.severity}`}>{label(alert.severity)}</span></td><td><code>{alert.sourceIp}</code></td><td>{relativeTime(alert.simulatedAt)}</td></tr>)}</tbody></table></div></article>
      <article className="panel"><div className="panel-heading"><div><h3>Incident status</h3><p>Distribusi status saat ini.</p></div></div><div className="status-bars">{statusCounts.map(([status, count]) => <div key={status}><span>{label(status)} <b>{count}</b></span><i><em style={{ width: `${(count / total) * 100}%` }} /></i></div>)}</div></article></section>
      <section className="chart-grid"><article className="panel chart-panel"><div className="panel-heading"><div><h3>Alert trend</h3><p>Frekuensi alert sintetis berdasarkan waktu simulasi.</p></div></div><ResponsiveContainer width="100%" height={230}><AreaChart data={timelineData}><defs><linearGradient id="alertFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={.34}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="time" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Area type="monotone" dataKey="alerts" stroke="#2563eb" strokeWidth={2.5} fill="url(#alertFill)" /></AreaChart></ResponsiveContainer></article>
      <article className="panel chart-panel"><div className="panel-heading"><div><h3>Severity distribution</h3><p>Komposisi tingkat risiko data demo.</p></div></div><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={severityData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3}>{severityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></article>
      <article className="panel chart-panel"><div className="panel-heading"><div><h3>Incident workflow</h3><p>Jumlah incident pada setiap tahapan.</p></div></div><ResponsiveContainer width="100%" height={230}><BarChart data={incidentData}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></article></section>
    </>}</>;
}
