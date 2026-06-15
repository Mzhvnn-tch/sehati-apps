import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { QRScan } from "@/components/qr-scan";
import { HealthRecord } from "@/components/health-card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, LogOut, ShieldCheck, Hexagon, Search, Pill } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserByWallet } from "@/lib/api";
import { decryptData, importKey } from "@/lib/encryption";
import { useEthersSigner, getContract } from "@/lib/blockchain";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { clearWalletConnectStorage } from "@/lib/utils";
import type { User, MedicalRecord } from "@shared/schema";
import { WalletConnect } from "@/components/wallet-connect";
import { DoctorRegistration } from "@/components/doctor-registration"; // We'll reuse this UI but send role="pharmacist"
import { useAccount, useSwitchChain, useDisconnect } from "wagmi";

export default function PharmacistDashboard() {
  const { user, loginWithSignature, connectWithWalletSignature, isLoading: authLoading, disconnect: authDisconnect } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { address, isConnected, chainId } = useAccount();
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
    if (user && user.role !== "pharmacist") setLocation("/patient");
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
    toast({ title: "Registration Complete", description: "Welcome to Pharmacist Portal" });
    window.location.reload();
  };

  // --- RENDERING VIEWS ---

  // 1. Loading
  if (authLoading || (isConnected && !address && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-emerald-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  // 2. Connect Wallet View (Diamond Theme)
  if (!user && !showRegistration) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-100/40 via-white to-white" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="diamond-card max-w-md w-full p-10 rounded-3xl relative z-10 text-center border-t-4 border-t-emerald-400"
        >
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 text-emerald-600 border border-emerald-100 shadow-sm">
            <Pill className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Pharmacy Console</h1>
          <p className="text-slate-500 mb-8 font-medium">Verified Dispensary Access</p>
          <div className="flex justify-center mb-8 scale-110">
            <WalletConnect onRequireRegistration={() => setShowRegistration(true)} />
          </div>
          <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-600" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }



  if (showRegistration && address) {
    return (
      <DoctorRegistration 
        walletAddress={address}
        role="pharmacist"
        onSuccess={() => {
          toast({ title: "Registered", description: "Pharmacist account created. Awaiting admin verification." });
          window.location.reload();
        }}
        onDisconnect={handleDisconnect}
      />
    );
  }

  if (user && !user.isVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-serif font-bold text-slate-800 mb-4">Pending Verification</h1>
        <Button variant="outline" onClick={handleDisconnect}><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button>
      </div>
    );
  }

  if (!user) return null;

  return <PharmacistDashboardContent user={user} />;
}

// ----------------------------------------------------------------------
// DASHBOARD CONTENT
// ----------------------------------------------------------------------
function PharmacistDashboardContent({ user }: { user: User }) {
  const { toast } = useToast();
  const signer = useEthersSigner();
  const [activePatient, setActivePatient] = useState<{ id: string, name: string, token: string } | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const fulfillMutation = useMutation({
    mutationFn: async ({ recordId }: { recordId: string }) => {
      if (!signer) throw new Error("Wallet not connected");
      const contract = await getContract(signer);
      
      // Attempt on-chain fulfillment
      console.log("Fulfilling on-chain:", recordId);
      const tx = await contract.fulfillPrescription(recordId);
      await tx.wait();

      // Update backend DB
      const res = await fetch(`/api/records/${recordId}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockchainHash: tx.hash, token: activePatient?.token })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Prescription fulfilled on-chain." });
      if (activePatient) loadPrescriptions(activePatient.id, activePatient.token);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  const loadPrescriptions = async (patientId: string, accessToken: string) => {
    setLoadingRecords(true);
    try {
      // Get records via API
      const res = await fetch(`/api/records/prescriptions?patientId=${patientId}&token=${accessToken}`);
      if (!res.ok) throw new Error("Failed to load records");
      const { records } = await res.json();
      
      const decrypted = [];
      // Hack for pharmacist dashboard: skip decryption in UI if no token provided or it fails
      let tempKey: CryptoKey | null = null;
      try {
        tempKey = await importKey(accessToken, "private");
      } catch (e) {
        console.warn("Could not import token as private key for decryption", e);
      }

      for (const record of records) {
        try {
          const contentStr = tempKey ? await decryptData(record.encryptedContent, tempKey) : record.encryptedContent;
          decrypted.push({ ...record, parsedContent: JSON.parse(contentStr) });
        } catch (e) {
          console.warn("Failed to decrypt a prescription (might be a different key)", e);
          decrypted.push({ ...record, parsedContent: { note: "[Encrypted]" } });
        }
      }
      setPrescriptions(decrypted);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleScanSuccess = async (data: { patient: User, records: any[], token: string }) => {
    try {
      if (data.patient && data.token) {
        setActivePatient({ id: data.patient.id, name: data.patient.name, token: data.token });
        await loadPrescriptions(data.patient.id, data.token);
        toast({ title: "Access Granted", description: `Viewing prescriptions for ${data.patient.name}` });
      } else {
        throw new Error("Invalid QR code format");
      }
    } catch (e) {
      toast({ title: "Invalid QR Code", description: "Could not parse access grant.", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-slate-900 flex items-center gap-3">
              <Hexagon className="w-8 h-8 text-cyan-600" /> Pharmacy Portal
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Pharmacist: {user.name}</p>
          </div>
        </header>

        {!activePatient ? (
          <div className="diamond-card p-12 rounded-3xl text-center max-w-2xl mx-auto border border-cyan-100">
            <div className="w-20 h-20 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-cyan-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">Scan Patient Access</h2>
            <p className="text-slate-500 mb-8">Scan a patient's QR code to view their active prescriptions.</p>
            <div className="max-w-sm mx-auto overflow-hidden rounded-2xl shadow-inner border border-slate-200">
              <QRScan onScanSuccess={handleScanSuccess} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-cyan-50 border border-cyan-100 p-6 rounded-2xl">
              <div>
                <h2 className="text-xl font-bold text-cyan-900">Patient: {activePatient.name}</h2>
                <p className="text-cyan-700/70 text-sm font-mono mt-1">ID: {activePatient.id}</p>
              </div>
              <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-100" onClick={() => {
                setActivePatient(null);
                setPrescriptions([]);
              }}>
                Scan Another Patient
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {loadingRecords ? (
                <div className="col-span-2 py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>
              ) : prescriptions.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  No readable prescriptions found for this patient.
                </div>
              ) : (
                prescriptions.map((record) => (
                  <div key={record.id} className="relative">
                    <HealthRecord 
                      recordId={record.id} 
                      type={record.recordType as "lab_result" | "prescription" | "diagnosis"} 
                      title={record.title} 
                      date={new Date(record.createdAt).toLocaleDateString()} 
                      doctor="Licensed Doctor"
                      hospital={record.hospitalName}
                      content={JSON.stringify(record.parsedContent)} 
                      blockchainHash={record.blockchainHash || undefined}
                      ipfsHash={record.ipfsHash || undefined}
                    />
                    <div className="absolute top-6 right-6">
                      {record.isFulfilled ? (
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full border border-slate-200 uppercase tracking-widest">
                          Fulfilled
                        </span>
                      ) : (
                        <Button 
                          onClick={() => fulfillMutation.mutate({ recordId: record.id })}
                          disabled={fulfillMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          {fulfillMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Fulfill Prescription
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
