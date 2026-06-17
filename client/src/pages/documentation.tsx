import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Code2, Database, Shield, Lock, Activity, FileJson, Network } from "lucide-react";

// Stark Easing for premium feel
const velvetEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 1, delay, ease: velvetEasing }}
  >
    {children}
  </motion.div>
);

const BlueprintCode = ({ title, code }: { title: string, code: string }) => (
  <div className="border border-[#020617] bg-[#020617] text-white w-full group relative mt-6 mb-12">
    <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">{title}</span>
      <div className="w-1.5 h-1.5 bg-white/20 rounded-full group-hover:bg-white transition-colors duration-500" />
    </div>
    <div className="p-8 overflow-x-auto selection:bg-white/30">
      <pre className="text-[13px] font-mono leading-loose text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  </div>
);

const SubHeading = ({ title, desc }: { title: string, desc: string }) => (
  <div className="mb-8">
    <h4 className="font-heading text-2xl font-medium text-[#020617] mb-4">{title}</h4>
    <p className="text-lg text-slate-600 font-light leading-relaxed">{desc}</p>
  </div>
);

const DOC_CHAPTERS = [
  {
    id: "chapter-01",
    num: "01",
    title: "The Standard",
    icon: Shield,
    desc: "AuraMed's cryptography is built on the premise that no central authority should hold the keys to patient data. Every piece of sensitive data is locked behind mathematically unbreakable algorithms.",
    content: (
      <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
        <FadeIn>
          <div className="border-t border-[#020617] pt-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 block mb-6">Subsystem / 1.A</span>
            <SubHeading 
              title="AES-256-GCM Encryption" 
              desc="We utilize the Galois/Counter Mode (GCM) for authenticated encryption. Not only does it provide confidentiality, but it also guarantees the integrity of the medical records. Any tampering of the ciphertext will instantly fail the authentication tag check upon decryption." 
            />
            <BlueprintCode title="Cryptography specs" code={`Algorithm: AES
Key Size: 256 bits
Mode: GCM (Galois/Counter Mode)
IV Size: 12 bytes (96 bits)
Auth Tag: 16 bytes (128 bits)`} />
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="border-t border-[#020617] pt-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 block mb-6">Subsystem / 1.B</span>
            <SubHeading 
              title="Key Derivation (PBKDF2 / ECDSA)" 
              desc="Keys are never transmitted. The user's Web3 wallet signs a deterministic message, and the resulting cryptographic signature is hashed via PBKDF2 to derive the master AES key entirely in the browser's memory." 
            />
            <div className="bg-slate-100 p-8 font-mono text-xs text-slate-500 leading-relaxed border border-slate-200 mt-6">
              [Wallet Signature] <br/>
              &nbsp;&nbsp;└── {'>'} [SHA-256 Hash] <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── {'>'} [PBKDF2 (100k iterations)] <br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── {'>'} [256-bit Master Key]
            </div>
          </div>
        </FadeIn>
      </div>
    )
  },
  {
    id: "chapter-02",
    num: "02",
    title: "Data Entities",
    icon: Database,
    desc: "Strictly typed PostgreSQL schema via Drizzle ORM. Sensitive data is stored as encrypted blobs, while metadata enables efficient indexing and cross-referencing.",
    content: (
      <div className="space-y-24">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start">
          <div className="lg:sticky lg:top-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 block mb-4">Entity 01</span>
            <h3 className="font-heading text-4xl font-medium text-[#020617] mb-6">Users & Identity.</h3>
            <p className="text-lg text-slate-600 font-light leading-relaxed">Manages the foundational actors within the ecosystem. The encrypted private key acts as a secure keystore for seamless cross-device login.</p>
          </div>
          <BlueprintCode title="schema/users.ts" code={`export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role").notNull(), // patient, doctor, pharmacist
  encryptedPrivateKey: text("encrypted_private_key"),
  publicKey: text("public_key"), // For asymmetric sharing
  isVerified: boolean("is_verified").default(false).notNull(),
});`} />
        </div>

        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start pt-24 border-t border-slate-200">
          <div className="lg:sticky lg:top-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 block mb-4">Entity 02</span>
            <h3 className="font-heading text-4xl font-medium text-[#020617] mb-6">Medical Records.</h3>
            <p className="text-lg text-slate-600 font-light leading-relaxed">The <code className="bg-slate-200 px-2 py-1 text-sm font-mono">encryptedContent</code> holds the AES-256 payload. The absolute truth is verified against the <code className="bg-slate-200 px-2 py-1 text-sm font-mono">blockchainHash</code> to prevent database tampering.</p>
          </div>
          <BlueprintCode title="schema/records.ts" code={`export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  patientId: varchar("patient_id").references(() => users.id),
  doctorId: varchar("doctor_id").references(() => users.id),
  recordType: text("record_type"), // lab_result, prescription, diagnosis
  encryptedContent: text("encrypted_content").notNull(),
  ipfsHash: text("ipfs_hash"), // Decentralized storage reference
  blockchainHash: text("blockchain_hash"), // Smart contract Tx
  createdAt: timestamp("created_at").defaultNow(),
});`} />
        </div>

        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start pt-24 border-t border-slate-200">
          <div className="lg:sticky lg:top-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 block mb-4">Entity 03</span>
            <h3 className="font-heading text-4xl font-medium text-[#020617] mb-6">Access Grants.</h3>
            <p className="text-lg text-slate-600 font-light leading-relaxed">Handles the time-limited QR code tokens. When a patient generates a QR, an active grant is created mapping their temporary key to a token.</p>
          </div>
          <BlueprintCode title="schema/grants.ts" code={`export const accessGrants = pgTable("access_grants", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  patientId: varchar("patient_id").references(() => users.id),
  token: text("token").notNull().unique(),
  encryptionKey: text("encryption_key").notNull(), // Fragment Key
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
});`} />
        </div>
      </div>
    )
  },
  {
    id: "chapter-03",
    num: "03",
    title: "Smart Contracts",
    icon: Code2,
    desc: "The immutable backbone deployed on Ethereum Sepolia. Contracts handle strict role-based access control and serve as a permanent, untamperable audit log of data interactions.",
    content: (
      <div className="space-y-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['ADMIN', 'PATIENT', 'DOCTOR', 'PHARMACIST'].map((role) => (
            <div key={role} className="border border-[#020617] p-8 md:p-12 flex items-center justify-center hover:bg-[#020617] hover:text-white transition-colors duration-500 group cursor-default">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold transition-colors">{role}</span>
            </div>
          ))}
        </div>
        
        <div className="pt-16 border-t border-[#020617] grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="font-heading text-4xl font-medium text-[#020617] mb-8">Registry Interface.</h3>
            <p className="text-lg text-slate-600 font-light leading-relaxed mb-6">The primary entrypoint for DApp integration. All write operations emit indexed events for off-chain subgraph indexing.</p>
            <BlueprintCode title="AuraMedRegistry.sol" code={`interface IAuraMedRegistry {
  event RecordCreated(
    bytes32 indexed recordId, 
    address indexed patient
  );

  // Medical Record Creation
  function createRecord(
      address _patient,
      string calldata _ipfsCID,
      bytes32 _contentHash,
      string calldata _recordType,
      bytes32 _accessToken
  ) external returns (bytes32);

  // Cross-provider prescriptions
  function fulfillPrescription(
      bytes32 _recordId
  ) external;
}`} />
          </div>
          <div>
            <h3 className="font-heading text-4xl font-medium text-[#020617] mb-8">On-Chain Verification.</h3>
            <p className="text-lg text-slate-600 font-light leading-relaxed mb-6">How the frontend guarantees that the database has not been tampered with by a malicious server administrator.</p>
            <BlueprintCode title="Client-Side Validation Flow" code={`// 1. Fetch encrypted record from Postgres
const record = await api.getRecord(id);

// 2. Hash the encrypted payload locally
const localHash = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(record.encryptedContent)
);

// 3. Query the blockchain for the true hash
const trueHash = await contract.getRecordHash(
  record.blockchainHash
);

// 4. Assert integrity before decryption
if (localHash !== trueHash) {
  throw new Error("CRITICAL: Data Tampering Detected!");
}`} />
          </div>
        </div>
      </div>
    )
  },
  {
    id: "chapter-04",
    num: "04",
    title: "Auth Protocol",
    icon: Lock,
    desc: "A completely passwordless architecture. Authentication is validated through cryptographic signatures of server-generated nonces, protecting against replay and man-in-the-middle attacks.",
    content: (
      <div className="space-y-16">
        <div className="grid md:grid-cols-3 gap-x-12 gap-y-16 border-b border-slate-200 pb-24">
          {[
            { step: "A", title: "Nonce Generation", desc: "A secure 32-byte hex nonce is generated and temporarily stored in the session memory." },
            { step: "B", title: "Cryptographic Sign", desc: "The wallet signs the nonce via EIP-191, proving ownership without exposing the private key." },
            { step: "C", title: "Session Establish", desc: "Signatures are verified (EIP-1271 compatible), and an HttpOnly cookie creates the secure session." }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="font-heading text-6xl text-slate-200 mb-6">{item.step}</span>
              <h3 className="font-heading text-2xl font-medium text-[#020617] mb-4">{item.title}</h3>
              <p className="text-slate-600 font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center gap-4 mb-8">
            <Activity className="w-8 h-8 text-[#020617]" />
            <h3 className="font-heading text-4xl font-medium text-[#020617]">API Traffic Flow.</h3>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <BlueprintCode title="POST /api/auth/generate-nonce" code={`// Request
{
  "walletAddress": "0x71C...976F"
}

// Response
{
  "nonce": "8f3a...1b9c",
  "message": "Welcome to AuraMed.\\n\\nSign this message to prove you own this wallet.\\n\\nNonce: 8f3a...1b9c"
}`} />

            <BlueprintCode title="POST /api/auth/verify-signature" code={`// Request
{
  "walletAddress": "0x71C...976F",
  "message": "Welcome to AuraMed...",
  "signature": "0x8a7b...12cf"
}

// Response (Set-Cookie: connect.sid=...)
{
  "verified": true,
  "user": {
    "id": "uuid-v4",
    "role": "doctor"
  }
}`} />
          </div>
        </div>
      </div>
    )
  },
  {
    id: "chapter-05",
    num: "05",
    title: "Advanced Protocols",
    icon: Network,
    desc: "Addressing the complex realities of healthcare data. We extend the baseline protocol to support multi-party data sharing, emergency key recovery, and strict compliance with the right to be forgotten (GDPR).",
    content: (
      <div className="space-y-24">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start">
          <div className="lg:sticky lg:top-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 block mb-4">Mechanism 01</span>
            <h3 className="font-heading text-4xl font-medium text-[#020617] mb-6">Asymmetric Sharing.</h3>
            <p className="text-lg text-slate-600 font-light leading-relaxed">
              Medical data cannot be siloed forever. To grant doctors access without exposing the patient's master AES key, we utilize Decentralized Key Management (e.g., Lit Protocol) and Proxy Re-Encryption (Threshold Network). The symmetric key is encrypted with the doctor's public key, allowing smart contracts to securely dictate access rights.
            </p>
          </div>
          <BlueprintCode title="Data Sharing Flow" code={`// 1. Patient encrypts data with symmetric AES
const ciphertext = AES.encrypt(data, patientSymmetricKey);

// 2. Patient encrypts symmetric key with Doctor's Public Key
const wrappedKey = Asymmetric.encrypt(patientSymmetricKey, doctorPublicKey);

// 3. Smart contract records the grant
await contract.grantAccess(doctorAddress, wrappedKey);`} />
        </div>

        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start pt-24 border-t border-slate-200">
          <div className="lg:sticky lg:top-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 block mb-4">Mechanism 02</span>
            <h3 className="font-heading text-4xl font-medium text-[#020617] mb-6">Emergency Recovery.</h3>
            <p className="text-lg text-slate-600 font-light leading-relaxed">
              Losing a seed phrase shouldn't mean losing critical medical history. By integrating Account Abstraction (ERC-4337) and Multi-Party Computation (MPC) via systems like Web3Auth, accounts feature social recovery through email, biometrics, or trusted family members—entirely decentralized.
            </p>
          </div>
          <BlueprintCode title="MPC Recovery Setup" code={`// Shard generation via Web3Auth / MPC
const keyShards = await mpc.generateShards({
  threshold: 2,
  shares: 3
});

// Distribution:
// Share 1: Local Device Storage
// Share 2: Patient's Email Auth Node
// Share 3: Trusted Guardian (Family/Doctor)`} />
        </div>

        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start pt-24 border-t border-slate-200">
          <div className="lg:sticky lg:top-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 block mb-4">Mechanism 03</span>
            <h3 className="font-heading text-4xl font-medium text-[#020617] mb-6">Crypto-Shredding.</h3>
            <p className="text-lg text-slate-600 font-light leading-relaxed">
              To comply with the GDPR "Right to be Forgotten" while using immutable storage like IPFS or Arweave, we employ Crypto-Shredding. By definitively destroying the decryption keys, the decentralized payload becomes mathematically unrecoverable digital noise.
            </p>
          </div>
          <BlueprintCode title="GDPR Compliance Flow" code={`// To delete an immutable record on IPFS:
// We cannot delete the file from the decentralized network.

async function executeCryptoShredding(recordId) {
  // 1. Locate the specific AES key for this record
  const keyIdentifier = await db.getKeyId(recordId);
  
  // 2. Permanently destroy the key from KMS/Storage
  await keyManager.destroyKey(keyIdentifier);
  
  // 3. The IPFS ciphertext is now permanently inaccessible
  return { status: "shredded", compliance: "GDPR-Article-17" };
}`} />
        </div>
      </div>
    )
  }
];

export default function Documentation() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#fafafa] selection:bg-[#020617] selection:text-white font-sans text-[#020617]">
      
      {/* Lightweight Architectural Grid Lines */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, #020617 1px, transparent 1px), linear-gradient(to bottom, #020617 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Top Navbar */}
      <nav className="w-full px-8 md:px-16 py-8 flex justify-between items-center border-b border-slate-200 relative z-50">
        <div className="flex items-center cursor-pointer group" onClick={() => navigate("/")}>
          <span className="text-[12px] uppercase tracking-[0.3em] font-bold text-[#020617] mt-0.5">AuraMed</span>
        </div>

        <button 
          onClick={() => navigate("/")} 
          className="group flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center group-hover:bg-[#020617] group-hover:text-white transition-colors duration-300">
            <ArrowLeft className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] hidden md:block">Return to App</span>
        </button>
      </nav>

      {/* Massive Editorial Hero */}
      <header className="px-8 md:px-16 pt-12 pb-32 border-b border-[#020617]">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: velvetEasing }}
          >
            <h1 className="font-heading text-[12vw] leading-[0.85] tracking-tighter text-[#020617] uppercase mb-16">
              System <br/>
              <span className="text-slate-300">Architecture.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-slate-600 font-light max-w-4xl leading-snug">
              A detailed dissection of the AuraMed protocol. From zero-knowledge concepts to strict database schemas and smart contract registries. Designed for transparency and absolute developer clarity.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Chapters Content */}
      <main className="relative">
        {DOC_CHAPTERS.map((chapter) => (
          <article 
            key={chapter.id} 
            id={chapter.id}
            className="border-b border-[#020617] last:border-b-0"
          >
            {/* FIXED WIDTH GRID TO ENSURE PERFECTLY STRAIGHT VERTICAL BORDERS */}
            <div className="grid lg:grid-cols-[320px_1fr] xl:grid-cols-[400px_1fr] max-w-[1800px] mx-auto">
              
              {/* Chapter Sidebar / Number */}
              <div className="p-8 md:p-12 xl:p-16 border-b lg:border-b-0 lg:border-r border-[#020617] flex flex-col justify-between bg-[#fafafa]">
                <chapter.icon className="w-8 h-8 text-[#020617] mb-12 hidden lg:block opacity-30" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: velvetEasing }}
                  className="mt-auto"
                >
                  <span className="font-heading text-8xl md:text-[10rem] xl:text-[12rem] leading-none text-[#020617] tracking-tighter block">
                    {chapter.num}
                  </span>
                  <span className="font-mono text-[10px] xl:text-xs uppercase tracking-[0.3em] font-bold text-slate-400 mt-4 xl:mt-8 block">
                    Chapter
                  </span>
                </motion.div>
              </div>

              {/* Chapter Content */}
              <div className="p-8 md:p-12 xl:p-24 bg-white/50">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1, ease: velvetEasing }}
                  className="max-w-5xl"
                >
                  <h2 className="font-heading text-5xl md:text-7xl xl:text-8xl font-medium tracking-tight text-[#020617] mb-8">
                    {chapter.title}.
                  </h2>
                  <p className="text-xl xl:text-2xl text-slate-600 font-light leading-relaxed mb-24 max-w-4xl">
                    {chapter.desc}
                  </p>

                  <div className="relative">
                    {chapter.content}
                  </div>
                </motion.div>
              </div>

            </div>
          </article>
        ))}
      </main>

      {/* Footer Block */}
      <footer className="bg-[#020617] text-white px-8 md:px-16 py-32 flex flex-col items-center text-center">
        <h2 className="font-heading text-6xl md:text-8xl lg:text-[10rem] font-medium tracking-tighter mb-12">End of Document.</h2>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-mono text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors border border-slate-800 px-8 py-4 hover:bg-white/5"
        >
          Return to Top
        </button>
      </footer>
    </div>
  );
}
