import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../features/auth/AuthContext';
import { useWorkspaceData } from '../features/workspace/WorkspaceDataContext';

export function SettingsPage() {
  const { user } = useAuth(); const { actionLoading, runAction } = useWorkspaceData();
  const reset = () => { if (window.confirm('Reset workspace akan menghapus seluruh data demo Anda dan membuat dataset sintetis baru. Lanjutkan?')) void runAction({ action: 'reset-workspace' }); };
  return <><PageHeader title="Settings" description="Informasi akun dan batas keamanan workspace demo." /><section className="settings-grid"><article className="panel"><h3>Account</h3><dl><div><dt>Name</dt><dd>{user?.name || 'Google user'}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>User ID</dt><dd><code>{user?.$id}</code></dd></div></dl></article><article className="panel"><h3>Demo safeguards</h3><ul className="safeguard-list"><li>✓ Per-user row permissions</li><li>✓ Private evidence storage</li><li>✓ Synthetic IP addresses and logs</li><li>✓ External integrations disabled</li></ul></article><article className="panel danger-panel"><h3>Workspace lifecycle</h3><p>Reset hanya menghapus data sintetis di workspace akun Anda, lalu membuat dataset demo baru.</p><button className="danger-button" type="button" disabled={actionLoading} onClick={reset}>{actionLoading ? 'Resetting…' : 'Reset workspace'}</button></article></section></>;
}
