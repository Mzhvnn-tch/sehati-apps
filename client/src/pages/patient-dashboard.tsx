// ----------------------------------------------------------------------
// 1. COMPONENTS & IMPORTS
// ----------------------------------------------------------------------
import Layout from "@/components/layout";
import { HealthRecord } from "@/components/health-card";
import { QRShare } from "@/components/qr-share";
import { AuditLog } from "@/components/audit-log";
import { MedicalHistoryBlock } from "@/components/medical-history-block";
import { HealthTimeline } from "@/components/health-timeline";
import { AIHealthInsights } from "@/components/ai-health-insights";
import { LoadingStates } from "@/components/loading-states";
import { NoRecordsState } from "@/components/empty-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Share2, FileText, Activity, Blocks, Download, Loader2, ArrowLeft, LogIn, Lock, Unlock, RefreshCw, BarChart3, Brain, Clock, ShieldAlert, Pill, AlertTriangle, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getPatientRecords, getAuditLogs, getUserByWallet } from "@/lib/api";
import { decryptData, importKey } from "@/lib/encryption";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { clearWalletConnectStorage } from "@/lib/utils";
import type { MedicalRecord } from "@shared/schema";
import { WalletConnect } from "@/components/wallet-connect";
import { PatientRegistration } from "@/components/patient-registration";
import { KeyExportDialog } from "@/components/key-export-dialog";
import { KeyImportDialog } from "@/components/key-import-dialog";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useEthersSigner } from "@/lib/blockchain";
import { useAccount, useSwitchChain, useDisconnect } from "wagmi";
import { RecordsSkeleton } from "@/components/records-skeleton";
import { CipherText } from "@/components/ui/cipher-text";
import { MagneticButton } from "@/components/ui/magnetic-button";

// [NEW] Magnetic Card Wrapper for breathable cards
function MagneticCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const xPct = clientX - left - width / 2;
    const yPct = clientY - top - height / 2;
    x.set(xPct / 25); // Reduced intensity for subtle effect
    y.set(yPct / 25);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const rotateX = useTransform(mouseY, (value) => value * -1);
  const rotateY = useTransform(mouseX, (value) => value);

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="perspective-1000 h-full"
    >
      {children}
    </motion.div>
  );
}

export default function PatientDashboard() {
  const { user, loginWithSignature, isLoading: authLoading, disconnect: authDisconnect } = useAuth();
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const { chainId } = useAccount();
  const signer = useEthersSigner();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  const [isChecking, setIsChecking] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Auth Logic (Keep intact, only UI changes below) ---
  const handleDisconnect = async () => {
    try {
      await authDisconnect();
      if (isConnected) await disconnect();
    } catch (e) {
      console.error("Disconnect failed:", e);
    }
    clearWalletConnectStorage();
    setShowRegistration(false);
    setLoginRequired(false);
    window.location.href = "/";
  };

  useEffect(() => {
    if (user && user.role !== "patient") setLocation("/doctor");
  }, [user, setLocation]);

  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const checkWallet = async () => {
      if (user) return;
      if (isConnected && address && !isChecking && !showRegistration && !loginRequired) {
        setIsChecking(true);
        setWalletError(null);
        try {
          const { user: existingUser } = await getUserByWallet(address);
          if (existingUser) {
            if (existingUser.role === "patient") {
              setLoginRequired(true);
            } else {
              // User exists but is not a patient. Redirect to doctor.
              toast({ title: "Redirecting", description: "You are registered as a doctor." });
              window.location.href = "/doctor";
            }
          }
        } catch (error: any) {
          console.error("checkWallet error:", error);
          if (error.status === 404 || error.message?.includes("User not found")) {
            setShowRegistration(true);
          } else {
            setWalletError(`Failed to fetch user data: ${error.message}`);
          }
        } finally {
          setIsChecking(false);
        }
      }
    };
    checkWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, user]);

  useEffect(() => {
    if (!isConnected) {
      setShowRegistration(false);
      setLoginRequired(false);
      setIsChecking(false);
      setWalletError(null);
    } else {
      // Force cleanup Web3Auth modal if it gets stuck
      setTimeout(() => {
        const w3aModal = document.getElementById("w3a-modal");
        if (w3aModal) w3aModal.style.display = "none";
        const overlay = document.querySelector(".w3a-modal__overlay");
        if (overlay) (overlay as HTMLElement).style.display = "none";
      }, 500); // slight delay to allow native animation to finish if any
    }
  }, [isConnected]);

  // Sync Logout
  useEffect(() => {
    if (!isConnected && user) handleDisconnect();
  }, [isConnected, user]);

  // Data Fetching
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/records/patient", user?.id],
    enabled: !!user,
    queryFn: () => (user ? getPatientRecords(user.id) : Promise.reject()),
  });

  const { data: auditData } = useQuery({
    queryKey: ["/api/audit", user?.id],
    enabled: !!user,
    queryFn: () => (user ? getAuditLogs(user.id) : Promise.reject()),
  });

  const handleLogin = async () => {
    if (Number(chainId) !== 11155111) {
      toast({ title: "Wrong Network", description: "Switching to Ethereum Sepolia...", duration: 3000 });
      try { switchChain({ chainId: 11155111 }); } catch (e) { }
      return;
    }
    if (!signer || !address) return;
    setIsLoggingIn(true);
    try {
      const message = `Login to SEHATI Patient Portal\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signer.signMessage(message);
      const result = await loginWithSignature(address, signature, message);
      if (result.success) {
        toast({ title: "Welcome back!", description: "Access granted." });
        setLoginRequired(false);
      } else {
        toast({ title: "Login Failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Debug logging to understand the blank screen issue
  console.log("Dashboard Render State:", { isConnected, address, user: !!user, isChecking, loginRequired, showRegistration, walletError });

  // 1. Loading (including waiting for Wagmi to resolve address after connecting)
  if (authLoading || (isConnected && isChecking) || (isConnected && !address && !user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent text-cyan-600 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          {isConnected && !address ? "Fetching wallet address..." : "Verifying identity..."}
        </p>
      </div>
    );
  }

  // 1.5 Error State
  if (walletError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white shadow-xl rounded-3xl max-w-md w-full p-8 border border-red-100 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6 text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">Connection Error</h1>
          <p className="text-slate-500 mb-8 font-light">{walletError}</p>
          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            Disconnect & Try Again
          </Button>
        </div>
      </div>
    );
  }

  // 2. Connect Wallet View (Clean Medical Theme)
  if (!isConnected && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-50 via-slate-50 to-slate-50" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white shadow-xl rounded-3xl max-w-md w-full p-8 border border-slate-100 relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-6 text-cyan-600 border border-cyan-100 shadow-sm">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-800 mb-2">Patient Portal</h1>
          <p className="text-slate-500 mb-8 font-light">
            Connect your wallet to retrieve your encrypted health identity.
          </p>
          <div className="flex justify-center mb-6 scale-110">
            <WalletConnect />
          </div>
          <Button variant="ghost" className="w-full text-slate-400 hover:text-cyan-600 hover:bg-cyan-50" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // 3. Signature Login (Clean Medical Theme)
  if (loginRequired && address) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white shadow-xl rounded-3xl max-w-md w-full p-8 border border-slate-100 relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-6 text-cyan-600 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">Security Verification</h1>
          <p className="text-slate-500 mb-8 font-light">
            Your data is encrypted. Sign the message to prove ownership.
          </p>

          <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-12 mb-4 rounded-xl shadow-md" onClick={handleLogin} disabled={isLoggingIn}>
            {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Identity"}
          </Button>

          <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50" onClick={handleDisconnect}>
            Cancel
          </Button>
        </motion.div>
      </div>
    );
  }

  // 4. Registration View
  if (showRegistration && address) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white shadow-xl rounded-3xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-serif text-slate-800 font-bold text-xl">Initialize Identity</h2>
            <Button variant="ghost" onClick={handleDisconnect} className="text-red-500 hover:bg-red-50">Abort</Button>
          </div>
          <div className="p-8">
            <PatientRegistration
              walletAddress={address}
              onSuccess={() => { setShowRegistration(false); toast({ title: "Identity Created" }); }}
              onDisconnect={handleDisconnect}
              isWalletConnect={true}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <PatientDashboardContent user={user} records={recordsData?.records || []} recordsLoading={recordsLoading} auditData={auditData} />;
}


// ----------------------------------------------------------------------
// 3. DIAMOND DASHBOARD CONTENT (LoggedIn) - TRUE HUD PROMAX
// ----------------------------------------------------------------------
function PatientDashboardContent({ user, records, recordsLoading, auditData }: { user: any, records: any[], recordsLoading: boolean, auditData: any }) {
  const [decryptedRecords, setDecryptedRecords] = useState<(MedicalRecord & { decryptedContent?: string })[]>([]);
  const [decryptTrigger, setDecryptTrigger] = useState(0);

  // Recovery State
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState("");
  const [recovering, setRecovering] = useState(false);
  const { toast } = useToast();

  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // Decryption Logic
  useEffect(() => {
    const decryptAll = async () => {
      if (!records.length) return;
      const privKeyStr = localStorage.getItem(`sehati_priv_${user.walletAddress}`);
      if (!privKeyStr) {
        setDecryptedRecords(records.map(r => ({ ...r, decryptedContent: null })));
        if (user.encryptedPrivateKey && !showRecovery) {
          setShowRecovery(true);
        }
        return;
      }
      try {
        const privateKey = await importKey(privKeyStr, "private");
        const decrypted = await Promise.all(records.map(async (record) => {
          try {
            const content = await decryptData(record.encryptedContent, privateKey);
            return { ...record, decryptedContent: content };
          } catch (e) {
            return { ...record, decryptedContent: null };
          }
        }));
        // @ts-ignore
        setDecryptedRecords(decrypted);
      } catch (e) {
        console.error(e);
      }
    };
    decryptAll();
  }, [records, user, decryptTrigger]);

  const handleRecover = async () => {
    if (recoveryPin.length !== 6) {
        toast({ title: "Error", description: "PIN must be exactly 6 digits", variant: "destructive" });
        return;
    }
    setRecovering(true);
    try {
        const { decryptPrivateKeyWithPIN } = await import("@/lib/encryption");
        const privateKeyStr = await decryptPrivateKeyWithPIN(user.encryptedPrivateKey, recoveryPin);
        localStorage.setItem(`sehati_priv_${user.walletAddress}`, privateKeyStr);
        toast({ title: "Recovery Success", description: "Your Keystore has been unlocked." });
        setShowRecovery(false);
        setDecryptTrigger(p => p + 1); // Retrigger decryption
    } catch (e) {
        toast({ title: "Recovery Failed", description: "Invalid PIN. Please try again.", variant: "destructive" });
    } finally {
        setRecovering(false);
    }
  };

  // Find latest VITALS record
  const latestVitals = decryptedRecords.find(r => r.recordType === 'VITALS');
  const vitalsData = latestVitals?.decryptedContent ? JSON.parse(latestVitals.decryptedContent) : null;

  // Extract dynamic Active Regimens from all records
  const activeRegimens = decryptedRecords.reduce((acc: any[], r) => {
    try {
      if (r.decryptedContent) {
        const payload = JSON.parse(r.decryptedContent);
        if (payload.prescription && payload.prescription !== "None" && payload.prescription.trim() !== "") {
           // Basic parser: split string to extract name and dose
           const words = payload.prescription.split(' ');
           const name = words[0];
           const dose = words.slice(1).join(' ') || "Prescribed by Doctor";
           acc.push({
             name: name.length > 20 ? name.substring(0, 20) + '...' : name,
             dose: dose.length > 30 ? dose.substring(0, 30) + '...' : dose,
             count: "-- CAPS", // Dynamic inventory not yet supported by smart contract
             progress: 100, 
             color: acc.length % 2 === 0 ? "from-blue-400 to-indigo-600" : "from-purple-400 to-fuchsia-600",
             shadow: acc.length % 2 === 0 ? "shadow-blue-500/20" : "shadow-purple-500/20"
           });
        }
      }
    } catch (e) {}
    return acc;
  }, []);

  return (
    <Layout>
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#FAFCFF]">
         <motion.div 
           animate={{ scale: [1, 1.2, 1], x: [0, 100, 0], y: [0, 50, 0] }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           className="absolute -top-40 -right-20 w-[800px] h-[800px] bg-cyan-200/20 rounded-full blur-[120px] mix-blend-multiply opacity-60" 
         />
         <motion.div 
           animate={{ scale: [1.1, 1, 1.1], x: [0, -80, 0], y: [0, -40, 0] }}
           transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
           className="absolute top-1/2 -left-40 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[150px] mix-blend-multiply opacity-50" 
         />
      </div>

      <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
        <DialogContent className="sm:max-w-md border-none bg-white/80 backdrop-blur-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-serif font-bold text-slate-800">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
              Keystore Recovery Required
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              We noticed your encryption keys are missing.
              Please enter your 6-digit Health PIN to recover your secure vault.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 flex justify-center">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="••••••"
              value={recoveryPin}
              onChange={(e) => setRecoveryPin(e.target.value.replace(/[^0-9]/g, ''))}
              className="text-center font-mono tracking-[1em] text-3xl h-16 bg-white/50 border-slate-100 rounded-2xl"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRecover} disabled={recovering || recoveryPin.length !== 6} className="w-full bg-slate-900 hover:bg-slate-800 h-14 rounded-2xl text-lg font-bold shadow-xl">
              {recovering ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Unlock className="w-5 h-5 mr-2" />}
              Unlock clinical Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- HUD PROVIDER WRAPPER --- */}
      <Tabs defaultValue="overview" className="h-[calc(100vh-8rem)] max-h-[900px] min-h-[650px] flex flex-col gap-6 animate-in fade-in duration-1000">
        
        {/* TOP: SMART HUD HEADER */}
        <div className="flex justify-between items-end px-2">
          <div>
            <h1 className="text-4xl font-serif font-bold text-slate-800 tracking-tight flex items-center gap-3">
              Medical Operating System
            </h1>
            <p className="text-sm text-slate-600 font-medium tracking-wide">Secure Patient Portal • Data sovereignty active</p>
          </div>
          
          <TabsList className="bg-white/40 backdrop-blur-2xl p-1.5 rounded-full border border-white/60 shadow-xl flex h-auto">
            <TabsTrigger value="overview" className="rounded-full px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:text-cyan-700 font-bold text-xs transition-all shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-full px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:text-cyan-700 font-bold text-xs transition-all">Clinical History</TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
          
          {/* LEFT: IDENTITY (3/12) — stagger 0ms */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0 }}
            className="col-span-3 flex flex-col gap-6 overflow-hidden"
          >
             <motion.div whileHover={{ y: -5 }} className="diamond-card p-6 rounded-[2.5rem] flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-50 to-white flex items-center justify-center border-4 border-white shadow-2xl mb-5 relative group">
                   <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.walletAddress}`} className="w-16 h-16 mix-blend-multiply opacity-80 group-hover:scale-110 transition-transform" />
                   <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-400 rounded-full border-4 border-white shadow-md" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-800 text-center leading-tight mb-2">{user.name}</h2>
                <div className="flex gap-2 w-full mt-4">
                   <div className="flex-1 bg-white/50 p-3 rounded-[1.5rem] border border-white/80 text-center shadow-sm">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Patient Age</p>
                      <p className="text-lg font-bold text-slate-700">{user.age}</p>
                   </div>
                   <div className="flex-1 bg-white/50 p-3 rounded-[1.5rem] border border-white/80 text-center shadow-sm">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Blood Unit</p>
                      <p className="text-lg font-bold text-cyan-600">{user.bloodType}</p>
                   </div>
                </div>
             </motion.div>

             <div className="diamond-card rounded-[2.5rem] flex-1 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20 pointer-events-none" />
                <QRShare patientId={user.id} walletAddress={user.walletAddress} />
             </div>
          </motion.div>

          {/* CENTER: BENTO HUB (6/12) — stagger 150ms */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
            className="col-span-6 flex flex-col gap-6 overflow-hidden"
          >
             <TabsContent value="overview" className="m-0 flex flex-col gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* COMPACT BENTO VITALS GRID */}
                <div className="grid grid-cols-2 gap-6">
                   <MagneticCard>
                      <div className="diamond-card p-8 rounded-[2.5rem] bg-white/40 h-[240px] relative overflow-hidden group border-cyan-100/50 shadow-cyan-900/5 shadow-2xl">
                         <div className="flex justify-between items-center mb-8 relative z-10">
                            <span className="text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-50/80 px-4 py-1.5 rounded-full border border-rose-100/50 flex items-center gap-2">
                               <Activity className={`w-4 h-4 ${vitalsData ? 'animate-pulse' : ''}`} /> Cardiac Rhythm
                            </span>
                            <div className={`text-[10px] font-bold px-2 py-1 rounded-md shadow-sm ${
                              vitalsData
                                ? 'text-emerald-700 bg-emerald-50/90'
                                : 'text-slate-500 bg-slate-50'
                            }`}>
                              {vitalsData
                                ? `RECORDED ${new Date(latestVitals!.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}`
                                : 'NO DATA YET'}
                            </div>
                         </div>
                         {vitalsData ? (
                           <div className="flex items-baseline gap-3 relative z-10">
                              <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-8xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{vitalsData.heartRate}</motion.span>
                              <span className="text-2xl font-bold text-slate-600">bpm</span>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center h-28 gap-2 relative z-10">
                             <Activity className="w-10 h-10 text-slate-200" />
                             <p className="text-xs text-slate-400 font-medium text-center">Vitals recorded during<br/>doctor visits</p>
                           </div>
                         )}
                         
                         {/* Dynamic Waveform Visualizer — only when data exists */}
                         {vitalsData && (
                           <div className="absolute bottom-0 left-0 w-full h-12 flex items-end opacity-20 overflow-hidden pointer-events-none px-1 gap-[1px]">
                              {Array.from({length: 40}).map((_, i) => (
                                 <motion.div 
                                   key={i} 
                                   animate={{ height: [10, Math.random() * 40 + 10, 10] }} 
                                   transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }} 
                                   className="w-full bg-rose-400 rounded-t-sm" 
                                 />
                              ))}
                           </div>
                         )}
                      </div>
                   </MagneticCard>

                   <div className="flex flex-col gap-4">
                      <motion.div whileHover={{ x: 5 }} className="diamond-card p-6 rounded-[2rem] flex flex-col justify-between flex-1 bg-white/60 border-indigo-100/50 shadow-2xl shadow-indigo-900/5">
                         <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <Fingerprint className="w-4 h-4" /> Vascular Pressure
                         </span>
                         <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-black tracking-tighter ${vitalsData ? 'text-slate-800' : 'text-slate-300'}`}>
                              {vitalsData?.bloodPressure || "--/--"}
                            </span>
                            <span className="text-xs font-bold text-slate-600 uppercase">mmHg</span>
                         </div>
                      </motion.div>
                      <motion.div whileHover={{ x: 5 }} className="diamond-card p-6 rounded-[2rem] flex flex-col justify-between flex-1 bg-fuchsia-50/20 border-fuchsia-100/50 shadow-2xl shadow-fuchsia-900/5">
                         <span className="text-[11px] font-black text-fuchsia-600 uppercase tracking-widest">Thermic Index</span>
                         <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-black tracking-tighter ${vitalsData ? 'text-slate-800' : 'text-slate-300'}`}>
                              {vitalsData?.temperature || "--"}
                            </span>
                            <span className="text-2xl font-bold text-fuchsia-400">°C</span>
                         </div>
                      </motion.div>
                   </div>
                </div>

                {/* PROMAX MEDICATION HUD (INTERNAL SCROLL) */}
                <div className="diamond-card p-8 rounded-[3rem] flex-1 overflow-hidden flex flex-col border-white/60 shadow-2xl shadow-slate-900/5">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                            <Pill className="w-6 h-6" />
                         </div>
                         Active Regimen
                      </h3>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Active</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 overflow-y-auto pr-2 scrollbar-hide">
                      {activeRegimens.length > 0 ? (
                        activeRegimens.map((m: any, i: number) => (
                         <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white/40 p-6 rounded-[2rem] border border-white hover:border-cyan-100 transition-all group shadow-sm hover:shadow-xl flex flex-col justify-center min-h-[120px]">
                            <div className="flex justify-between items-center">
                               <div>
                                  <h4 className="font-bold text-slate-800 text-lg group-hover:text-cyan-700 transition-colors break-words max-w-[140px]">{m.name}</h4>
                                  <p className="text-[11px] font-medium text-slate-600 mt-1 uppercase tracking-tight break-words max-w-[140px]">{m.dose}</p>
                               </div>
                               <div className="bg-white/80 p-2.5 rounded-xl border border-slate-50 shadow-sm shrink-0">
                                  <Pill className="w-5 h-5 text-cyan-600" />
                               </div>
                            </div>
                         </motion.div>
                        ))
                      ) : (
                        <div className="col-span-2 flex flex-col items-center justify-center py-10 bg-white/30 rounded-[2rem] border border-white/50 border-dashed">
                          <Pill className="w-8 h-8 text-slate-300 mb-3" />
                          <p className="text-slate-600 font-medium text-sm">No active protocols or prescriptions</p>
                        </div>
                      )}
                   </div>
                </div>
             </TabsContent>
             
             <TabsContent value="timeline" className="m-0 h-full overflow-hidden">
                <div className="diamond-card rounded-[3rem] p-8 h-full overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-3">
                        <FileText className="w-7 h-7 text-cyan-500" />
                        Clinical Archive
                     </h3>
                     <span className="text-[10px] font-black bg-slate-900 text-white px-5 py-2 rounded-full tracking-widest">{records.length} ENTRIES</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-hide">
                    <HealthTimeline records={decryptedRecords as MedicalRecord[]} />
                  </div>
                </div>
             </TabsContent>
          </motion.div>

          {/* RIGHT: SECURITY & PROTOCOLS (3/12) — stagger 300ms */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.3 }}
            className="col-span-3 flex flex-col h-full overflow-hidden"
          >
             <div className="diamond-card p-8 rounded-[2.5rem] flex flex-col h-full bg-white/60 border-slate-100 shadow-2xl shadow-slate-900/5">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                      <ShieldAlert className="w-5 h-5" />
                   </div>
                   <h3 className="font-serif font-bold text-xl text-slate-800">Security Node</h3>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide transform-gpu">
                   <MedicalTimeline logs={auditData?.logs ? auditData.logs.slice(0,10) : []} />
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100">
                   <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <div>
                         <p className="text-[10px] font-black text-emerald-800 uppercase">Encryption Engine</p>
                         <p className="text-xs font-bold text-emerald-600">AES-256 ACTIVE</p>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>

        </div>
      </Tabs>
    </Layout>
  );
}

// --- SUB-COMPONENTS ---

function VitalStat({ label, value, unit, highlight }: { label: string, value: string, unit: string, highlight?: boolean }) {
  const isNoData = value === "--" || value === "--/--";
  const applyHighlight = highlight && !isNoData;
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${applyHighlight ? 'bg-cyan-50 border-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white border-slate-100 hover:border-cyan-100'} flex flex-col justify-between h-[104px] shadow-sm`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${applyHighlight ? 'text-cyan-600' : 'text-slate-600'}`}>{label}</span>
      <div className="flex items-baseline gap-1 mt-auto">
        <span className={`text-3xl font-serif font-bold tracking-tight ${isNoData ? 'text-slate-200' : applyHighlight ? 'text-cyan-900' : 'text-slate-800'}`}>{value}</span>
        {!isNoData && <span className={`text-xs font-medium mb-1 ${applyHighlight ? 'text-cyan-600' : 'text-slate-600'}`}>{unit}</span>}
      </div>
    </div>
  )
}

function MedicalTimeline({ logs }: { logs: any[] }) {
  if (logs.length === 0) return <div className="text-slate-600 text-center py-4 text-sm font-medium">No system events logged.</div>;

  return (
    <div className="relative border-l-2 border-slate-100 ml-3 space-y-4">
      {logs.map((log, i) => (
        <Dialog key={i}>
          <DialogTrigger asChild>
            <div className="relative pl-8 group cursor-pointer hover:bg-slate-50/50 p-2 rounded-xl transition-all -ml-2">
              <div className="absolute left-[7px] top-3.5 w-4 h-4 rounded-full border-4 border-white bg-slate-200 group-hover:bg-cyan-500 transition-colors shadow-sm" />
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-black text-cyan-700 uppercase tracking-tighter group-hover:underline underline-offset-4 decoration-cyan-300 transition-all">{log.action}</span>
                  <span className="font-mono text-slate-600 group-hover:text-cyan-600 transition-colors">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed truncate">
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-200/60 shadow-sm">{(log.actorWallet || "System").substring(0, 8)}...</span>
                  <span className="mx-2 text-slate-200">/</span>
                  {log.metadata ? JSON.parse(log.metadata).recordType || log.entityType : "Request Authorized"}
                </p>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-2xl border-white/60 shadow-2xl rounded-3xl">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-slate-800">
                  <ShieldAlert className="w-6 h-6 text-cyan-600" /> Audit Log Detail
               </DialogTitle>
               <DialogDescription className="text-slate-500">
                  Cryptographic trail of this system event.
               </DialogDescription>
             </DialogHeader>
             <div className="space-y-4 py-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                   <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Event Type</span>
                      <span className="text-xs font-bold text-cyan-700 uppercase">{log.action}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Timestamp</span>
                      <span className="text-xs font-mono text-slate-700">{new Date(log.createdAt).toLocaleString()}</span>
                   </div>
                   <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Actor ID (Wallet)</span>
                      <span className="text-xs font-mono text-slate-700 bg-white p-1.5 rounded border border-slate-100 shadow-sm break-all">{log.actorWallet || "System Automaton"}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Transaction Hash</span>
                      <span className="text-xs font-mono text-emerald-600 bg-emerald-50 p-1.5 rounded border border-emerald-100 shadow-sm break-all">{log.transactionHash || "Pending Confirmation..."}</span>
                   </div>
                </div>
             </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
