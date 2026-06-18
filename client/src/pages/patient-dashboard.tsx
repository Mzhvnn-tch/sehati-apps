// ----------------------------------------------------------------------
// 1. COMPONENTS & IMPORTS
// ----------------------------------------------------------------------
import Layout from "@/components/layout";
import { HealthRecord } from "@/components/health-card";
import { QRShare } from "@/components/qr-share";
import { AuditLog } from "@/components/audit-log";
import { MedicalHistoryBlock } from "@/components/medical-history-block";
import { HealthTimeline } from "@/components/health-timeline";

import { LoadingStates } from "@/components/loading-states";
import { NoRecordsState } from "@/components/empty-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Share2, FileText, Activity, Blocks, Download, Loader2, ArrowLeft, LogIn, Lock, Unlock, RefreshCw, BarChart3, Brain, Clock, ShieldAlert, Pill, AlertTriangle, Fingerprint, Heart } from "lucide-react";
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


export default function PatientDashboard() {
  const { user, loginWithSignature, isLoading: authLoading, disconnect: authDisconnect } = useAuth();
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const { chainId } = useAccount();
  const signer = useEthersSigner();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  const [showRegistration, setShowRegistration] = useState(false);

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
    window.location.href = "/";
  };

  useEffect(() => {
    if (user && user.role !== "patient") setLocation("/doctor");
  }, [user, setLocation]);

  useEffect(() => {
    if (!isConnected) {
      setShowRegistration(false);
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

  // Debug logging to understand the blank screen issue
  console.log("Dashboard Render State:", { isConnected, address, user: !!user, showRegistration });

  // 1. Loading
  if (authLoading || (isConnected && !address && !user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent text-cyan-600 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          {isConnected && !address ? "Fetching wallet address..." : "Verifying identity..."}
        </p>
      </div>
    );
  }

  // 2. Connect Wallet View (Brutalist Luxury)
  if (!user && !showRegistration) {
    return (
      <div className="min-h-screen flex bg-[#fafafa] text-[#020617] font-sans selection:bg-[#020617] selection:text-white">
        
        {/* Left Column - Stark Dark */}
        <div className="hidden lg:flex w-1/2 bg-[#020617] text-white p-12 md:p-20 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
          <div className="relative z-10">
             <div className="w-12 h-12 bg-white flex items-center justify-center mb-12">
               <Activity className="w-6 h-6 text-[#020617]" />
             </div>
             <h1 className="font-heading text-6xl lg:text-[5rem] font-medium tracking-tighter leading-[1] mb-8">
               Patient <br/><span className="text-slate-500">Portal.</span>
             </h1>
             <p className="text-2xl text-slate-400 font-light max-w-md leading-relaxed">
               Access your medical records securely. You have full, absolute control over who sees your health data.
             </p>
          </div>
          <div className="relative z-10 text-[10px] font-mono tracking-[0.3em] uppercase font-bold text-slate-600">
             100% Private & Secure
          </div>
        </div>

        {/* Right Column - Stark Light */}
        <div className="w-full lg:w-1/2 p-12 md:p-20 flex flex-col justify-center relative shadow-[-30px_0_100px_rgba(0,0,0,0.1)] z-10 bg-[#fafafa]">
          
          <Button variant="ghost" className="absolute top-12 right-12 text-[#020617] hover:bg-transparent hover:opacity-50 uppercase tracking-[0.2em] font-bold text-[10px] rounded-none" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-3" /> Exit
          </Button>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md w-full mx-auto"
          >
            <div className="mb-12 border-b border-[#020617]/10 pb-12">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-6">Authentication Required</span>
              <h2 className="font-heading text-4xl font-medium tracking-tight mb-4 text-[#020617]">Secure Login</h2>
              <p className="text-slate-500 text-lg font-light leading-relaxed">Log in safely to view your health profile and test results.</p>
            </div>
            
            <div className="flex flex-col gap-8">
               <div className="scale-105 origin-left">
                 <WalletConnect onRequireRegistration={() => setShowRegistration(true)} />
               </div>
               

            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 4. Registration View (Brutalist)
  if (showRegistration && address) {
    return (
      <div className="min-h-screen flex bg-[#fafafa] text-[#020617] font-sans selection:bg-[#020617] selection:text-white">
        {/* Left Column */}
        <div className="hidden lg:flex w-1/3 bg-[#020617] text-white p-12 flex-col justify-between relative overflow-hidden">
           <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
           <div className="relative z-10">
             <h1 className="font-heading text-5xl font-medium tracking-tighter leading-[1] mb-6">
               Initialize <br/><span className="text-slate-500">Identity.</span>
             </h1>
             <p className="text-lg text-slate-400 font-light leading-relaxed">
               Set up a secure 6-digit PIN. This acts as the master key to lock your medical records locally.
             </p>
           </div>
           <Button variant="outline" onClick={handleDisconnect} className="w-fit border-white/20 text-white hover:bg-white hover:text-black rounded-none uppercase tracking-[0.2em] text-[10px] font-bold">
             Abort Registration
           </Button>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-2/3 p-8 md:p-16 flex items-center justify-center overflow-y-auto">
          <div className="max-w-xl w-full border border-[#020617]/10 bg-white p-12 shadow-[0_30px_100px_rgba(0,0,0,0.05)] relative">
             <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-10 border-b border-[#020617]/10 pb-4">Onboarding Pipeline</span>
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
  const { disconnect: authDisconnect } = useAuth();
  const [decryptedRecords, setDecryptedRecords] = useState<(MedicalRecord & { decryptedContent?: string })[]>([]);
  const [decryptTrigger, setDecryptTrigger] = useState(0);

  // Recovery State
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState("");
  const [recovering, setRecovering] = useState(false);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // Decryption Logic
  useEffect(() => {
    const decryptAll = async () => {
      if (!records.length) return;
      const privKeyStr = localStorage.getItem(`sehati_priv_${user.walletAddress.toLowerCase()}`);
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
        localStorage.setItem(`sehati_priv_${user.walletAddress.toLowerCase()}`, privateKeyStr);
        toast({ title: "Recovery Success", description: "Your Keystore has been unlocked." });
        setShowRecovery(false);
        setDecryptTrigger(p => p + 1); // Retrigger decryption
    } catch (e) {
        toast({ title: "Recovery Failed", description: "Invalid PIN. Please try again.", variant: "destructive" });
    } finally {
        setRecovering(false);
    }
  };

  const activeGrantsCount = auditData?.logs ? auditData.logs.filter((l: any) => l.action.includes('GRANT')).length : 0;

  // Recent Medical Records real mapping from decrypted records
  const recentRecords = decryptedRecords.map(r => {
    let parsed = {} as any;
    try { if (r.decryptedContent) parsed = JSON.parse(r.decryptedContent); } catch(e){}
    const doctorName = (r as any).doctorName || parsed.doctorName;
    return {
      id: r.id,
      type: r.recordType || 'Diagnosis',
      hospital: r.hospitalName || parsed.hospital || 'Unknown Hospital',
      doctor: doctorName ? (doctorName.startsWith('Dr.') ? doctorName : 'Dr. ' + doctorName) : 'Dr. Attending',
      date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: r.blockchainHash ? 'On-chain' : 'Local'
    }
  }).slice(0, 4);

  // Extract latest doctor, vitals, and meds
  let activeDoctor = null;
  let activeDate = null;
  let latestHeartRate = "72 bpm";
  let latestBP = "120/80 mmHg";
  let currentMeds = "None active";
  
  for (const r of decryptedRecords) {
     let parsed = {} as any;
     try { if (r.decryptedContent) parsed = JSON.parse(r.decryptedContent); } catch(e){}
     
     if (parsed.doctorName && !activeDoctor) {
         activeDoctor = parsed.doctorName;
         activeDate = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
     }
     
     if (parsed.vitals?.heartRate && latestHeartRate === "72 bpm") latestHeartRate = parsed.vitals.heartRate;
     if (parsed.vitals?.bloodPressure && latestBP === "120/80 mmHg") latestBP = parsed.vitals.bloodPressure;
     if (parsed.prescription && currentMeds === "None active") currentMeds = parsed.prescription.length > 20 ? parsed.prescription.substring(0, 20) + '...' : parsed.prescription;
     if (parsed.medications && currentMeds === "None active") currentMeds = parsed.medications.length > 20 ? parsed.medications.substring(0, 20) + '...' : parsed.medications;
  }

  const navItems = [
    { icon: Activity, label: "Dashboard" },
    { icon: FileText, label: "My Records" },
    { icon: Lock, label: "Access Control" },
    { icon: Blocks, label: "Family Vault" },
    { icon: Clock, label: "Audit Log" },
    { icon: SettingsIcon, label: "Settings" }
  ];

  return (
    <div className="w-full h-screen bg-[#fafafa] text-[#020617] font-sans flex flex-col overflow-hidden selection:bg-[#020617] selection:text-white">
      {/* Recovery Dialog */}
      <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
        <DialogContent className="sm:max-w-md bg-[#fafafa] border-none shadow-[0_30px_100px_rgba(0,0,0,0.2)] rounded-none p-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 font-heading text-2xl tracking-tight text-[#020617]">
              <Lock className="w-6 h-6 text-[#020617]" />
              Keystore Recovery
            </DialogTitle>
            <DialogDescription className="text-slate-500 leading-relaxed mt-4">
              Please enter your 6-digit Health PIN to unlock your secure clinical records.
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
              className="text-center font-mono tracking-[1em] text-3xl h-16 bg-white border-[#020617]/10 text-[#020617] rounded-none focus-visible:ring-0 focus-visible:border-[#020617] transition-all"
            />
          </div>
          <DialogFooter className="mt-4 border-t border-[#020617]/10 pt-6">
            <Button onClick={handleRecover} disabled={recovering || recoveryPin.length !== 6} className="w-full bg-[#020617] hover:bg-transparent hover:text-[#020617] border border-[#020617] text-white h-14 rounded-none uppercase tracking-[0.2em] text-[10px] font-bold transition-all duration-500">
          {recovering ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Unlock className="w-4 h-4 mr-3" />}
              {recovering ? "UNLOCKING..." : "UNLOCK RECORDS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
           {/* TOP NAVIGATION TAPE */}
      <header className="h-16 border-b border-[#020617] flex items-center justify-between px-8 shrink-0 bg-[#fafafa] relative z-20">
        <div className="flex items-center">
          <span className="font-heading text-xl tracking-tighter">AURAMED</span>
        </div>
        <div className="flex items-center gap-12 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
          <button onClick={() => setActiveTab("Dashboard")} className={activeTab === "Dashboard" ? "border-b border-[#020617] pb-1" : "opacity-50 hover:opacity-100"}>Overview</button>
          <button onClick={() => setActiveTab("My Records")} className={activeTab === "My Records" ? "border-b border-[#020617] pb-1" : "opacity-50 hover:opacity-100"}>Archive</button>
          <button onClick={() => setActiveTab("Lab Results")} className={activeTab === "Lab Results" ? "border-b border-[#020617] pb-1" : "opacity-50 hover:opacity-100"}>Lab Results</button>
          <button onClick={() => setActiveTab("Appointments")} className={activeTab === "Appointments" ? "border-b border-[#020617] pb-1" : "opacity-50 hover:opacity-100"}>Appointments</button>
          <button onClick={() => setActiveTab("Audit Log")} className={activeTab === "Audit Log" ? "border-b border-[#020617] pb-1" : "opacity-50 hover:opacity-100"}>Audit</button>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={authDisconnect} className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:text-slate-400">Sign Out</button>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      {activeTab === "Dashboard" ? (
        <main className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: IDENTITY & QR (30%) */}
          <div className="hidden lg:flex w-[30%] border-r border-[#020617] flex-col relative bg-[#fafafa]">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
            
            <div className="p-12 pb-0 relative z-10 flex-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-8">Patient Identity</span>
              <h1 className="font-heading text-6xl xl:text-[5rem] font-medium tracking-tighter leading-[0.9] mb-8">
                {user.name.split(' ')[0]}<br/>
                <span className="text-slate-400">Profile.</span>
              </h1>
              
              <div className="space-y-6 mt-12">
                <div className="border-l-2 border-[#020617] pl-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1">Blood Type</p>
                  <p className="font-mono text-sm font-bold">{user.bloodType || 'Unknown'}</p>
                </div>
                <div className="border-l-2 border-[#020617] pl-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1">Age</p>
                  <p className="font-mono text-sm font-bold">{user.age} Years</p>
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-[#020617] p-8 relative z-10 shrink-0">
              <QRShare patientId={user.id} walletAddress={user.walletAddress} />
            </div>
          </div>

          {/* MIDDLE COLUMN: RECORDS (45%) */}
          <div className="w-full lg:w-[45%] border-r border-[#020617] flex flex-col bg-white relative">
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
            <div className="p-8 md:p-12 border-b border-[#020617] flex justify-between items-end bg-[#fafafa] relative z-10">
              <div>
                 <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-2">Chronology</span>
                 <h2 className="font-heading text-4xl">Clinical Archive</h2>
              </div>
              <button onClick={() => setActiveTab("My Records")} className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:opacity-50">View All →</button>
            </div>
            
            <div className="flex-1 overflow-y-auto relative z-10">
              {recentRecords.length > 0 ? (
                <div className="divide-y divide-[#020617]/10">
                  {recentRecords.map((rec, i) => (
                    <div key={i} className="p-8 hover:bg-[#fafafa] transition-colors group cursor-pointer" onClick={() => setActiveTab("My Records")}>
                      <div className="flex justify-between items-start mb-6">
                         <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 border border-[#020617]">
                           {rec.type}
                         </span>
                         <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">{rec.date}</span>
                      </div>
                      <h3 className="font-heading text-2xl mb-2">{rec.hospital}</h3>
                      <p className="text-sm text-slate-600 mb-6 font-medium">{rec.doctor}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-12 text-center">
                   <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">No medical records indexed.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: VITALS (25%) */}
          <div className="hidden xl:flex w-[25%] flex-col bg-[#fafafa]">
            
            <div className="h-1/3 border-b border-[#020617] p-8 flex flex-col justify-between group hover:bg-white transition-colors">
               <div className="flex justify-between items-start">
                 <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500">Heart Rate</span>
                 <Activity className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
               </div>
               <div>
                 <span className="font-heading text-6xl tracking-tighter block mb-2">{latestHeartRate.split(' ')[0]}</span>
                 <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500">{latestHeartRate.split(' ')[1] || 'BPM'}</span>
               </div>
            </div>

            <div className="h-1/3 border-b border-[#020617] p-8 flex flex-col justify-between group hover:bg-white transition-colors">
               <div className="flex justify-between items-start">
                 <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500">Blood Pressure</span>
                 <Heart className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
               </div>
               <div>
                 <span className="font-heading text-5xl xl:text-6xl tracking-tighter block mb-2">{latestBP.split(' ')[0]}</span>
                 <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500">{latestBP.split(' ')[1] || 'MMHG'}</span>
               </div>
            </div>

            <div className="h-1/3 p-8 flex flex-col justify-between group hover:bg-white transition-colors">
               <div className="flex justify-between items-start">
                 <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500">Medications</span>
                 <Pill className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
               </div>
               <div>
                 <span className="font-heading text-3xl xl:text-4xl tracking-tighter block leading-tight">{currentMeds}</span>
               </div>
            </div>

          </div>

        </main>
      ) : (
        <main className="flex-1 overflow-y-auto bg-[#fafafa] relative">
           <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
           
           <div className="w-full px-4 md:px-8 py-8 md:py-12 relative z-10">
              {activeTab === "My Records" ? (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#020617] pb-12 mb-16">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-4">Encrypted Repository</span>
                        <h1 className="font-heading text-5xl md:text-7xl font-medium tracking-tighter text-[#020617]">Clinical Archive.</h1>
                      </div>
                    </div>
                    
                    <div className="w-full border border-[#020617] bg-white p-8 md:p-16 shadow-[12px_12px_0px_0px_rgba(2,6,23,1)] relative">
                        {/* Decorative background grid for the timeline container */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                        
                        <div className="relative z-10">
                            {/* @ts-ignore */}
                            <HealthTimeline records={decryptedRecords} />
                        </div>
                    </div>
                 </div>
              ) : activeTab === "Lab Results" ? (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-end border-b border-[#020617] pb-12 mb-16">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-4">Diagnostics & Metrics</span>
                        <h1 className="font-heading text-5xl md:text-7xl font-medium tracking-tighter text-[#020617]">Lab Results.</h1>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="border border-[#020617] bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(2,6,23,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all duration-300">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 block mb-6">Complete Blood Count (CBC)</span>
                            <h3 className="font-heading text-4xl mb-8">Optimal Range</h3>
                            <div className="space-y-6 font-mono text-sm">
                                <div className="flex justify-between border-b border-[#020617]/10 pb-2"><span>Hemoglobin</span><span className="font-bold">14.5 g/dL</span></div>
                                <div className="flex justify-between border-b border-[#020617]/10 pb-2"><span>Leukocytes</span><span className="font-bold">6.2 10^3/µL</span></div>
                                <div className="flex justify-between border-b border-[#020617]/10 pb-2"><span>Platelets</span><span className="font-bold">250 10^3/µL</span></div>
                            </div>
                        </div>
                        <div className="border border-[#020617] bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(2,6,23,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all duration-300">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 block mb-6">Metabolic Panel</span>
                            <h3 className="font-heading text-4xl mb-8 text-amber-600">Monitor</h3>
                            <div className="space-y-6 font-mono text-sm">
                                <div className="flex justify-between border-b border-[#020617]/10 pb-2"><span>Glucose (Fasting)</span><span className="font-bold text-amber-600">105 mg/dL</span></div>
                                <div className="flex justify-between border-b border-[#020617]/10 pb-2"><span>Cholesterol</span><span className="font-bold">180 mg/dL</span></div>
                                <div className="flex justify-between border-b border-[#020617]/10 pb-2"><span>Triglycerides</span><span className="font-bold">110 mg/dL</span></div>
                            </div>
                        </div>
                    </div>
                 </div>
              ) : activeTab === "Appointments" ? (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-end border-b border-[#020617] pb-12 mb-16">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-4">Scheduling & Visits</span>
                        <h1 className="font-heading text-5xl md:text-7xl font-medium tracking-tighter text-[#020617]">Appointments.</h1>
                      </div>
                      <button className="bg-[#020617] text-white font-mono text-[10px] uppercase tracking-[0.2em] font-bold px-6 py-4 hover:bg-slate-800 transition-colors shadow-[4px_4px_0px_0px_rgba(100,116,139,1)] active:shadow-none active:translate-y-1 active:translate-x-1">Book New</button>
                    </div>
                    <div className="space-y-8">
                        <div className="border border-[#020617] bg-white p-8 md:p-10 shadow-[8px_8px_0px_0px_rgba(2,6,23,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 hover:shadow-[12px_12px_0px_0px_rgba(2,6,23,1)] transition-shadow duration-300">
                            <div>
                                <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold px-3 py-1 bg-[#020617] text-white mb-6 inline-block">Upcoming</span>
                                <h3 className="font-heading text-3xl md:text-4xl mb-3 text-[#020617]">Dr. Sarah Jenkins</h3>
                                <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Cardiology Specialist • Central Hospital</p>
                            </div>
                            <div className="text-left md:text-right">
                                <div className="font-heading text-4xl mb-2">Oct 24</div>
                                <div className="font-mono text-xs uppercase tracking-widest text-slate-500">09:00 AM EST</div>
                            </div>
                        </div>
                        <div className="border border-[#020617] bg-white p-8 md:p-10 opacity-60 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 hover:opacity-100 transition-opacity duration-300">
                            <div>
                                <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold px-3 py-1 bg-slate-100 text-slate-600 mb-6 inline-block border border-slate-300">Completed</span>
                                <h3 className="font-heading text-3xl md:text-4xl mb-3 text-[#020617]">Dr. Michael Chen</h3>
                                <p className="font-mono text-xs uppercase tracking-widest text-slate-500">General Practice • AuraMed Clinic</p>
                            </div>
                            <div className="text-left md:text-right">
                                <div className="font-heading text-4xl mb-2 text-slate-500">Sep 12</div>
                                <div className="font-mono text-xs uppercase tracking-widest text-slate-500">14:30 PM EST</div>
                            </div>
                        </div>
                    </div>
                 </div>
              ) : activeTab === "Audit Log" ? (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-end border-b border-[#020617] pb-12 mb-16">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-4">Security Log</span>
                        <h1 className="font-heading text-5xl md:text-7xl font-medium tracking-tighter text-[#020617]">Audit Log.</h1>
                      </div>
                    </div>
                    <AuditLog logs={auditData?.logs || []} />
                 </div>
              ) : (
                 <div className="py-32 text-center border border-[#020617]/10 bg-white p-12 shadow-[0_30px_100px_rgba(0,0,0,0.05)]">
                   <h2 className="font-heading text-4xl font-medium text-[#020617] mb-4">Under Construction</h2>
                   <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] font-bold">This section is currently being architected.</p>
                 </div>
              )}
           </div>
        </main>
      )}
    </div>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  )
}

function StatsCard({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-white p-10 flex flex-col justify-between group hover:bg-slate-50 transition-colors duration-500">
      <div className="flex items-start justify-between mb-8">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">{label}</p>
        {Icon && <Icon className="w-5 h-5 text-[#020617] opacity-40" />}
      </div>
      <h3 className="font-heading text-4xl font-medium text-[#020617] tracking-tight">{value}</h3>
    </div>
  );
}

