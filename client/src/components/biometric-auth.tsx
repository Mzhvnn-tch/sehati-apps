import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, Camera, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface BiometricAuthProps {
    onSuccess: (user: any) => void;
    mode?: 'enroll' | 'verify';
}

export function BiometricAuth({ onSuccess, mode = 'verify' }: BiometricAuthProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturing, setCapturing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            toast({
                title: "Camera Error",
                description: "Please allow camera access to use biometric login.",
                variant: "destructive"
            });
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureAndSubmit = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setProcessing(true);

        // Draw video frame to canvas
        const context = canvasRef.current.getContext('2d');
        if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);

            // Convert to blob
            canvasRef.current.toBlob(async (blob) => {
                if (!blob) {
                    setProcessing(false);
                    return;
                }

                const formData = new FormData();
                formData.append("image", blob, "biometric_scan.jpg");

                if (mode === 'verify') {
                    if (!walletAddress) {
                        toast({ title: "Error", description: "Please enter your wallet address first.", variant: "destructive" });
                        setProcessing(false);
                        return;
                    }
                    formData.append("walletAddress", walletAddress);
                }

                try {
                    const endpoint = mode === 'enroll'
                        ? "/api/auth/biometric/enroll"
                        : "/api/auth/biometric/verify";

                    const res = await fetch(endpoint, {
                        method: "POST",
                        body: formData
                    });

                    const data = await res.json();

                    if (res.ok && data.success) {
                        toast({
                            title: "Success",
                            description: mode === 'enroll' ? "Biometric enrolled successfully!" : "Authenticated securely.",
                        });
                        if (onSuccess) onSuccess(data.user);
                    } else {
                        throw new Error(data.error || "Biometric operation failed");
                    }
                } catch (error: any) {
                    toast({
                        title: "Authentication Failed",
                        description: error.message,
                        variant: "destructive"
                    });
                } finally {
                    setProcessing(false);
                }
            }, 'image/jpeg', 0.95);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            {/* Camera Viewfinder */}
            <div className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning Overlay */}
                <AnimatePresence>
                    {!processing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <div className="w-48 h-48 border-2 border-cyan-500/50 rounded-full relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/80 blur-sm animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {processing && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-cyan-600 animate-spin mb-2" />
                        <p className="text-sm font-semibold text-cyan-700">Processing Biometrics...</p>
                    </div>
                )}
            </div>

            <div className="w-full space-y-4">
                {mode === 'verify' && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wallet Identity</label>
                        <Input
                            placeholder="Enter your Wallet Address (0x...)"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            className="font-mono text-sm bg-slate-50 border-slate-200"
                        />
                    </div>
                )}

                <Button
                    className="w-full h-12 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-200/50"
                    onClick={captureAndSubmit}
                    disabled={processing || (mode === 'verify' && !walletAddress)}
                >
                    {processing ? (
                        "Verifying..."
                    ) : (
                        <>
                            <Fingerprint className="w-5 h-5 mr-2" />
                            {mode === 'enroll' ? "Scan to Enroll" : "Secure Login"}
                        </>
                    )}
                </Button>
            </div>

            <p className="text-xs text-center text-slate-400 max-w-xs">
                <LockIcon className="w-3 h-3 inline mr-1 mb-0.5" />
                Your biometric data is processed locally and never stored as raw images.
            </p>
        </div>
    );
}

function LockIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}
