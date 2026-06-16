import Layout from "@/components/layout";
import { QRScan } from "@/components/qr-scan";
import { HealthRecord } from "@/components/health-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MedicalHistoryBlock } from "@/components/medical-history-block";
import { useState, useEffect } from "react";
import { Search, UserCheck, FilePlus, X, Blocks, ExternalLink, CheckCircle2, Loader2, Stethoscope, ArrowLeft, LogIn, UserCog, ScanLine, Activity, ShieldCheck, Microscope, LogOut, Lock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useMutation } from "@tanstack/react-query";
import { createMedicalRecord, getUserByWallet } from "@/lib/api";
import { encryptData, importKey } from "@/lib/encryption";
import { useEthersSigner, createRecordOnChain } from "@/lib/blockchain";
import { uploadToIPFS } from "@/lib/ipfs";
import { ethers } from "ethers";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { clearWalletConnectStorage } from "@/lib/utils";
import type { User, MedicalRecord } from "@shared/schema";
import { WalletConnect } from "@/components/wallet-connect";
import { DoctorRegistration } from "@/components/doctor-registration";
import { useAccount, useSwitchChain, useDisconnect } from "wagmi";
import { MagneticButton } from "@/components/ui/magnetic-button";

// ----------------------------------------------------------------------
// 2. MAIN COMPONENT (Diamond Theme)
// ----------------------------------------------------------------------
export default function DoctorDashboard() {
  const { user, loginWithSignature, isLoading: authLoading, disconnect: authDisconnect } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { chainId } = useAccount();
  const signer = useEthersSigner();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [showRegistration, setShowRegistration] = useState(false);

  // --- Auth Logic ---
  const handleDisconnect = async () => {
    try {
      await authDisconnect();
      if (isConnected) await disconnect();
    } catch (e) { console.error(e); }
    clearWalletConnectStorage();
    setShowRegistration(false);
    window.location.href = "/";
  };

  useEffect(() => {
    if (user && user.role !== "doctor") setLocation("/patient");
  }, [user, setLocation]);

  useEffect(() => {
    if (!isConnected) {
      setShowRegistration(false);
    } else {
      setTimeout(() => {
        const w3aModal = document.getElementById("w3a-modal");
        if (w3aModal) w3aModal.style.display = "none";
        const overlay = document.querySelector(".w3a-modal__overlay");
        if (overlay) (overlay as HTMLElement).style.display = "none";
      }, 500);
    }
  }, [isConnected]);

  useEffect(() => { if (!isConnected && user) handleDisconnect(); }, [isConnected, user]);

  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
    toast({ title: "Registration Complete", description: "Welcome to Doctor Portal" });
    window.location.reload();
  };

  // --- RENDERING VIEWS ---

  // 1. Loading
  if (authLoading || (isConnected && !address && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-cyan-600">
        <Loader2 className="w-10 h-10 animate-spin" />
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
               <Stethoscope className="w-6 h-6 text-[#020617]" />
             </div>
             <h1 className="font-heading text-6xl lg:text-[5rem] font-medium tracking-tighter leading-[1] mb-8">
               Clinical <br/><span className="text-slate-500">Console.</span>
             </h1>
             <p className="text-2xl text-slate-400 font-light max-w-md leading-relaxed">
               Authorized medical providers only. Access decentralized health infrastructure and patient telemetry.
             </p>
          </div>
          <div className="relative z-10 text-[10px] font-mono tracking-[0.3em] uppercase font-bold text-slate-600">
             Strictly Confidential & Encrypted
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
               <h2 className="font-heading text-4xl font-medium tracking-tight mb-4 text-[#020617]">Provider Login</h2>
               <p className="text-slate-500 text-lg font-light leading-relaxed">Log in safely to access patient records and clinical telemetry.</p>
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



  // 4. Registration
  if (showRegistration && address) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl diamond-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-serif text-slate-900 font-bold text-xl">New Provider Registration</h2>
            <Button variant="ghost" onClick={handleDisconnect} className="text-red-400 hover:bg-red-50">Abort</Button>
          </div>
          <div className="p-8">
            <DoctorRegistration
              walletAddress={address}
              onSuccess={handleRegistrationSuccess}
              onDisconnect={handleDisconnect}
              isWalletConnect={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // 5. Verification Gate
  if (user && !user.isVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white shadow-xl rounded-3xl max-w-md w-full p-8 border border-slate-100 relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6 text-amber-500 animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">Pending Verification</h1>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">
            Your credentials are under review by the hospital administration. You will be granted access once your medical license is verified.
          </p>

          <Button variant="outline" className="w-full text-slate-500 border-slate-200 hover:bg-slate-50 h-12 rounded-xl" onClick={handleDisconnect}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return <DoctorDashboardContent user={user} />;
}


// ----------------------------------------------------------------------
// 3. DOCTOR CONTENT (Diamond Theme - Tablet UI)
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 3. DOCTOR CONTENT (Diamond Theme - Tablet UI)
// ----------------------------------------------------------------------
function DoctorDashboardContent({ user }: { user: User }) {
  const { toast } = useToast();
  const { disconnect: authDisconnect } = useAuth();
  const signer = useEthersSigner();

  // Session State
  const [patientAccessed, setPatientAccessed] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<User | null>(null);
  const [patientRecords, setPatientRecords] = useState<(MedicalRecord & { decryptedContent: string })[]>([]);
  const [capturedToken, setCapturedToken] = useState<string | null>(null);
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [isClosingSession, setIsClosingSession] = useState(false);

  // Form State
  const [activeTab, setActiveTab] = useState<"doctor" | "triage">("doctor");
  const [recordType, setRecordType] = useState("diagnosis");

  // Doctor Fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [allergies, setAllergies] = useState("");
  const [prescription, setPrescription] = useState("");

  // Triage Fields
  const [vitals, setVitals] = useState({
    heartRate: "",
    bloodPressure: "",
    weight: "",
    temperature: "",
    sleep: "",
    bloodType: ""
  });

  // Animation State
  const [animState, setAnimState] = useState<"idle" | "encrypting" | "uploading" | "signing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);

  const [lastCreatedRecord, setLastCreatedRecord] = useState<{ txHash: string; recordId: string; title: string; } | null>(null);

  const createRecordMutation = useMutation({
    onMutate: () => { setAnimState("encrypting"); setProgress(10); },
    mutationFn: async (vars: { title: string; content: string; recordType: string }) => {
      if (!currentPatient || !user) throw new Error("No patient selected");
      if (!signer) throw new Error("Wallet not connected");

      // 1. Encrypt
      if (!currentPatient.publicKey) throw new Error("Patient keys missing");
      const patientPublicKey = await importKey(currentPatient.publicKey, "public");
      setProgress(30); await new Promise(r => setTimeout(r, 500));

      const encryptedPayload = await encryptData(vars.content, patientPublicKey);
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(encryptedPayload));

      // 2. IPFS
      setAnimState("uploading"); setProgress(50);
      let ipfsCid = "ipfs-fallback-cid";
      try { ipfsCid = await uploadToIPFS(encryptedPayload); } catch (e) { console.error(e); }

      // 3. Blockchain
      setAnimState("signing"); setProgress(75);
      const effectiveToken = capturedToken || localStorage.getItem("doctor_captured_token") || "";
      if (!effectiveToken) throw new Error("Missing access token");

      let txHash = "";
      try {
          const tx = await createRecordOnChain(signer, currentPatient.walletAddress, ipfsCid, contentHash, vars.recordType, effectiveToken);
          txHash = tx.hash;
          // We intentionally do NOT await tx.wait() to prevent RPC rate-limit (429 Too Many Requests) and CORS errors 
          // from the free public RPC endpoint when polling for the transaction receipt.
      } catch (e: any) {
          console.error("Blockchain error:", e);
          const errMsg = e.reason || e.message || "Unknown error";
          if (errMsg.includes("AccessControl")) {
              throw new Error("Not authorized! Ask Admin to approve your Doctor account.");
          }
          if (errMsg.toLowerCase().includes("insufficient funds") || e.code === "INSUFFICIENT_FUNDS") {
              throw new Error("Insufficient Testnet ETH to publish record. Please fund your wallet or ask Admin.");
          }
          throw new Error("Blockchain transaction failed: " + errMsg);
      }

      // 4. DB
      return createMedicalRecord({
        patientId: currentPatient.id,
        doctorId: user.id,
        hospitalName: "AuraMed Medical Center",
        recordType: vars.recordType,
        title: vars.title,
        content: encryptedPayload,
        blockchainHash: txHash,
        ipfsHash: ipfsCid,
        token: effectiveToken
      } as any);
    },
    onSuccess: (data, vars) => {
      setProgress(100); setAnimState("success");
      setTimeout(() => {
        setAnimState("idle"); setProgress(0);
        // Reset Forms
        setTitle(""); setContent(""); setAllergies(""); setPrescription("");
        setVitals({ heartRate: "", bloodPressure: "", weight: "", temperature: "", sleep: "", bloodType: "" });

        if (data.record.blockchainHash) {
          setLastCreatedRecord({ txHash: data.record.blockchainHash, recordId: data.record.id, title: vars.title });
        }
        setPatientRecords((prev) => [{ ...data.record, decryptedContent: vars.content }, ...prev]);
      }, 2000);
    },
    onError: (error) => {
      setAnimState("error"); toast({ title: "Failed", description: error.message, variant: "destructive" });
      setTimeout(() => setAnimState("idle"), 3000);
    }
  });

  const handleScanSuccess = (data: { patient: User; records: any[]; token: string }) => {
    setCurrentPatient(data.patient);
    setPatientRecords(data.records);
    setCapturedToken(data.token);
    setIsDecrypting(true);
    setPatientAccessed(true);
    localStorage.setItem("doctor_active_patient", JSON.stringify(data.patient));
    localStorage.setItem("doctor_captured_token", data.token);

    let ticks = 0;
    const interval = setInterval(() => {
        ticks++;
        if (ticks >= 6) { // 6 * 400ms = 2400ms
            clearInterval(interval);
            setTimeout(() => setIsDecrypting(false), 200);
        }
    }, 400);
  };

  const handleManualTokenSubmit = async () => {
    if (!manualTokenInput) return;

    // Parse token if it's a URL or contains parameters
    let tokenToValidate = manualTokenInput.trim();
    if (tokenToValidate.includes("token=")) {
      const parts = tokenToValidate.split("?");
      const queryPart = parts.length > 1 ? parts[1] : tokenToValidate;
      const urlParams = new URLSearchParams(queryPart);
      tokenToValidate = urlParams.get("token") || tokenToValidate;
    }

    try {
      const { validateQRToken } = await import("@/lib/api");
      const data = await validateQRToken(tokenToValidate, user.id);
      handleScanSuccess({ patient: data.patient, records: data.records, token: tokenToValidate });
      toast({ title: "Access Granted", description: `Connected to ${data.patient.name}` });
      setManualTokenInput(""); // Clear input on success
    } catch (e) {
      toast({ title: "Invalid Token", description: "Could not fetch patient data. Check format or expiration.", variant: "destructive" });
    }
  }

  const closeSession = () => {
    setIsClosingSession(true);
    let ticks = 0;
    const interval = setInterval(() => {
        ticks++;
        if (ticks >= 5) { // 5 * 400ms = 2000ms
            clearInterval(interval);
            setPatientAccessed(false); setCurrentPatient(null); setPatientRecords([]); setCapturedToken(null); setIsDecrypting(false); setIsClosingSession(false);
            localStorage.removeItem("doctor_active_patient");
            localStorage.removeItem("doctor_captured_token");
        }
    }, 400);
  };

  useEffect(() => {
    const savedPatient = localStorage.getItem("doctor_active_patient");
    const savedToken = localStorage.getItem("doctor_captured_token");
    if (savedPatient && savedToken && user) {
      try {
        const p = JSON.parse(savedPatient);
        setCurrentPatient(p); setCapturedToken(savedToken); setPatientAccessed(true);
        import("@/lib/api").then(({ validateQRToken }) => {
          validateQRToken(savedToken, user.id).then(d => setPatientRecords(d.records)).catch(() => { });
        });
      } catch (e) { console.error(e); }
    }
  }, [user]);

  // Submit Logic
  const handleSubmit = () => {
    // [REF] Unified Record Construction
    // Merge Vitals and Clinical data into one payload
    const unifiedPayload = {
      title: title || "Clinical Visit",
      diagnosis: content,
      prescription: prescription || "None",
      allergies: allergies || "None",
      vitals: vitals // Include vitals object directly
    };

    createRecordMutation.mutate({
      title: title || "Clinical Visit",
      content: JSON.stringify(unifiedPayload),
      recordType: recordType
    });
  }

  return (
    <div className="w-full h-screen bg-[#fafafa] text-[#020617] font-sans flex flex-col overflow-hidden selection:bg-[#020617] selection:text-white">
      {/* SUCCESS MODAL (Brutalist) */}
      <AnimatePresence>
        {
          lastCreatedRecord && (
            <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border-4 border-[#020617] max-w-md w-full p-8 shadow-[16px_16px_0px_0px_rgba(203,213,225,1)]">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#020617] text-white flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-heading text-3xl font-medium text-[#020617] uppercase tracking-tight mb-2">Record Immutable</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-bold">Successfully written to Ethereum Sepolia.</p>
                </div>
                <div className="bg-[#fafafa] border-2 border-[#020617] p-4 mb-8 font-mono text-xs">
                  <div className="flex justify-between items-center"><span className="text-slate-400 font-bold tracking-widest">TX HASH</span> <span className="text-[#020617] truncate max-w-[150px] font-bold">{lastCreatedRecord.txHash}</span></div>
                </div>
                <Button onClick={() => setLastCreatedRecord(null)} className="w-full bg-[#020617] hover:bg-[#020617]/90 text-white font-mono uppercase tracking-[0.2em] font-bold h-14 rounded-none">Acknowledge</Button>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence>

      {/* TOP NAVIGATION TAPE (Matches Patient Dashboard) */}
      <header className="h-16 border-b border-[#020617] flex items-center justify-between px-8 shrink-0 bg-[#fafafa] relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#020617] text-white flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-heading text-xl tracking-tighter">AURAMED</span>
        </div>
        <div className="flex items-center gap-12 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
          <button className="border-b border-[#020617] pb-1">Clinical Station</button>
          <button className="opacity-50 hover:opacity-100">Patient Lookup</button>
          <button className="opacity-50 hover:opacity-100">Appointments</button>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={authDisconnect} className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:text-slate-400">Sign Out</button>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="flex-1 flex overflow-hidden bg-[#fafafa]">
         {!patientAccessed ? (
            // ==========================================
            // STANDBY MODE: QR SCAN & DOCTOR DETAILS
            // ==========================================
            <>
                {/* LEFT COLUMN: PROVIDER DETAILS */}
                <motion.div className="hidden lg:flex w-[30%] shrink-0 border-r border-[#020617] flex-col relative bg-[#fafafa] z-20">
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
                  
                  <div className="p-12 pb-0 relative z-10 flex-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-8">Provider Details</span>
                    <h1 className="font-heading text-4xl xl:text-5xl font-medium tracking-tighter leading-[0.9] mb-8">
                      Dr. {user.name.split(' ')[0]}<br/>
                      <span className="text-slate-400">Station.</span>
                    </h1>
                    
                    <div className="space-y-6 mt-12">
                      <div className="border-l-2 border-[#020617] pl-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1">Institution</p>
                        <p className="font-mono text-sm font-bold uppercase">Sehati Medical Center</p>
                      </div>
                      <div className="border-l-2 border-[#020617] pl-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1">On-Chain ID</p>
                        <p className="font-mono text-xs font-bold">{user.walletAddress.slice(0, 10)}...</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-[#020617] p-8 relative z-10 shrink-0 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block">Manual Override</span>
                      <Button variant="outline" className="text-[10px] font-mono tracking-widest uppercase font-bold h-8 rounded-none border-2 border-[#020617] hover:bg-[#020617] hover:text-white transition-colors" onClick={() => setManualTokenInput(manualTokenInput ? "" : " ")}>
                        {manualTokenInput ? "Cancel" : "Input"}
                      </Button>
                    </div>
                    {manualTokenInput !== "" && (
                       <div className="flex gap-2">
                         <Input 
                           value={manualTokenInput} 
                           onChange={e => setManualTokenInput(e.target.value)} 
                           onKeyDown={e => {
                             if (e.key === 'Enter' && manualTokenInput.trim()) {
                               handleManualTokenSubmit();
                             }
                           }}
                           placeholder="Enter Token..." 
                           className="border-2 border-[#020617] rounded-none h-10 font-mono text-xs focus-visible:ring-0" 
                         />
                         <Button onClick={handleManualTokenSubmit} disabled={!manualTokenInput.trim()} className="bg-[#020617] hover:bg-black text-white rounded-none h-10 px-4"><Search className="w-4 h-4" /></Button>
                       </div>
                    )}
                  </div>
                </motion.div>

                {/* RIGHT COLUMN: SCANNER */}
                <motion.div className="flex-1 flex flex-col bg-white relative overflow-hidden z-10">
                  <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                     className="h-full flex flex-col items-center justify-center p-8 text-center"
                  >
                     <div className="w-[360px] h-[360px] xl:w-[480px] xl:h-[480px] bg-white border-4 border-[#020617] shadow-[16px_16px_0px_0px_rgba(203,213,225,1)] flex items-center justify-center mb-12 p-2 relative z-10">
                       <QRScan onScanSuccess={handleScanSuccess} doctorId={user.id} />
                     </div>
                     <h3 className="font-heading text-4xl xl:text-5xl font-medium text-[#020617] uppercase tracking-tight mb-4 relative z-10">Awaiting Target</h3>
                     <p className="font-mono text-xs tracking-widest text-slate-500 max-w-md mx-auto uppercase font-bold relative z-10">Scan dynamic QR token generated by the patient's encrypted vault.</p>
                  </motion.div>
                </motion.div>
            </>
         ) : (
            // ==========================================
            // ACTIVE SESSION MODE: PREMIUM CLINICAL EHR
            // ==========================================
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full h-full bg-[#fafafa] relative">
               
               {/* OVERLAY DECRYPTING */}
               <AnimatePresence>
                 {isDecrypting && (
                    <motion.div 
                        initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }} transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center text-white overflow-hidden"
                    >
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                        
                        {/* Scanning Line */}
                        <motion.div 
                            initial={{ top: "-10%" }} 
                            animate={{ top: "110%" }} 
                            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                            className="absolute left-0 right-0 h-[2px] bg-white opacity-50 shadow-[0_0_20px_5px_rgba(255,255,255,0.5)] pointer-events-none" 
                        />

                        {/* Main Branding */}
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div
                                initial={{ letterSpacing: "1em", opacity: 0 }}
                                animate={{ letterSpacing: "0.2em", opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="font-heading text-5xl md:text-7xl xl:text-8xl font-bold uppercase mb-4"
                            >
                                AURAMED
                            </motion.div>
                            
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: "100%" }} 
                                transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                                className="h-1 bg-white mb-6" 
                            />

                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="font-mono text-xs md:text-sm uppercase tracking-[0.4em] text-slate-400 font-bold mb-16"
                            >
                                CLINICAL OS v9.2.4
                            </motion.div>

                            {/* Decoding Text Animation */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-white/80 flex items-center gap-4 border border-slate-800 bg-black/50 px-6 py-3"
                            >
                                <span className="w-2 h-2 bg-white animate-pulse" />
                                <motion.span
                                    key="decrypt-log"
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse", repeatDelay: 0.1 }}
                                >
                                    ESTABLISHING SECURE HANDSHAKE...
                                </motion.span>
                            </motion.div>
                        </div>
                    </motion.div>
                 )}
               </AnimatePresence>

               {/* OVERLAY CLOSING SESSION */}
               <AnimatePresence>
                 {isClosingSession && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center text-white overflow-hidden"
                    >
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="w-24 h-24 mb-8 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700"
                            >
                                <Lock className="w-10 h-10 text-white" />
                            </motion.div>

                            <h2 className="font-heading text-4xl font-medium uppercase tracking-tight mb-4">Sealing Vault</h2>
                            
                            <motion.div 
                                initial={{ width: "100%" }} 
                                animate={{ width: 0 }} 
                                transition={{ duration: 1.5, ease: "linear" }}
                                className="h-1 bg-white mb-8" 
                            />

                            <motion.div 
                                className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-slate-400 font-bold flex items-center gap-3 border border-slate-800 bg-black/50 px-6 py-3"
                            >
                                <span className="w-2 h-2 bg-red-500 animate-pulse" />
                                TERMINATING SECURE CONNECTION...
                            </motion.div>
                        </div>
                    </motion.div>
                 )}
               </AnimatePresence>

               {/* PREMIUM PATIENT HEADER */}
               <div className="bg-white border-b-2 border-[#020617] px-8 py-6 shrink-0 relative z-20 flex justify-between items-center shadow-[0_4px_0_0_rgba(2,6,23,0.05)]">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-[#020617] flex items-center justify-center text-white">
                        <UserCheck className="w-8 h-8" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-heading font-medium text-[#020617] uppercase tracking-tight leading-none">{currentPatient?.name}</h2>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                     <div className="flex gap-6">
                         <div className="text-right">
                             <span className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Age</span>
                             <span className="font-mono text-lg font-bold text-[#020617]">{currentPatient?.age || '--'}</span>
                         </div>
                         <div className="text-right">
                             <span className="block font-mono text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Blood Type</span>
                             <span className="font-mono text-lg font-bold text-[#020617]">{currentPatient?.bloodType || '--'}</span>
                         </div>
                     </div>
                     <div className="h-10 w-px bg-slate-200"></div>
                     <Button variant="outline" className="border-2 border-[#020617] bg-transparent text-[#020617] hover:bg-[#020617] hover:text-white font-mono uppercase tracking-[0.2em] text-[10px] font-bold rounded-none h-12 transition-all" onClick={closeSession}>
                       <LogOut className="w-4 h-4 mr-2" /> End Consultation
                     </Button>
                  </div>
               </div>

               {/* MAIN ENTRY & HISTORY SPLIT */}
               <div className="flex-1 flex overflow-hidden">
                  
                  {/* LEFT: CLINICAL DATA ENTRY (60%) */}
                  <div className="w-3/5 h-full overflow-y-auto p-8 border-r-2 border-[#020617] bg-white relative">
                     {animState === 'idle' ? (
                     <div className="max-w-2xl mx-auto space-y-8 pb-12">
                        <div className="mb-6 border-b-2 border-[#020617] pb-4">
                           <h3 className="font-heading text-2xl text-[#020617] uppercase tracking-tight">Clinical Telemetry Entry</h3>
                           <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Append new records to patient history</p>
                        </div>

                        {/* Narrative Section */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-[#020617] text-white flex items-center justify-center"><FilePlus className="w-3 h-3" /></div>
                                <span className="font-mono text-[12px] font-bold uppercase tracking-widest text-[#020617]">Clinical Narrative</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Record Category</Label>
                                    <select value={recordType} onChange={e => setRecordType(e.target.value)} className="w-full bg-[#fafafa] border border-slate-300 rounded-none p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#020617] focus:border-[#020617] uppercase text-[#020617] font-bold">
                                        <option value="diagnosis">Primary Diagnosis</option>
                                        <option value="prescription">Prescription / Referral</option>
                                        <option value="procedure">Surgical / Procedure Notes</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Diagnosis / Title</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. UPPER RESPIRATORY INFECTION" className="bg-[#fafafa] border border-slate-300 rounded-none h-[42px] font-serif text-sm focus-visible:ring-1 focus-visible:ring-[#020617] text-[#020617]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Clinical Observations</Label>
                                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Enter detailed objective and subjective findings..." className="min-h-[100px] bg-[#fafafa] border border-slate-300 rounded-none font-serif text-sm focus-visible:ring-1 focus-visible:ring-[#020617] text-[#020617] p-4" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Treatment Plan / Rx</Label>
                                    <Textarea value={prescription} onChange={e => setPrescription(e.target.value)} placeholder="Medication, dosage..." className="min-h-[60px] bg-[#fafafa] border border-slate-300 rounded-none font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#020617] text-[#020617] p-3" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Allergies / Alerts</Label>
                                    <Textarea value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. PENICILLIN" className="min-h-[60px] bg-slate-100 border border-slate-300 rounded-none font-mono text-xs focus-visible:ring-1 focus-visible:ring-slate-500 text-slate-800 uppercase font-bold p-3" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-t-2 border-dashed border-slate-200 my-8" />

                        {/* Vitals Section */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-[#020617] text-white flex items-center justify-center"><Activity className="w-3 h-3" /></div>
                                <span className="font-mono text-[12px] font-bold uppercase tracking-widest text-[#020617]">Vital Signs</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Heart Rate</Label>
                                    <div className="relative"><Input value={vitals.heartRate} onChange={e => setVitals({ ...vitals, heartRate: e.target.value })} placeholder="72" className="bg-[#fafafa] border border-slate-300 rounded-none h-12 font-mono text-lg font-bold text-[#020617] pr-10 focus-visible:ring-1 focus-visible:ring-[#020617]" /><span className="absolute right-3 top-3.5 font-mono text-[9px] tracking-widest text-slate-400 font-bold uppercase">bpm</span></div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Blood Press.</Label>
                                    <div className="relative"><Input value={vitals.bloodPressure} onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })} placeholder="120/80" className="bg-[#fafafa] border border-slate-300 rounded-none h-12 font-mono text-lg font-bold text-[#020617] pr-12 focus-visible:ring-1 focus-visible:ring-[#020617]" /><span className="absolute right-3 top-3.5 font-mono text-[9px] tracking-widest text-slate-400 font-bold uppercase">mmHg</span></div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Weight</Label>
                                    <div className="relative"><Input value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} placeholder="80" className="bg-[#fafafa] border border-slate-300 rounded-none h-12 font-mono text-lg font-bold text-[#020617] pr-8 focus-visible:ring-1 focus-visible:ring-[#020617]" /><span className="absolute right-3 top-3.5 font-mono text-[9px] tracking-widest text-slate-400 font-bold uppercase">kg</span></div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Temp.</Label>
                                    <div className="relative"><Input value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} placeholder="36.5" className="bg-[#fafafa] border border-slate-300 rounded-none h-12 font-mono text-lg font-bold text-[#020617] pr-8 focus-visible:ring-1 focus-visible:ring-[#020617]" /><span className="absolute right-3 top-3.5 font-mono text-[9px] tracking-widest text-slate-400 font-bold uppercase">°C</span></div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Sleep</Label>
                                    <div className="relative"><Input value={vitals.sleep} onChange={e => setVitals({ ...vitals, sleep: e.target.value })} placeholder="8" className="bg-[#fafafa] border border-slate-300 rounded-none h-12 font-mono text-lg font-bold text-[#020617] pr-8 focus-visible:ring-1 focus-visible:ring-[#020617]" /><span className="absolute right-3 top-3.5 font-mono text-[9px] tracking-widest text-slate-400 font-bold uppercase">hrs</span></div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">Blood Type</Label>
                                    <div><Input value={vitals.bloodType} onChange={e => setVitals({ ...vitals, bloodType: e.target.value })} placeholder="O+" className="bg-[#fafafa] border border-slate-300 rounded-none h-12 font-mono text-lg font-bold text-[#020617] focus-visible:ring-1 focus-visible:ring-[#020617] uppercase" /></div>
                                </div>
                            </div>
                        </div>

                        <Button
                          className="w-full bg-[#020617] hover:bg-black text-white font-mono text-[10px] uppercase tracking-[0.2em] font-bold h-16 rounded-none disabled:opacity-50 transition-all border-2 border-[#020617] mt-8 shadow-[8px_8px_0px_0px_rgba(2,6,23,0.15)]"
                          onClick={handleSubmit}
                          disabled={!title || !content || !vitals.heartRate || !vitals.bloodPressure || !vitals.weight || !vitals.temperature}
                        >
                          <span className="flex items-center justify-center gap-3 w-full">
                             <Lock className="w-4 h-4" /> Finalize Medical Record
                          </span>
                        </Button>
                     </div>
                     ) : (
                      <div className="flex flex-col items-center justify-center py-32 text-center h-full">
                        <div className="relative w-32 h-32 mb-10 mx-auto">
                          <div className="absolute inset-0 border-4 border-[#020617]/10" />
                          <div className="absolute inset-0 border-4 border-[#020617] border-t-transparent animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center font-heading text-3xl text-[#020617]">{progress}%</div>
                        </div>
                        <h4 className="font-heading text-3xl font-medium text-[#020617] uppercase tracking-tight mb-3">Saving Clinical Record</h4>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-bold">{animState === 'encrypting' ? 'Securing Data Integrity...' : animState === 'uploading' ? 'Publishing Clinical Record...' : 'Saving to Patient History...'}</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: HISTORY ARCHIVE (40%) */}
                  <div className="w-2/5 h-full overflow-y-auto bg-[#fafafa] p-8">
                      <div className="flex justify-between items-center mb-6 border-b-2 border-[#020617] pb-3">
                         <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#020617]">History Archive</span>
                         <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white bg-[#020617] px-2 py-0.5">{patientRecords.length} Records</span>
                      </div>
                      <div className="grid gap-6">
                         {patientRecords.map(r => (
                           <MedicalHistoryBlock key={r.id} record={r} />
                         ))}
                         {patientRecords.length === 0 && (
                            <div className="border border-dashed border-[#020617] bg-white p-12 text-center">
                                <Activity className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                                <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-slate-500">No previous records</span>
                            </div>
                         )}
                      </div>
                  </div>
               </div>
            </motion.div>
         )}
      </main>
    </div>
  );
}