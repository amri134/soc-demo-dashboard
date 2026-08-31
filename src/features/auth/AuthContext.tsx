import type { Models } from 'appwrite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { account, appwriteConfigured, functions, OAuthProvider } from '../../lib/appwrite';

type AuthValue = { user: Models.User<Models.Preferences> | null; loading: boolean; error: string | null; loginWithGoogle: () => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadUser = useCallback(async () => {
    if (!appwriteConfigured) { setError('Konfigurasi Appwrite belum lengkap di file .env.'); setLoading(false); return; }
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      setError(null);
      try {
        await provisionWorkspace();
      } catch {
        setError('Workspace demo belum dapat disiapkan. Muat ulang halaman atau coba lagi nanti.');
      }
    } catch {
      setUser(null);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadUser(); }, [loadUser]);
  const loginWithGoogle = useCallback(async () => {
    setError(null);
    if (!appwriteConfigured) { setError('Konfigurasi Appwrite belum lengkap di file .env.'); return; }
    const origin = window.location.origin;
    await account.createOAuth2Session({ provider: OAuthProvider.Google, success: `${origin}/`, failure: `${origin}/login?error=oauth` });
  }, []);
  const logout = useCallback(async () => { await account.deleteSession({ sessionId: 'current' }); setUser(null); }, []);
  const value = useMemo(() => ({ user, loading, error, loginWithGoogle, logout }), [user, loading, error, loginWithGoogle, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function provisionWorkspace() {
  const functionId = import.meta.env.VITE_APPWRITE_PROVISION_FUNCTION_ID;
  if (!functionId) return;

  await functions.createExecution({ functionId, async: false });
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  return value;
}
