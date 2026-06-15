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
               Cryptographically authenticate to retrieve your sovereign health records. Zero intermediaries.
             </p>
          </div>
          <div className="relative z-10 text-[10px] font-mono tracking-[0.3em] uppercase font-bold text-slate-600">
             End-to-end encrypted architecture
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
              <h2 className="font-heading text-4xl font-medium tracking-tight mb-4 text-[#020617]">Wallet Access</h2>
              <p className="text-slate-500 text-lg font-light leading-relaxed">Initialize a secure connection to decrypt your clinical vault.</p>
            </div>
            
            <div className="flex flex-col gap-8">
               <div className="scale-105 origin-left">
                 <WalletConnect onRequireRegistration={() => setShowRegistration(true)} />
               </div>
               
               <div className="p-8 border border-[#020617]/10 bg-white mt-4">
                 <div className="flex items-start gap-5">
                   <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                   <div>
                     <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#020617] mb-2">Zero-Knowledge Proof</h4>
                     <p className="text-slate-500 text-sm leading-relaxed">Your private keys never leave your device. Signatures are computed locally.</p>
                   </div>
                 </div>
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
               Configure your cryptographic master password. This PIN will secure your AES keys locally.
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
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Recovery Dialog */}
      <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Lock className="w-5 h-5 text-cyan-600" />
              Keystore Recovery
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-1">
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
              className="text-center font-mono tracking-[1em] text-3xl h-16 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-cyan-600 focus:border-cyan-600 transition-all"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRecover} disabled={recovering || recoveryPin.length !== 6} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-12 rounded-xl text-base font-medium shadow-md transition-all">
              {recovering ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Unlock className="w-5 h-5 mr-2" />}
              Unlock Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ULTRA SIDEBAR */}
      <aside className="w-[280px] h-screen bg-white border-r border-slate-200 flex flex-col relative z-20 shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-md">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-wider">SEHATI</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item, idx) => (
            <button key={idx} onClick={() => setActiveTab(item.label)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === item.label ? 'bg-cyan-50 text-cyan-700 shadow-sm border border-cyan-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              <item.icon className={`w-5 h-5 ${activeTab === item.label ? 'text-cyan-600' : 'group-hover:text-cyan-500'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-slate-100 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center border border-cyan-200">
              <Fingerprint className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-mono text-slate-600 truncate">{user.walletAddress}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-slate-50">
        <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-10 relative z-10">
          
          {activeTab === "My Records" ? (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-2 mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                    Clinical Archive
                  </h1>
                  <p className="text-slate-500 font-medium">Your complete medical history</p>
                </div>
                {/* @ts-ignore */}
                <HealthTimeline records={decryptedRecords} />
             </div>
          ) : activeTab === "Audit Log" ? (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-2 mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                    Audit Log
                  </h1>
                  <p className="text-slate-500 font-medium">Track who accessed your data</p>
                </div>
                <AuditLog logs={auditData?.logs || []} />
             </div>
          ) : activeTab === "Dashboard" ? (
            <>
              {/* HEADER ROW */}
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                  Good Morning, {user.name.split(' ')[0]}
                </h1>
                <p className="text-slate-500 font-medium">Your data is encrypted and sovereign</p>
              </div>

              {/* TOP STATS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard 
                  label="Heart Rate" 
                  value={latestHeartRate} 
                  icon={Activity} 
                  iconColor="text-rose-500" 
                  gradient="bg-gradient-to-br from-rose-50/80 to-white"
                  isEcg={true}
                />
                <StatsCard 
                  label="Current Medications" 
                  value={currentMeds} 
                  subtext="" 
                  icon={Pill} 
                  iconColor="text-cyan-500" 
                  gradient="bg-gradient-to-br from-cyan-50/80 to-white"
                />
                <StatsCard 
                  label="Blood Pressure" 
                  value={latestBP} 
                  icon={Heart} 
                  iconColor="text-indigo-500" 
                  gradient="bg-gradient-to-br from-indigo-50/80 to-white"
                />
              </div>

              {/* MIDDLE ROW SECTION */}
              <div className="space-y-4 mt-10">
             
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Records Table */}
                <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                   <h2 className="text-xl font-bold text-slate-900 mb-6 relative z-10">Recent Medical Records</h2>
                   
                   <div className="overflow-x-auto relative z-10">
                     <table className="w-full text-sm text-left">
                       <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                         <tr>
                           <th className="pb-4 font-semibold px-2">Record type</th>
                           <th className="pb-4 font-semibold px-2">Hospital</th>
                           <th className="pb-4 font-semibold px-2">Attending Doctor</th>
                           <th className="pb-4 font-semibold px-2">Date</th>
                           <th className="pb-4 font-semibold px-2 text-center">Verification</th>
                           <th className="pb-4 font-semibold px-2"></th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {recentRecords.length > 0 ? (
                           recentRecords.map((rec, i) => (
                             <tr key={i} className="hover:bg-slate-50 transition-colors group">
                               <td className="py-4 px-2">
                                 <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                   rec.type.toLowerCase().includes('diagnosis') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                   rec.type.toLowerCase().includes('lab') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                   'bg-amber-50 text-amber-700 border-amber-100'
                                 }`}>
                                   {rec.type}
                                 </span>
                               </td>
                               <td className="py-4 px-2 font-medium text-slate-800">{rec.hospital}</td>
                               <td className="py-4 px-2 text-slate-600">{rec.doctor}</td>
                               <td className="py-4 px-2 text-slate-600 font-mono text-xs">{rec.date}</td>
                               <td className="py-4 px-2">
                                 <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 w-fit mx-auto">
                                   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                   <span className="text-[10px] font-bold uppercase tracking-wider">{rec.status}</span>
                                 </div>
                               </td>
                               <td className="py-4 px-2 text-right">
                                 <button 
                                   onClick={() => {
                                      setActiveTab("My Records");
                                      setTimeout(() => {
                                         const el = document.getElementById(`record-${rec.id}`);
                                         if (el) {
                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            el.click(); // Expand the record
                                         }
                                      }, 300);
                                   }}
                                   className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200 transition-all shadow-sm">
                                   View
                                 </button>
                               </td>
                             </tr>
                           ))
                         ) : (
                           <tr>
                             <td colSpan={6} className="py-10 text-center text-slate-500 text-sm">
                               No medical records found. Let a doctor scan your QR to add records.
                             </td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                </div>

                {/* Active Access Panel */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden">
                   <h2 className="text-xl font-bold text-slate-900 mb-6 relative z-10">Data Sovereignty</h2>
                   
                   {activeDoctor ? (
                     <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 relative z-10">
                       <div className="flex items-center gap-4 mb-5">
                         <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shadow-inner">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeDoctor}`} alt="Doctor" className="w-10 h-10 object-cover" />
                         </div>
                         <div>
                           <h3 className="font-bold text-slate-800 text-lg">{activeDoctor.startsWith('Dr.') ? activeDoctor : `Dr. ${activeDoctor}`}</h3>
                           <p className="text-xs text-cyan-700 font-medium">Attending Physician</p>
                         </div>
                       </div>
                       <div className="space-y-4">
                         <div>
                           <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Date</p>
                           <p className="font-medium text-slate-700">{activeDate}</p>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6 relative z-10 text-center flex flex-col items-center justify-center h-full">
                       <ShieldAlert className="w-10 h-10 text-cyan-500 mb-4 opacity-80" />
                       <h3 className="text-slate-800 font-bold mb-1">No Active Doctor Sessions</h3>
                       <p className="text-slate-500 text-xs font-medium">Grant secure temporary access to a verified doctor below.</p>
                     </div>
                   )}

                   <div className="mt-auto relative z-10">
                     <QRShare patientId={user.id} walletAddress={user.walletAddress} />
                   </div>
                </div>
             </div>
          </div>
          </>
          ) : (
             <div className="py-20 text-center text-slate-500">
               <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
               <p>This section is under construction.</p>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  )
}

function StatsCard({ label, value, icon: Icon, iconColor, gradient, subtext, subtextColor, badge, showPulse, isEcg }: any) {
  return (
    <div className={`border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${gradient || 'bg-white'}`}>
      <div className="relative z-10">
        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtext && <span className={`text-xs font-semibold ${subtextColor}`}>{subtext}</span>}
        </div>
      </div>
      
      {Icon && (
        <div className="relative shrink-0 flex items-center justify-center p-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          {isEcg ? (
            <>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes scanline { 0% { width: 0%; } 100% { width: 100%; } }
              `}} />
              <div className="relative w-10 h-10 group-hover:scale-110 transition-transform duration-500">
                 {/* Background faded icon */}
                 <Icon className={`absolute inset-0 w-10 h-10 ${iconColor} opacity-20`} strokeWidth={1.5} />
                 {/* Foreground revealing icon */}
                 <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ animation: 'scanline 1.5s linear infinite' }}>
                    <Icon className={`absolute left-0 top-0 w-10 h-10 ${iconColor} drop-shadow-[0_0_6px_rgba(244,63,94,0.6)] max-w-none`} strokeWidth={1.5} />
                 </div>
              </div>
            </>
          ) : (
            <>
              {showPulse && <span className="absolute w-8 h-8 rounded-full bg-rose-200/60 animate-ping duration-1000" />}
              <Icon className={`w-10 h-10 relative z-10 ${iconColor} drop-shadow-sm group-hover:scale-110 transition-transform duration-500 ${showPulse ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
            </>
          )}
        </div>
      )}
      {badge && (
        <div className="px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-bold shrink-0 relative z-10">
          {badge}
        </div>
      )}
    </div>
  );
}

