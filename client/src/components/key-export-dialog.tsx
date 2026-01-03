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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, Key, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeyExportDialogProps {
    walletAddress: string;
}

export function KeyExportDialog({ walletAddress }: KeyExportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const { toast } = useToast();

    const getPrivateKey = () => {
        return localStorage.getItem(`sehati_priv_${walletAddress}`) || "";
    };

    const handleCopy = () => {
        const key = getPrivateKey();
        if (key) {
            navigator.clipboard.writeText(key);
            toast({ title: "Copied!", description: "Private key copied to clipboard." });
        } else {
            toast({ title: "Error", description: "No private key found.", variant: "destructive" });
        }
    };

    const handleDownload = () => {
        const key = getPrivateKey();
        if (!key) {
            toast({ title: "Error", description: "No private key found.", variant: "destructive" });
            return;
        }

        const element = document.createElement("a");
        const file = new Blob([key], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `sehati-backup-key-${walletAddress.substring(0, 6)}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast({ title: "Downloaded", description: "Key file saved." });
    };

    const privateKey = getPrivateKey();

    if (!privateKey) return null; // Don't show if no key exists

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 gap-2 text-amber-600 border-amber-200 hover:bg-amber-50">
                    <Key className="w-4 h-4" />
                    Backup Key
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <ShieldAlert className="w-5 h-5" />
                        Security Warning
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        This key grants complete access to your medical records.
                        <br />
                        <strong>NEVER share this with anyone.</strong> Store it offline in a secure place.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Your Private Key</Label>
                        <div className="relative">
                            <Input
                                readOnly
                                type={showKey ? "text" : "password"}
                                value={privateKey}
                                className="pr-20 font-mono text-xs"
                            />
                            <div className="absolute right-0 top-0 h-full flex items-center pr-1 gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "Hide private key" : "Show private key"}>
                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleCopy} aria-label="Copy private key to clipboard">
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-start gap-2">
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download .txt
                    </Button>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
