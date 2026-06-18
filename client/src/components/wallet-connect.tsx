import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Wallet, LogOut, ShieldCheck } from "lucide-react";
// @ts-ignore
import { useAccount, useSignMessage, useDisconnect, useConnect } from "wagmi";
import { web3AuthConnector } from "@/lib/wagmi";
import { generateNonce } from "@/lib/api";

interface WalletConnectProps {
  className?: string;
  initialRole?: "patient" | "doctor";
  autoOpen?: boolean;
  onRequireRegistration?: () => void;
}

export function WalletConnect({ className, initialRole, autoOpen, onRequireRegistration }: WalletConnectProps) {
  const { user, connectWithWalletSignature, loginWithSignature, disconnect: appDisconnect } = useAuth();
  const { connectAsync, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [showDialog, setShowDialog] = useState(autoOpen ?? false);
  const [role, setRole] = useState<"patient" | "doctor">(initialRole ?? "patient");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [hospital, setHospital] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  // Sync role if prop changes
  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  // Handle wallet connection and login flow
  useEffect(() => {
    if (isConnected && address && !user && !isSigning) {
      handleLogin();
    }
  }, [isConnected, address]);

  const handleLogin = async () => {
    if (!address) return;
    setError(null);
    setIsSigning(true);

    try {
      // 1. Get nonce and message from server
      const { message } = await generateNonce(address);

      // 2. Request signature from wallet
      const signature = await signMessageAsync({ message });

      // 3. Verify signature and check if user exists
      const result = await loginWithSignature(address, signature, message);

      if (result.success) {
        setShowVerifyDialog(false);
        setShowDialog(false);
      } else if (!result.exists) {
        // User doesn't exist, trigger registration callback
        setIsSigning(false);
        if (onRequireRegistration) {
          onRequireRegistration();
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Don't show error if user rejected signature, just reset
      if (err.message?.includes("User rejected")) {
        setError("Signature request rejected.");
      } else {
        setError("Failed to verify wallet. Please try again.");
      }
      setIsSigning(false);
    }
  };

  const handleRegister = async () => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 0) {
      setError("Please enter a valid age");
      return;
    }
    if (role === "doctor" && !hospital.trim()) {
      setError("Hospital name is required for doctors");
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      const { message } = await generateNonce(address);

      const signature = await signMessageAsync({ message });

      await connectWithWalletSignature({
        walletAddress: address,
        name,
        role,
        age: ageNum,
        gender,
        hospital: role === "doctor" ? hospital : undefined
      }, signature, message);

      setShowDialog(false);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setIsSigning(false);
    }
  };

  const handleDisconnect = async () => {
    disconnect(); // Wagmi disconnect
    await appDisconnect(); // App logout
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className={`font-mono text-xs gap-2 bg-primary/5 border border-primary/20 text-primary px-3 py-2 rounded-md flex items-center ${className}`}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(38)}
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-9 gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      <Button
        onClick={async () => {
          try {
            const connector = connectors.find(c => c.id === 'web3auth') || connectors.find(c => c.name.toLowerCase().includes('web3auth'));
            if (!connector) throw new Error("Web3Auth connector not found");
            await connectAsync({ connector });
          } catch (err: any) {
            console.error("Connection error:", err);
            
            if (localStorage.getItem("Web3Auth-cachedAdapter")) {
              localStorage.removeItem("Web3Auth-cachedAdapter");
            }
  
            const w3aModal = document.getElementById("w3a-modal");
            if (w3aModal) w3aModal.style.display = "none";
            const overlay = document.querySelector(".w3a-modal__overlay");
            if (overlay) (overlay as HTMLElement).style.display = "none";

            const errorMsg = err.message || "";
            if (!errorMsg.toLowerCase().includes("user rejected") && !errorMsg.toLowerCase().includes("closed the modal")) {
              setError("Gagal connect Web3Auth: " + errorMsg);
            }
          }
        }}
        className="w-full h-14 bg-[#020617] hover:bg-transparent hover:text-[#020617] border border-[#020617] text-white rounded-none uppercase tracking-[0.2em] text-[10px] font-bold transition-all duration-500 flex items-center justify-center gap-4 group shadow-xl"
      >
        <Wallet className="w-4 h-4 transition-transform duration-500 group-hover:scale-110" />
        CONTINUE WITH EMAIL / GOOGLE
      </Button>

      {error && (
        <div className="p-4 border border-rose-500/30 bg-rose-50/50 flex items-start gap-3 mt-4">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-rose-700 tracking-wide uppercase">{error}</p>
        </div>
      )}


    </div>
  );
}
