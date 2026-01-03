import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, RefreshCw, XCircle, Sparkles, Zap } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TransactionStep = "encrypt" | "ipfs" | "sign" | "blockchain" | "db";
export type TransactionStatus = "idle" | "processing" | "success" | "error";

interface StepConfig {
    id: TransactionStep;
    label: string;
    description: string;
}

const STEPS: StepConfig[] = [
    { id: "encrypt", label: "Encryption", description: "Securing data with AES-256..." },
    { id: "ipfs", label: "Decentralized Storage", description: "Pinning proof to IPFS network..." },
    { id: "sign", label: "Digital Signature", description: "Waiting for wallet confirmation..." },
    { id: "blockchain", label: "Lisk Consensus", description: "Finalizing block validation..." },
    { id: "db", label: "Local Indexing", description: "Syncing hospital database..." },
];

interface TransactionProgressProps {
    open: boolean;
    currentStep: TransactionStep;
    status: TransactionStatus;
    error?: string;
    onClose?: () => void;
    onRetry?: () => void;
}

const SuccessParticles = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-20">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{
                        opacity: 0,
                        scale: Math.random() * 1 + 0.5,
                        x: (Math.random() - 0.5) * 150,
                        y: (Math.random() - 0.5) * 150,
                        rotate: Math.random() * 360
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                        "absolute top-1/2 left-1/2 rounded-full",
                        i % 2 === 0 ? "w-2 h-2 bg-cyan-400" : "w-1 h-1 bg-blue-300"
                    )}
                />
            ))}
        </div>
    );
};

export function TransactionProgress({
    open,
    currentStep,
    status,
    error,
    onClose,
    onRetry
}: TransactionProgressProps) {
    const [elapsed, setElapsed] = useState(0);
    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    useEffect(() => {
        if (status === "processing" && open) {
            const timer = setInterval(() => setElapsed(e => e + 1), 1000);
            return () => clearInterval(timer);
        }
        setElapsed(0);
    }, [status, open]);

    return (
        <Dialog open={open} onOpenChange={() => { if (status !== "processing") onClose?.(); }}>
            <DialogContent
                className="sm:max-w-md overflow-hidden bg-white/80 backdrop-blur-3xl border-white/40 shadow-2xl p-0 ring-1 ring-black/5"
                id="tx-progress-dialog"
            >
                {/* 3D Animated Background Mesh */}
                <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.2, 1],
                            x: [0, 50, 0]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-cyan-300/30 to-blue-400/30 rounded-full blur-3xl mix-blend-multiply"
                    />
                    <motion.div
                        animate={{
                            rotate: [360, 0],
                            scale: [1, 1.3, 1],
                            x: [0, -50, 0]
                        }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/30 to-pink-300/30 rounded-full blur-3xl mix-blend-multiply"
                    />
                </div>

                <div className="relative p-6 z-10">
                    {/* Header Status */}
                    <div className="text-center mb-8 relative">
                        <motion.div
                            key={status}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="inline-flex items-center justify-center mb-4 relative"
                        >
                            {/* Ambient Glow */}
                            {status === "processing" && (
                                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
                            )}

                            {status === "error" ? (
                                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-inner">
                                    <XCircle className="w-8 h-8" />
                                </div>
                            ) : status === "success" ? (
                                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 shadow-inner">
                                    <Sparkles className="w-8 h-8 fill-green-200 animate-pulse" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-inner relative overflow-hidden">
                                    {/* Spinning border effect */}
                                    <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-2xl border-t-cyan-500 animate-spin" />
                                    <Loader2 className="w-8 h-8 animate-spin-slow" />
                                </div>
                            )}
                        </motion.div>

                        <motion.h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {status === "error" ? "Transaction Failed" :
                                status === "success" ? "Record Verified!" :
                                    "Processing Securely"}
                        </motion.h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {elapsed > 0 && status === "processing" ? `${elapsed}s elapsed` :
                                status === "success" ? "Your data is now on the blockchain." : "Please do not close this window."}
                        </p>
                    </div>

                    {/* Premium 3D Stepper */}
                    <div className="space-y-3 relative pl-4 pr-2 perspective-[1000px]">
                        {/* The "Liquid" Line */}
                        <div className="absolute left-[27px] top-4 bottom-8 w-0.5 bg-slate-100/50 rounded-full z-0 overflow-hidden">
                            <motion.div
                                className="w-full bg-gradient-to-b from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                initial={{ height: "0%" }}
                                animate={{ height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                        </div>

                        {STEPS.map((step, idx) => {
                            const isActive = idx === currentStepIndex;
                            const isCompleted = idx < currentStepIndex || status === "success";
                            const isError = isActive && status === "error";

                            return (
                                <motion.div
                                    key={step.id}
                                    layout
                                    initial={{ opacity: 0, x: -20, rotateX: 10 }}
                                    animate={{
                                        opacity: idx > currentStepIndex + 1 ? 0.4 : 1,
                                        x: 0,
                                        rotateX: isActive ? 0 : 5,
                                        scale: isActive ? 1.02 : 1,
                                        z: isActive ? 20 : 0
                                    }}
                                    className={cn(
                                        "relative flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-500 z-10 transform-style-3d",
                                        isActive ? "bg-white/60 shadow-lg shadow-cyan-900/5 border border-white/60 backdrop-blur-md" : "hover:bg-white/20"
                                    )}
                                >
                                    {/* Step Indicator */}
                                    <div className="relative flex-shrink-0">
                                        <motion.div
                                            animate={{
                                                scale: isActive ? [1, 1.1, 1] : 1,
                                                borderColor: isActive ? "rgba(6,182,212,0.5)" : "rgba(226,232,240,0.5)"
                                            }}
                                            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                                            className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10 relative bg-white",
                                                isCompleted ? "border-cyan-500 bg-cyan-500 text-white" :
                                                    isError ? "border-red-500 bg-red-500 text-white" :
                                                        isActive ? "border-cyan-500 text-cyan-500 shadow-md shadow-cyan-200" :
                                                            "border-slate-200 text-slate-300"
                                            )}
                                        >
                                            {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> :
                                                isError ? <XCircle className="w-3.5 h-3.5" /> :
                                                    <span className="text-[10px] font-bold">{idx + 1}</span>}
                                        </motion.div>

                                        {/* Pulse Ring for Active Step */}
                                        {isActive && status === "processing" && (
                                            <motion.div
                                                className="absolute inset-0 -m-1 rounded-full border border-cyan-400 opacity-30"
                                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                        )}

                                        {/* Success Particles */}
                                        {isCompleted && isActive && <SuccessParticles />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-sm font-semibold transition-colors truncate",
                                                isActive || isCompleted ? "text-slate-800" : "text-slate-400"
                                            )}>
                                                {step.label}
                                            </span>
                                            {isActive && status === "processing" && (
                                                <Loader2 className="w-3 h-3 text-cyan-500 animate-spin ml-2" />
                                            )}
                                        </div>

                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className={cn(
                                                        "text-xs mt-1 font-medium",
                                                        isError ? "text-red-500" : "text-cyan-600/80"
                                                    )}>
                                                        {isError ? error : step.description}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <AnimatePresence>
                        {status === "error" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 justify-end pt-6"
                            >
                                <Button variant="ghost" onClick={onClose} size="sm" className="text-slate-500 hover:text-slate-800">
                                    Cancel
                                </Button>
                                <Button onClick={onRetry} variant="destructive" size="sm" className="gap-2 shadow-lg shadow-red-200">
                                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                                </Button>
                            </motion.div>
                        )}
                        {status === "success" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="pt-6"
                            >
                                <Button onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-xl shadow-cyan-900/10 h-11 rounded-xl group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <Check className="w-4 h-4 mr-2" />
                                    Done & Close
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
