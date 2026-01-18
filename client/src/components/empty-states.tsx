import { motion } from "framer-motion";
import { FileQuestion, Inbox, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-50 to-purple-50 flex items-center justify-center mb-6">
                {icon || <Inbox className="w-10 h-10 text-muted-foreground/50" />}
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">{description}</p>
            {action && (
                <Button onClick={action.onClick} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
}

export function NoRecordsState({ onCreateClick }: { onCreateClick?: () => void }) {
    return (
        <EmptyState
            icon={<FileQuestion className="w-10 h-10 text-cyan-400" />}
            title="No Medical Records Yet"
            description="Your medical history will appear here once doctors add records. Share your QR code with healthcare providers to get started."
            action={onCreateClick ? {
                label: "Generate QR Code",
                onClick: onCreateClick
            } : undefined}
        />
    );
}

export function NoAccessGrantsState({ onGenerateClick }: { onGenerateClick?: () => void }) {
    return (
        <EmptyState
            icon={<Inbox className="w-10 h-10 text-purple-400" />}
            title="No Active Access Grants"
            description="Create a temporary access token to share your medical records securely with healthcare providers via QR code."
            action={onGenerateClick ? {
                label: "Create Access Token",
                onClick: onGenerateClick
            } : undefined}
        />
    );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
    return (
        <EmptyState
            icon={<AlertCircle className="w-10 h-10 text-red-400" />}
            title="Something Went Wrong"
            description="We couldn't load the data. Please check your connection and try again."
            action={onRetry ? {
                label: "Try Again",
                onClick: onRetry
            } : undefined}
        />
    );
}
