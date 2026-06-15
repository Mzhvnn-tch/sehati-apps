import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { generateNonce } from "@/lib/api";
import { generateKeyPair, encryptPrivateKeyWithPIN } from "@/lib/encryption";
import { BrowserProvider } from "ethers";
import { LogOut } from "lucide-react";
// @ts-ignore
import { useAccount, useSwitchChain } from "wagmi"; // Added useSwitchChain
import { useEthersSigner, registerAsPatientOnChain } from "@/lib/blockchain";

interface PatientRegistrationProps {
  walletAddress: string;
  onSuccess: () => void;
  onDisconnect?: () => void; // Callback when user disconnects wallet
  isWalletConnect?: boolean; // Flag to indicate if this is a WalletConnect wallet
}

export function PatientRegistration({ walletAddress, onSuccess, onDisconnect, isWalletConnect = false }: PatientRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male" as "male" | "female" | "other",
    pin: "",
  });
  const { toast } = useToast();
  const { connectWithWalletSignature } = useAuth();
  const { isConnected, address, chainId } = useAccount(); // Added chainId
  const { switchChain } = useSwitchChain(); // Added hook
  const signer = useEthersSigner();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.age || formData.pin.length !== 6) {
      toast({
        title: "Error",
        description: "Please fill in all fields and ensure Health PIN is exactly 6 digits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Show initial loading toast
    const loadingToast = toast({
      title: "Processing...",
      description: "Please wait",
      duration: 60000, // 60 seconds
    });

    try {
      const registrationData = {
        walletAddress,
        name: formData.name,
        role: "patient" as const,
        gender: formData.gender,
        age: parseInt(formData.age),
      };

      // Enforce WalletConnect/Signature flow
      if (address) {
        // Network Check (Added for Robustness)
        const chainIdNumber = Number(chainId);
        if (chainIdNumber && chainIdNumber !== 11155111) {
          console.warn(`⚠️ Registration: Wrong Network ${chainIdNumber}`);
          toast({ title: "Wrong Network", description: "Switching to Ethereum Sepolia for registration...", duration: 3000 });
          try {
            switchChain({ chainId: 11155111 });
            // We return here to let the switch happen. User needs to click Register again after switch.
            // Or we could await if switchChain was async in a way that blocks, but usually it triggers a prompt.
            setLoading(false);
            return;
          } catch (e) {
            console.error("Failed to switch network:", e);
          }
        }

        console.log("🔵 WalletConnect flow detected", {
          address,
          walletAddress,
          windowEthereum: typeof window !== 'undefined' && !!(window as any).ethereum
        });

        try {
          // Use signer from hook
          if (!signer) {
            throw new Error("Wallet signer not available. Please ensure your wallet is connected and unlocked.");
          }

          // Step 1: Generate Key Pair (Client-Side)
          toast({
            title: "Security Setup",
            description: "Generating your secure encryption keys...",
            duration: 5000,
          });
          const { publicKeyStr, privateKeyStr } = await generateKeyPair();
          console.log("🔑 Generated Public Key:", publicKeyStr); // DEBUG LOG
          console.log("🔑 Public Key Length:", publicKeyStr.length); // DEBUG LOG

          localStorage.setItem(`sehati_priv_${walletAddress}`, privateKeyStr);

          // Step 1.5: Register on Blockchain (CRITICAL FIX)
          toast({
            title: "Step 1/4",
            description: "Funding vault and registering identity on Blockchain...",
            duration: 15000,
          });

          try {
            // Auto-Faucet Call
            try {
              const faucetRes = await fetch("/api/faucet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress })
              });
              if (!faucetRes.ok) console.warn("Faucet call failed or skipped");
            } catch (e) {
              console.warn("Faucet error:", e);
            }

            const tx = await registerAsPatientOnChain(signer);
            console.log("🔗 Blockchain Registration Tx:", tx.hash);
            toast({ title: "Blockchain Tx Sent", description: "Identity is being minted on Ethereum Sepolia." });
          } catch (e: any) {
            console.error("Blockchain registration failed:", e);
            const errMsg = (e.reason || e.message || "").toLowerCase();
            if (errMsg.includes("already registered")) {
              toast({ title: "Info", description: "Wallet already registered on-chain. Syncing with backend..." });
            } else if (errMsg.includes("undefined to a bigint") || errMsg.includes("insufficient funds")) {
              toast({ title: "Warning", description: "No Sepolia ETH for Blockchain. Proceeding with Database sync only...", duration: 5000 });
            } else {
              toast({ title: "Warning", description: "Blockchain sync failed. Proceeding with Database only...", duration: 5000 });
            }
            // By NOT throwing here, we allow the app to fallback to the off-chain database 
            // so the user can still test the UI without needing real testnet ETH.
          }

          // Step 2: Generate nonce
          toast({
            title: "Step 2/4",

            description: "Generating verification message...",
            duration: 5000,
          });
          const { message } = await generateNonce(walletAddress);

          // Step 3: Sign message
          toast({
            title: "Step 3/4",
            description: "Please sign the message in your wallet...",
            duration: 30000,
          });

          // Add timeout for signature request
          const signaturePromise = signer.signMessage(message);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Signature request timed out.")), 60000)
          );

          const signature = await Promise.race([signaturePromise, timeoutPromise]) as string;

          // Step 4: Register with Public Key
          toast({
            title: "Step 4/4",
            description: "Completing registration...",
            duration: 10000,
          });

          // Mix in the generated public key
          const dataWithKey = {
            ...registrationData,
            publicKey: publicKeyStr
          };

          await connectWithWalletSignature(dataWithKey, signature, message);
          
          // [NEW] Zero-Knowledge Keystore Backup
          toast({
            title: "Backup Setup",
            description: "Encrypting and syncing your Keystore securely...",
            duration: 5000,
          });
          const encryptedPrivateKey = await encryptPrivateKeyWithPIN(privateKeyStr, formData.pin);
          const backupRes = await fetch("/api/auth/backup-key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedPrivateKey })
          });
          if (!backupRes.ok) throw new Error("Failed to sync encrypted keystore");

          console.log("✅ Registration completed successfully!");

        } catch (error: any) {
          console.error("❌ WalletConnect registration error:", error);

          // Specific error messages
          let errorMessage = "Registration failed. Please try again.";

          if (error.message.includes("user rejected") || error.message.includes("User denied")) {
            errorMessage = "Signature request was rejected. Please approve the signature request in your wallet to continue.";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Signature request timed out. Please try again and approve the request promptly.";
          } else if (error.message.includes("provider")) {
            errorMessage = "Wallet provider not available. Please ensure your wallet is connected.";
          } else if (error.message) {
            errorMessage = error.message;
          }

          throw new Error(errorMessage);
        }
      } else {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }

      // Dismiss loading toast
      if (loadingToast.dismiss) loadingToast.dismiss();

      toast({
        title: "✅ Success!",
        description: "Registration completed successfully!",
        duration: 5000,
      });

      onSuccess();
    } catch (error: any) {
      console.error("❌ Registration error:", error);

      // Dismiss loading toast
      if (loadingToast.dismiss) loadingToast.dismiss();

      toast({
        title: "❌ Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Connected Wallet Info */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Connected Wallet</p>
            <p className="text-base font-mono font-bold text-gray-900 tracking-tight">{truncateAddress(walletAddress)}</p>
          </div>
          {onDisconnect && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Patient Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <Input
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Age</label>
          <Input
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            disabled={loading}
            min="1"
            max="150"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as "male" | "female" | "other" })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Health PIN (6 Digits)</label>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="Create a 6-digit PIN for Recovery"
            value={formData.pin}
            onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '') })}
            disabled={loading}
            className="font-mono tracking-[0.5em] text-center"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            This PIN encrypts your medical data key. Do not forget it!
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Registering..." : "Complete Registration"}
        </Button>
      </form>
    </div>
  );
}
