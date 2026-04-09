import { createContext, useCallback, useContext, useState } from "react";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API = "http://localhost:4000/api/auth";

  // const restoreSession = useCallback(async () => {
  //   setLoading(true);
  //   const token = localStorage.getItem("token");
  //   const refreshToken = localStorage.getItem("refresh_token");

  //   if (!token) {
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     const res = await fetch(`${API}/me`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     if (res.ok) {
  //       const user = await res.json();
  //       setUser(user);
  //       return;
  //     }

  //     if (res.status === 401) {
  //       const refreshRes = await fetch(`${API}/refresh`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ refresh_token: refreshToken }),
  //       });

  //       if (!refreshRes.ok) throw new Error("Session expired");

  //       const refreshData = await refreshRes.json();
  //       localStorage.setItem("token", refreshData.access_token);
  //       localStorage.setItem("refresh_token", refreshData.refresh_token);
  //       setUser(refreshData.user);
  //     }
  //   } catch {
  //     localStorage.removeItem("token");
  //     localStorage.removeItem("refresh_token");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  const restoreSession = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const user = await res.json();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // localStorage.setItem("token", data.access_token);
      // localStorage.setItem("refresh_token", data.refresh_token);
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err; // re-throw so the form can react if needed
    }
  };

  // 🆕 register
  const register = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(`${API}/register`, {
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
  };

  // 🚪 logout
  // const logout = () => {
  //   fetch(`${API}/logout`, {
  //     method: "POST",
  //     credentials: "include",
  //   }).catch(() => {
  //     /* ignore logout network issues */
  //   });

  //   localStorage.removeItem("token");
  //   localStorage.removeItem("refresh_token");
  //   setUser(null);
  //   setError(null);
  // };

  const logout = async () => {
    await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setError(null);
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout, restoreSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
