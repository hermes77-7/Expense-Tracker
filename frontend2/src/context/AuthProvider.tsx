import { useState } from "react";
import type { ReactNode } from "react";

import type { User } from "../types/auth";

import { AuthContext } from "./AuthContext";
import type { AuthContextType } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");

    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);

    setUser(newUser);

    localStorage.setItem("token", newToken);

    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);

    setUser(null);

    localStorage.removeItem("token");

    localStorage.removeItem("user");
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
