import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "../api";

const STORAGE_KEY = "drivemint-mobile-session";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!raw) {
          setReady(true);
          return;
        }

        const session = JSON.parse(raw);

        if (!session?.token) {
          setReady(true);
          return;
        }

        const data = await apiRequest("/auth/me", {
          token: session.token,
        });

        setToken(session.token);
        setUser(data.user);
      } catch (error) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setToken("");
        setUser(null);
      } finally {
        setReady(true);
      }
    }

    restoreSession();
  }, []);

  async function persistSession(nextToken, nextUser) {
    if (!nextToken || !nextUser) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setToken("");
      setUser(null);
      return;
    }

    const payload = { token: nextToken, user: nextUser };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setToken(nextToken);
    setUser(nextUser);
  }

  async function signIn(credentials) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    });

    await persistSession(data.token, data.user);
    return data.user;
  }

  async function signUp(payload) {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: payload,
    });

    await persistSession(data.token, data.user);
    return data.user;
  }

  async function signOut() {
    try {
      if (token) {
        await apiRequest("/auth/logout", {
          method: "POST",
          token,
        });
      }
    } catch (error) {
      // Best-effort logout for local demo sessions.
    } finally {
      await persistSession("", null);
    }
  }

  async function refreshUser() {
    if (!token) {
      return null;
    }

    const data = await apiRequest("/auth/me", {
      token,
    });

    await persistSession(token, data.user);
    return data.user;
  }

  async function updateStoredUser(nextUser) {
    await persistSession(token, nextUser);
  }

  return (
    <AuthContext.Provider
      value={{
        ready,
        token,
        user,
        signIn,
        signOut,
        signUp,
        refreshUser,
        updateStoredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
