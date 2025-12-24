import QRCode from "react-qr-code";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, RefreshCw, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { generateQRAccess } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function QRShare({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrData, setQrData] = useState("");
  const [grantId, setGrantId] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () => generateQRAccess(patientId, 60),
    onSuccess: (data) => {
      setQrData(data.qrData);
      setGrantId(data.grant.id);
      setTimeLeft(3600); // 60 minutes in seconds
    },
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const regenerate = () => {
    generateMutation.mutate();
    setCopied(false);
  };

  const getToken = () => {
    if (!qrData) return "";
    if (qrData.includes("token=")) {
      const urlParams = new URLSearchParams(qrData.split("?")[1] || qrData);
      return urlParams.get("token") || qrData;
    }
    return qrData;
  };

  const copyToken = () => {
    const token = getToken();
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Token Copied!",
      description: "Share this token with your doctor",
    });
  };

  if (!qrData && !generateMutation.isPending) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-primary/10 p-8 flex flex-col items-center max-w-sm w-full mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Share Medical Access</h3>
          <p className="text-sm text-muted-foreground">
            Generate a QR code to grant temporary access to your records.
          </p>
        </div>
        <Button onClick={regenerate} className="w-full">
          Generate QR Code
        </Button>
      </div>
    );
  }

  if (generateMutation.isPending) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-primary/10 p-8 flex flex-col items-center max-w-sm w-full mx-auto">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Generating secure access token...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-primary/10 p-8 flex flex-col items-center max-w-sm w-full mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Share Medical Access</h3>
        <p className="text-sm text-muted-foreground">
          Scan this code to grant temporary read access to your records.
        </p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-cyan-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-white p-4 rounded-xl border border-gray-100">
          <QRCode 
            value={qrData} 
            size={200} 
            viewBox={`0 0 256 256`}
            className="w-full h-auto"
            fgColor="#0F172A"
          />
          
          {/* Overlay Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 bg-white rounded-full p-1 shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary text-xs">S</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {timeLeft > 0 ? (
        <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-100">
          <Timer className="w-4 h-4" />
          <span>Expires in {formatTime(timeLeft)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
          <span>Expired</span>
        </div>
      )}

      <div className="mt-6 w-full space-y-3">
        <div className="space-y-2">
          <p className="text-xs text-gray-500 text-center">Can't scan? Copy the token instead:</p>
          <div className="flex gap-2">
            <Input 
              value={getToken()} 
              readOnly 
              className="font-mono text-xs bg-gray-50 select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button 
              size="icon" 
              variant="outline" 
              onClick={copyToken}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full gap-2 border-dashed"
          onClick={regenerate}
          disabled={generateMutation.isPending}
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate Token
        </Button>
      </div>
    </div>
  );
}