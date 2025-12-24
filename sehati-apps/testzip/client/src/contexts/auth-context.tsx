import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@shared/schema";
import { 
  connectWallet as apiConnectWallet, 
  generateWallet as apiGenerateWallet,
  generateNonce,
  signMessage as apiSignMessage,
  verifySignature,
  checkSession,
  logout as apiLogout 
} from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

interface WalletInfo {
  address: string;
  privateKey: string;
  mnemonic: string;
}

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
  walletInfo: WalletInfo | null;
  generateNewWallet: () => Promise<WalletInfo>;
  connectWithWallet: (data: RegistrationData) => Promise<void>;
  loginWithExistingWallet: (walletAddress: string, privateKey: string) => Promise<LoginResult>;
  disconnect: () => Promise<void>;
  clearWalletInfo: () => void;
  setExternalWallet: (address: string, privateKey: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

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
      } catch (e) {
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

  const verifyWalletOwnership = async (walletAddress: string, privateKey: string): Promise<boolean> => {
    const { nonce, message } = await generateNonce(walletAddress);
    const { signature } = await apiSignMessage(privateKey, message);
    const result = await verifySignature(walletAddress, message, signature);
    return result.verified;
  };

  const generateNewWallet = async (): Promise<WalletInfo> => {
    setIsLoading(true);
    try {
      const result = await apiGenerateWallet();
      const wallet: WalletInfo = {
        address: result.address,
        privateKey: result.privateKey,
        mnemonic: result.mnemonic,
      };
      setWalletInfo(wallet);
      
      await verifyWalletOwnership(wallet.address, wallet.privateKey);
      
      return wallet;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWithWallet = async (data: RegistrationData) => {
    setIsLoading(true);
    try {
      queryClient.clear();
      const { user: newUser } = await apiConnectWallet(data);
      setUser(newUser);
      localStorage.setItem("sehati_user", JSON.stringify(newUser));
      setWalletInfo(null);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithExistingWallet = async (walletAddress: string, privateKey: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      queryClient.clear();
      
      const { nonce, message } = await generateNonce(walletAddress);
      const { signature } = await apiSignMessage(privateKey, message);
      const verifyResult = await verifySignature(walletAddress, message, signature);
      
      if (!verifyResult.verified) {
        return { success: false, verified: false, exists: false };
      }
      
      if (verifyResult.exists && verifyResult.user) {
        setUser(verifyResult.user);
        localStorage.setItem("sehati_user", JSON.stringify(verifyResult.user));
        return { success: true, verified: true, exists: true, userRole: verifyResult.user.role };
      }
      
      const session = await checkSession();
      if (session.authenticated && session.user) {
        setUser(session.user);
        localStorage.setItem("sehati_user", JSON.stringify(session.user));
        return { success: true, verified: true, exists: true, userRole: session.user.role };
      }
      
      return { success: false, verified: true, exists: false };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, verified: false, exists: false };
    } finally {
      setIsLoading(false);
    }
  };

  const setExternalWallet = (address: string, privateKey: string) => {
    setWalletInfo({
      address,
      privateKey,
      mnemonic: "",
    });
  };

  const disconnect = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error("Logout error:", e);
    }
    queryClient.clear();
    setUser(null);
    setWalletInfo(null);
    localStorage.removeItem("sehati_user");
  };

  const clearWalletInfo = () => {
    setWalletInfo(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      walletInfo,
      generateNewWallet, 
      connectWithWallet,
      loginWithExistingWallet,
      disconnect,
      clearWalletInfo,
      setExternalWallet
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
