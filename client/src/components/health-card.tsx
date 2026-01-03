import { FileText, ShieldCheck, Lock, Calendar, User, Eye, ExternalLink, Blocks, Microscope } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface HealthRecordProps {
  type: "lab_result" | "prescription" | "diagnosis";
  title: string;
  date: string;
  doctor: string;
  hospital: string;
  recordId?: string;
  encryptedContent?: string;
  userId?: string;
  isEncrypted?: boolean;
  content?: string;
  blockchainHash?: string;
  ipfsHash?: string;
}

export function HealthRecord({
  type,
  title,
  date,
  doctor,
  hospital,
  recordId,
  isEncrypted: initialEncrypted = true,
  content: initialContent = "",
  blockchainHash,
  ipfsHash
}: HealthRecordProps) {
  const [isDecrypted, setIsDecrypted] = useState(!initialEncrypted);
  const [decryptedContent, setDecryptedContent] = useState(initialContent);

  useEffect(() => {
    setDecryptedContent(initialContent);
    if (initialContent && !initialEncrypted) {
      setIsDecrypted(true);
    }
  }, [initialContent, initialEncrypted]);

  const handleDecrypt = () => {
    // Logic handled by parent via props usually, but here we just simulate reveal
    setIsDecrypted(true);
  };

  const getBlockscoutUrl = (txHash: string) => `https://sepolia-blockscout.lisk.com/tx/${txHash}`;
  const truncateHash = (hash: string, chars: number = 8) => !hash ? "" : `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="diamond-card rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-100"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${type === 'lab_result' ? 'bg-blue-500' :
          type === 'prescription' ? 'bg-emerald-500' : 'bg-purple-500'
        }`} />

      <div className="flex justify-between items-start mb-4 pl-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`
              ${type === 'lab_result' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                type === 'prescription' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                  'text-purple-600 border-purple-200 bg-purple-50'}
              capitalize font-bold border rounded-md px-2 py-0.5
            `}>
              {type.replace("_", " ")}
            </Badge>
            <span className="text-xs text-slate-400 font-medium">{date}</span>
          </div>
          <h3 className="font-bold text-lg text-slate-800 group-hover:text-cyan-600 transition-colors">{title}</h3>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
          <span className="text-[10px] font-bold text-slate-500">LISK SAFE</span>
        </div>
      </div>

      <div className="pl-4 space-y-4">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{doctor}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{hospital}</span>
          </div>
        </div>

        {blockchainHash && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Blocks className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-slate-600">Immutable Proof</span>
              </div>
              <a
                href={getBlockscoutUrl(blockchainHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors font-medium"
              >
                Verify
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="truncate">
                <span className="text-slate-400 mr-2">TX</span>
                <span className="text-slate-600">{truncateHash(blockchainHash)}</span>
              </div>
              {ipfsHash && (
                <div className="truncate text-right">
                  <span className="text-slate-400 mr-2">IPFS</span>
                  <span className="text-slate-600">{truncateHash(ipfsHash)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-5 mt-4 group-hover:bg-white transition-colors">
          {!isDecrypted ? (
            <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Encrypted Clinical Data</p>
                <p className="text-xs text-slate-400">Restricted access.</p>
              </div>
              <Button
                size="sm"
                className="mt-2 h-8 text-xs bg-slate-800 text-white hover:bg-cyan-600"
                onClick={handleDecrypt}
              >
                <Eye className="w-3 h-3 mr-2" /> Decrypt
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                {decryptedContent || "No content available."}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-400">
                  {recordId ? `ID: ${recordId.substring(0, 12)}` : "LOCAL_BUFFER"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  onClick={() => setIsDecrypted(false)}
                >
                  Hide
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
