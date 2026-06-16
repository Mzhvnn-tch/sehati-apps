import QRCode from "react-qr-code";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, RefreshCw, Loader2, Copy, Check, ShieldCheck, AlertCircle, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { generateQRAccess } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useEthersSigner, createAccessGrantOnChain, estimateGasForAccessGrant } from "@/lib/blockchain";
import { useAccount } from "wagmi";

export function QRShare({ patientId, walletAddress }: { patientId: string, walletAddress: string }) {
  const { toast } = useToast();
  const signer = useEthersSigner();
  const { isConnected, address } = useAccount();

  const [timeLeft, setTimeLeft] = useState(0);
  const [qrData, setQrData] = useState("");
  const [grantId, setGrantId] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !qrData && !generateMutation.isPending) {
      regenerate(); // auto generate when opened
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className="w-full flex flex-col relative">
        <div className="mb-8 relative z-10">
          <h3 className="font-heading text-2xl text-[#020617] mb-2 tracking-tighter">Data Sovereignty.</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Grant secure temporary access to a verified doctor.
          </p>
        </div>
        
        <DialogTrigger asChild>
          <button className="w-full border border-[#020617] bg-[#020617] text-white hover:bg-transparent hover:text-[#020617] transition-all duration-300 px-6 py-4 flex items-center justify-center group">
             <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">Generate QR Access →</span>
          </button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-3xl bg-white border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-0 overflow-hidden rounded-3xl flex flex-col md:flex-row w-full">
        {/* Left Side: QR Display (Medical Scanner HUD) */}
        <div className="w-full md:w-[45%] bg-[#020617] p-10 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/40 via-[#020617] to-[#020617] pointer-events-none"></div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
            
            <div className="mb-10 w-full text-center relative z-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                 <span className="font-mono text-[10px] text-slate-300 uppercase tracking-[0.3em] font-bold">Secure Gateway</span>
              </div>
              <DialogTitle className="font-heading text-4xl tracking-tighter text-white mb-1">Access Matrix</DialogTitle>
            </div>

            {generateMutation.isPending ? (
               <div className="h-[180px] flex flex-col items-center justify-center relative z-10 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 border-2 border-slate-500/30 rounded-full animate-ping"></div>
                    <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 tracking-[0.2em] uppercase">Generating Protocol...</span>
               </div>
            ) : (
               <div className="relative p-2 z-10 group">
                    {/* Futuristic Viewfinder Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-slate-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-slate-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-slate-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-slate-500"></div>
                    
                    <div className="bg-white p-4 shadow-[0_0_30px_rgba(148,163,184,0.1)] transition-all duration-500 group-hover:shadow-[0_0_50px_rgba(148,163,184,0.2)] rounded-sm">
                      <QRCode
                        value={qrData}
                        size={160}
                        className={`w-full h-auto ${!isOnChain ? 'opacity-20' : ''} transition-all duration-500`}
                        fgColor="#020617"
                      />
                    </div>
                    {!isOnChain && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617]/80 backdrop-blur-sm z-10 border border-slate-500/20">
                            <Lock className="w-6 h-6 text-slate-400 mb-3 opacity-50" />
                            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] text-slate-300 text-center px-2">Signature<br/>Required</span>
                        </div>
                    )}
               </div>
            )}
            
            {/* Tech details */}
            <div className="mt-12 flex justify-between w-full text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] relative z-10">
               <span>SYS: ONLINE</span>
               <span>{isOnChain ? 'NODE: SYNCED' : 'NODE: PENDING'}</span>
            </div>
        </div>

        {/* Right Side: Medical Hardware Interface */}
        <div className="w-full md:w-[55%] p-10 flex flex-col justify-center bg-white relative">
           {/* Hardware aesthetic detail */}
           <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[100px] pointer-events-none"></div>

           {generateMutation.isPending ? (
              <div className="flex-1 flex items-center justify-center min-h-[200px]">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></div>
                   <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Establishing Handshake...</p>
                 </div>
              </div>
           ) : (
              <div className="space-y-8 relative z-10">
                {/* Blockchain Registration Section */}
                {!isOnChain && (
                  <div className={`p-6 rounded-2xl border ${isWalletMismatch ? "border-red-200 bg-red-50/50" : "border-slate-100 bg-slate-50/50"}`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className={`font-mono text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-3 ${isWalletMismatch ? "text-red-600" : "text-slate-700"}`}>
                        <div className={`w-2 h-2 rounded-full ${isWalletMismatch ? "bg-red-500" : "bg-slate-500 animate-pulse"}`}></div>
                        On-Chain Verification
                      </span>
                      {gasEstimate && !isWalletMismatch && (
                        <span className="font-mono text-[10px] tracking-widest font-bold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                          ~{parseFloat(gasEstimate.cost).toFixed(6)} ETH
                        </span>
                      )}
                    </div>

                    {isWalletMismatch ? (
                      <div className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest mt-2 bg-red-100/50 p-3 rounded-lg">
                        Mismatch: App({userWalletDisplay}) vs Wallet({metaWalletDisplay})
                      </div>
                    ) : isConnected ? (
                      <button
                        className="w-full bg-[#020617] rounded-xl hover:bg-slate-800 text-white font-mono text-[10px] uppercase tracking-[0.2em] font-bold h-12 transition-all flex items-center justify-center disabled:opacity-50 shadow-lg shadow-slate-900/20"
                        onClick={registerOnChain}
                        disabled={isRegistering}
                      >
                        {isRegistering ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Encrypting...</>
                        ) : (
                          "Sign & Activate Protocol"
                        )}
                      </button>
                    ) : (
                      <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest font-bold mt-2">Wallet connection required</p>
                    )}
                  </div>
                )}

                {isOnChain && timeLeft > 0 ? (
                  <div className="relative w-full p-6 bg-[#020617] rounded-2xl border border-slate-800 overflow-hidden shadow-[0_10px_30px_rgba(2,6,23,0.15)] text-white">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/50 to-transparent pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-300">Connection Active</span>
                        </div>
                        <span className="font-mono text-[8px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 uppercase tracking-[0.2em]">Verified On-Chain</span>
                      </div>
                      
                      <div className="text-right">
                         <span className="block text-[8px] font-mono uppercase tracking-[0.2em] text-slate-400 mb-1">Time Remaining</span>
                         <span className="font-heading text-4xl tracking-tighter text-white leading-none">{formatTime(timeLeft)}</span>
                      </div>
                    </div>
                  </div>
                ) : timeLeft > 0 ? null : (
                  <div className="flex w-full items-center justify-between p-5 bg-red-50/50 rounded-2xl border border-red-100 text-red-900 font-mono text-[10px] uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-3">
                       <AlertCircle className="w-5 h-5 text-red-500" />
                       <span>Session Expired</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                       <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Session ID / Hex</p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={!isOnChain ? "****************************************************************" : getToken()}
                        readOnly
                        className={`font-mono text-xs bg-slate-50 rounded-xl border border-slate-200 focus-visible:ring-slate-500 focus-visible:border-slate-500 h-12 shadow-inner ${!isOnChain ? "text-slate-400 tracking-[0.2em]" : "text-slate-600"}`}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        disabled={!isOnChain}
                      />
                      <button
                        onClick={copyToken}
                        className="w-12 h-12 shrink-0 bg-white border border-slate-200 rounded-xl text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm hover:text-slate-900"
                        disabled={!isOnChain}
                      >
                        {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button
                    className="w-full border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 font-mono text-[10px] uppercase tracking-[0.2em] font-bold h-12 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                    onClick={regenerate}
                    disabled={generateMutation.isPending || isRegistering}
                  >
                    <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                    Initialize New Session
                  </button>
                </div>
              </div>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}