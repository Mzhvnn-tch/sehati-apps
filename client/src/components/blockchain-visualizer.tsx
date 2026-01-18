import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ExternalLink, Blocks, Clock, Hash, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface Transaction {
    hash: string;
    blockNumber: number;
    timestamp: number;
    status: "pending" | "confirmed" | "failed";
    type: "record_created" | "access_granted" | "permission_revoked";
}

interface BlockchainVisualizerProps {
    transactions?: Transaction[];
}

// Simulated transaction for demo
const generateMockTransactions = (): Transaction[] => {
    return [
        {
            hash: "0xa2b3...d4e5",
            blockNumber: 482910,
            timestamp: Date.now() - 5000,
            status: "confirmed",
            type: "record_created"
        },
        {
            hash: "0xf5g6...h7i8",
            blockNumber: 482911,
            timestamp: Date.now() - 3000,
            status: "confirmed",
            type: "access_granted"
        },
        {
            hash: "0xj9k0...l1m2",
            blockNumber: 482912,
            timestamp: Date.now() - 1000,
            status: "pending",
            type: "record_created"
        }
    ];
};

const getTypeColor = (type: string) => {
    switch (type) {
        case "record_created":
            return "bg-blue-500";
        case "access_granted":
            return "bg-emerald-500";
        case "permission_revoked":
            return "bg-red-500";
        default:
            return "bg-gray-500";
    }
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case "record_created":
            return "Record Created";
        case "access_granted":
            return "Access Granted";
        case "permission_revoked":
            return "Permission Revoked";
        default:
            return type;
    }
};

export function BlockchainVisualizer({ transactions: propTransactions }: BlockchainVisualizerProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(propTransactions || generateMockTransactions());
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    useEffect(() => {
        // Simulate new transaction every 10 seconds
        const interval = setInterval(() => {
            const newTx: Transaction = {
                hash: `0x${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 8)}`,
                blockNumber: 482912 + Math.floor(Math.random() * 10),
                timestamp: Date.now(),
                status: "pending",
                type: ["record_created", "access_granted"][Math.floor(Math.random() * 2)] as any
            };

            setTransactions(prev => [newTx, ...prev].slice(0, 10)); // Keep last 10

            // Confirm after 2 seconds
            setTimeout(() => {
                setTransactions(prev => prev.map(tx =>
                    tx.hash === newTx.hash ? { ...tx, status: "confirmed" } : tx
                ));
            }, 2000);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Blocks className="w-6 h-6 text-purple-600" />
                        Blockchain Activity
                    </h3>
                    <p className="text-sm text-muted-foreground">Real-time transactions on Lisk Sepolia</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 font-medium">Live</span>
                </div>
            </div>

            {/* Network Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Latest Block</p>
                            <p className="text-lg font-bold text-slate-800">#482,912</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Gas Price</p>
                            <p className="text-lg font-bold text-slate-800">0.02 Gwei</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Block Time</p>
                            <p className="text-lg font-bold text-slate-800">12s</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Transaction Stream */}
            <Card className="p-6">
                <h4 className="font-semibold text-slate-800 mb-4">Recent Transactions</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    <AnimatePresence>
                        {transactions.map((tx, index) => (
                            <motion.div
                                key={tx.hash}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTx?.hash === tx.hash
                                        ? 'bg-cyan-50 border-cyan-200 shadow-md'
                                        : 'bg-slate-50 border-slate-200 hover:border-cyan-200 hover:shadow-sm'
                                    }`}
                                onClick={() => setSelectedTx(tx)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${getTypeColor(tx.type)}`} />
                                        <span className="font-mono text-sm font-medium text-slate-700">{tx.hash}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {getTypeLabel(tx.type)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {tx.status === "confirmed" && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        )}
                                        {tx.status === "pending" && (
                                            <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                                        )}
                                        <span className={`text-xs font-medium ${tx.status === "confirmed" ? "text-emerald-600" : "text-amber-600"
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Block #{tx.blockNumber.toLocaleString()}</span>
                                    <span>•</span>
                                    <span>{Math.floor((Date.now() - tx.timestamp) / 1000)}s ago</span>
                                    <span className="ml-auto">
                                        <ExternalLink className="w-3 h-3 inline mr-1" />
                                        View
                                    </span>
                                </div>

                                {selectedTx?.hash === tx.hash && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs"
                                    >
                                        <div>
                                            <p className="text-muted-foreground mb-1">Block Number</p>
                                            <p className="font-mono font-medium">{tx.blockNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Timestamp</p>
                                            <p className="font-mono font-medium">
                                                {new Date(tx.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground mb-1">Transaction Hash</p>
                                            <p className="font-mono font-medium break-all">{tx.hash}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    );
}
