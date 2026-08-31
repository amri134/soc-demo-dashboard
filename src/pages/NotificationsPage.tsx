import { PageHeader } from '../components/ui/PageHeader';
import { relativeTime, useWorkspaceData } from '../features/workspace/WorkspaceDataContext';

export function NotificationsPage() {
  const { notifications, loading, error } = useWorkspaceData();
  return <><PageHeader title="Notifications" description="Pratinjau notifikasi simulasi—tidak ada pesan yang dikirim ke Telegram." /><div className="notification-notice"><strong>Telegram simulation only</strong><span>Konten dibuat dari data sintetis dan hanya ditampilkan di browser.</span></div>
    <section className="phone-preview"><div className="phone-header"><span className="brand-mark">S</span><div><strong>Sentinel Alert Bot</strong><small>simulation</small></div></div>{loading ? <p className="data-state">Memuat notifikasi…</p> : error ? <p className="data-state error-message">{error}</p> : notifications.map((notification) => <div className="message" key={notification.$id}><strong>{notification.message?.startsWith('🚨') ? '🚨 Critical security alert' : 'Incident updated'}</strong><p>{notification.message}</p><small>{relativeTime(notification.createdAt)}</small></div>)}</section></>;
}
