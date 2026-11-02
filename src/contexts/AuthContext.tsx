import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  adminLoading: boolean;
  profile: { display_name: string; avatar_url: string | null } | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let authRevision = 0;
    let userDataRevision = 0;
    let active = true;

    async function syncUserData(userId: string | null) {
      const revision = ++userDataRevision;
      if (!userId) {
        setProfile(null);
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      setAdminLoading(true);
      try {
        const [profileResult, adminResult] = await Promise.all([
          supabase.from("profiles").select("display_name, avatar_url").eq("user_id", userId).single(),
          supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        ]);

        if (!active || revision !== userDataRevision) return;
        setProfile(profileResult.data ?? null);
        setIsAdmin(!adminResult.error && !!adminResult.data);
      } catch {
        if (!active || revision !== userDataRevision) return;
        setProfile(null);
        setIsAdmin(false);
      } finally {
        if (active && revision === userDataRevision) setAdminLoading(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authRevision += 1;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setAdminLoading(true);
        setTimeout(() => {
          void syncUserData(session.user.id);
        }, 0);
      } else {
        void syncUserData(null);
      }
      setLoading(false);
    });

    const initialAuthRevision = authRevision;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || initialAuthRevision !== authRevision) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void syncUserData(session.user.id);
      } else {
        void syncUserData(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, adminLoading, profile, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
