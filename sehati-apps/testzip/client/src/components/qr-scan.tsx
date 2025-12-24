import { useState, useCallback } from "react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { ScanLine, CheckCircle2, Search, Camera, XCircle, AlertCircle } from "lucide-react";
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
    onSuccess: (data) => {
      setScanStatus("success");
      setTimeout(() => {
        onScanSuccess({
          patient: data.patient,
          records: data.records,
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
      if (error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera permissions.");
      } else if (error.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Unable to access camera. Please try manual entry.");
      }
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
    <div className="bg-black rounded-2xl overflow-hidden relative aspect-[4/3] w-full max-w-md mx-auto flex flex-col items-center justify-center border border-gray-800 shadow-2xl">
      <AnimatePresence mode="wait">
        {scanStatus === "idle" && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 bg-gray-900"
          >
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm text-center">
              Scan the patient's QR code to access their medical records.
            </p>
            
            {cameraError && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm text-center max-w-xs">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {cameraError}
              </div>
            )}
            
            <Button onClick={startScanning} className="bg-white text-black hover:bg-gray-200">
              <Camera className="w-4 h-4 mr-2" />
              Open Camera
            </Button>
            
            <div className="w-full max-w-xs space-y-2">
              <p className="text-gray-500 text-xs text-center">Or enter token manually</p>
              <div className="relative">
                <Input 
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste access token here..."
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-gray-400 hover:text-white"
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
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <Scanner
              onScan={handleScanResult}
              onError={handleCameraError}
              constraints={{
                facingMode: "environment",
              }}
              styles={{
                container: {
                  width: "100%",
                  height: "100%",
                },
                video: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                },
              }}
              components={{
                finder: false,
              }}
            />
            
            <div className="absolute inset-0 pointer-events-none">
              <motion.div 
                className="absolute left-0 right-0 h-0.5 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                animate={{ top: ["15%", "85%", "15%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="absolute inset-12 border-2 border-white/30 rounded-lg">
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-green-500 rounded-tl-lg" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-green-500 rounded-tr-lg" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-green-500 rounded-bl-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-green-500 rounded-br-lg" />
              </div>
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-white/90 text-sm font-medium">Point at QR code to scan</p>
              </div>
              <Button 
                onClick={stopScanning}
                variant="outline"
                size="sm"
                className="bg-black/60 border-white/30 text-white hover:bg-black/80"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {scanStatus === "validating" && (
          <motion.div 
            key="validating"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <ScanLine className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-1">Validating Token</h3>
            <p className="text-gray-400 text-sm">Please wait...</p>
          </motion.div>
        )}

        {scanStatus === "success" && (
          <motion.div 
            key="success"
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-green-500 flex flex-col items-center justify-center text-white"
          >
            <CheckCircle2 className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-bold">Access Granted</h3>
            <p className="text-white/80 text-sm">Loading patient records...</p>
          </motion.div>
        )}

        {scanStatus === "error" && (
          <motion.div 
            key="error"
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-red-500 flex flex-col items-center justify-center text-white"
          >
            <XCircle className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-bold">Invalid Token</h3>
            <p className="text-white/80 text-sm">Token expired or invalid. Try again.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
