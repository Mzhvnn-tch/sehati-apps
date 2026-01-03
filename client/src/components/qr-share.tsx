import QRCode from "react-qr-code";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, RefreshCw, Loader2, Copy, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { generateQRAccess } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useEthersSigner, createAccessGrantOnChain, estimateGasForAccessGrant } from "@/lib/blockchain";
import { useAppKitAccount } from "@reown/appkit/react";

export function QRShare({ patientId, walletAddress }: { patientId: string, walletAddress: string }) {
  const { toast } = useToast();
  const signer = useEthersSigner();
  const { isConnected, address } = useAppKitAccount();

  const [timeLeft, setTimeLeft] = useState(0);
  const [qrData, setQrData] = useState("");
  const [grantId, setGrantId] = useState("");
  const [copied, setCopied] = useState(false);

  // Blockchain State
  const [isRegistering, setIsRegistering] = useState(false);
  const [isOnChain, setIsOnChain] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<{ cost: string, limit: string } | null>(null);

  // Mismatch Check
  const isWalletMismatch = isConnected && address && walletAddress && address.toLowerCase() !== walletAddress.toLowerCase();

  const userWalletDisplay = walletAddress ? walletAddress.substring(0, 6) : "";
  const metaWalletDisplay = address ? address.substring(0, 6) : "";

  const generateMutation = useMutation({
    mutationFn: () => generateQRAccess(patientId, 60),
    onSuccess: (data) => {
      setQrData(data.qrData);
      setGrantId(data.grant.id);
      setTimeLeft(3600); // 60 minutes in seconds
      setIsOnChain(false); // Reset on-chain status for new token
      setGasEstimate(null);
    },
  });



  // ...

  // Update JSX to show Mismatch Warning
  // In the Blockchain Registration Section:




  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const regenerate = () => {
    generateMutation.mutate();
    setCopied(false);
    setIsOnChain(false);
  };

  const getToken = () => {
    if (!qrData) return "";
    if (qrData.includes("token=")) {
      const urlParams = new URLSearchParams(qrData.split("?")[1] || qrData);
      return urlParams.get("token") || qrData;
    }
    return qrData;
  };

  const copyToken = () => {
    const token = getToken();
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Token Copied!",
      description: "Share this token with your doctor",
    });
  };

  const checkGas = async () => {
    if (!signer || !qrData) return;
    const token = getToken();
    const estimate = await estimateGasForAccessGrant(signer, token, 60);
    if (estimate) {
      setGasEstimate({ cost: estimate.estimatedCost, limit: estimate.gasLimit });
    }
  };

  const registerOnChain = async () => {
    if (!signer || !qrData) {
      toast({ title: "Wallet Error", description: "Please connect your wallet.", variant: "destructive" });
      return;
    }

    // [New] Wallet Mismatch Check
    if (isWalletMismatch) {
      toast({
        title: "Wallet Mismatch",
        description: `Please switch MetaMask to ${walletAddress.substring(0, 6)}...`,
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    try {
      const token = getToken();

      // Final Estimate check (optional, but good for UX)
      if (!gasEstimate) await checkGas();

      const tx = await createAccessGrantOnChain(signer, token, 60);
      console.log("Grant TX:", tx.hash);

      toast({
        title: "Transaction Sent",
        description: "Waiting for blockchain confirmation...",
      });

      await tx.wait(); // Wait for 1 confirmation

      setIsOnChain(true);
      toast({
        title: "Access Granted On-Chain",
        description: "Doctor can now verify this token.",
        className: "bg-green-50 border-green-200 text-green-800"
      });

    } catch (error: any) {
      console.error("Chain registration failed:", error);
      if (error.code === 'ACTION_REJECTED') {
        toast({ title: "Transaction Cancelled", description: "You rejected the transaction." });
      } else {
        toast({
          title: "Registration Failed",
          description: error.message || "Blockchain error occurred.",
          variant: "destructive"
        });
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Auto-estimate gas when QR is ready and wallet connected
  useEffect(() => {
    if (qrData && isConnected && !isOnChain && !gasEstimate) {
      checkGas();
    }
  }, [qrData, isConnected, isOnChain]);

  if (!qrData && !generateMutation.isPending) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-primary/10 p-8 flex flex-col items-center max-w-sm w-full mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Share Medical Access</h3>
          <p className="text-sm text-muted-foreground">
            Generate a QR code to grant temporary access to your records.
          </p>
        </div>
        <Button onClick={regenerate} className="w-full">
          Generate QR Code
        </Button>
      </div>
    );
  }

  if (generateMutation.isPending) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-primary/10 p-8 flex flex-col items-center max-w-sm w-full mx-auto">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Generating secure access token...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-primary/10 p-8 flex flex-col items-center max-w-sm w-full mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Share Medical Access</h3>
        <p className="text-sm text-muted-foreground">
          Scan this code to grant temporary read access to your records.
        </p>
      </div>

      <div className="relative group mb-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-cyan-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-white p-4 rounded-xl border border-gray-100">
          <QRCode
            value={qrData}
            size={200}
            viewBox={`0 0 256 256`}
            className={`w-full h-auto ${!isOnChain ? 'opacity-50 blur-[2px]' : ''} transition-all duration-500`}
            fgColor="#0F172A"
          />

          {!isOnChain && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl">
              <div className="bg-white p-3 rounded-lg shadow-lg text-center border border-gray-100">
                <p className="text-xs font-bold text-gray-900 mb-2">Registration Required</p>
                <p className="text-[10px] text-gray-500 max-w-[120px] mx-auto leading-tight">
                  Token must be registered on blockchain to be valid.
                </p>
              </div>
            </div>
          )}

          {/* Overlay Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-10 h-10 bg-white rounded-full p-1 shadow-lg flex items-center justify-center ${isOnChain ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary text-xs">S</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Registration Section */}
      {/* Blockchain Registration Section */}
      {!isOnChain && (
        <div className={`w-full mb-6 border rounded-lg p-3 ${isWalletMismatch ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-semibold flex items-center gap-1 ${isWalletMismatch ? "text-red-900" : "text-blue-900"}`}>
              <ShieldCheck className="w-3 h-3" /> Blockchain Register
            </span>
            {gasEstimate && !isWalletMismatch && (
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                Gas: ~{parseFloat(gasEstimate.cost).toFixed(6)} ETH
              </span>
            )}
          </div>

          {isWalletMismatch ? (
            <div className="text-xs text-red-600 font-medium text-center py-1">
              ⚠️ Wallet Mismatch
              <br />
              <span className="font-normal text-[10px]">
                App: {userWalletDisplay}...
                <br />
                Wallet: {metaWalletDisplay}...
              </span>
              <br />
              Please switch account in MetaMask.
            </div>
          ) : isConnected ? (
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
              onClick={registerOnChain}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Registering...</>
              ) : (
                "Sign & Activate Token"
              )}
            </Button>
          ) : (
            <p className="text-xs text-red-500 text-center">Connect wallet to activate</p>
          )}
        </div>
      )}

      {isOnChain && timeLeft > 0 ? (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>Active for {formatTime(timeLeft)}</span>
        </div>
      ) : timeLeft > 0 ? null : (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
          <span>Expired</span>
        </div>
      )}

      <div className="w-full space-y-3">
        <div className="space-y-2">
          <p className="text-xs text-gray-500 text-center">Can't scan? Copy the token instead:</p>
          <div className="flex gap-2">
            <Input
              value={getToken()}
              readOnly
              className="font-mono text-xs bg-gray-50 select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
              disabled={!isOnChain}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyToken}
              className="shrink-0"
              disabled={!isOnChain}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={regenerate}
          disabled={generateMutation.isPending || isRegistering}
        >
          <RefreshCw className="w-4 h-4" />
          Generate New Token
        </Button>
      </div>
    </div>
  );
}