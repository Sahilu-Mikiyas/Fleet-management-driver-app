import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Driver {
  id: number;
  email: string;
  name: string;
  licenseNumber: string;
  companyId: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  session: { user: { id: string; email: string } } | null;
  driver: Driver | null;
  isLoading: boolean;
  isApproved: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshDriver: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock driver database
const MOCK_DRIVERS: Record<string, Driver> = {
  "driver@test.com": {
    id: 1,
    email: "driver@test.com",
    name: "Test Driver",
    licenseNumber: "DL123456789",
    companyId: "comp1",
    isApproved: true,
    createdAt: "2026-03-28T09:04:36Z",
    updatedAt: "2026-03-28T09:04:36Z",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: { id: string; email: string } } | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  // Initialize auth session on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedSession = await AsyncStorage.getItem("auth_session");
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          setSession(parsedSession);
          await fetchDriver(parsedSession.user.email);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchDriver = async (email: string) => {
    try {
      const mockDriver = MOCK_DRIVERS[email];
      if (!mockDriver) {
        throw new Error("Driver not found");
      }

      setDriver(mockDriver);
      setIsApproved(mockDriver.isApproved);
    } catch (error) {
      console.error("Error fetching driver:", error);
      setDriver(null);
      setIsApproved(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Mock authentication - just check if driver exists
      const mockDriver = MOCK_DRIVERS[email];
      if (!mockDriver) {
        throw new Error("Invalid email or password");
      }

      const newSession = {
        user: {
          id: email,
          email: email,
        },
      };

      setSession(newSession);
      await fetchDriver(email);
      await AsyncStorage.setItem("auth_session", JSON.stringify(newSession));
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setSession(null);
      setDriver(null);
      setIsApproved(false);
      await AsyncStorage.removeItem("auth_session");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const refreshDriver = async () => {
    if (session?.user.email) {
      await fetchDriver(session.user.email);
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
