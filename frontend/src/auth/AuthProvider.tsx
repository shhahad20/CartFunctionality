import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const API = "http://localhost:4000/api/auth";

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      if (res.status === 401) {
        // session expired → force logout
        setUser(null);
        throw new Error("Unauthorized");
      }

      return res;
    },
    [],
  );
  // Restore / validate session (SOURCE OF TRUTH)
  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const res = await apiFetch(`${API}/me`);
      const data = await res.json();

      const currentUser = data.user ?? data;
      setUser(currentUser);

      return currentUser;
    } catch {
      setUser(null);
      return null;
    }
  }, [apiFetch]);

  useEffect(() => {
    const init = async () => {
      try {
        await refresh();
      } finally {
        setInitialized(true);
      }
    };

    init();
  }, [refresh]);

  // const restoreSession = useCallback(async () => {
  //   setLoading(true);

  //   try {
  //     const res = await apiFetch(`${API}/me`, {
  //       credentials: "include",
  //     });

  //     if (!res.ok) {
  //       setUser(null);
  //       return;
  //     }

  //     const user = await res.json();
  //     setUser(user);
  //   } catch {
  //     setUser(null);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [apiFetch]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);

      try {
        const res = await apiFetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setUser(data.user);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err; // re-throw so the form can react if needed
      } finally {
        setLoading(false);
      }
    },
    [apiFetch],
  );

  // 🆕 register
  const register = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const res = await apiFetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // auto-login
        // await login(email, password);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setError(message);
        throw err; // re-throw so the form can react if needed
      }
    },
    [apiFetch],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch(`${API}/logout`, { method: "POST" });
    } catch {
      // ignore network errors
    } finally {
      setUser(null);
      setError(null);
    }
  }, [apiFetch]);

  const value = useMemo(
    () => ({
      user,
      loading,
      initialized,
      error,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, initialized, error, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
