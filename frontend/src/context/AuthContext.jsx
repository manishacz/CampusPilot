import { createContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";
import { auth } from "../lib/auth.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until first session check completes
  const [error, setError] = useState(null);
  const initialised = useRef(false);

  useEffect(() => {
    // Load session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        if (session) {
          const profile = await auth.buildUserFromSession(session);
          setUser(profile);
        }
        setLoading(false);
        initialised.current = true;
      })();
    });

    // Keep session in sync across tabs and after OAuth redirects.
    // Skip the INITIAL_SESSION synthetic event — getSession() above already
    // handled it, and letting both run causes 7+ duplicate profile fetches.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialised.current) return; // still loading from getSession()
      (async () => {
        if (session) {
          const profile = await auth.buildUserFromSession(session);
          setUser(profile);
        } else {
          setUser(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const u = await auth.login(email, password);
      setUser(u);
      return u;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const u = await auth.signup(data);
      setUser(u);
      return u;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await auth.loginWithGoogle();
      // Browser navigates away for OAuth; no return value needed
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const u = await auth.updateProfile(updates);
    setUser(u);
    return u;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
