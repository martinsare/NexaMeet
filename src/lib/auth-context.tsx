import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, type Session } from "./backend";

type AuthContextValue = {
  session: Session;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });
    return auth.onSessionChange(setSession);
  }, []);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
