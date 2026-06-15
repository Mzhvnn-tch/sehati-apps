import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPendingDoctors, approveDoctor } from "@/lib/api";
import { registerDoctorOnChain, registerPharmacistOnChain, useEthersSigner } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, ShieldAlert, ShieldCheck, Wallet, LogOut, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { ethers } from "ethers";
import { WalletConnect } from "@/components/wallet-connect";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";

export default function AdminDashboard() {
    const { user, loginWithSignature, isLoading: authLoading, disconnect: appDisconnect } = useAuth();
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const signer = useEthersSigner();
    const { address, isConnected } = useAccount();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loginRequired = isConnected && !user;

    const handleLogin = async () => {
        if (!signer || !address) return;
        setIsLoggingIn(true);
        try {
            const message = `Welcome to AuraMed Health Identity System!\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address: ${address}\nTimestamp: ${new Date().toISOString()}`;
            const signature = await signer.signMessage(message);
            const result = await loginWithSignature(address, signature, message);
            if (result.success) {
                toast({ title: "Admin Access Granted", description: "Welcome back." });
                // We'll let the query auto-fetch based on `user` state
            } else {
                toast({ title: "Login Failed", variant: "destructive", description: "Are you sure this is the admin wallet?" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsLoggingIn(false);
        }
    };

    const { data, isLoading, refetch, error } = useQuery({
        queryKey: ["pendingDoctors"],
        queryFn: getPendingDoctors,
        enabled: !!user,
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
            await appDisconnect();
            navigate("/");
            toast({ title: "Disconnected", description: "Successfully logged out." });
        } catch (e: any) {
            console.error("Disconnect error:", e);
        }
    };

    if (authLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!isConnected && !user) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200/40 via-white to-white" />
                
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="diamond-card max-w-md w-full p-10 rounded-3xl relative z-10 text-center"
                >
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-600 border border-slate-200 shadow-sm">
                        <ShieldAlert className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Admin Portal</h1>
                    <p className="text-slate-500 mb-8 font-medium">Authorized Personnel Only</p>
                    
                    <div className="flex justify-center mb-8 scale-110">
                        <WalletConnect />
                    </div>

                    <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-600" onClick={() => navigate("/")}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (loginRequired && address) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white shadow-xl rounded-3xl max-w-md w-full p-8 border border-slate-100 relative z-10 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-6 text-cyan-600 animate-pulse">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">Security Verification</h1>
                    <p className="text-slate-500 mb-8 font-light">
                        Sign the message to prove admin ownership.
                    </p>

                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-12 mb-4 rounded-xl shadow-md" onClick={handleLogin} disabled={isLoggingIn}>
                        {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Identity"}
                    </Button>

                    <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50" onClick={appDisconnect}>
                        Cancel
                    </Button>
                </motion.div>
            </div>
        );
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
                        <Button variant="outline" size="sm" onClick={appDisconnect} className="text-slate-600 border-slate-200">
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
