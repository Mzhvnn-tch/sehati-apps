import { ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useDisconnect } from "wagmi";
import { clearWalletConnectStorage } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, useScroll, useTransform } from "framer-motion";

function PortalLink({ title, desc, onClick, num, delay = 0, isDark = false }: { title: string, desc: string, onClick: () => void, num: string, delay?: number, isDark?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-50px" }}
      className={`group cursor-pointer border-b ${isDark ? 'border-[#1e293b] hover:border-white' : 'border-slate-200 hover:border-[#020617]'} py-12 md:py-16 transition-colors duration-500 flex flex-col md:flex-row md:items-center justify-between gap-8`}
      onClick={onClick}
    >
      <div className="flex items-start gap-8 md:w-1/2">
        <span className={`font-heading text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} font-medium mt-2`}>{num}</span>
        <div>
          <h3 className={`font-heading text-4xl md:text-5xl font-medium ${isDark ? 'text-white' : 'text-[#020617]'} group-hover:-tracking-[0.02em] transition-all duration-500 ease-out`}>{title}</h3>
        </div>
      </div>
      <div className="md:w-1/2 flex items-center justify-between">
        <p className={`text-lg md:text-xl font-light max-w-sm leading-relaxed ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-[#020617]'} transition-colors duration-500`}>{desc}</p>
        <div className={`w-14 h-14 rounded-full border ${isDark ? 'border-[#1e293b] group-hover:bg-white group-hover:border-white text-white group-hover:text-[#020617]' : 'border-slate-300 group-hover:bg-[#020617] group-hover:border-[#020617] text-[#020617] group-hover:text-white'} flex items-center justify-center transition-all duration-300 ease-out`}>
          <ArrowUpRight className="w-6 h-6 transform group-hover:translate-x-[2px] group-hover:-translate-y-[2px] transition-transform duration-300 ease-out" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { disconnect } = useDisconnect();
  
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  useEffect(() => {
    const cleanup = async () => {
      try { await disconnect(); } catch (e) { }
      clearWalletConnectStorage();
    };
    cleanup();
  }, [disconnect]);

  const velvetEasing = [0.22, 1, 0.36, 1];

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-[#020617] selection:text-white font-sans text-[#020617]">
      
      {/* Lightweight Architectural Grid Lines - NO BLUR, NO BLEND MODE */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, #020617 1px, transparent 1px), linear-gradient(to bottom, #020617 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Ultra Minimalist Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-8 md:px-12 py-6 bg-[#fafafa]/90 backdrop-blur-md border-b border-transparent transition-all duration-300">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div 
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/sehati.png" alt="AuraMed Logo" className="w-9 h-9 object-contain group-hover:opacity-80 transition-opacity duration-300" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#020617] mt-1.5">AuraMed</span>
          </div>

          <div className="hidden md:flex gap-12 text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
            <Dialog>
              <DialogTrigger className="hover:text-[#020617] transition-colors duration-300">Protocol</DialogTrigger>
              <DialogContent className="bg-[#fafafa] border-none shadow-2xl p-16 max-w-3xl rounded-none">
                <DialogHeader>
                  <DialogTitle className="font-heading text-5xl font-medium mb-6 tracking-tight text-[#020617]">Decentralized Trust.</DialogTitle>
                </DialogHeader>
                <div className="text-slate-600 font-light text-2xl leading-relaxed">
                  <p>AuraMed reimagines medical data ownership through advanced cryptographic key pairs. Your data, your absolute rules.</p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger className="hover:text-[#020617] transition-colors duration-300">Security</DialogTrigger>
              <DialogContent className="bg-[#fafafa] border-none shadow-2xl p-16 max-w-3xl rounded-none">
                <DialogHeader>
                  <DialogTitle className="font-heading text-5xl font-medium mb-6 tracking-tight text-[#020617]">Absolute Privacy.</DialogTitle>
                </DialogHeader>
                <div className="text-slate-600 font-light text-2xl leading-relaxed">
                  <p>Locked securely on your device before it ever reaches our servers. Unreadable by anyone—even us—without your explicit permission.</p>
                </div>
              </DialogContent>
            </Dialog>
            <button onClick={() => navigate("/docs")} className="hover:text-[#020617] transition-colors duration-300">Docs</button>
          </div>
        </div>
      </nav>

      {/* Stark Hero Section */}
      <main className="pt-28 md:pt-36 relative z-10">
        <div className="px-8 md:px-12 max-w-[1600px] mx-auto">
          <motion.div 
            style={{ y: yHero, opacity: opacityHero }}
            className="mb-32 md:mb-48"
          >

            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-[7.5rem] font-medium leading-[1.05] tracking-tighter text-[#020617] max-w-6xl">
              <motion.span 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: velvetEasing }}
                className="block"
              >
                Sovereign health data.
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: velvetEasing }}
                className="block text-slate-800"
              >
                Zero compromise.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: velvetEasing }}
              className="mt-10 text-xl md:text-2xl text-slate-800 font-medium max-w-3xl leading-relaxed"
            >
              The world's first decentralized medical identity protocol. End-to-end encrypted, patient-controlled, and verified on-chain.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5, ease: velvetEasing }}
              className="mt-12 flex flex-wrap items-center gap-8"
            >
              <button 
                onClick={() => document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })}
                className="group relative overflow-hidden bg-[#020617] text-white pl-8 pr-4 py-4 rounded-full font-medium tracking-widest uppercase text-sm flex items-center gap-8 shadow-[0_8px_30px_rgb(2,6,23,0.25)] transition-all duration-500 hover:shadow-[0_15px_40px_rgb(2,6,23,0.35)] hover:-translate-y-1"
              >
                <span className="relative z-10">Launch App</span>
                <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white text-white group-hover:text-[#020617] transition-all duration-500">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </button>
              <button 
                onClick={() => navigate("/docs")} 
                className="text-[#020617] font-semibold tracking-widest uppercase text-sm hover:text-slate-500 transition-colors px-4 py-4 relative group"
              >
                Read Documentation
                <span className="absolute left-0 bottom-2 w-full h-[1px] bg-[#020617] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
              </button>
            </motion.div>

          </motion.div>

          {/* Minimalist Typographic Features */}
          <div className="grid md:grid-cols-3 border-t border-slate-200">
            {[
              { title: "Absolute Privacy", desc: "Your health records are locked locally. Only you hold the key to decrypt them." },
              { title: "Tamper-Proof", desc: "Every interaction is securely verified and permanently recorded on-chain." },
              { title: "In Control", desc: "Grant and revoke access to your doctors instantly, at any time." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: i * 0.1, ease: velvetEasing }}
                viewport={{ once: true, margin: "-50px" }}
                className={`py-16 ${i !== 2 ? 'border-b md:border-b-0 md:border-r border-slate-200' : ''} ${i === 0 ? 'md:pr-16' : i === 1 ? 'md:px-16' : 'md:pl-16'}`}
              >
                <h4 className="font-heading text-3xl font-medium mb-6 tracking-tight text-[#020617]">{feature.title}</h4>
                <p className="text-slate-600 font-light text-xl leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Portals Section - Full Bleed Dark Navy Dior Block */}
        <div id="portals" className="mt-20 bg-[#020617] px-8 md:px-12 py-32 lg:py-40">
          <div className="max-w-[1600px] mx-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: velvetEasing }}
              viewport={{ once: true }}
              className="mb-16 border-b border-[#1e293b] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
            >
              <h2 className="font-heading text-6xl md:text-7xl font-medium tracking-tight text-white">Select Portal</h2>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-2">Access Network</span>
            </motion.div>
            
            <div className="relative z-10">
              <PortalLink 
                isDark={true}
                num="01"
                title="Patient"
                desc="Take custody of your history. Share records via secure QR codes."
                onClick={() => navigate("/patient")}
                delay={0}
              />
              <PortalLink 
                isDark={true}
                num="02"
                title="Medical Provider"
                desc="Streamlined verification. View records and add medical notes."
                onClick={() => navigate("/doctor")}
                delay={0.1}
              />
              <PortalLink 
                isDark={true}
                num="03"
                title="Pharmacy"
                desc="Fulfill prescriptions safely. Verify authenticity instantly."
                onClick={() => navigate("/pharmacist")}
                delay={0.2}
              />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
