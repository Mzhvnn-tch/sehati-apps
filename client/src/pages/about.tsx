import { ArrowUpRight, ArrowLeft, Fingerprint } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function About() {
  const [, navigate] = useLocation();
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  // Force scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const velvetEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-white selection:text-[#020617] font-sans text-white">
      
      {/* Lightweight Architectural Grid Lines - Dark Mode */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Ultra Minimalist Navbar - Dark Mode */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-8 md:px-12 py-6 bg-[#020617]/90 backdrop-blur-md border-b border-[#1e293b] transition-all duration-300">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-4 group"
          >
            <div className="w-8 h-8 rounded-full border border-slate-700 group-hover:bg-white group-hover:border-white text-white group-hover:text-[#020617] flex items-center justify-center transition-all duration-300 ease-out">
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-[2px] transition-transform duration-300 ease-out" />
            </div>
            <span className="text-[14px] uppercase tracking-[0.25em] font-bold text-white leading-none">Return</span>
          </button>

          <div className="hidden md:flex gap-12 text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
            <span>AuraMed / About</span>
          </div>
        </div>
      </nav>

      {/* 1. The Human-Centric Hero Section (Now Dark) */}
      <main className="pt-28 md:pt-40 relative z-10">
        <div className="px-8 md:px-12 max-w-[1600px] mx-auto">
          <motion.div 
            style={{ y: yHero, opacity: opacityHero }}
            className="mb-32 md:mb-48 border-b border-[#1e293b] pb-20"
          >
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 block mb-8">Our Manifesto</span>
            <h1 className="font-heading text-5xl md:text-7xl lg:text-[7.5rem] font-medium leading-[1.05] tracking-tighter text-white max-w-6xl">
              <motion.span 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: velvetEasing }}
                className="block"
              >
                Technology for
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: velvetEasing }}
                className="block text-slate-500"
              >
                the sovereign individual.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: velvetEasing }}
              className="mt-12 text-xl md:text-2xl text-slate-400 font-light max-w-3xl leading-relaxed"
            >
              We didn't build AuraMed to be another healthcare IT vendor. We built it because we fundamentally believe your medical data belongs to you—not the hospital, not the insurance company, and certainly not the highest bidder.
            </motion.p>
          </motion.div>

          {/* 2. The Narrative Journey / Origin Story (Now Dark) */}
          <div className="grid md:grid-cols-12 gap-16 md:gap-8 mb-32 md:mb-48">
            <div className="md:col-span-4">
              <h2 className="font-heading text-4xl font-medium tracking-tight text-white">The Catalyst</h2>
            </div>
            <div className="md:col-span-8 space-y-12">
              <p className="text-2xl md:text-3xl text-slate-300 font-light leading-relaxed">
                The modern medical system treats the patient as a data point in a fragmented, insecure web of legacy databases. Your most intimate history is scattered across systems you don't control.
              </p>
              <p className="text-xl md:text-2xl text-slate-500 font-light leading-relaxed">
                We saw firsthand how this fragmentation didn't just cause inefficiencies—it cost lives. Doctors couldn't access critical history in emergencies, and patients were locked out of their own records. We realized that solving this wasn't about building a better UI for a hospital; it was about tearing down the architecture of ownership and handing the keys back to the patient.
              </p>
            </div>
          </div>
        </div>

        {/* 3. The Trust & Credibility Stack (Now Light / fafafa) */}
        <div className="bg-[#fafafa] px-8 md:px-12 py-32 lg:py-40 text-[#020617] relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-slate-200 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1600px] mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: velvetEasing }}
              viewport={{ once: true }}
              className="mb-24 border-b border-slate-200 pb-12"
            >
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 block mb-6">The Architecture of Trust</span>
              <h2 className="font-heading text-5xl md:text-7xl font-medium tracking-tight text-[#020617] max-w-4xl">
                Cryptographic guarantees, not corporate promises.
              </h2>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-16 md:gap-8">
              {[
                { num: "01", title: "Zero Knowledge", desc: "Our servers cannot read your data. We utilize AES-256-GCM client-side encryption before anything leaves your device." },
                { num: "02", title: "Immutable Audit", desc: "Every time a doctor views your record, it requires your digital signature and is logged permanently on the blockchain." },
                { num: "03", title: "Absolute Custody", desc: "You are the sole custodian of your private keys. Revoke access to any provider instantly, with cryptographic certainty." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: i * 0.1, ease: velvetEasing }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="border-l border-slate-200 pl-8"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 block mb-4">{item.num}</span>
                  <h4 className="font-heading text-3xl font-medium mb-4 text-[#020617]">{item.title}</h4>
                  <p className="text-slate-600 font-light text-lg leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Team & Culture (Dark Mode again) */}
        <div className="bg-[#020617] px-8 md:px-12 py-32 lg:py-48 max-w-[1600px] mx-auto text-white">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 block mb-8">Who We Are</span>
              <h2 className="font-heading text-4xl md:text-6xl font-medium tracking-tight text-white mb-8">
                Built by a cryptography enthusiast.
              </h2>
              <p className="text-xl text-slate-400 font-light leading-relaxed mb-8">
                AuraMed was built out of a pure fascination with decentralized technology and a frustration with the current state of data privacy. As a cryptography observer, the goal wasn't to create just another healthcare app, but to prove that absolute privacy and local data ownership is possible. No corporate agenda, just mathematics.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#1e293b]">
                <div>
                  <div className="font-heading text-4xl font-medium text-white mb-2">100%</div>
                  <div className="text-sm font-mono uppercase tracking-widest text-slate-500">Patient Controlled</div>
                </div>
                <div>
                  <div className="font-heading text-4xl font-medium text-white mb-2">Zero</div>
                  <div className="text-sm font-mono uppercase tracking-widest text-slate-500">Data Monetization</div>
                </div>
              </div>
            </div>
            
            {/* Abstract representation: Digital Fingerprint Scanner */}
            <div className="relative aspect-square bg-[#0f172a] flex items-center justify-center overflow-hidden group rounded-2xl">
              <div className="absolute inset-0 border border-slate-800 scale-95 group-hover:scale-[0.98] transition-transform duration-700 ease-out rounded-2xl z-20 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-80 z-10 pointer-events-none" />
              
              {/* Biometric Fingerprint */}
              <Fingerprint className="w-48 h-48 md:w-64 md:h-64 text-slate-600 opacity-30 group-hover:opacity-60 transition-all duration-700 ease-out scale-95 group-hover:scale-100" strokeWidth={0.5} />
              
              {/* Scanning Laser */}
              <motion.div 
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                className="absolute left-0 w-full h-[1px] bg-slate-400/50 shadow-[0_0_20px_rgba(148,163,184,0.6)] z-10" 
              />

              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px] z-20 pointer-events-none">
                <span className="font-mono text-xs tracking-[0.3em] uppercase text-slate-400 mt-40 group-hover:text-white transition-colors duration-500">Absolute Privacy</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Clear Conversion Path (CTA) (Dark Mode) */}
        <div className="relative bg-[#020617] py-40 overflow-hidden">
          {/* Ambient Lighting / Spotlight effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-slate-800/30 rounded-[100%] blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 px-8 md:px-12 max-w-[1600px] mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: velvetEasing }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-[1px] bg-slate-800 mb-12" />
              <h2 className="font-heading text-5xl md:text-7xl font-medium tracking-tight text-white mb-6">
                Take back control.
              </h2>
              <p className="text-slate-400 font-mono text-sm tracking-[0.2em] uppercase mb-16">
                Because your medical history shouldn't be a corporate commodity.
              </p>
              
              <button 
                onClick={() => {
                  // 1. Buat layar transisi warna gelap
                  const overlay = document.createElement('div');
                  overlay.className = 'fixed inset-0 bg-[#020617] z-[100] opacity-0 transition-opacity duration-500 pointer-events-none';
                  document.body.appendChild(overlay);
                  
                  // 2. Layar menggelap (Fade out)
                  setTimeout(() => {
                    overlay.style.opacity = '1';
                  }, 10);

                  // 3. Setelah layar gelap total, pindah halaman dan atur posisi scroll diam-diam
                  setTimeout(() => {
                    navigate("/");
                    
                    setTimeout(() => {
                      const portalsEl = document.getElementById('portals');
                      if (portalsEl) {
                        // Menggunakan block: 'center' atau 'end' agar seluruh opsi (Patient, Doctor, Pharmacy) masuk frame
                        // dan batas bawahnya fokus di garis bawah apotek, bukan kebablasan ke background putih.
                        portalsEl.scrollIntoView({ block: 'center' });
                      }
                      
                      // 4. Layar kembali terang (Fade in) menampakkan blok Select Portal
                      overlay.style.opacity = '0';
                      setTimeout(() => {
                        overlay.remove();
                      }, 500);
                    }, 50);
                  }, 500);
                }}
                className="inline-flex group relative overflow-hidden bg-white text-[#020617] pl-8 pr-4 py-4 rounded-full font-medium tracking-widest uppercase text-sm items-center gap-8 shadow-[0_0_60px_rgba(255,255,255,0.1)] transition-all duration-700 hover:shadow-[0_0_80px_rgba(255,255,255,0.2)] hover:-translate-y-1"
              >
                <span className="relative z-10">Access Protocol</span>
                <div className="relative z-10 w-10 h-10 rounded-full bg-[#020617]/10 border border-[#020617]/20 flex items-center justify-center group-hover:bg-[#020617] text-[#020617] group-hover:text-white transition-all duration-500">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#020617]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Footer Link (Dark Mode) */}
        <footer className="bg-[#020617] border-t border-slate-800 py-12 px-8 md:px-12 text-center flex flex-col md:flex-row justify-center items-center max-w-[1600px] mx-auto">
          <p className="text-slate-500 font-mono text-xs tracking-wider">
            © {new Date().getFullYear()} AURAMED PROTOCOL. ALL RIGHTS RESERVED.
          </p>
        </footer>

      </main>
    </div>
  );
}
