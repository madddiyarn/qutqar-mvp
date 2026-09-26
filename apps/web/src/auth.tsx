import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { User } from "./types/domain";

type AuthContextValue = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isController: boolean;
};

const storageKey = "boltzzmann.session";
const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const value = useMemo<AuthContextValue>(() => ({
    user,
    isController: user?.role === "CONTROLLER",
    login: (nextUser) => {
      localStorage.setItem(storageKey, JSON.stringify(nextUser));
      setUser(nextUser);
    },
    logout: () => {
      localStorage.removeItem(storageKey);
      setUser(null);
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
