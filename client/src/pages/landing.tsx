import { ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useDisconnect } from "wagmi";
import { clearWalletConnectStorage } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function PortalLink({ title, desc, onClick, num }: { title: string, desc: string, onClick: () => void, num: string }) {
  return (
    <div 
      className="group cursor-pointer border-b border-slate-200 py-10 md:py-16 hover:border-slate-900 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8"
      onClick={onClick}
    >
      <div className="flex items-start gap-8 md:w-1/2">
        <span className="font-heading text-sm text-slate-400 font-medium mt-2">{num}</span>
        <div>
          <h3 className="font-heading text-4xl md:text-5xl font-medium text-slate-900 group-hover:tracking-tight transition-all duration-500">{title}</h3>
        </div>
      </div>
      <div className="md:w-1/2 flex items-center justify-between">
        <p className="text-slate-500 text-lg md:text-xl font-light max-w-sm leading-relaxed">{desc}</p>
        <div className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
          <ArrowUpRight className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const cleanup = async () => {
      try { await disconnect(); } catch (e) { }
      clearWalletConnectStorage();
    };
    cleanup();
  }, [disconnect]);

  return (
    <div className="min-h-screen bg-white selection:bg-slate-900 selection:text-white font-sans text-slate-900">
      {/* Ultra Minimalist Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 md:px-12 py-8 bg-white/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div 
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/sehati.png" alt="AuraMed Logo" className="w-10 h-10 object-contain group-hover:opacity-80 transition-opacity" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-slate-900 mt-2">AuraMed</span>
          </div>

          <div className="hidden md:flex gap-12 text-xs uppercase tracking-[0.2em] font-bold text-slate-400">
            <Dialog>
              <DialogTrigger className="hover:text-slate-900 transition-colors">Protocol</DialogTrigger>
              <DialogContent className="bg-white border-none shadow-2xl p-16 max-w-3xl rounded-none">
                <DialogHeader>
                  <DialogTitle className="font-heading text-5xl font-medium mb-6 tracking-tight">Decentralized Trust.</DialogTitle>
                </DialogHeader>
                <div className="text-slate-500 font-light text-2xl leading-relaxed">
                  <p>AuraMed reimagines medical data ownership through advanced cryptographic key pairs. Your data, your absolute rules.</p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger className="hover:text-slate-900 transition-colors">Security</DialogTrigger>
              <DialogContent className="bg-white border-none shadow-2xl p-16 max-w-3xl rounded-none">
                <DialogHeader>
                  <DialogTitle className="font-heading text-5xl font-medium mb-6 tracking-tight">Absolute Privacy.</DialogTitle>
                </DialogHeader>
                <div className="text-slate-500 font-light text-2xl leading-relaxed">
                  <p>Locked securely on your device before it ever reaches our servers. Unreadable by anyone—even us—without your explicit permission.</p>
                </div>
              </DialogContent>
            </Dialog>
            <button onClick={() => navigate("/docs")} className="hover:text-slate-900 transition-colors">Docs</button>
          </div>
        </div>
      </nav>

      {/* Stark Hero Section */}
      <main className="pt-32 md:pt-40 px-8 md:px-12 max-w-[1600px] mx-auto">
        <div className="mb-40 md:mb-56">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-2 h-2 bg-emerald-500"></div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Live on Sepolia Network</span>
          </div>
          <h1 className="font-heading text-6xl md:text-8xl lg:text-[8.5rem] font-medium leading-[0.9] tracking-tighter text-slate-900 max-w-6xl">
            Sovereign health data. <br />
            <span className="text-slate-300">Zero compromise.</span>
          </h1>
        </div>

        {/* Minimalist Typographic Features (No ugly boxes or tables) */}
        <div className="grid md:grid-cols-3 border-t border-slate-200">
          <div className="border-b md:border-b-0 md:border-r border-slate-200 py-16 md:pr-16">
            <h4 className="font-heading text-3xl font-medium mb-6 tracking-tight">Absolute Privacy</h4>
            <p className="text-slate-500 font-light text-xl leading-relaxed">Your health records are locked locally. Only you hold the key to decrypt them.</p>
          </div>
          <div className="border-b md:border-b-0 md:border-r border-slate-200 py-16 md:px-16">
            <h4 className="font-heading text-3xl font-medium mb-6 tracking-tight">Tamper-Proof</h4>
            <p className="text-slate-500 font-light text-xl leading-relaxed">Every interaction is securely verified and permanently recorded on-chain.</p>
          </div>
          <div className="py-16 md:pl-16">
            <h4 className="font-heading text-3xl font-medium mb-6 tracking-tight">In Control</h4>
            <p className="text-slate-500 font-light text-xl leading-relaxed">Grant and revoke access to your doctors instantly, at any time.</p>
          </div>
        </div>

        {/* Portals Section */}
        <div className="mt-40 mb-48">
          <div className="mb-16 border-b border-slate-900 pb-8 flex justify-between items-end">
            <h2 className="font-heading text-6xl font-medium tracking-tight">Select Portal</h2>
            <span className="hidden md:block text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">Access Network</span>
          </div>
          
          <div>
            <PortalLink 
              num="01"
              title="Patient"
              desc="Take custody of your history. Share records via secure QR codes."
              onClick={() => navigate("/patient")}
            />
            <PortalLink 
              num="02"
              title="Medical Provider"
              desc="Streamlined verification. View records and add medical notes."
              onClick={() => navigate("/doctor")}
            />
            <PortalLink 
              num="03"
              title="Pharmacy"
              desc="Fulfill prescriptions safely. Verify authenticity instantly."
              onClick={() => navigate("/pharmacist")}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
