import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Wallet } from "lucide-react";
// @ts-ignore
import { useAccount, useSignMessage, useDisconnect, useConnect } from "wagmi";
import { web3AuthConnector } from "@/lib/wagmi";

interface WalletConnectProps {
  className?: string;
  initialRole?: "patient" | "doctor";
  autoOpen?: boolean;
}

export function WalletConnect({ className, initialRole, autoOpen }: WalletConnectProps) {
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

  // Sync role if prop changes
  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  // Handle wallet connection and login flow
  useEffect(() => {
    if (isConnected && address && showDialog && !user && !isSigning) {
      // Auto-attempt login if connected
      handleLogin();
    }
  }, [isConnected, address, showDialog]);

  const handleLogin = async () => {
    if (!address) return;
    setError(null);
    setIsSigning(true);

    try {
      // 1. Generate message to sign
      const timestamp = new Date().toISOString();
      const message = `Welcome to SEHATI Health Identity System!\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address: ${address}\nTimestamp: ${timestamp}`;

      // 2. Request signature from wallet
      const signature = await signMessageAsync({ message });

      // 3. Verify signature and check if user exists
      const result = await loginWithSignature(address, signature, message);

      if (result.success) {
        setShowDialog(false);
      } else if (!result.exists) {
        // User doesn't exist, stay on dialog to complete registration
        // Just stop loading and let them fill the form
        setIsSigning(false);
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
      const timestamp = new Date().toISOString();
      const message = `Registering for SEHATI Health Identity System\n\nName: ${name}\nRole: ${role}\nWallet: ${address}\nTimestamp: ${timestamp}`;

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
        <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-9">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={async () => {
        try {
          const connector = connectors.find(c => c.id === 'web3auth') || connectors[0];
          if (!connector) throw new Error("Web3Auth connector not found");
          await connectAsync({ connector });
        } catch (err: any) {
          console.error("Connection error:", err);
          
          // BULLETPROOF FIX: Web3Auth modal often gets stuck on "You are connected" and forces user to click X.
          // When they click X, Wagmi aborts with an error. 
          // BUT Web3Auth actually succeeded and saved the session to localStorage!
          // If the session exists, we just reload the page to let Wagmi auto-connect seamlessly.
          if (localStorage.getItem("Web3Auth-cachedAdapter")) {
            window.location.reload();
            return;
          }

          // Force cleanup Web3Auth modal on error if not reloading
          const w3aModal = document.getElementById("w3a-modal");
          if (w3aModal) w3aModal.style.display = "none";
          const overlay = document.querySelector(".w3a-modal__overlay");
          if (overlay) (overlay as HTMLElement).style.display = "none";
        }
      }}
      className={`gap-2 h-12 px-8 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full shadow-md font-bold transition-all ${className}`}
    >
      <Wallet className="w-5 h-5" />
      Connect Web3Auth
    </Button>
  );
}
