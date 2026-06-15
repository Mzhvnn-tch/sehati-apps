import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const CodeBlock = ({ title, code }: { title: string, code: string }) => (
  <div className="bg-[#0a1128] border border-slate-800 my-12">
    <div className="px-6 py-4 border-b border-slate-800 bg-[#020617]">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">{title}</span>
    </div>
    <div className="p-8 overflow-x-auto">
      <pre className="text-[13px] font-mono leading-relaxed text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  </div>
);

const FeatureCard = ({ title, desc }: { title: string, desc: string }) => (
  <div className="p-10 border border-slate-800 bg-[#020617] hover:bg-[#0a1128] transition-colors duration-500">
    <h3 className="font-heading text-3xl font-medium text-white mb-4">{title}</h3>
    <p className="text-slate-400 text-lg leading-relaxed">{desc}</p>
  </div>
);

const DOC_SECTIONS = [
  {
    id: "intro",
    title: "Introduction",
    content: (
      <div className="space-y-16">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500 block mb-6">System Overview 2.0</span>
          <h1 className="font-heading text-6xl md:text-[5rem] font-medium tracking-tighter leading-[1] text-white mb-8">
            The SEHATI <br/>
            <span className="text-slate-500">Protocol.</span>
          </h1>
          <p className="text-2xl text-slate-400 font-light leading-relaxed max-w-3xl">
            A stark, decentralized standard for self-sovereign medical identity. Patients cryptographically own their health records, while granting granular, time-based access to medical providers.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="grid md:grid-cols-2 gap-px bg-slate-800 border border-slate-800">
            <FeatureCard 
              title="Patient Sovereignty" 
              desc="Records are encrypted locally using AES-256-GCM. The encryption keys are securely derived, meaning only the patient can decrypt or authorize sharing."
            />
            <FeatureCard 
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
    content: (
      <div className="space-y-16">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500 block mb-6">Architecture</span>
          <h1 className="font-heading text-6xl md:text-[5rem] font-medium tracking-tighter leading-[1] text-white mb-8">
            PostgreSQL <br/>
            <span className="text-slate-500">Schema.</span>
          </h1>
          <p className="text-2xl text-slate-400 font-light leading-relaxed max-w-3xl">
            SEHATI relies on Drizzle ORM to map relational data while maintaining strict types. All sensitive payload data remains encrypted at rest.
          </p>
        </FadeIn>

        <div>
          <FadeIn delay={0.1}>
            <div className="border-t border-slate-800 pt-12 mt-12">
              <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500 block mb-4">Table 01</span>
              <h3 className="font-heading text-4xl font-medium text-white mb-4">Users Entity</h3>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-6">Manages all actors in the ecosystem: Patients, Doctors, and Pharmacists.</p>
              <CodeBlock title="shared/schema.ts - Users" code={`export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role").notNull(), // "patient", "doctor", "pharmacist"
  encryptedPrivateKey: text("encrypted_private_key"), // Keystore
  isVerified: boolean("is_verified").default(false).notNull(),
});`} />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="border-t border-slate-800 pt-12 mt-12">
              <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500 block mb-4">Table 02</span>
              <h3 className="font-heading text-4xl font-medium text-white mb-4">Medical Records</h3>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-6">Stores the encrypted blob of the record. The absolute truth is verified against the on-chain hash.</p>
              <CodeBlock title="shared/schema.ts - Records" code={`export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey(),
  patientId: varchar("patient_id").references(() => users.id),
  recordType: text("record_type"), // "lab_result", "prescription"
  encryptedContent: text("encrypted_content").notNull(), // AES blob
  ipfsHash: text("ipfs_hash"),
  blockchainHash: text("blockchain_hash"), // Smart contract Tx
  isFulfilled: boolean("is_fulfilled").default(false), 
});`} />
            </div>
          </FadeIn>
        </div>
      </div>
    )
  },
  {
    id: "contracts",
    title: "Smart Contracts",
    content: (
      <div className="space-y-16">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500 block mb-6">Infrastructure</span>
          <h1 className="font-heading text-6xl md:text-[5rem] font-medium tracking-tighter leading-[1] text-white mb-8">
            Blockchain <br/>
            <span className="text-slate-500">Registry.</span>
          </h1>
          <p className="text-2xl text-slate-400 font-light leading-relaxed max-w-3xl">
            Deployed on Ethereum Sepolia. The SEHATI Registry acts as the immutable source of truth for access control and record verification.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="border-t border-slate-800 pt-12 mt-12">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500 block mb-8">Role-Based Access Control (RBAC)</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800 border border-slate-800">
              {['DEFAULT_ADMIN', 'PATIENT_ROLE', 'DOCTOR_ROLE', 'PHARMACIST_ROLE'].map(role => (
                <div key={role} className="bg-[#020617] p-8 text-center flex items-center justify-center">
                  <span className="font-mono text-xs text-white">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="border-t border-slate-800 pt-12 mt-12">
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500 block mb-4">Core Functions</span>
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
          </div>
        </FadeIn>
      </div>
    )
  },
  {
    id: "auth",
    title: "Auth & APIs",
    content: (
      <div className="space-y-16">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-slate-500 block mb-6">Security Layer</span>
          <h1 className="font-heading text-6xl md:text-[5rem] font-medium tracking-tighter leading-[1] text-white mb-8">
            Authentication <br/>
            <span className="text-slate-500">Flow.</span>
          </h1>
          <p className="text-2xl text-slate-400 font-light leading-relaxed max-w-3xl">
            Authentication is handled entirely via cryptographic signatures, eliminating legacy passwords.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="border-l border-slate-800 ml-4 pl-12 space-y-16">
            <div className="relative">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-2">Step 01</span>
              <h3 className="font-heading text-3xl font-medium text-white mb-4">Nonce Generation</h3>
              <p className="text-slate-400 text-lg leading-relaxed">Client calls the endpoint to generate a secure 32-byte hex nonce.</p>
            </div>
            <div className="relative">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-2">Step 02</span>
              <h3 className="font-heading text-3xl font-medium text-white mb-4">Wallet Signature</h3>
              <p className="text-slate-400 text-lg leading-relaxed">User signs the message. Smart Accounts yield complex ABI-encoded signatures.</p>
            </div>
            <div className="relative">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 block mb-2">Step 03</span>
              <h3 className="font-heading text-3xl font-medium text-white mb-4">Validation Bypass</h3>
              <p className="text-slate-400 text-lg leading-relaxed">Signatures are processed to handle both standard EOAs and Smart Accounts seamlessly.</p>
            </div>
          </div>
        </FadeIn>
      </div>
    )
  }
];

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("intro");

  return (
    <div className="flex h-screen bg-[#020617] text-white font-sans overflow-hidden selection:bg-white selection:text-[#020617]">
      
      {/* Stark Sidebar (Light Mode Contrast) */}
      <div className="w-80 bg-[#fafafa] flex-shrink-0 flex flex-col z-20 shadow-[30px_0_100px_rgba(0,0,0,0.5)]">
        <div className="p-12 pb-8">
          <Link href="/" className="inline-flex items-center gap-4 text-[#020617] font-bold hover:opacity-70 transition-opacity group uppercase tracking-[0.2em] text-xs">
            <div className="w-10 h-10 border border-[#020617] flex items-center justify-center rounded-full group-hover:bg-[#020617] group-hover:text-white transition-colors duration-500">
              <ArrowLeft className="w-4 h-4" /> 
            </div>
            Exit Docs
          </Link>
        </div>
        
        <div className="px-12 py-8 mt-4 border-t border-slate-200">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Documentation</h2>
        </div>

        <ScrollArea className="flex-1 px-8">
          <div className="space-y-2 pb-12">
            {DOC_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById("doc-content-area")?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full text-left px-4 py-4 border-l-2 transition-all duration-300 font-heading text-xl tracking-tight ${
                  activeSection === section.id
                    ? "border-[#020617] text-[#020617] font-medium"
                    : "border-transparent text-slate-400 hover:text-[#020617]"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Stark Main Content Area (Dark Mode Contrast) */}
      <div className="flex-1 flex flex-col h-full relative bg-[#020617]">
        {/* Subtle Architectural Grid */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}
        />
        
        <ScrollArea id="doc-content-area" className="flex-1 px-12 md:px-24 lg:px-40 py-32 relative z-10 scroll-smooth">
          <div className="max-w-4xl pb-40">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
