import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowLeft, Book, Code, Shield, Network, Database, Lock, Server, Fingerprint, ChevronRight, Hash, Cpu, Key, UserCheck, Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

const CodeBlock = ({ title, code }: { title: string, code: string }) => (
  <div className="rounded-xl overflow-hidden border border-cyan-500/20 bg-[#090b10] my-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] group transition-all hover:border-cyan-500/40">
    <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-950/50 to-transparent border-b border-white/5">
      <div className="flex items-center gap-2">
        <Code className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-mono text-cyan-100">{title}</span>
      </div>
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
      </div>
    </div>
    <div className="p-4 overflow-x-auto">
      <pre className="text-[13px] font-mono leading-relaxed text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all duration-500 group">
    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
      <Icon className="w-6 h-6 text-cyan-400" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

const DOC_SECTIONS = [
  {
    id: "intro",
    title: "Introduction",
    icon: Book,
    content: (
      <div className="space-y-12">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            System Overview v2.0
          </div>
          <h1 className="text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-800 mb-6 leading-tight">
            The SEHATI Protocol
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
            A decentralized standard for self-sovereign medical identity. Patients cryptographically own their health records, while granting granular, time-based access to medical providers.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <FeatureCard 
              icon={Shield} 
              title="Patient Sovereignty" 
              desc="Records are encrypted locally using AES-256-GCM. The encryption keys are securely derived, meaning only the patient can decrypt or authorize sharing."
            />
            <FeatureCard 
              icon={Network} 
              title="Decentralized Trust" 
              desc="Access control and record hashes are verified on the Ethereum Sepolia network. Smart contracts eliminate central points of failure and prevent unauthorized modification."
            />
          </div>
        </FadeIn>
      </div>
    )
  },
  {
    id: "database",
    title: "Database Schema",
    icon: Database,
    content: (
      <div className="space-y-12">
        <FadeIn>
          <h2 className="text-4xl font-serif font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" /> PostgreSQL Schema
          </h2>
          <p className="text-slate-400 mt-4 text-lg">
            SEHATI relies on Drizzle ORM to map relational data while maintaining strict types. Sensitive data is stored encrypted.
          </p>
        </FadeIn>

        <div className="space-y-16">
          <FadeIn delay={0.1}>
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">1. Users Table</h3>
            <p className="text-slate-400 text-sm mb-4">Manages all actors in the ecosystem: Patients, Doctors, and Pharmacists.</p>
            <CodeBlock title="shared/schema.ts - Users" code={`export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role").notNull(), // "patient", "doctor", "pharmacist"
  encryptedPrivateKey: text("encrypted_private_key"), // Keystore
  isVerified: boolean("is_verified").default(false).notNull(),
  // ... demographics (age, gender, bloodType)
});`} />
          </FadeIn>

          <FadeIn delay={0.2}>
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">2. Medical Records</h3>
            <p className="text-slate-400 text-sm mb-4">Stores the encrypted blob of the record. The actual truth is verified against the <code>blockchainHash</code>.</p>
            <CodeBlock title="shared/schema.ts - Records" code={`export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey(),
  patientId: varchar("patient_id").references(() => users.id),
  recordType: text("record_type"), // "lab_result", "prescription"
  encryptedContent: text("encrypted_content").notNull(), // AES blob
  ipfsHash: text("ipfs_hash"),
  blockchainHash: text("blockchain_hash"), // Smart contract Tx
  isFulfilled: boolean("is_fulfilled").default(false), 
});`} />
          </FadeIn>
        </div>
      </div>
    )
  },
  {
    id: "contracts",
    title: "Smart Contracts",
    icon: Code,
    content: (
      <div className="space-y-12">
        <FadeIn>
          <h2 className="text-4xl font-serif font-bold text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-cyan-400" /> Blockchain Architecture
          </h2>
          <p className="text-slate-400 mt-4 text-lg">
            Deployed on Ethereum Sepolia. <code>SEHATIRegistry.sol</code> acts as the immutable source of truth for access control and record verification.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-cyan-500/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Role-Based Access Control (RBAC)
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
              <li className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-400 rounded-full" /> <code>DEFAULT_ADMIN_ROLE</code></li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-400 rounded-full" /> <code>PATIENT_ROLE</code></li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-400 rounded-full" /> <code>DOCTOR_ROLE</code></li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-400 rounded-full" /> <code>PHARMACIST_ROLE</code></li>
            </ul>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">Core Functions</h3>
          <CodeBlock title="SEHATIRegistry.sol - Interface" code={`interface ISehatiRegistry {
  // Medical Record Creation
  function createRecord(
      address _patient,
      string calldata _ipfsCID,
      bytes32 _contentHash,
      string calldata _recordType,
      bytes32 _accessToken
  ) external;

  // Temporary QR Code Access Grant
  function createAccessGrant(
      bytes32 _accessToken,
      uint256 _expiresAt
  ) external;

  // Pharmacy Anti-Double Spend
  function fulfillPrescription(bytes32 _recordId) external;
}`} />
        </FadeIn>
      </div>
    )
  },
  {
    id: "auth",
    title: "Auth & APIs",
    icon: Server,
    content: (
      <div className="space-y-12">
        <FadeIn>
          <h2 className="text-4xl font-serif font-bold text-white flex items-center gap-3">
            <Key className="w-8 h-8 text-cyan-400" /> Auth & API Flow
          </h2>
          <p className="text-slate-400 mt-4 text-lg">
            Authentication is handled entirely via cryptographic signatures, eliminating passwords.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="relative pl-8 border-l-2 border-cyan-500/30 space-y-8">
            <div className="relative">
              <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-[#0B0C10] border-2 border-cyan-400 flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1. Nonce Generation</h3>
              <p className="text-slate-400 text-sm">Client calls <code>/api/auth/generate-nonce</code>. Server returns a secure 32-byte hex nonce.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-[#0B0C10] border-2 border-cyan-400 flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">2. Wallet Signature</h3>
              <p className="text-slate-400 text-sm">User signs the message. Smart Accounts (ERC-4337) yield complex ABI-encoded signatures &gt; 132 bytes.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-[#0B0C10] border-2 border-cyan-400 flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">3. Validation Bypass</h3>
              <p className="text-slate-400 text-sm"><code>ethers.verifyMessage</code> handles standard EOA accounts. Signatures &gt; 132 bytes trigger our Smart Account handler to prevent login failures for AA wallets.</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2 mt-8">QR Code Unified Session</h3>
          <p className="text-slate-400 text-sm mb-4">
            The <code>/api/access/validate</code> endpoint acts as a Unified Session validator.
            The exact same QR code scanned by a doctor grants full access, but when scanned by a Pharmacist, the frontend automatically filters to fetch <b>only prescriptions</b> (<code>/api/records/prescriptions</code>).
          </p>
        </FadeIn>
      </div>
    )
  },
  {
    id: "security",
    title: "Security Measures",
    icon: Lock,
    content: (
      <div className="space-y-12">
        <FadeIn>
          <h2 className="text-4xl font-serif font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" /> Advanced Security
          </h2>
          <p className="text-slate-400 mt-4 text-lg">
            Data integrity and anti-spam architectures designed for clinical-grade reliability.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl">
              <Fingerprint className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">AES-256-GCM</h3>
              <p className="text-sm text-slate-400">All medical content is encrypted using AES-GCM before it ever leaves the client device. The backend database only stores indecipherable ciphertext.</p>
            </div>
            
            <div className="bg-white/[0.02] border border-red-500/20 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-bl-lg">PLANNED</div>
              <Activity className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">QR Anti-Spam (Max Uses)</h3>
              <p className="text-sm text-slate-400">To prevent infinite API reads during an active 60-minute session, a <code>maxUses</code> column will enforce a strict limit on scans (e.g. 3 scans max) before immediate revocation.</p>
            </div>
          </div>
        </FadeIn>
      </div>
    )
  }
];

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("intro");
  
  // Smooth scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="flex h-screen bg-[#05060A] text-white font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* Top Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 to-blue-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Futuristic Sidebar */}
      <div className="w-72 border-r border-white/5 bg-[#080B13]/90 backdrop-blur-2xl flex-shrink-0 flex flex-col z-20">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 text-cyan-400 font-bold hover:text-cyan-300 transition-colors group">
            <div className="p-2 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
              <ArrowLeft className="w-4 h-4" /> 
            </div>
            Exit Docs
          </Link>
        </div>
        
        <div className="px-8 pb-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Table of Contents</h2>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 pb-8">
            {DOC_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  // Scroll right panel to top on section change
                  document.getElementById("doc-content-area")?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeSection === section.id
                    ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <section.icon className={`w-4 h-4 ${activeSection === section.id ? "text-cyan-400" : "opacity-70"}`} />
                  {section.title}
                </div>
                {activeSection === section.id && (
                  <motion.div layoutId="active-pill" className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0A1224] via-[#05060A] to-[#05060A]">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNHYtNGgtMnY0aC00djJoNGY0aDJ2LTRoNHYtMmgtNHptMC0zMFYwaC0ydjRoLTR2Mmg0djRoMnYtNGg0VjRoLTR6bS0zMCAwVjBoLTJ2NGgtNHYyaDR2NGgydi00aDRWNGgtNHpNMzYgNjR2LTRoLTJ2NGgtNHYyaDR2NGgydi00aDR2LTJoLTR6bTE4LTMwdC00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0tMzAgMGgtNHYyaDR2NGgydi00aDR2LTJoLTR2LTRoLTJ2NHoiIGZpbGw9IiMzM2RjZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyIgLz48L2c+PC9zdmc+')] opacity-50 pointer-events-none" />
        
        <ScrollArea id="doc-content-area" className="flex-1 px-8 md:px-20 lg:px-32 py-20 relative z-10 scroll-smooth">
          <div className="max-w-4xl mx-auto pb-40">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "circOut" }}
              >
                {DOC_SECTIONS.find(s => s.id === activeSection)?.content}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
