import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@shared/schema";
import {
  connectWallet as apiConnectWallet,
  checkSession,
  logout as apiLogout
} from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

interface LoginResult {
  success: boolean;
  verified: boolean;
  exists: boolean;
  userRole?: "patient" | "doctor";
}

interface RegistrationData {
  walletAddress: string;
  name: string;
  role: "patient" | "doctor";
  gender: "male" | "female" | "other";
  age: number;
  bloodType?: string | null;
  allergies?: string[] | null;
  hospital?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  connectWithWalletSignature: (data: RegistrationData, signature: string, message: string) => Promise<void>;
  loginWithSignature: (walletAddress: string, signature: string, message: string) => Promise<LoginResult>;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await checkSession();
        if (session.authenticated && session.user) {
          setUser(session.user);
          localStorage.setItem("sehati_user", JSON.stringify(session.user));
        } else {
          localStorage.removeItem("sehati_user");
        }
      } catch (e: any) {
        // [FIX] If checking session fails with 401/403, do not restore from local storage
        if (e.status === 401 || e.status === 403) {
          console.log("Session expired or invalid, clearing local user state");
          localStorage.removeItem("sehati_user");
          setUser(null);
          return;
        }

        const savedUser = localStorage.getItem("sehati_user");
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            localStorage.removeItem("sehati_user");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const connectWithWalletSignature = async (data: RegistrationData, signature: string, message: string) => {
    setIsLoading(true);
    try {
      queryClient.clear();

      console.log("Connecting wallet with signature:", {
        walletAddress: data.walletAddress,
        hasSignature: !!signature,
        hasMessage: !!message
      });

      // Pass signature and message to connectWallet - server will verify and register in one request
      const { user: newUser } = await apiConnectWallet({
        ...data,
        signature,
        message,
      });
      setUser(newUser);
      localStorage.setItem("sehati_user", JSON.stringify(newUser));
    } catch (error: any) {
      console.error("Failed to connect wallet with signature:", error);
      const errorMessage = error?.message || "Failed to complete registration. Please try again.";
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSignature = async (walletAddress: string, signature: string, message: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      queryClient.clear();

      // We use the same endpoint but checking if user exists
      // In a real app we might have a dedicated login endpoint, but /api/auth/verify-signature is typically used (which we called in previous flow)
      // Here we will use a hypothetical verify-signature aligned with routes.ts

      const response = await fetch("/api/auth/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, message, signature }),
      });

      if (!response.ok) {
        throw new Error("Signature verification failed");
      }

      const verifyResult = await response.json();

      if (!verifyResult.verified) {
        return { success: false, verified: false, exists: false };
      }

      if (verifyResult.exists && verifyResult.user) {
        setUser(verifyResult.user);
        localStorage.setItem("sehati_user", JSON.stringify(verifyResult.user));
        return { success: true, verified: true, exists: true, userRole: verifyResult.user.role as "patient" | "doctor" };
      }

      const session = await checkSession();
      if (session.authenticated && session.user) {
        setUser(session.user);
        localStorage.setItem("sehati_user", JSON.stringify(session.user));
        return { success: true, verified: true, exists: true, userRole: session.user.role as "patient" | "doctor" };
      }

      return { success: false, verified: true, exists: false };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, verified: false, exists: false };
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error("Logout error:", e);
    }
    queryClient.clear();
    setUser(null);
    localStorage.removeItem("sehati_user");
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      connectWithWalletSignature,
      loginWithSignature,
      disconnect,
    }}>
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
