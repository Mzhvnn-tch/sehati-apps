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
import { Share2, FileText, Activity, Blocks, Download, Loader2, ArrowLeft, LogIn, Lock, Unlock, RefreshCw, BarChart3, Brain, Clock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getPatientRecords, getAuditLogs, getUserByWallet } from "@/lib/api";
import { decryptData, importKey } from "@/lib/encryption";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { clearWalletConnectStorage } from "@/lib/utils";
import type { MedicalRecord } from "@shared/schema";
import { useAppKit, useAppKitAccount, useDisconnect, AppKitButton } from "@reown/appkit/react";
import { PatientRegistration } from "@/components/patient-registration";
import { KeyExportDialog } from "@/components/key-export-dialog";
import { KeyImportDialog } from "@/components/key-import-dialog";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useEthersSigner } from "@/lib/blockchain";
import { useAccount, useSwitchChain } from "wagmi";
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
  const { address, isConnected } = useAppKitAccount();
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

  useEffect(() => {
    const checkWallet = async () => {
      if (user) return;
      if (isConnected && address && !isChecking && !showRegistration && !loginRequired) {
        setIsChecking(true);
        try {
          const { user: existingUser } = await getUserByWallet(address);
          if (existingUser && existingUser.role === "patient") {
            setLoginRequired(true);
          }
        } catch (error: any) {
          if (error.status === 404 || error.message?.includes("User not found")) {
            setShowRegistration(true);
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
    if (Number(chainId) !== 4202) {
      toast({ title: "Wrong Network", description: "Switching to Lisk Sepolia...", duration: 3000 });
      try { switchChain({ chainId: 4202 }); } catch (e) { }
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

  // --- RENDERING VIEWS ---

  // 1. Loading
  if (authLoading || (isConnected && isChecking)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0C10] text-primary">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  // 2. Connect Wallet View (Dark Theme)
  if (!isConnected && !user) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-[#0B0C10] to-[#0B0C10]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-card max-w-md w-full p-8 border border-white/10 relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20 shadow-[0_0_30px_-10px_rgba(244,208,63,0.3)]">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Patient Portal</h1>
          <p className="text-white/60 mb-8 font-light">
            Connect your wallet to retrieve your encrypted health identity.
          </p>
          <div className="flex justify-center mb-6 scale-110">
            <AppKitButton />
          </div>
          <Button variant="ghost" className="w-full text-white/40 hover:text-primary" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // 3. Signature Login (Dark Theme)
  if (loginRequired && address) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md w-full p-8 border border-white/10 relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 text-primary animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-2">Security Verification</h1>
          <p className="text-white/60 mb-8 font-light">
            Your data is encrypted. Sign the message to prove ownership.
          </p>

          <MagneticButton className="w-full bg-primary text-black font-bold h-12 mb-4 hover:shadow-[0_0_20px_rgba(244,208,63,0.5)]" onClick={handleLogin} disabled={isLoggingIn}>
            {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Identity"}
          </MagneticButton>

          <Button variant="ghost" className="w-full text-white/40 hover:text-white" onClick={handleDisconnect}>
            Cancel
          </Button>
        </motion.div>
      </div>
    );
  }

  // 4. Registration View
  if (showRegistration && address) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
        <div className="w-full max-w-xl glass-card border-white/10">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-serif text-white font-bold text-xl">Initialize Identity</h2>
            <Button variant="ghost" onClick={handleDisconnect} className="text-red-400 hover:bg-red-500/10">Abort</Button>
          </div>
          <div className="p-8">
            {/* Note: PatientRegistration internal styles might need tweaks, but container is dark now */}
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

  // Decryption Logic
  useEffect(() => {
    const decryptAll = async () => {
      if (!records.length) return;
      const privKeyStr = localStorage.getItem(`sehati_priv_${user.walletAddress}`);
      if (!privKeyStr) {
        setDecryptedRecords(records.map(r => ({ ...r, decryptedContent: null })));
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

  // Find latest VITALS record
  const latestVitals = decryptedRecords.find(r => r.recordType === 'VITALS');
  const vitalsData = latestVitals?.decryptedContent ? JSON.parse(latestVitals.decryptedContent) : null;

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        {/* 1. Header: Profile & Keys */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-50 flex items-center justify-center border border-white shadow-inner">
              <img
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.walletAddress}`}
                alt="Avatar"
                className="w-10 h-10 opacity-70 mix-blend-multiply"
              />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-800">{user.name}</h1>
              <p className="text-slate-500 text-sm font-mono">ID: {user.walletAddress.substring(0, 8)}...</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Keys</span>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex gap-2">
                <KeyExportDialog walletAddress={user.walletAddress} />
                <KeyImportDialog walletAddress={user.walletAddress} onSuccess={() => setDecryptTrigger(p => p + 1)} />
              </div>
            </div>
            <div className="hidden md:block">
              <QRShare patientId={user.id} walletAddress={user.walletAddress} />
            </div>
          </div>
        </header>

        {/* 2. Enhanced Dashboard with Tabs */}
        <section>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="gap-2">
                <Activity className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <Brain className="w-4 h-4" />
                AI Insights
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Vitals Widget */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-serif font-bold text-slate-800">Latest Vitals</h3>
                  <span className="text-xs text-slate-400 font-medium ml-auto">Verified by Nurse Station</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <VitalStat label="Heart Rate" value={vitalsData?.heartRate || "--"} unit="bpm" />
                  <VitalStat label="Blood Pressure" value={vitalsData?.bloodPressure || "--/--"} unit="mmHg" />
                  <VitalStat label="Weight" value={vitalsData?.weight || "--"} unit="kg" />
                  <VitalStat label="Blood Type" value={vitalsData?.bloodType || user.bloodType || "--"} unit="" highlight />
                  <VitalStat label="Sleep" value={vitalsData?.sleep || "--"} unit="hrs" />
                </div>
              </div>

              {/* Medical Records */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="font-serif font-bold text-xl text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    Medical History
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium">{records.length} Records</span>
                </div>

                <div className="p-6 bg-slate-50/50">
                  <div className="flex flex-col gap-4">
                    {recordsLoading ? (
                      <LoadingStates />
                    ) : decryptedRecords.length === 0 ? (
                      <NoRecordsState />
                    ) : (
                      decryptedRecords.map((record) => (
                        record.decryptedContent ? (
                          <MedicalHistoryBlock key={record.id} record={record as any} />
                        ) : (
                          <div key={record.id} className="p-4 border border-slate-100 rounded-xl bg-white flex justify-between items-center opacity-70">
                            <div>
                              <h4 className="font-bold text-slate-700">{record.recordType}</h4>
                              <p className="text-xs text-slate-400">{new Date(record.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Lock className="w-4 h-4" /> Locked Content
                            </div>
                          </div>
                        )
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Access Logs */}
              <div className="bg-white rounded-3xl border border-slate-100 p-8">
                <h3 className="font-serif font-bold text-lg text-slate-800 mb-6">Security Access Log</h3>
                <MedicalTimeline logs={auditData?.logs || []} />
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              {recordsLoading ? (
                <LoadingStates />
              ) : (
                <HealthAnalytics records={decryptedRecords as MedicalRecord[]} />
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              {recordsLoading ? (
                <LoadingStates />
              ) : (
                <HealthTimeline records={decryptedRecords as MedicalRecord[]} />
              )}
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights">
              {recordsLoading ? (
                <LoadingStates />
              ) : (
                <AIHealthInsights
                  records={decryptedRecords as MedicalRecord[]}
                  userProfile={{
                    age: user.age,
                    bloodType: user.bloodType,
                    allergies: user.allergies
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
}

// --- SUB-COMPONENTS ---

function baseVitalStat({ label, value, unit, highlight }: any) {
  // ... logic
}

function VitalStat({ label, value, unit, highlight }: { label: string, value: string, unit: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-cyan-50 border-cyan-100' : 'bg-white border-slate-100'} flex flex-col justify-between h-24 shadow-sm`}>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-cyan-600' : 'text-slate-400'}`}>{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${highlight ? 'text-cyan-900' : 'text-slate-800'}`}>{value}</span>
        <span className={`text-xs font-medium ${highlight ? 'text-cyan-600' : 'text-slate-400'}`}>{unit}</span>
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





