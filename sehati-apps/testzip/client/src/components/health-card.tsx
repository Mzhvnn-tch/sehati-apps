import { FileText, ShieldCheck, Lock, Calendar, User, Eye, ExternalLink, Blocks } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { decryptRecord } from "@/lib/api";

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
  encryptedContent,
  userId,
  isEncrypted: initialEncrypted = true,
  content: initialContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  blockchainHash,
  ipfsHash
}: HealthRecordProps) {
  const [isDecrypted, setIsDecrypted] = useState(!initialEncrypted);
  const [decryptedContent, setDecryptedContent] = useState(initialContent);

  const decryptMutation = useMutation({
    mutationFn: async () => {
      if (!recordId || !userId) throw new Error("Missing record or user ID");
      const result = await decryptRecord(recordId, userId);
      return result.decryptedContent;
    },
    onSuccess: (content) => {
      setDecryptedContent(content);
      setIsDecrypted(true);
    },
  });

  const handleDecrypt = () => {
    if (recordId && userId && encryptedContent) {
      decryptMutation.mutate();
    } else {
      setIsDecrypted(true);
    }
  };

  const getBlockscoutUrl = (txHash: string) => {
    return `https://sepolia-blockscout.lisk.com/tx/${txHash}`;
  };

  const truncateHash = (hash: string, chars: number = 8) => {
    if (!hash) return "";
    return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5 hover:shadow-md transition-shadow duration-300 group relative overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        type === 'lab_result' ? 'bg-blue-500' : 
        type === 'prescription' ? 'bg-emerald-500' : 'bg-purple-500'
      }`} />

      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`
              ${type === 'lab_result' ? 'text-blue-600 border-blue-200 bg-blue-50' : 
                type === 'prescription' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 
                'text-purple-600 border-purple-200 bg-purple-50'}
              capitalize font-medium
            `}>
              {type.replace("_", " ")}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">{date}</span>
          </div>
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        </div>
        
        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono text-muted-foreground">ON-CHAIN</span>
        </div>
      </div>

      <div className="pl-2 space-y-4">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>{doctor}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{hospital}</span>
          </div>
        </div>

        {blockchainHash && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Blocks className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Blockchain Proof</span>
              </div>
              <a 
                href={getBlockscoutUrl(blockchainHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition-colors"
              >
                Verify on Blockscout
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">TX Hash:</span>
                <span className="ml-1 font-mono text-gray-700">{truncateHash(blockchainHash)}</span>
              </div>
              {ipfsHash && (
                <div>
                  <span className="text-gray-500">IPFS:</span>
                  <span className="ml-1 font-mono text-gray-700">{truncateHash(ipfsHash)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative bg-gray-50/50 rounded-lg border border-gray-100 p-4 mt-4">
          {!isDecrypted ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Encrypted Data</p>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                  Only authorized parties with valid keys can view this content.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 h-8 text-xs"
                onClick={handleDecrypt}
                disabled={decryptMutation.isPending}
              >
                <Eye className="w-3 h-3 mr-2" />
                {decryptMutation.isPending ? "Decrypting..." : "Decrypt & View"}
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <p className="text-sm text-gray-700 leading-relaxed font-sans">
                {decryptedContent}
              </p>
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-[10px] font-mono text-gray-400">
                  {recordId ? `RECORD: ${recordId.substring(0, 12)}...` : "LOCAL RECORD"}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] text-gray-500 hover:text-gray-700"
                  onClick={() => setIsDecrypted(false)}
                >
                  Encrypt
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
