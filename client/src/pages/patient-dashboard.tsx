// ----------------------------------------------------------------------
// 1. COMPONENTS & IMPORTS
// ----------------------------------------------------------------------
import Layout from "@/components/layout";
import { HealthRecord } from "@/components/health-card";
import { QRShare } from "@/components/qr-share";
import { AuditLog } from "@/components/audit-log";
import { MedicalHistoryBlock } from "@/components/medical-history-block";
import { HealthAnalytics } from "@/components/health-analytics";
import { HealthTimeline } from "@/components/health-timeline";
import { AIHealthInsights } from "@/components/ai-health-insights";
import { LoadingStates } from "@/components/loading-states";
import { NoRecordsState } from "@/components/empty-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Share2, FileText, Activity, Blocks, Download, Loader2, ArrowLeft, LogIn, Lock, Unlock, RefreshCw, BarChart3, Brain, Clock, ShieldAlert, Pill } from "lucide-react";
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
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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
    x.set(xPct / 15); // Reduced intensity for subtle effect
    y.set(yPct / 15);
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
      className="perspective-1000"
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
// 3. DASHBOARD CONTENT (LoggedIn)
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 3. DIAMOND DASHBOARD CONTENT (LoggedIn)
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 3. DIAMOND DASHBOARD CONTENT (LoggedIn)
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

  return (
    <Layout>
      <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              Keystore Recovery Required
            </DialogTitle>
            <DialogDescription>
              We noticed your encryption keys are missing from this browser (likely due to a new device or cleared cache).
              Please enter your 6-digit Health PIN to recover your secure Keystore.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex justify-center">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="••••••"
              value={recoveryPin}
              onChange={(e) => setRecoveryPin(e.target.value.replace(/[^0-9]/g, ''))}
              className="text-center font-mono tracking-[1em] text-2xl h-14"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRecover} disabled={recovering || recoveryPin.length !== 6} className="w-full">
              {recovering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              Unlock Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative min-h-screen pb-20">
        {/* Ambient Gum Background (Sovereignity Vibe - 30% reduced for Clinical Trust) */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#FAFCFF]">
           <div className="absolute -top-40 -right-20 w-[600px] h-[600px] bg-cyan-300/20 rounded-full blur-[120px] mix-blend-multiply opacity-70" />
           <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-fuchsia-300/20 rounded-full blur-[150px] mix-blend-multiply opacity-60" />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Identity & Access (span 3) */}
            <div className="xl:col-span-3 space-y-6">
              {/* Profile Card (Glassmorphism) */}
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-slate-200/40 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-100 to-white flex items-center justify-center border-4 border-white shadow-lg mb-6 relative">
                  <img
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.walletAddress}`}
                    alt="Avatar"
                    className="w-14 h-14 opacity-70 mix-blend-multiply"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-slate-800 mb-1">{user.name}</h1>
                <p className="text-slate-500 text-xs font-mono bg-white/80 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm mb-6">
                  ID: {user.walletAddress.substring(0, 10)}...
                </p>
                

              </div>

              {/* Smart QR Card */}
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 overflow-hidden">
                <QRShare patientId={user.id} walletAddress={user.walletAddress} />
              </div>
            </div>

            {/* CENTER COLUMN: Adaptive Intelligence (span 6) */}
            <div className="xl:col-span-6 space-y-8">
              
              {/* Floating Tab Navigation */}
              <div className="flex justify-center sticky top-4 z-50">
                <TabsList className="bg-white/70 backdrop-blur-xl p-1.5 rounded-full border border-white shadow-lg shadow-slate-200/50 flex h-auto">
                  <TabsTrigger value="overview" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm transition-all gap-2 text-sm font-medium">
                    <Activity className="w-4 h-4" /> Overview
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm transition-all gap-2 text-sm font-medium">
                    <BarChart3 className="w-4 h-4" /> Analytics
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm transition-all gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4" /> Timeline
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Main Content Area */}
              <TabsContent value="overview" className="space-y-8 mt-0">
                
                {/* Elite Hierarchical Vitals */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Primary Vital: Heart Rate (Massive Card) */}
                  <div className="col-span-2 md:col-span-1 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-rose-400/20 transition-all duration-500" />
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <span className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Heart Rate
                      </span>
                      <span className="text-[10px] bg-white px-2 py-1 rounded-full text-slate-400 font-medium shadow-sm">Verified</span>
                    </div>
                    <div className="flex items-baseline gap-2 relative z-10">
                      <span className="text-6xl font-black text-slate-800 tracking-tighter">{vitalsData?.heartRate || "--"}</span>
                      <span className="text-lg font-bold text-slate-400">bpm</span>
                    </div>
                    {/* Faint Waveform SVG */}
                    <svg className="absolute bottom-0 left-0 w-full h-16 opacity-20 text-rose-500" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M0,50 Q25,50 30,30 T40,50 T50,80 T60,50 T100,50" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>

                  {/* Primary Vital: Blood Pressure (Massive Card) */}
                  <div className="col-span-2 md:col-span-1 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-400/20 transition-all duration-500" />
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Blood Pressure
                      </span>
                      <span className="text-[10px] bg-white px-2 py-1 rounded-full text-slate-400 font-medium shadow-sm">Verified</span>
                    </div>
                    <div className="flex items-baseline gap-2 relative z-10">
                      <span className="text-5xl font-black text-slate-800 tracking-tighter">{vitalsData?.bloodPressure || "--/--"}</span>
                      <span className="text-lg font-bold text-slate-400">mmHg</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Vitals Pills */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-white shadow-sm flex flex-col justify-center gap-1 hover:bg-white/80 transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight</span>
                    <span className="text-xl font-bold text-slate-700">{vitalsData?.weight || "--"} <span className="text-xs text-slate-400 font-normal">kg</span></span>
                  </div>
                  <div className="bg-cyan-50/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-cyan-100 shadow-sm flex flex-col justify-center gap-1 hover:bg-cyan-50/80 transition-colors">
                    <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">Blood Type</span>
                    <span className="text-xl font-bold text-cyan-900">{vitalsData?.bloodType || user.bloodType || "--"}</span>
                  </div>
                  <div className="bg-white/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-white shadow-sm flex flex-col justify-center gap-1 hover:bg-white/80 transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sleep</span>
                    <span className="text-xl font-bold text-slate-700">{vitalsData?.sleep || "--"} <span className="text-xs text-slate-400 font-normal">hrs</span></span>
                  </div>
                  <div className="bg-fuchsia-50/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-fuchsia-100 shadow-sm flex flex-col justify-center gap-1 hover:bg-fuchsia-50/80 transition-colors">
                    <span className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-widest">Temp</span>
                    <span className="text-xl font-bold text-fuchsia-900">{vitalsData?.temperature || "--"} <span className="text-xs text-fuchsia-600/70 font-normal">°C</span></span>
                  </div>
                </div>

                {/* ZERO-SCROLL HUD: Active Medications Widget */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 p-6 md:p-8 flex-1 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif font-bold text-xl text-slate-800 flex items-center gap-3">
                      <Pill className="w-5 h-5 text-blue-500" />
                      Active Medications
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-blue-100">Today</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medication Card 1 */}
                    <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/30 rounded-2xl p-5 border border-blue-100/50 relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-400/20 transition-all duration-500" />
                      <div className="relative z-10 flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-blue-900 text-lg">Amoxicillin</h4>
                          <p className="text-xs text-blue-700/70 font-medium">Antibiotic 500mg</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-blue-100 text-blue-800 font-bold text-xs shadow-sm">
                          3x Sehari
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center gap-2">
                        <div className="flex-1 bg-white/60 h-2 rounded-full overflow-hidden border border-blue-100">
                          <div className="bg-blue-500 w-[60%] h-full rounded-full" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-800">Sisa 12</span>
                      </div>
                    </div>

                    {/* Medication Card 2 */}
                    <div className="bg-gradient-to-br from-purple-50/80 to-fuchsia-50/30 rounded-2xl p-5 border border-purple-100/50 relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-400/20 transition-all duration-500" />
                      <div className="relative z-10 flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-purple-900 text-lg">Omeprazole</h4>
                          <p className="text-xs text-purple-700/70 font-medium">Gastric 20mg</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-purple-100 text-purple-800 font-bold text-xs shadow-sm">
                          1x Sehari
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center gap-2">
                        <div className="flex-1 bg-white/60 h-2 rounded-full overflow-hidden border border-purple-100">
                          <div className="bg-purple-500 w-[80%] h-full rounded-full" />
                        </div>
                        <span className="text-[10px] font-bold text-purple-800">Sisa 24</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 overflow-hidden p-6">
                  {recordsLoading ? <LoadingStates /> : <HealthAnalytics records={decryptedRecords as MedicalRecord[]} />}
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6">
                {/* Medical Records Core - MASTER-DETAIL UI */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif font-bold text-2xl text-slate-800 flex items-center gap-3">
                      <FileText className="w-6 h-6 text-cyan-500" />
                      Medical History
                    </h3>
                    <span className="text-xs bg-white text-slate-500 px-4 py-1.5 rounded-full font-bold shadow-sm border border-slate-100">{records.length} Records</span>
                  </div>

                  <div className="flex flex-col gap-6">
                    {recordsLoading ? (
                      <LoadingStates />
                    ) : decryptedRecords.length === 0 ? (
                      <NoRecordsState />
                    ) : (
                      <>
                        {/* MASTER: Horizontal Scrollable Timeline */}
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                          {decryptedRecords.map((record) => {
                            const isSelected = (selectedRecordId || decryptedRecords[0].id) === record.id;
                            const dateNum = Number(record.createdAt);
                            const dateObj = new Date(isNaN(dateNum) ? record.createdAt : dateNum);
                            const dateStr = isNaN(dateObj.getTime()) ? "Unknown Date" : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateObj);
                            
                            return (
                              <button
                                key={record.id}
                                onClick={() => setSelectedRecordId(record.id as number)}
                                className={`flex-shrink-0 snap-start text-left p-4 rounded-2xl border transition-all duration-300 w-48 ${
                                  isSelected 
                                    ? "bg-cyan-50/80 border-cyan-300 shadow-md ring-2 ring-cyan-100 ring-offset-1" 
                                    : "bg-white/50 border-slate-200/60 hover:bg-white/80 hover:border-cyan-200"
                                }`}
                              >
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                                  <span className={isSelected ? "text-cyan-700" : "text-slate-500"}>
                                    {record.recordType.replace("_", " ")}
                                  </span>
                                  {!record.decryptedContent && <Lock className="w-3 h-3 text-slate-400" />}
                                </div>
                                <div className={`font-medium ${isSelected ? "text-cyan-950" : "text-slate-700"}`}>
                                  {dateStr}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* DETAIL: Active Record View */}
                        <div className="mt-2 relative animate-in slide-in-from-right-4 fade-in duration-300">
                          {(() => {
                            const activeRecord = decryptedRecords.find(r => r.id === (selectedRecordId || decryptedRecords[0].id));
                            if (!activeRecord) return null;
                            if (!activeRecord.decryptedContent) {
                               return (
                                <div className="p-8 border border-slate-200/50 rounded-3xl bg-white/50 backdrop-blur-sm flex flex-col justify-center items-center opacity-70">
                                  <Lock className="w-8 h-8 text-slate-300 mb-3" />
                                  <h4 className="font-bold text-slate-700 text-lg mb-1">Record Locked</h4>
                                  <p className="text-sm text-slate-400 text-center mb-6">Unlock your keystore to view this {activeRecord.recordType} record.</p>
                                  <KeyImportDialog walletAddress={user.walletAddress} onSuccess={() => setDecryptTrigger(p => p + 1)}>
                                    <button className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-slate-700 transition-colors flex items-center gap-2">
                                      <Unlock className="w-4 h-4" /> Unlock Data Vault
                                    </button>
                                  </KeyImportDialog>
                                </div>
                               );
                            }
                            return <MedicalHistoryBlock key={`detail-${activeRecord.id}`} record={activeRecord as any} />;
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/40 overflow-hidden p-6 mt-8">
                  {recordsLoading ? <LoadingStates /> : <HealthTimeline records={decryptedRecords as MedicalRecord[]} />}
                </div>
              </TabsContent>

            </div>

            {/* RIGHT COLUMN: Insights & Story (span 3) */}
            <div className="xl:col-span-3 space-y-6">

              {/* Patient Identity Node */}
              <div className="bg-slate-900/5 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Patient Node</span>
                  <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]" />
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Optimal</span>
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-slate-800 break-all mb-1">
                  {user.walletAddress.substring(0,8)}...{user.walletAddress.substring(36)}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Decentralized Identity Active</div>
              </div>

              {/* Mini Security Logs */}
              <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  <h3 className="font-serif font-bold text-slate-800">Security Logs</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                   <MedicalTimeline logs={auditData?.logs ? auditData.logs.slice(0,5) : []} />
                </div>
                {auditData?.logs?.length > 5 && (
                  <TabsList className="bg-transparent p-0 w-full mt-4">
                     <TabsTrigger value="security" className="w-full text-xs text-slate-500 font-medium hover:text-slate-800">
                        View All Logs &rarr;
                     </TabsTrigger>
                  </TabsList>
                )}
              </div>

              {/* Full AI Insights Tab Content (Hidden unless triggered) */}
              <TabsContent value="insights" className="hidden">
                  <AIHealthInsights
                    records={decryptedRecords as MedicalRecord[]}
                    userProfile={{ age: user.age, bloodType: user.bloodType, allergies: user.allergies }}
                  />
              </TabsContent>
              <TabsContent value="security" className="hidden">
                  {/* Kept minimal as logic moved to Mini Security Logs, but full content can be accessed here if needed */}
              </TabsContent>

            </div>

          </div>
        </Tabs>
      </div>
    </Layout>
  );
}

// --- SUB-COMPONENTS ---

function baseVitalStat({ label, value, unit, highlight }: any) {
  // ... logic
}

function VitalStat({ label, value, unit, highlight }: { label: string, value: string, unit: string, highlight?: boolean }) {
  const isNoData = value === "--" || value === "--/--";
  const applyHighlight = highlight && !isNoData;
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${applyHighlight ? 'bg-cyan-50 border-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white border-slate-100 hover:border-cyan-100'} flex flex-col justify-between h-[104px] shadow-sm`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${applyHighlight ? 'text-cyan-600' : 'text-slate-400'}`}>{label}</span>
      <div className="flex items-baseline gap-1 mt-auto">
        <span className={`text-3xl font-serif font-bold tracking-tight ${isNoData ? 'text-slate-200' : applyHighlight ? 'text-cyan-900' : 'text-slate-800'}`}>{value}</span>
        {!isNoData && <span className={`text-xs font-medium mb-1 ${applyHighlight ? 'text-cyan-600' : 'text-slate-400'}`}>{unit}</span>}
      </div>
    </div>
  )
}

function MedicalTimeline({ logs }: { logs: any[] }) {
  if (logs.length === 0) return <div className="text-slate-400 text-center py-4 text-sm">No activity recorded.</div>;

  return (
    <div className="relative border-l border-slate-100 ml-2 space-y-6">
      {logs.map((log, i) => (
        <div key={i} className="relative pl-6">
          <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-300 ring-1 ring-slate-100" />
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">{log.action}</span>
              <span className="font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-sm text-slate-600">
              Performed by <span className="font-mono bg-slate-50 px-1 rounded text-slate-500">{(log.performedBy || "").substring(0, 8)}...</span>
              <span className="mx-1 text-slate-300">|</span>
              {log.details || "Access Request"}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}





