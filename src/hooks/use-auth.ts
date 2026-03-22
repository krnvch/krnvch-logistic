import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { identify, reset, track } from "@/lib/analytics";
import type { UserRole } from "@/types";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Extract role from user metadata; default to "operator" for backwards compat
  const role: UserRole =
    (session?.user?.user_metadata?.role as UserRole) ?? "operator";
  const isOperator = role === "operator";

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        identify(user.id, {
          email: user.email,
          role: user.user_metadata?.role as string | undefined,
        });
        track("user_logged_in", { email: user.email });
      }
    }
    return { error };
  };

  const logout = async () => {
    track("user_logged_out");
    await supabase.auth.signOut();
    reset();
  };

  return { session, loading, login, logout, role, isOperator };
}
