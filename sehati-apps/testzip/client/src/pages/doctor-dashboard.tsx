import Layout from "@/components/layout";
import { WalletConnect } from "@/components/wallet-connect";
import { QRScan } from "@/components/qr-scan";
import { HealthRecord } from "@/components/health-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Search, UserCheck, FilePlus, X, Blocks, ExternalLink, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useMutation } from "@tanstack/react-query";
import { createMedicalRecord } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { User, MedicalRecord } from "@shared/schema";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [patientAccessed, setPatientAccessed] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<User | null>(null);
  const [patientRecords, setPatientRecords] = useState<(MedicalRecord & { decryptedContent: string })[]>([]);

  // Form state for new record
  const [recordType, setRecordType] = useState("diagnosis");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // Blockchain confirmation state
  const [showBlockchainConfirm, setShowBlockchainConfirm] = useState(false);
  const [lastCreatedRecord, setLastCreatedRecord] = useState<{
    txHash: string;
    recordId: string;
    title: string;
  } | null>(null);

  // Redirect if not doctor
  useEffect(() => {
    if (user && user.role !== "doctor") {
      setLocation("/patient");
    }
  }, [user, setLocation]);

  const createRecordMutation = useMutation({
    mutationFn: () => {
      if (!currentPatient || !user) throw new Error("Missing data");
      return createMedicalRecord({
        patientId: currentPatient.id,
        doctorId: user.id,
        hospitalName: "Current Hospital", // In real app, get from doctor profile
        recordType,
        title,
        content,
      });
    },
    onSuccess: (data) => {
      // Show blockchain confirmation only if we have real blockchain hash
      if (data.record.blockchainHash) {
        toast({
          title: "Record Saved to Blockchain",
          description: "Medical record has been encrypted and saved on-chain.",
        });
        setLastCreatedRecord({
          txHash: data.record.blockchainHash,
          recordId: data.record.id,
          title: title,
        });
        setShowBlockchainConfirm(true);
      } else {
        toast({
          title: "Record Saved (Simulation Mode)",
          description: "Record saved locally. Deploy smart contract to enable on-chain storage.",
        });
      }
      // Add to local records
      setPatientRecords((prev) => [
        {
          ...data.record,
          decryptedContent: content,
        },
        ...prev,
      ]);
      // Reset form
      setTitle("");
      setContent("");
      setRecordType("diagnosis");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScanSuccess = (data: {
    patient: User;
    records: (MedicalRecord & { decryptedContent: string })[];
  }) => {
    setCurrentPatient(data.patient);
    setPatientRecords(data.records);
    setPatientAccessed(true);
  };

  const closeSession = () => {
    setPatientAccessed(false);
    setCurrentPatient(null);
    setPatientRecords([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Doctor Portal</h2>
          <p className="text-muted-foreground">Connect your wallet to continue</p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <Layout type="doctor">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Doctor Console</h2>
          <p className="text-muted-foreground">Scan patient QR to decrypt and view records.</p>
        </div>
        <WalletConnect />
      </div>

      {/* Blockchain Confirmation Modal */}
      {showBlockchainConfirm && lastCreatedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Record Saved to Blockchain</h3>
              <p className="text-sm text-gray-600 mb-6">
                "{lastCreatedRecord.title}" has been encrypted and permanently recorded.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Blocks className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-700">Blockchain Proof</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Hash:</span>
                  <span className="font-mono text-gray-700 text-xs">
                    {lastCreatedRecord.txHash.substring(0, 10)}...{lastCreatedRecord.txHash.substring(lastCreatedRecord.txHash.length - 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network:</span>
                  <span className="text-gray-700">Lisk Sepolia Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600 font-medium">Confirmed</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`https://sepolia-blockscout.lisk.com/tx/${lastCreatedRecord.txHash}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Verify on Blockscout
              </Button>
              <Button
                className="flex-1"
                onClick={() => setShowBlockchainConfirm(false)}
              >
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {!patientAccessed ? (
        <div className="max-w-xl mx-auto mt-12 space-y-8 text-center">
           <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
             <h3 className="text-lg font-semibold mb-6">Scan Patient Access Token</h3>
             <QRScan onScanSuccess={handleScanSuccess} doctorId={user.id} />
             <p className="mt-4 text-xs text-gray-500">
               Patient must generate a QR code from their app to grant you temporary access.
             </p>
           </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Patient Context Header */}
          <div className="bg-white rounded-xl border border-green-100 p-6 shadow-sm flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-400">
                {currentPatient?.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">{currentPatient?.name}</h3>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Verified Access
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-mono">
                  ID: {currentPatient?.walletAddress ? currentPatient.walletAddress.substring(0, 12) + "..." : "N/A"}
                </p>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>Age: <b className="text-gray-900">{currentPatient?.age || "N/A"}</b></span>
                  <span>Blood: <b className="text-gray-900">{currentPatient?.bloodType || "N/A"}</b></span>
                  <span>Allergies: <b className="text-red-600">{currentPatient?.allergies?.join(", ") || "None"}</b></span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={closeSession}>Close Session</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Records List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-900">Decrypted Medical History</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search records..." className="pl-9 h-9" />
                </div>
              </div>

              {patientRecords.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100 p-8">
                  <p className="text-muted-foreground">No medical records found for this patient.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientRecords.map((record) => (
                    <HealthRecord
                      key={record.id}
                      type={record.recordType as any}
                      title={record.title}
                      date={new Date(record.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      doctor={`Doctor ID: ${record.doctorId.substring(0, 8)}...`}
                      hospital={record.hospitalName}
                      isEncrypted={false}
                      content={record.decryptedContent}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Add Record Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <FilePlus className="w-5 h-5" />
                  <h3 className="font-bold">Add New Record</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Record Type</Label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="diagnosis">Diagnosis</option>
                      <option value="prescription">Prescription</option>
                      <option value="lab_result">Lab Result</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Title / Summary</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Viral Infection Diagnosis"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Clinical Notes</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Detailed findings..."
                      className="h-32"
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => createRecordMutation.mutate()}
                      disabled={!title.trim() || !content.trim() || createRecordMutation.isPending}
                    >
                      {createRecordMutation.isPending ? "Encrypting..." : "Encrypt & Sign Record"}
                    </Button>
                    <p className="text-[10px] text-center text-gray-400 mt-2">
                      This action will sign the data with your private key and upload the encrypted hash to the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </Layout>
  );
}