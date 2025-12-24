import { Shield, Stethoscope, ArrowRight, Lock, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AppKitButton } from "@reown/appkit/react";
import logo from "../../public/logo.png";
import { seedDatabase } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAppKit } from "@reown/appkit/react";

export default function Landing() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(null);
  const { open } = useAppKit();

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDatabase();
      toast({
        title: "Database Seeded",
        description: `Created sample patient and ${result.records?.length || 0} medical records`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleGetStarted = (role: "patient" | "doctor") => {
    setSelectedRole(role);
    setTimeout(() => open(), 100);
  };

  if (selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-xl mx-auto space-y-8 text-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {selectedRole === "patient" ? "Patient Portal" : "Doctor Portal"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {selectedRole === "patient" 
                ? "Connect your wallet to access your medical records securely on-chain and manage your health identity."
                : "Connect your wallet to verify your on-chain identity and manage patient records."
              }
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <AppKitButton />
          </div>

          <Button 
            variant="ghost" 
            onClick={() => setSelectedRole(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Portal Selection
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-primary/20" />
          <span className="font-bold text-2xl text-primary tracking-tight">SEHATI</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" size="sm" onClick={handleSeedData} disabled={isSeeding}>
            {isSeeding ? "Seeding..." : "Seed Test Data"}
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 text-center mt-[-4rem]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary/20 shadow-sm mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Self-Sovereign Health Identity</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
            Your Health Data, <br/>
            <span className="text-gradient">Under Your Control.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Secure, portable, and encrypted medical records on the blockchain. 
            Share access with doctors instantly via QR, revoke anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mt-16 max-w-4xl w-full">
          <motion.button
            whileHover={{ y: -5 }}
            onClick={() => handleGetStarted("patient")}
            className="group cursor-pointer bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 text-left relative overflow-hidden hover:shadow-2xl transition-shadow"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Portal</h2>
              <p className="text-gray-500 mb-6">Manage your identity, view encrypted records, and share access via QR codes.</p>
              <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -5 }}
            onClick={() => handleGetStarted("doctor")}
            className="group cursor-pointer bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 text-left relative overflow-hidden hover:shadow-2xl transition-shadow"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Stethoscope className="w-32 h-32 text-cyan-500" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 text-cyan-600 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Portal</h2>
              <p className="text-gray-500 mb-6">Scan patient QRs, decrypt medical history, and issue new verifiable records.</p>
              <div className="flex items-center text-cyan-600 font-medium group-hover:translate-x-1 transition-transform">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </motion.button>
        </div>

        <div className="mt-20 flex gap-8 text-gray-400">
          <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> End-to-End Encrypted</div>
          <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Blockchain Verified</div>
        </div>
      </main>
    </div>
  );
}
