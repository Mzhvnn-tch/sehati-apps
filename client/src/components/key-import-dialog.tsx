import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Using Textarea for easier pasting
import { Label } from "@/components/ui/label";
import { Key, Upload, LockOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeyImportDialogProps {
    walletAddress: string;
    onSuccess: () => void;
}

export function KeyImportDialog({ walletAddress, onSuccess }: KeyImportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [keyInput, setKeyInput] = useState("");
    const { toast } = useToast();

    const handleImport = () => {
        if (!keyInput.trim()) {
            toast({ title: "Error", description: "Please enter your private key.", variant: "destructive" });
            return;
        }

        try {
            // Basic validation (check if it looks like a key)
            if (keyInput.length < 50) { // Arbitrary simple check
                toast({ title: "Invalid Key", description: "This key looks too short. Please check your backup file.", variant: "destructive" });
                return;
            }

            // Save to localStorage
            localStorage.setItem(`sehati_priv_${walletAddress}`, keyInput.trim());

            toast({ title: "Success", description: "Key imported successfully! Decrypting records..." });
            setIsOpen(false);
            setKeyInput("");
            onSuccess(); // Trigger parent reload/decrypt
        } catch (e) {
            toast({ title: "Error", description: "Failed to save key.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <LockOpen className="w-4 h-4" />
                    Restore Key
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Restore Access</DialogTitle>
                    <DialogDescription>
                        Paste your backed-up <strong>Private Key</strong> here to unlock your medical records.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Private Key</Label>
                        <Textarea
                            placeholder="Paste the key starting with { ... } or your long string here"
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            className="font-mono text-xs min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleImport}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import & Unlock
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
