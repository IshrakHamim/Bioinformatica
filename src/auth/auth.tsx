import { createContext, useContext, useState, type ReactNode } from 'react';

// Static sites cannot keep secrets: this gate only keeps casual visitors out and scopes
// progress to a user. The Vercel /api/progress route re-checks credentials server side.
// sha256(`bioinformatica|${user}|${password}`), here for admin / admin123. To change the login, run:
//   node -e "console.log(require('crypto').createHash('sha256').update('bioinformatica|USER|PASS').digest('hex'))"
const CREDENTIAL_HASH = '651d95305ad8a44d70df889a65d3750ff333f90222a73bde2aea1969492392d5';
const SESSION_KEY = 'bioinformatica.session';

export interface Session {
  user: string;
  token: string; // base64(user:password), sent as HTTP Basic auth to the sync API
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

interface AuthCtx {
  session: Session | null;
  login: (user: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ session: null, login: async () => false, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const login = async (user: string, password: string) => {
    const ok = (await sha256(`bioinformatica|${user.trim()}|${password}`)) === CREDENTIAL_HASH;
    if (!ok) return false;
    const s = { user: user.trim(), token: btoa(`${user.trim()}:${password}`) };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable: session lasts for this tab only */
    }
    setSession(s);
    return true;
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setSession(null);
  };

  return <Ctx.Provider value={{ session, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
