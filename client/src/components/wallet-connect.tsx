import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Wallet } from "lucide-react";
import { useAppKit } from "@reown/appkit/react";
// @ts-ignore
import { useAccount, useSignMessage, useDisconnect } from "wagmi";

interface WalletConnectProps {
  className?: string;
  initialRole?: "patient" | "doctor";
  autoOpen?: boolean;
}

export function WalletConnect({ className, initialRole, autoOpen }: WalletConnectProps) {
  const { user, connectWithWalletSignature, loginWithSignature, disconnect: appDisconnect } = useAuth();
  const { open } = useAppKit();
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
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className={`gap-2 ${className}`}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to SEHATI</DialogTitle>
            <DialogDescription>
              Connect your wallet to securely access your health identity.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isConnected ? (
            <div className="py-6 flex flex-col items-center gap-4">
              <p className="text-center text-sm text-muted-foreground">
                Select your preferred wallet to continue.
              </p>
              <Button onClick={async () => {
                try {
                  await open();
                } catch (err: any) {
                  console.error("Connection error:", err);
                  if (err?.message?.includes("Failed to connect to MetaMask")) {
                    setError("Connection failed. Please retry or check your wallet.");
                  } else {
                    setError("Failed to open wallet connection.");
                  }
                }
              }} className="w-full">
                <Wallet className="w-4 h-4 mr-2" />
                Select Wallet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md text-center text-sm">
                Connected: <span className="font-mono">{address?.substring(0, 10)}...</span>
              </div>

              {isSigning ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Please sign the message in your wallet...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm font-medium">New User Registration</div>

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="30" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={gender}
                        onChange={e => setGender(e.target.value as any)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={role}
                      onChange={e => setRole(e.target.value as any)}
                    >
                      <option value="patient">Patient United</option>
                      <option value="doctor">Doctor</option>
                    </select>
                  </div>

                  {role === "doctor" && (
                    <div className="space-y-2">
                      <Label>Hospital Name</Label>
                      <Input value={hospital} onChange={e => setHospital(e.target.value)} placeholder="City General Hospital" />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={handleRegister} className="w-full">
                      Register & Sign In
                    </Button>
                    <Button variant="ghost" onClick={handleLogin} className="w-full text-xs">
                      Already have an account? Sign In existing
                    </Button>
                    <Button variant="link" onClick={() => disconnect()} className="w-full text-xs text-muted-foreground">
                      Disconnect Wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
