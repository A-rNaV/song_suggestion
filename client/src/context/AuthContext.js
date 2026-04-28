import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("adminToken"));
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem("adminToken"));

  const login = useCallback(async (password) => {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL || "/api"}/auth/admin-login`,
      { password }
    );
    const { token } = res.data;
    localStorage.setItem("adminToken", token);
    setToken(token);
    setIsAdmin(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    setToken(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
