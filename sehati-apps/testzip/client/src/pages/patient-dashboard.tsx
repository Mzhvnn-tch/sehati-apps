import Layout from "@/components/layout";
import { WalletConnect } from "@/components/wallet-connect";
import { HealthRecord } from "@/components/health-card";
import { QRShare } from "@/components/qr-share";
import { AuditLog } from "@/components/audit-log";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2, FileText, Activity, Blocks, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getPatientRecords, getAuditLogs, decryptRecord } from "@/lib/api";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not patient
  useEffect(() => {
    if (user && user.role !== "patient") {
      setLocation("/doctor");
    }
  }, [user, setLocation]);

  // Fetch medical records - always refetch to get latest data
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/records/patient", user?.id],
    enabled: !!user,
    queryFn: () => (user ? getPatientRecords(user.id) : Promise.reject()),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Fetch audit logs - always refetch to get latest data
  const { data: auditData } = useQuery({
    queryKey: ["/api/audit", user?.id],
    enabled: !!user,
    queryFn: () => (user ? getAuditLogs(user.id) : Promise.reject()),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome to SEHATI</h2>
          <p className="text-muted-foreground">Connect your wallet to continue</p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  const records = recordsData?.records || [];

  return (
    <Layout type="patient">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}</h2>
          <p className="text-muted-foreground">Manage your health identity and records.</p>
        </div>
        <WalletConnect />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="records" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/50 p-1 border border-white/60 rounded-xl h-12">
              <TabsTrigger value="records" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">My Records</TabsTrigger>
              <TabsTrigger value="share" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Share Access</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Recent Records
                </h3>
                <Button size="sm" variant="ghost" className="text-primary">Filter by Date</Button>
              </div>
              
              {recordsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading records...</div>
              ) : records.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100 p-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No medical records yet</p>
                  <p className="text-sm text-gray-400 mt-2">Records added by doctors will appear here</p>
                </div>
              ) : (
                records.map((record) => (
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
                    recordId={record.id}
                    encryptedContent={record.encryptedContent}
                    userId={user.id}
                    blockchainHash={record.blockchainHash || undefined}
                    ipfsHash={record.ipfsHash || undefined}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="share" className="flex justify-center py-8">
              <QRShare patientId={user.id} />
            </TabsContent>
            
            <TabsContent value="audit">
               <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                 <h3 className="font-semibold mb-4 text-gray-900">Activity Log</h3>
                 <AuditLog logs={auditData?.logs || []} />
               </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
            <div className="flex justify-between items-start mb-4">
              <Activity className="w-8 h-8 opacity-80" />
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                {user.bloodType || "Unknown"}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-white/70 text-sm">Medical Records</p>
              <p className="text-4xl font-bold">{records.length}<span className="text-lg opacity-60"> total</span></p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 flex justify-between text-sm">
              <span>Allergies</span>
              <span className="font-medium">{user.allergies?.join(", ") || "None"}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors"
                onClick={() => {
                  const shareTab = document.querySelector('[data-state="inactive"][value="share"]') as HTMLElement;
                  if (shareTab) shareTab.click();
                }}
              >
                <Share2 className="w-5 h-5" />
                <span className="text-xs text-center">Share Access<br/>(Generate QR)</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
                onClick={() => window.open('https://sepolia-blockscout.lisk.com', '_blank')}
              >
                <Blocks className="w-5 h-5" />
                <span className="text-xs text-center">View on<br/>Blockscout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}