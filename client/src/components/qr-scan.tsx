import { useState, useCallback } from "react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { ScanLine, CheckCircle2, Search, Camera, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { validateQRToken } from "@/lib/api";
import type { User, MedicalRecord } from "@shared/schema";

interface QRScanProps {
  onScanSuccess: (data: {
    patient: User;
    records: (MedicalRecord & { decryptedContent: string })[];
    token: string;
  }) => void;
  doctorId?: string;
}

export function QRScan({ onScanSuccess, doctorId }: QRScanProps) {
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "validating" | "success" | "error">("idle");
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedToken, setLastScannedToken] = useState<string | null>(null);

  const validateMutation = useMutation({
    mutationFn: (token: string) => validateQRToken(token, doctorId),
    onSuccess: (data, variables) => {
      setScanStatus("success");
      setTimeout(() => {
        onScanSuccess({
          patient: data.patient,
          records: data.records,
          token: variables
        });
        setScanStatus("idle");
        setLastScannedToken(null);
      }, 1500);
    },
    onError: (error) => {
      setScanStatus("error");
      setTimeout(() => {
        setScanStatus("scanning");
        setLastScannedToken(null);
      }, 2000);
    },
  });

  const handleScanResult = useCallback((detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0 && scanStatus === "scanning") {
      const scannedValue = detectedCodes[0].rawValue;
      if (scannedValue && scannedValue !== lastScannedToken) {
        setLastScannedToken(scannedValue);
        let token = scannedValue;
        if (scannedValue.includes("token=")) {
          const urlParams = new URLSearchParams(scannedValue.split("?")[1] || scannedValue);
          token = urlParams.get("token") || scannedValue;
        }
        setScanStatus("validating");
        validateMutation.mutate(token);
      }
    }
  }, [scanStatus, lastScannedToken, validateMutation]);

  const handleCameraError = (error: unknown) => {
    console.error("Camera error:", error);
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") setCameraError("Camera access denied.");
      else if (error.name === "NotFoundError") setCameraError("No camera found.");
      else setCameraError("Camera access failed.");
    }
    setScanStatus("idle");
  };

  const startScanning = () => {
    setCameraError(null);
    setLastScannedToken(null);
    setScanStatus("scanning");
  };

  const stopScanning = () => {
    setScanStatus("idle");
    setLastScannedToken(null);
  };

  const handleManualSubmit = () => {
    if (!manualToken.trim()) return;
    let token = manualToken.trim();
    if (token.includes("token=")) {
      const urlParams = new URLSearchParams(token.split("?")[1] || token);
      token = urlParams.get("token") || token;
    }
    setScanStatus("validating");
    validateMutation.mutate(token);
  };

  return (
    <div className="diamond-card rounded-3xl overflow-hidden relative aspect-[4/3] w-full max-w-md mx-auto flex flex-col items-center justify-center border border-slate-200 shadow-xl bg-slate-50">
      <AnimatePresence mode="wait">
        {scanStatus === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-5 bg-white/60 backdrop-blur-md"
          >
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm">
              <Camera className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm text-center font-medium max-w-xs">
              Align patient QR code within the frame to authorize access.
            </p>

            {cameraError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-500 text-xs text-center max-w-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {cameraError}
              </div>
            )}

            <Button onClick={startScanning} className="bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-200">
              <Camera className="w-4 h-4 mr-2" />
              Activate Scanner
            </Button>

            <div className="w-full max-w-xs space-y-3 pt-6 border-t border-slate-200/50">
              <p className="text-slate-300 text-[10px] text-center uppercase tracking-widest font-bold">Or Enter Token</p>
              <div className="relative group">
                <Input
                  value={manualToken} onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste token..."
                  className="bg-white border-slate-200 text-slate-800 pr-10 focus:ring-cyan-100 text-xs h-9"
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                />
                <Button
                  size="sm" variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50"
                  onClick={handleManualSubmit}
                  disabled={!manualToken.trim()}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {scanStatus === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          >
            <Scanner
              onScan={handleScanResult} onError={handleCameraError}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%", height: "100%" }, video: { width: "100%", height: "100%", objectFit: "cover" } }}
              components={{ finder: false }}
            />

            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20"
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />

              <div className="absolute inset-0 border-[20px] border-white/90 z-10 backdrop-blur-[1px]">
                {/* This creates a 'frame' effect by obscuring the edges */}
                <div className="absolute inset-0 border-2 border-white/50 m-[-20px]" />
              </div>

              {/* Corner Markers */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl z-30 drop-shadow-lg" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl z-30 drop-shadow-lg" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl z-30 drop-shadow-lg" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-cyan-400 rounded-br-xl z-30 drop-shadow-lg" />
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-auto z-40">
              <Button onClick={stopScanning} variant="secondary" size="sm" className="bg-white/90 text-slate-800 hover:bg-white border-white/50 shadow-lg">
                <XCircle className="w-4 h-4 mr-2 text-red-500" /> Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {scanStatus === "validating" && (
          <motion.div
            key="validating"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-50 text-center p-6"
          >
            <div className="w-20 h-20 rounded-full bg-cyan-50 flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
              <ScanLine className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-slate-800 text-lg font-bold mb-1">Authenticating</h3>
            <p className="text-slate-400 text-sm">Verifying cryptographic signature...</p>
          </motion.div>
        )}

        {scanStatus === "success" && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center text-white z-50 p-6"
          >
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_infinite]">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Access Granted</h3>
            <p className="text-white/90 text-sm mt-2">Decrypting patient data securely...</p>
          </motion.div>
        )}

        {scanStatus === "error" && (
          <motion.div
            key="error"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-red-500 flex flex-col items-center justify-center text-white z-50 p-6"
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold">Invalid Token</h3>
            <p className="text-white/90 text-sm mt-2 max-w-xs text-center">Unable to verify signature. Please try scanning again.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
