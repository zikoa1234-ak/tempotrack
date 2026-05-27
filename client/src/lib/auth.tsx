import { createContext, useContext, useMemo, useState } from "react";
import type { AuthResponse, SafeUser } from "@shared/schema";
import { apiRequest, queryClient, setAuthToken } from "@/lib/queryClient";

type AuthContextValue = {
  user: SafeUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  function applyAuth(auth: AuthResponse) {
    setAuthToken(auth.token);
    setToken(auth.token);
    setUser(auth.user);
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    login: async (email, password) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      applyAuth(await res.json());
    },
    register: async (name, email, password) => {
      const res = await apiRequest("POST", "/api/auth/register", { name, email, password });
      applyAuth(await res.json());
    },
    logout: async () => {
      if (token) {
        try {
          await apiRequest("POST", "/api/auth/logout");
        } catch {
          // Continue clearing local in-memory auth if the server token is already gone.
        }
      }
      setAuthToken(null);
      setToken(null);
      setUser(null);
      queryClient.clear();
    },
  }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
