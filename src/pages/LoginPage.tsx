import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

export function LoginPage() {
  const { user, loading, error, loginWithGoogle } = useAuth();
  const [params] = useSearchParams();
  if (!loading && user) return <Navigate to="/" replace />;
  return <main className="login-page">
    <section className="login-panel">
      <div className="login-brand"><span className="brand-mark">S</span><span>Sentinel Lab</span></div>
      <div className="login-copy"><span className="security-label">Isolated SOC workspace</span><h1>Investigasi ancaman tanpa mengekspos sistem nyata.</h1><p>Masuk untuk memperoleh workspace demo pribadi berisi alert dan incident sintetis yang terisolasi dari pengguna lain.</p></div>
      <ul className="trust-list"><li>✓ Data sintetis per pengguna</li><li>✓ Tanpa Wazuh atau Telegram</li><li>✓ Data demo memiliki masa aktif</li></ul>
    </section>
    <section className="signin-panel" aria-labelledby="signin-title"><div className="signin-card">
      <p className="eyebrow">Secure access</p><h2 id="signin-title">Masuk ke dashboard</h2><p>Gunakan akun Google untuk membuat atau melanjutkan workspace demo Anda.</p>
      {(error || params.get('error') === 'oauth') && <div className="error-message" role="alert">{error || 'Login Google dibatalkan atau gagal. Silakan coba lagi.'}</div>}
      <button className="google-button" type="button" disabled={loading} onClick={() => void loginWithGoogle()}><span className="google-mark">G</span>{loading ? 'Memeriksa sesi…' : 'Lanjutkan dengan Google'}</button>
      <small>Anda hanya dapat mengakses data demo milik akun Anda sendiri.</small>
    </div></section>
  </main>;
}
