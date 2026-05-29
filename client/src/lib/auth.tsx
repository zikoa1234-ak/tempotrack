import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { AuthResponse, SafeUser } from "@shared/schema";
import { apiRequest, queryClient, setAuthToken } from "@/lib/queryClient";

type AuthContextValue = {
  user: SafeUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string, countryCode: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Token storage key
const TOKEN_STORAGE_KEY = "tempotrack_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      bootstrapAuth(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function bootstrapAuth(token: string) {
    try {
      setAuthToken(token);
      // Try to get user info with stored token
      const res = await apiRequest("GET", "/api/auth/me");
      
      if (res.ok) {
        const { user } = await res.json();
        setTokenState(token);
        setUser(user);
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      } else {
        // Token is invalid or expired, clear it
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
      }
    } catch (error) {
      console.error("Failed to bootstrap auth:", error);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }

  function setToken(token: string | null) {
    setTokenState(token);
    setAuthToken(token);
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  function applyAuth(auth: AuthResponse) {
    setToken(auth.token);
    setUser(auth.user);
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    login: async (email, password) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      applyAuth(await res.json());
    },
    register: async (name, email, password, phone, countryCode) => {
      const res = await apiRequest("POST", "/api/auth/register", { name, email, password, phone, countryCode });
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
      setToken(null);
      setUser(null);
      queryClient.clear();
    },
  }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

