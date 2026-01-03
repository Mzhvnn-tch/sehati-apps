import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Book, Code, Shield, Network, FileText, Database, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const DOC_SECTIONS = [
    {
        id: "intro",
        title: "Introduction",
        icon: Book,
        content: (
            <div className="space-y-4">
                <h1 className="text-4xl font-serif font-bold text-white mb-6">Sehati Protocol Documentation</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    The Sehati Protocol is a decentralized standard for self-sovereign medical identity.
                    It enables patients to cryptographically own their health records while granting granular,
                    revocable access to medical providers.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-8">
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                        <Shield className="w-8 h-8 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Patient Sovereignty</h3>
                        <p className="text-muted-foreground text-sm">Records are encrypted with keys derived from the patient's wallet signature. Only the patient can decrypt or share them.</p>
                    </div>
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                        <Network className="w-8 h-8 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Decentralized Trust</h3>
                        <p className="text-muted-foreground text-sm">Access rights and record integrity are verified on the Lisk blockchain, eliminating central points of failure.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "architecture",
        title: "System Architecture",
        icon: Database,
        content: (
            <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold text-white">System Architecture</h2>
                <p className="text-muted-foreground">The architecture consists of three main layers:</p>

                <div className="space-y-8 mt-6">
                    <div className="relative pl-8 border-l-2 border-primary/20">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                        <h3 className="text-xl font-bold text-white mb-2">1. Identity Layer (Wallet + DID)</h3>
                        <p className="text-muted-foreground">
                            Users authenticate via EVM-compatible wallets (MetaMask).
                            A deterministic Identity Key is derived from the wallet signature using PBKDF2, ensuring the private key never leaves the client.
                        </p>
                    </div>

                    <div className="relative pl-8 border-l-2 border-primary/20">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                        <h3 className="text-xl font-bold text-white mb-2">2. Storage Layer (IPFS + Encryption)</h3>
                        <p className="text-muted-foreground">
                            Medical data is JSON-serialized and encrypted using AES-256-GCM.
                            The encrypted blob is pinned to IPFS for immutable, distributed storage.
                        </p>
                    </div>

                    <div className="relative pl-8 border-l-2 border-primary/20">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                        <h3 className="text-xl font-bold text-white mb-2">3. Verification Layer (Lisk Sepolia)</h3>
                        <p className="text-muted-foreground">
                            Smart contracts registry stores the mapping of <code>User Address -&gt; IPFS Hash</code>.
                            It also manages the Access Control List (ACL) for doctor permissions.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "encryption",
        title: "Encryption Standard",
        icon: Lock,
        content: (
            <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold text-white">End-to-End Encryption</h2>
                <p className="text-muted-foreground">We utilize industry-standard cryptographic primitives.</p>

                <div className="bg-black/50 p-6 rounded-lg border border-white/10 font-mono text-sm overflow-x-auto">
                    <h4 className="text-primary mb-4 font-bold">// Encryption Process</h4>
                    <div className="space-y-2 text-white/70">
                        <p><span className="text-blue-400">const</span> <span className="text-yellow-400">secret</span> = <span className="text-green-400">PBKDF2</span>(walletSignature, salt, 10000);</p>
                        <p><span className="text-blue-400">const</span> <span className="text-yellow-400">iv</span> = <span className="text-green-400">crypto.getRandomValues</span>(new Uint8Array(12));</p>
                        <p><span className="text-blue-400">const</span> <span className="text-yellow-400">encrypted</span> = <span className="text-green-400">AES-GCM.encrypt</span>(data, secret, iv);</p>
                    </div>
                </div>

                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Algorithm: <strong className="text-white">AES-256-GCM</strong> (Authenticated Encryption)</li>
                    <li>Key Derivation: <strong className="text-white">PBKDF2</strong> with HMAC-SHA256</li>
                    <li>Perfect Forward Secrecy: Unique session keys for doctor access sharing.</li>
                </ul>
            </div>
        )
    },
    {
        id: "contracts",
        title: "Smart Contracts",
        icon: Code,
        content: (
            <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold text-white">Smart Contracts</h2>
                <p className="text-muted-foreground">Deployed on Lisk Sepolia Testnet.</p>

                <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center group">
                        <div>
                            <h4 className="font-bold text-white">SehatiRegistry.sol</h4>
                            <p className="text-xs text-muted-foreground">Main entry point for user records and access control.</p>
                        </div>
                        <code className="bg-black/50 px-3 py-1 rounded text-xs text-primary font-mono select-all cursor-pointer">
                            0x123...abc
                        </code>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4">ABI Interface</h3>
                    <pre className="bg-black/50 p-4 rounded-lg border border-white/10 text-xs text-muted-foreground overflow-auto">
                        {`interface ISehatiRegistry {
    function registerPatient(string memory ipfsHash) external;
    function grantAccess(address doctor, uint256 duration) external;
    function revokeAccess(address doctor) external;
    function getRecordHash(address patient) external view returns (string memory);
}`}
                    </pre>
                </div>
            </div>
        )
    }
];

export default function Documentation() {
    const [activeSection, setActiveSection] = useState("intro");

    return (
        <div className="flex h-screen bg-[#0B0C10] text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 bg-white/[0.02] flex-shrink-0 flex flex-col">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>
                <Separator className="bg-white/10" />
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                        {DOC_SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeSection === section.id
                                    ? "bg-primary/20 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <section.icon className="w-4 h-4" />
                                {section.title}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
                <ScrollArea className="flex-1 p-8 md:p-12">
                    <div className="max-w-3xl mx-auto pb-20">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {DOC_SECTIONS.find(s => s.id === activeSection)?.content}
                        </motion.div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
