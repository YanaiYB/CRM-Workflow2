import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Internal email convention: <username>@app.local
function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@app.local`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const meta = newSession?.user?.user_metadata as { username?: string } | undefined;
      setUsername(meta?.username ?? null);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const meta = data.session?.user?.user_metadata as { username?: string } | undefined;
      setUsername(meta?.username ?? null);
      setIsLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = async (uname: string, password: string) => {
    const email = usernameToEmail(uname);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error("שם משתמש או סיסמה שגויים");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        username,
        isAuthenticated: !!session,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
