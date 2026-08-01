// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { setAuthToken } from "../services/apiClient";
import { authService } from "../services/authService";
import { storage } from "../services/storage";

const AuthContext = createContext();

const AUTH_TOKEN_KEY = "@salon_app_token";
const AUTH_USER_KEY = "@salon_app_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore user session automatically on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await storage.getItem(AUTH_TOKEN_KEY);
        const savedUser = await storage.getItem(AUTH_USER_KEY);

        if (savedToken && savedUser && savedUser !== "undefined" && savedUser !== "null") {
          try {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser) {
              setToken(savedToken);
              setUser(parsedUser);
              setAuthToken(savedToken);
            }
          } catch (e) {
            console.warn("Invalid saved user JSON, clearing session:", e);
            await storage.removeItem(AUTH_USER_KEY);
          }
        }
      } catch (err) {
        console.warn("Failed to restore auth session:", err.message);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const accessToken = res?.data?.accessToken || res?.accessToken;
      const userData = res?.data?.user || res?.user;

      if (accessToken) {
        setToken(accessToken);
        setUser(userData || null);
        setAuthToken(accessToken);

        // Persist session across app restarts
        await storage.setItem(AUTH_TOKEN_KEY, accessToken);
        if (userData) {
          await storage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        }

        return { success: true, user: userData };
      }
      throw new Error(res?.message || "Invalid response from server");
    } catch (err) {
      const msg = err.message || "Failed to log in";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.register(name, email, password, phone);
      const accessToken = res?.data?.accessToken || res?.accessToken;
      const userData = res?.data?.user || res?.user;

      if (accessToken) {
        setToken(accessToken);
        setUser(userData || null);
        setAuthToken(accessToken);

        // Persist session across app restarts
        await storage.setItem(AUTH_TOKEN_KEY, accessToken);
        if (userData) {
          await storage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        }

        return { success: true, user: userData };
      }
      throw new Error(res?.message || "Registration failed");
    } catch (err) {
      const msg = err.message || "Failed to register";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    await storage.removeItem(AUTH_TOKEN_KEY);
    await storage.removeItem(AUTH_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
