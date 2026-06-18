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
    key?: string;
  }) => void;
  doctorId?: string;
}

export function QRScan({ onScanSuccess, doctorId }: QRScanProps) {
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "validating" | "success" | "error">("idle");
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedToken, setLastScannedToken] = useState<string | null>(null);
  const [extractedKey, setExtractedKey] = useState<string>("");

  const validateMutation = useMutation({
    mutationFn: (token: string) => validateQRToken(token, doctorId),
    onSuccess: (data, variables) => {
      setScanStatus("success");
      setTimeout(() => {
        onScanSuccess({
          patient: data.patient,
          records: data.records,
          token: variables,
          key: extractedKey
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
        let pKey = "";
        if (scannedValue.includes("token=")) {
          const urlParams = new URLSearchParams(scannedValue.split("?")[1] || scannedValue);
          token = urlParams.get("token") || scannedValue;
          pKey = urlParams.get("key") || "";
        }
        setExtractedKey(pKey);
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
    let pKey = "";
    if (token.includes("token=")) {
      const urlParams = new URLSearchParams(token.split("?")[1] || token);
      token = urlParams.get("token") || token;
      pKey = urlParams.get("key") || "";
    }
    setExtractedKey(pKey);
    setScanStatus("validating");
    validateMutation.mutate(token);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-white overflow-hidden">
      <AnimatePresence mode="wait">
        {scanStatus === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white"
          >
            <div className="w-16 h-16 bg-[#020617] flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <p className="text-[#020617] text-[10px] text-center font-mono uppercase tracking-widest font-bold max-w-[200px] mb-4">
              Align patient QR token to authorize.
            </p>

            {cameraError && (
              <div className="bg-red-50 border-2 border-red-900 p-2 mb-4 text-red-900 text-[10px] font-mono uppercase tracking-widest font-bold text-center w-full flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {cameraError}
              </div>
            )}

            <Button onClick={startScanning} className="bg-[#020617] hover:bg-black text-white font-mono uppercase tracking-[0.2em] font-bold text-[10px] rounded-none h-10 w-full">
              <Camera className="w-4 h-4 mr-2" />
              Activate Scanner
            </Button>
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
                className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />

              {/* Corner Markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white z-30" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white z-30" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white z-30" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white z-30" />
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-auto z-40 px-4">
              <Button onClick={stopScanning} variant="secondary" className="w-full bg-white hover:bg-slate-200 text-[#020617] font-mono text-[10px] tracking-widest uppercase font-bold rounded-none h-10 border-none">
                <XCircle className="w-4 h-4 mr-2 text-red-600" /> Abort Scan
              </Button>
            </div>
          </motion.div>
        )}

        {scanStatus === "validating" && (
          <motion.div
            key="validating"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center z-50 text-center p-4"
          >
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin flex items-center justify-center mb-4">
               <ScanLine className="w-6 h-6 text-white absolute animate-pulse" />
            </div>
            <h3 className="text-white text-sm font-heading uppercase tracking-widest font-bold mb-1">Authenticating</h3>
            <p className="text-slate-400 text-[10px] font-mono tracking-widest uppercase font-bold">Verifying Signature...</p>
          </motion.div>
        )}

        {scanStatus === "success" && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-white flex flex-col items-center justify-center text-[#020617] z-50 p-4 border-4 border-[#020617]"
          >
            <div className="w-16 h-16 bg-[#020617] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-heading uppercase tracking-widest font-bold">Access Granted</h3>
            <p className="text-slate-500 text-[10px] mt-2 font-mono uppercase tracking-widest font-bold text-center">Decrypting Vault...</p>
          </motion.div>
        )}

        {scanStatus === "error" && (
          <motion.div
            key="error"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-red-900 flex flex-col items-center justify-center text-white z-50 p-4"
          >
            <div className="w-16 h-16 bg-white flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-900" />
            </div>
            <h3 className="text-sm font-heading uppercase tracking-widest font-bold">Invalid Token</h3>
            <p className="text-red-200 text-[10px] mt-2 font-mono uppercase tracking-widest font-bold text-center">Signature Verification Failed</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
