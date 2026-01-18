import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
}

export function LoadingOverlay({ isLoading, message = "Loading..." }: LoadingOverlayProps) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="diamond-card p-8 rounded-2xl flex flex-col items-center gap-4 min-w-[300px]"
                    >
                        <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
                        <p className="text-slate-700 font-medium">{message}</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

interface ProgressIndicatorProps {
    value: number;
    max: number;
    label?: string;
}

export function ProgressIndicator({ value, max, label }: ProgressIndicatorProps) {
    const percentage = (value / max) * 100;

    return (
        <div className="w-full space-y-2">
            {label && <p className="text-sm text-muted-foreground">{label}</p>}
            <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>
            <p className="text-xs text-muted-foreground text-right">
                {value} / {max}
            </p>
        </div>
    );
}

export function Spinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
    const sizeClasses = {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8"
    };

    return <Loader2 className={`${sizeClasses[size]} animate-spin text-cyan-600`} />;
}

interface ToastStatusProps {
    type: "success" | "error" | "warning";
    message: string;
}

export function ToastStatus({ type, message }: ToastStatusProps) {
    const config = {
        success: {
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-200"
        },
        error: {
            icon: XCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200"
        },
        warning: {
            icon: AlertTriangle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200"
        }
    };

    const { icon: Icon, color, bg, border } = config[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${bg} ${border} border-2 rounded-xl p-4 flex items-center gap-3`}
        >
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-sm font-medium text-slate-800">{message}</p>
        </motion.div>
    );
}
