import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  authApi,
  storeToken,
  clearToken,
  getStoredToken,
  type ApiUser,
} from "./api-client";

interface Driver {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  licenseNumber: string;
  companyId: string | null;
  role: string;
  isApproved: boolean;
  isAvailable: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  session: { user: { id: string; email: string } } | null;
  driver: Driver | null;
  isLoading: boolean;
  isApproved: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshDriver: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "auth_session";

/**
 * Map an API User object to our internal Driver type.
 */
function mapUserToDriver(user: ApiUser): Driver {
  return {
    id: user._id,
    email: user.email,
    name: user.fullName,
    phoneNumber: user.phoneNumber,
    licenseNumber: "", // license is on the driver profile, not user
    companyId: user.companyId,
    role: user.role,
    isApproved: user.status === "ACTIVE",
    isAvailable: user.isAvailable ?? false,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: { id: string; email: string } } | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  // Initialize auth session on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          // Validate token against the server
          const response = await authApi.checkAuth();
          const user = response.data.data.user;

          const driverData = mapUserToDriver(user);
          setDriver(driverData);
          setIsApproved(driverData.isApproved);
          setSession({ user: { id: user._id, email: user.email } });

          // Persist session for offline reference
          await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ user: { id: user._id, email: user.email } })
          );
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Token is invalid or expired, clear it
        await clearToken();
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    try {
      const response = await authApi.login(identifier, password);
      const { token, data } = response.data;
      const user = data.user;

      // Store the JWT token
      await storeToken(token);

      const driverData = mapUserToDriver(user);
      setDriver(driverData);
      setIsApproved(driverData.isApproved);

      const newSession = {
        user: {
          id: user._id,
          email: user.email,
        },
      };
      setSession(newSession);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Call server logout (best effort)
      try {
        await authApi.logout();
      } catch {
        // Ignore logout API errors
      }

      setSession(null);
      setDriver(null);
      setIsApproved(false);
      await clearToken();
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const refreshDriver = async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      const response = await authApi.checkAuth();
      const user = response.data.data.user;

      const driverData = mapUserToDriver(user);
      setDriver(driverData);
      setIsApproved(driverData.isApproved);
    } catch (error) {
      console.error("Error refreshing driver:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        driver,
        isLoading,
        isApproved,
        signIn,
        signOut,
        refreshDriver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { Driver };
