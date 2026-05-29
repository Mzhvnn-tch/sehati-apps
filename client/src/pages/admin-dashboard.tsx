import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPendingDoctors, approveDoctor } from "@/lib/api";
import { registerDoctorOnChain, registerPharmacistOnChain, useEthersSigner } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, ShieldAlert, Wallet, LogOut, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { AppKitButton } from "@reown/appkit/react"; // Use AppKit connect button
import { ethers } from "ethers";
import { useAccount, useSwitchChain } from "wagmi"; // Added imports

export default function AdminDashboard() {
    const { user, isLoading: authLoading, disconnect } = useAuth();
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const signer = useEthersSigner();
    const { isConnected, chainId } = useAccount(); // Added hooks
    const { switchChain } = useSwitchChain(); // Added hook
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Hardcoded admin check for client-side redirection
    // Ideally this comes from a "role" in the user object or a specific capability
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/");
        }
    }, [user, authLoading, navigate]);

    // Network Check Effect
    useEffect(() => {
        const chainIdNumber = Number(chainId);
        if (isConnected && chainIdNumber && chainIdNumber !== 11155111) {
            toast({ title: "Wrong Network", description: "Switching to Ethereum Sepolia...", duration: 3000 });
            try {
                switchChain({ chainId: 11155111 });
            } catch (e) {
                console.error("Auto-switch failed:", e);
            }
        }
    }, [isConnected, chainId, switchChain]);

    const { data, isLoading, refetch, error } = useQuery({
        queryKey: ["pendingDoctors"],
        queryFn: getPendingDoctors,
        enabled: !!user, // Only fetch if user is logged in
        retry: false, // Don't retry if 403 Forbidden
    });

    const handleApprove = async (doctor: any) => {
        if (!signer) {
            toast({ title: "Error", description: "Please connect your wallet first", variant: "destructive" });
            return;
        }

        setProcessingId(doctor.id);
        try {
            // 1. Blockchain Transaction
            toast({
                title: "Step 1/2: Blockchain Approval",
                description: `Please confirm the transaction in your wallet to whitelist this ${doctor.role} on-chain.`,
                duration: 10000
            });

            let tx;
            let isAlreadyRegistered = false;
            try {
                if (doctor.role === "pharmacist") {
                    tx = await registerPharmacistOnChain(signer, doctor.walletAddress);
                } else {
                    tx = await registerDoctorOnChain(signer, doctor.walletAddress);
                }
            } catch (e: any) {
                if (e.message.includes("Already registered")) {
                    isAlreadyRegistered = true;
                    console.log("User already registered on-chain. Syncing database...");
                } else if (e.message.includes("AccessControl")) {
                    throw new Error("Your wallet is not the Admin of the Smart Contract.");
                } else {
                    throw e;
                }
            }

            if (!isAlreadyRegistered && tx) {
                console.log("Approval Tx:", tx.hash);

                toast({
                    title: "Step 2/3: Waiting for Blockchain...",
                    description: `Transaction sent (${tx.hash.slice(0, 8)}...). Waiting for block confirmation...`,
                    duration: 15000
                });

                // CRITICAL FIX: Wait for the transaction to be mined before updating the DB!
                await tx.wait();
            }

            // 2. Backend Update
            toast({
                title: isAlreadyRegistered ? "Syncing Database" : "Step 3/3: Updating Database",
                description: isAlreadyRegistered ? "User already approved on-chain. Syncing..." : `Transaction confirmed! Updating verification status...`
            });

            await approveDoctor(doctor.id, tx?.hash || "0x_already_registered_on_chain");

            toast({
                title: "Success",
                description: `${doctor.role === 'pharmacist' ? 'Pharmacist' : 'Doctor'} ${doctor.name} has been approved and verified!`,
            });

            refetch();
        } catch (e: any) {
            console.error("Approval error:", e);
            toast({
                title: "Approval Failed",
                description: e.message || "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
            navigate("/");
            toast({ title: "Disconnected", description: "Successfully logged out." });
        } catch (e: any) {
            console.error("Disconnect error:", e);
        }
    };

    if (authLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="text-slate-500">Manage doctor approvals and system settings</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
                            <Wallet className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium">{user?.walletAddress.slice(0, 6)}...{user?.walletAddress.slice(-4)}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-slate-600 border-slate-200">
                            <LogOut className="h-4 w-4 mr-2" />
                            Disconnect
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-amber-500" />
                                Pending Approvals
                            </CardTitle>
                            <CardDescription>
                                Doctors waiting for whitelisting and verification.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>
                            ) : error ? (
                                <div className="text-center py-12 bg-red-50/50 rounded-lg border border-red-100 border-dashed">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                                    <p className="font-bold text-red-700 text-lg">Access Denied</p>
                                    <p className="text-sm text-red-600/80 mt-1 max-w-sm mx-auto">
                                        Your currently connected wallet ({user?.walletAddress.slice(0,6)}...{user?.walletAddress.slice(-4)}) is not authorized as an Admin.
                                    </p>
                                    <Button onClick={handleDisconnect} variant="outline" className="mt-6 border-red-200 text-red-700 hover:bg-red-50">
                                        Switch Wallet
                                    </Button>
                                </div>
                            ) : data?.doctors?.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                                    <p className="font-medium">All caught up!</p>
                                    <p className="text-sm">No pending doctor registrations.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {data?.doctors.map((doctor: any) => (
                                        <div key={doctor.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border rounded-xl shadow-sm gap-4 transition-all hover:shadow-md">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold">
                                                    DR
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{doctor.name}</h3>
                                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm text-slate-500">
                                                        <span className="font-mono bg-slate-100 px-1 rounded">{doctor.walletAddress.slice(0, 8)}...</span>
                                                        <span>{doctor.hospital || "No Hospital Specified"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => handleApprove(doctor)}
                                                disabled={!!processingId}
                                                className={processingId === doctor.id ? "min-w-[100px]" : "bg-emerald-600 hover:bg-emerald-700 min-w-[100px]"}
                                            >
                                                {processingId === doctor.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Approve
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-slate-500">Pending Requests</span>
                                    <span className="font-bold text-xl">{data?.doctors?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-slate-500">Contract</span>
                                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">0x89D5...e909</span>
                                </div>
                                <div className="pt-2">
                                    <p className="text-xs text-slate-400 italic">
                                        Note: Approving a doctor incurs a gas fee on the Ethereum Sepolia network.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
