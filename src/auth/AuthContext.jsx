import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ApiError,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  setSavedRequestUnauthorizedHandler,
} from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState(null);

  useEffect(() => {
    setSavedRequestUnauthorizedHandler(() => {
      setUser(null);
      setAuthNotice("Your session expired. Please log in again.");
    });
    return () => setSavedRequestUnauthorizedHandler(null);
  }, []);

  async function refreshCurrentUser() {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      return data.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        return null;
      }
      throw error;
    }
  }

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(data => {
        if (active) setUser(data.user);
      })
      .catch(error => {
        if (active && !(error instanceof ApiError && error.status === 401)) {
          console.error("Authentication check failed:", error);
        }
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function register(data) {
    const result = await registerUser(data);
    setAuthNotice(null);
    setUser(result.user);
    return result.user;
  }

  async function login(data) {
    const result = await loginUser(data);
    setAuthNotice(null);
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    setUser(null);
    setAuthNotice(null);
    await logoutUser();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        authNotice,
        clearAuthNotice: () => setAuthNotice(null),
        register,
        login,
        logout,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
