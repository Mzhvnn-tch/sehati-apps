import { Shield, ArrowRight, Activity, Lock, Search, Zap, Hexagon, Fingerprint, Network } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, MouseEvent } from "react";
import { useDisconnect } from "wagmi";
import { clearWalletConnectStorage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CipherText } from "@/components/ui/cipher-text";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { ParticleNetwork } from "@/components/ui/particle-network";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// --- Components ---

function PremiumCard({
  children,
  onClick,
  title,
  icon: Icon,
  delay = 0
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  icon: any;
  delay?: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className="group relative diamond-card rounded-2xl overflow-hidden cursor-pointer h-full"
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      {/* Spotlight Effect - Cyan/Pink */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(6, 182, 212, 0.1),
              transparent 80%
            )
          `,
        }}
      />

      <div className="relative p-8 flex flex-col h-full z-10">
        <div className="w-12 h-12 rounded-xl bg-cyan-50/50 border border-cyan-100 flex items-center justify-center mb-6 group-hover:bg-cyan-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
          <Icon className="w-6 h-6 text-cyan-600" />
        </div>

        <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">
          <CipherText text={title} delay={0.5 + delay} />
        </h3>

        <div className="text-muted-foreground leading-relaxed flex-1 font-light">
          {children}
        </div>

        <div className="mt-8 flex items-center text-sm font-medium text-cyan-600/70 group-hover:text-cyan-600 transition-colors uppercase tracking-widest">
          Enter Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Page ---

export default function Landing() {
  const [, navigate] = useLocation();
  const { disconnect } = useDisconnect();

  // Clean session on mount
  useEffect(() => {
    const cleanup = async () => {
      try { await disconnect(); } catch (e) { }
      clearWalletConnectStorage();
    };
    cleanup();
  }, [disconnect]);

  const handlePortalSelect = (role: "patient" | "doctor") => {
    navigate(role === "patient" ? "/patient" : "/doctor");
  };

  return (
    // Global Diamond Gradient is inherited from body. No bg-color class here.
    <div className="min-h-screen relative selection:bg-cyan-100 selection:text-cyan-900 font-sans overflow-x-hidden text-foreground">

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

      {/* Navbar with Modals */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all duration-300 backdrop-blur-md border-b border-white/40 bg-white/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-8 h-8 flex items-center justify-center transition-transform group-hover:rotate-180 duration-700">
              <Hexagon className="w-full h-full text-cyan-600 fill-cyan-50" />
              <span className="absolute text-[10px] font-bold text-cyan-700 group-hover:opacity-0 transition-opacity">ID</span>
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-slate-800">
              SEHATI<span className="text-cyan-500 animate-pulse">.</span>
            </span>
          </div>

          <div className="hidden md:flex gap-8 text-sm font-medium tracking-wide text-slate-500 items-center">

            {/* Protocol Modal */}
            <Dialog>
              <DialogTrigger className="hover:text-cyan-600 transition-colors relative group">
                Protocol
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full" />
              </DialogTrigger>
              <DialogContent className="diamond-card text-foreground max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif text-cyan-700">The Sehati Protocol</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Sehati fundamentally reimagines medical data ownership. Unlike traditional systems where hospitals own your data, Sehati gives you full custody through cryptographic key pairs.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center py-4">
                    <div className="p-4 rounded-lg bg-white/50 border border-white/60 shadow-sm">
                      <Fingerprint className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                      <div className="text-xs font-bold uppercase text-slate-700">1. Sign</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/50 border border-white/60 shadow-sm">
                      <Lock className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                      <div className="text-xs font-bold uppercase text-slate-700">2. Encrypt</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/50 border border-white/60 shadow-sm">
                      <Network className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                      <div className="text-xs font-bold uppercase text-slate-700">3. Store</div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Encryption Modal */}
            <Dialog>
              <DialogTrigger className="hover:text-cyan-600 transition-colors relative group">
                Encryption
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full" />
              </DialogTrigger>
              <DialogContent className="diamond-card text-foreground max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif text-cyan-700">Zero-Knowledge Encryption</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4 font-light text-muted-foreground">
                  <p>Your data is encrypted <strong>client-side</strong> before it ever touches our servers. We use AES-256-GCM, the gold standard for secure data transmission.</p>
                  <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-cyan-700 border border-slate-100 shadow-inner">
                    AES-256-GCM(Data, DerivedKey, IV)
                  </div>
                  <p className="text-xs">
                    *Keys are derived deterministically from your wallet signature. Even Sehati developers cannot view your medical records.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Network Modal */}
            <Dialog>
              <DialogTrigger className="hover:text-cyan-600 transition-colors relative group">
                Network
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full" />
              </DialogTrigger>
              <DialogContent className="diamond-card text-foreground max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif text-cyan-700">Lisk Sepolia Network</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Network Status: Online
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">Block #482910</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Verification and Access Control logic is executed on the Lisk Sepolia testnet. This ensures immutability and transparency for every permission grant and revocation.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            variant="outline"
            className="hidden md:inline-flex border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 transition-colors cursor-pointer bg-white/50 backdrop-blur-sm shadow-sm"
            onClick={() => navigate("/docs")}
          >
            <Network className="w-4 h-4 mr-2" /> Documentation
          </Button>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">

          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-200/60 bg-white/60 text-cyan-700 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-[pulse_1.5s_infinite]" />
                <CipherText text="System Operational: Sepolia" />
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-serif font-medium text-slate-900 leading-[1.1]">
                Health Data <br />
                <span className="text-gradient-diamond font-bold italic">
                  <CipherText text="Sovereignty." delay={0.2} />
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-lg leading-relaxed font-light">
                The world's first decentralized medical identity protocol.
                End-to-end encrypted, patient-controlled, and verified on Lisk.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <MagneticButton
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 font-semibold px-8 h-12 text-base rounded-full shadow-[0_4px_14px_rgba(6,182,212,0.3)] border-none"
                  strength={0.3}
                  onClick={() => handlePortalSelect("patient")}
                >
                  Retrieve Records
                </MagneticButton>
                <MagneticButton
                  size="lg"
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 h-12 px-8 rounded-full bg-white/50 backdrop-blur-sm"
                  strength={0.2}
                  onClick={() => handlePortalSelect("doctor")}
                >
                  Provider Access
                </MagneticButton>
              </div>
            </motion.div>

            {/* Aesthetic Detail / 3D Abstract Representation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 1.2, type: "spring" }}
              className="relative hidden lg:block h-[500px]"
            >
              {/* Diamond Glow behind */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/30 to-purple-300/30 rounded-[2rem] blur-[80px] opacity-60" />

              <div className="relative w-full h-full diamond-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400/80 animate-pulse" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/80 animate-pulse delay-75" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400/80 animate-pulse delay-150" />
                    </div>
                    <div className="text-xs font-mono text-slate-400 tracking-widest">
                      <CipherText text="AES-256-GCM / LIVE" delay={1} />
                    </div>
                  </div>
                  <div className="space-y-3 font-mono text-sm text-slate-500">
                    <p className="flex items-center gap-2"><span className="text-cyan-500">&gt;</span> <CipherText text="Initializing secure handshake..." delay={1.5} /></p>
                    <p className="flex items-center gap-2"><span className="text-cyan-500">&gt;</span> <CipherText text="Verifying on-chain credentials..." delay={2.5} /></p>
                    <p className="flex items-center gap-2"><span className="text-cyan-500">&gt;</span> <CipherText text="Decrypting patient data..." delay={3.5} /></p>
                    <p className="text-emerald-600 font-bold flex items-center gap-2"><span className="text-emerald-500">&gt;</span> <CipherText text="Access Granted." delay={4.5} /></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                  <div className="bg-white/50 p-4 rounded-xl border border-slate-100 hover:bg-white/80 transition-colors shadow-sm">
                    <Shield className="w-8 h-8 text-cyan-500 mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Security</p>
                    <p className="text-slate-900 font-medium">Ultra High</p>
                  </div>
                  <div className="bg-white/50 p-4 rounded-xl border border-slate-100 hover:bg-white/80 transition-colors shadow-sm">
                    <Zap className="w-8 h-8 text-purple-500 mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Latency</p>
                    <p className="text-slate-900 font-medium">Real-time</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Features / Portals */}
          <div className="grid md:grid-cols-2 gap-8 mt-32">
            <PremiumCard
              title="Patient Portal"
              icon={Fingerprint}
              onClick={() => handlePortalSelect("patient")}
              delay={0.2}
            >
              Take full custody of your medical history. Share records instantly via QR codes, revoke access anytime, and audit every interaction on the blockchain.
            </PremiumCard>

            <PremiumCard
              title="Medical Provider"
              icon={Activity}
              onClick={() => handlePortalSelect("doctor")}
              delay={0.4}
            >
              Streamlined verification for doctors and clinics. Issue verifiable credentials and sync patient records securely without central database reliance.
            </PremiumCard>
          </div>

          {/* Footer Stats */}
          <div className="mt-32 pt-16 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Encryption", value: "AES-256" },
              { label: "Blockchain", value: "Lisk Sepolia" },
              { label: "Uptime", value: "99.9%" },
              { label: "Privacy", value: "Zero-Knowledge" },
            ].map((stat, i) => (
              <div key={i} className="text-center md:text-left group cursor-default">
                <div className="text-2xl font-serif font-bold text-slate-800 mb-1 group-hover:text-cyan-600 transition-colors duration-500">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
