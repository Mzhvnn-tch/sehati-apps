import Layout from "@/components/layout";
import { QRScan } from "@/components/qr-scan";
import { HealthRecord } from "@/components/health-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MedicalHistoryBlock } from "@/components/medical-history-block";
import { useState, useEffect } from "react";
import { Search, UserCheck, FilePlus, X, Blocks, ExternalLink, CheckCircle2, Loader2, Stethoscope, ArrowLeft, LogIn, UserCog, ScanLine, Activity, ShieldCheck, Microscope } from "lucide-react";
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
import { useAppKitAccount, useDisconnect, AppKitButton } from "@reown/appkit/react";
import { DoctorRegistration } from "@/components/doctor-registration";
import { useAccount, useSwitchChain } from "wagmi";
import { MagneticButton } from "@/components/ui/magnetic-button";

// ----------------------------------------------------------------------
// 2. MAIN COMPONENT (Diamond Theme)
// ----------------------------------------------------------------------
export default function DoctorDashboard() {
  const { user, loginWithSignature, isLoading: authLoading, disconnect: authDisconnect } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAccount();
  const signer = useEthersSigner();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [isChecking, setIsChecking] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Auth Logic ---
  const handleDisconnect = async () => {
    try {
      await authDisconnect();
      if (isConnected) await disconnect();
    } catch (e) { console.error(e); }
    clearWalletConnectStorage();
    setShowRegistration(false);
    setLoginRequired(false);
    window.location.href = "/";
  };

  useEffect(() => {
    if (user && user.role !== "doctor") setLocation("/patient");
  }, [user, setLocation]);

  useEffect(() => {
    const checkWallet = async () => {
      if (user) return;
      if (isConnected && address && !isChecking && !showRegistration && !loginRequired) {
        setIsChecking(true);
        try {
          const { user: existingUser } = await getUserByWallet(address);
          if (existingUser && existingUser.role === "doctor") setLoginRequired(true);
        } catch (error: any) {
          if (error.status === 404 || error.message?.includes("User not found")) setShowRegistration(true);
        } finally { setIsChecking(false); }
      }
    };
    checkWallet();
  }, [isConnected, address, user]);

  useEffect(() => {
    if (!isConnected) {
      setShowRegistration(false);
      setLoginRequired(false);
      setIsChecking(false);
    }
  }, [isConnected]);

  useEffect(() => { if (!isConnected && user) handleDisconnect(); }, [isConnected, user]);

  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
    toast({ title: "Registration Complete", description: "Welcome to Doctor Portal" });
    window.location.reload();
  };

  const handleLogin = async () => {
    if (Number(chainId) !== 4202) {
      toast({ title: "Wrong Network", description: "Switching to Lisk Sepolia...", duration: 3000 });
      try { switchChain({ chainId: 4202 }); } catch (e) { }
      return;
    }
    if (!signer || !address) return;
    setIsLoggingIn(true);
    try {
      const message = `Login to SEHATI Doctor Portal\nWallet: ${address}\nTimestamp: ${Date.now()}`;
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
      <div className="min-h-screen flex items-center justify-center bg-white text-cyan-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  // 2. Connect Wallet View (Diamond Theme)
  if (!isConnected && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-100/40 via-white to-white" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="diamond-card max-w-md w-full p-10 rounded-3xl relative z-10 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-cyan-50 flex items-center justify-center mx-auto mb-6 text-cyan-600 border border-cyan-100 shadow-sm">
            <Stethoscope className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Doctor Console</h1>
          <p className="text-slate-500 mb-8 font-medium">Licensed Access Only</p>
          <div className="flex justify-center mb-8 scale-110">
            <AppKitButton />
          </div>
          <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-600" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // 3. Signature Login
  if (loginRequired && address) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="diamond-card max-w-md w-full p-10 rounded-3xl relative z-10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-6 text-purple-600 animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">Identify Verification</h1>
          <p className="text-slate-500 mb-8">Sign to prove ownership of this node.</p>

          <MagneticButton className="w-full bg-slate-900 text-white font-bold h-12 mb-4 hover:bg-slate-800" onClick={handleLogin} disabled={isLoggingIn}>
            {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Credentials"}
          </MagneticButton>

          <Button variant="ghost" className="text-slate-400" onClick={handleDisconnect}>Cancel</Button>
        </motion.div>
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
  const signer = useEthersSigner();

  // Session State
  const [patientAccessed, setPatientAccessed] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<User | null>(null);
  const [patientRecords, setPatientRecords] = useState<(MedicalRecord & { decryptedContent: string })[]>([]);
  const [capturedToken, setCapturedToken] = useState<string | null>(null);
  const [manualTokenInput, setManualTokenInput] = useState("");

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

      const tx = await createRecordOnChain(signer, currentPatient.walletAddress, ipfsCid, contentHash, vars.recordType, effectiveToken);

      // 4. DB
      return createMedicalRecord({
        patientId: currentPatient.id,
        doctorId: user.id,
        hospitalName: "Sehati Medical Center",
        recordType: vars.recordType,
        title: vars.title,
        content: encryptedPayload,
        blockchainHash: tx.hash,
        ipfsHash: ipfsCid
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
    setPatientAccessed(true);
    localStorage.setItem("doctor_active_patient", JSON.stringify(data.patient));
    localStorage.setItem("doctor_captured_token", data.token);
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
    setPatientAccessed(false); setCurrentPatient(null); setPatientRecords([]); setCapturedToken(null);
    localStorage.removeItem("doctor_active_patient");
    localStorage.removeItem("doctor_captured_token");
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
    <Layout type="doctor">
      {/* SUCCESS MODAL (Diamond) */}
      <AnimatePresence>
        {
          lastCreatedRecord && (
            <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="diamond-card max-w-md w-full p-8 rounded-3xl shadow-xl">
                <div className="text-center mb-6">
                  <CheckCircle2 className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-serif font-bold text-slate-800">Record Immutable</h3>
                  <p className="text-slate-500">Successfully written to Lisk Sepolia.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 font-mono text-xs">
                  <div className="flex justify-between mb-1"><span className="text-slate-400">TX</span> <span className="text-cyan-600 truncate max-w-[150px]">{lastCreatedRecord.txHash}</span></div>
                </div>
                <Button onClick={() => setLastCreatedRecord(null)} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-12 rounded-xl">Dismiss</Button>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Clinical Station</h1>
          <p className="text-slate-500 font-medium">Dr. {user.name} <span className="mx-2 text-slate-300">|</span> ID: {user.walletAddress.slice(0, 6)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-600 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ONLINE
          </div>
          <Button variant="outline" className="text-xs h-8 ml-2" onClick={() => setManualTokenInput(manualTokenInput ? "" : " ")}>
            {manualTokenInput ? "Cancel Input" : "Manual Input"}
          </Button>
          <AppKitButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
        {/* LEFT: Tablet/Scanner View */}
        <div className="lg:col-span-8 space-y-6">
          {!patientAccessed ? (
            <div className="h-[500px] diamond-card rounded-3xl flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-slate-200">

              {manualTokenInput !== "" ? (
                <div className="w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95">
                  <h3 className="text-xl font-bold text-slate-800">Manual Access</h3>
                  <p className="text-slate-400 text-sm">Paste the temporary access token generated by the patient.</p>
                  <Textarea
                    placeholder="Paste token here..."
                    className="min-h-[100px] bg-slate-50 font-mono text-xs"
                    value={manualTokenInput}
                    onChange={e => setManualTokenInput(e.target.value)}
                  />
                  <Button onClick={handleManualTokenSubmit} className="w-full" disabled={!manualTokenInput.trim()}>Access Patient Data</Button>
                  <Button variant="ghost" className="w-full text-slate-400" onClick={() => setManualTokenInput("")}>Back to Scanner</Button>
                </div>
              ) : (
                <>
                  <div className="w-64 h-64 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <QRScan onScanSuccess={handleScanSuccess} doctorId={user.id} />
                    {/* Stylized Frame */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Waiting for Patient Token...</h3>
                  <p className="text-slate-400 max-w-xs mx-auto mt-2">Scan the dynamic QR code generated by the patient's secure app.</p>
                  <Button variant="link" className="text-slate-400 mt-4 text-xs" onClick={() => setManualTokenInput(" ")}>Can't scan? Enter manually</Button>
                </>
              )}

            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Patient Holographic Card */}
              <div className="diamond-card rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Activity className="w-40 h-40 text-cyan-600" />
                </div>
                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-50 border border-cyan-100 shadow-inner flex items-center justify-center text-3xl font-bold text-cyan-700">
                    {currentPatient?.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-serif font-bold text-slate-900">{currentPatient?.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentPatient?.age && <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">AGE: {currentPatient?.age}</span>}
                      {currentPatient?.bloodType && <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">BLOOD: {currentPatient?.bloodType}</span>}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-500" /> Verified Identity</div>
                      <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-pink-500" /> No Critical Alerts</div>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-red-400 hover:bg-red-50" onClick={closeSession}>End Session</Button>
                </div>
              </div>

              {/* Records Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-bold text-slate-700">Medical History</h3>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{patientRecords.length} Records</span>
                </div>
                <div className="grid gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {patientRecords.map(r => (
                    <MedicalHistoryBlock key={r.id} record={r} />
                  ))}
                  {patientRecords.length === 0 && <p className="text-center text-slate-400 py-8 italic">No previous history available.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Input Form */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <div className="diamond-card rounded-3xl p-6 bg-white/80 backdrop-blur-xl">
              {animState === 'idle' ? (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <FilePlus className="w-5 h-5 text-purple-500" /> New Entry
                    </h3>
                  </div>

                  {/* Mode Toggles */}
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                      onClick={() => setActiveTab('doctor')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'doctor' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Clinical
                    </button>
                    <button
                      onClick={() => setActiveTab('triage')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'triage' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Nurse Triage
                    </button>
                  </div>

                  {activeTab === 'doctor' ? (
                    // DOCTOR FORM
                    <div className="space-y-4 animate-in slide-in-from-right-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Record Type</Label>
                        <select value={recordType} onChange={e => setRecordType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-100 text-slate-700">
                          <option value="diagnosis">Diagnosis</option>
                          <option value="referral">Referral</option>
                          <option value="surgery">Surgery</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Title</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual Checkup" className="bg-slate-50 border-slate-200 text-slate-700" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Clinical Notes & Diagnosis</Label>
                        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Observation details..." className="min-h-[100px] bg-slate-50 border-slate-200 text-slate-700" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Prescription (Optional)</Label>
                        <Textarea value={prescription} onChange={e => setPrescription(e.target.value)} placeholder="Medication..." className="min-h-[60px] bg-slate-50 border-slate-200 text-slate-700" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Allergies (Optional)</Label>
                        <Input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. Penicillin" className="bg-slate-50 border-slate-200 text-slate-700" />
                      </div>
                    </div>
                  ) : (
                    // NURSE TRIAGE FORM
                    <div className="space-y-4 animate-in slide-in-from-left-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Heart Rate</Label>
                          <div className="relative"><Input value={vitals.heartRate} onChange={e => setVitals({ ...vitals, heartRate: e.target.value })} placeholder="72" className="bg-slate-50" /><span className="absolute right-3 top-2.5 text-xs text-slate-400">bpm</span></div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Blood Pres.</Label>
                          <div className="relative"><Input value={vitals.bloodPressure} onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })} placeholder="120/80" className="bg-slate-50" /><span className="absolute right-3 top-2.5 text-xs text-slate-400">mmHg</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Weight</Label>
                          <div className="relative"><Input value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} placeholder="kg" className="bg-slate-50" /><span className="absolute right-3 top-2.5 text-xs text-slate-400">kg</span></div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Temp.</Label>
                          <div className="relative"><Input value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} placeholder="36.5" className="bg-slate-50" /><span className="absolute right-3 top-2.5 text-xs text-slate-400">°C</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Sleep</Label>
                          <div className="relative"><Input value={vitals.sleep} onChange={e => setVitals({ ...vitals, sleep: e.target.value })} placeholder="8" className="bg-slate-50" /><span className="absolute right-3 top-2.5 text-xs text-slate-400">hrs</span></div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Blood Type</Label>
                          <Input value={vitals.bloodType} onChange={e => setVitals({ ...vitals, bloodType: e.target.value })} placeholder="O+" className="bg-slate-50" />
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs text-blue-700">
                        <Activity className="w-4 h-4 inline mr-1" /> This will be saved as a secure <strong>VITALS</strong> record.
                      </div>
                    </div>
                  )}

                  <MagneticButton
                    className="w-full bg-slate-900 text-white font-bold h-12 shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 mt-4"
                    onClick={handleSubmit}
                    // require BOTH Clinical Data (Title, Diagnosis) AND Vitals (HR, BP, Weight, Temp)
                    disabled={
                      !patientAccessed ||
                      !title ||
                      !content ||
                      !vitals.heartRate ||
                      !vitals.bloodPressure ||
                      !vitals.weight ||
                      !vitals.temperature
                    }
                  >
                    Sign & Submit Unified Record
                  </MagneticButton>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative w-32 h-32 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-slate-700">{progress}%</div>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Processing Secure Record</h4>
                  <p className="text-sm text-slate-400">{animState === 'encrypting' ? 'Encrypting with Patient Key...' : animState === 'uploading' ? 'Hashing to IPFS...' : 'Minting on Lisk Sepolia...'}</p>
                </div>
              )
              }
            </div >
          </div >
        </div >
      </div >
    </Layout >
  );
}