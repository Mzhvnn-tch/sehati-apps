import { Shield, Stethoscope, ArrowRight, Lock, Activity, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AppKitButton } from "@reown/appkit/react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import logo from "/logo.png?url";
import { seedDatabase } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { PatientRegistration } from "@/components/patient-registration";
import { DoctorRegistration } from "@/components/doctor-registration";

export default function Landing() {
  const { toast } = useToast();
  const { loginWithExistingWallet } = useAuth();
  const [, navigate] = useLocation();
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  // Monitor AppKit account changes
  useEffect(() => {
    if (isConnected && address && selectedRole && !showRegistration && !isChecking) {
      setConnectedWallet(address);
      checkWalletExists(address);
    }
  }, [isConnected, address, selectedRole, showRegistration, isChecking]);

  const checkWalletExists = async (walletAddress: string) => {
    setIsChecking(true);
    try {
      console.log("Checking wallet:", walletAddress);
      const result = await loginWithExistingWallet(walletAddress, "0x");
      console.log("Wallet check result:", result);
      
      if (result.exists && result.userRole) {
        // Wallet already registered - redirect immediately
        toast({
          title: "Welcome back!",
          description: "Redirecting to your portal...",
        });
        setTimeout(() => {
          navigate(result.userRole === "patient" ? "/patient" : "/doctor");
        }, 1000);
      } else {
        // New wallet - show registration form
        setShowRegistration(true);
      }
    } catch (error: any) {
      console.error("Wallet check error:", error);
      // New wallet on error
      setShowRegistration(true);
    } finally {
      setIsChecking(false);
    }
  };

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
    setConnectedWallet(null);
    setShowRegistration(false);
    setIsChecking(false);
    setTimeout(() => open({ view: "Connect" }), 100);
  };

  const handleRegistrationSuccess = () => {
    if (selectedRole === "patient") {
      navigate("/patient");
    } else {
      navigate("/doctor");
    }
  };

  // Show loading while checking wallet
  if (selectedRole && isChecking && connectedWallet) {
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
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Connected Wallet</p>
              <p className="font-mono font-bold text-primary break-all">{connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}</p>
              
              <div className="flex flex-col items-center gap-2 pt-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Checking wallet status...</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show registration form when wallet connected but new
  if (showRegistration && connectedWallet && selectedRole) {
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
          className="relative z-10 max-w-xl mx-auto space-y-8"
        >
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="mb-6 p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Connected Wallet</p>
              <p className="font-mono font-bold text-primary break-all">{connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}</p>
            </div>

            {selectedRole === "patient" ? (
              <PatientRegistration 
                walletAddress={connectedWallet} 
                onSuccess={handleRegistrationSuccess}
              />
            ) : (
              <DoctorRegistration 
                walletAddress={connectedWallet} 
                onSuccess={handleRegistrationSuccess}
              />
            )}
          </div>

          <Button 
            variant="ghost" 
            onClick={() => {
              setShowRegistration(false);
              setConnectedWallet(null);
              setSelectedRole(null);
              setIsChecking(false);
            }}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            ← Cancel
          </Button>
        </motion.div>
      </div>
    );
  }

  // Show AppKit connection screen
  if (selectedRole && !connectedWallet) {
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

  // Show main landing page
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
