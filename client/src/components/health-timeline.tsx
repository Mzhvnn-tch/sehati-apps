import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Microscope, Pill, FileText, Search, Filter, ChevronDown, Lock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MedicalRecord } from "@shared/schema";
import { format } from "date-fns";

interface HealthTimelineProps {
    records: MedicalRecord[];
    onRecordClick?: (record: MedicalRecord) => void;
}

const getRecordIcon = (type: string) => {
    switch (type) {
        case 'lab_result':
            return Microscope;
        case 'prescription':
            return Pill;
        case 'diagnosis':
            return FileText;
        default:
            return Calendar;
    }
};

const getRecordColor = (type: string) => {
    switch (type) {
        case 'lab_result':
            return 'blue';
        case 'prescription':
            return 'emerald';
        case 'diagnosis':
            return 'purple';
        default:
            return 'gray';
    }
};

export function HealthTimeline({ records, onRecordClick }: HealthTimelineProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredRecords = useMemo(() => {
        let filtered = [...records];

        // Filter by type
        if (filterType) {
            filtered = filtered.filter(r => r.recordType === filterType);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(r =>
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [records, searchQuery, filterType]);

    const recordTypes = Array.from(new Set(records.map(r => r.recordType)));

    return (
        <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-slate-100/50 shadow-sm relative z-20">
                <div className="w-full lg:w-96 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                    <Input
                        placeholder="Search medical records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 bg-white/80 border-slate-200 focus-visible:ring-cyan-500 rounded-xl h-11 shadow-sm transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/80 rounded-xl w-full lg:w-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterType(null)}
                        className={`gap-2 rounded-lg px-4 font-semibold text-sm transition-all ${filterType === null ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        <Filter className="w-4 h-4" />
                        All
                    </Button>
                    {recordTypes.map(type => (
                        <Button
                            key={type}
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterType(type === filterType ? null : type)}
                            className={`capitalize rounded-lg px-4 font-semibold text-sm transition-all ${filterType === type ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            {type.replace('_', ' ')}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[1.375rem] md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-200 via-indigo-100 to-transparent" />

                <div className="space-y-8">
                        {filteredRecords.map((record, index) => {
                            const Icon = getRecordIcon(record.recordType);
                            const color = getRecordColor(record.recordType);
                            const isExpanded = expandedId === record.id;

                            return (
                                <div
                                    key={record.id}
                                    className="relative pl-20 animate-in fade-in slide-in-from-bottom-4 duration-500"
                                    style={{ animationFillMode: 'both' }}
                                >
                                    {/* Timeline Node */}
                                    <div
                                        className={`absolute left-0 md:left-4 w-11 h-11 rounded-full border-[3px] border-white flex items-center justify-center z-10 shadow-sm ring-4 ring-offset-2 ${isExpanded ? 'ring-offset-cyan-50 ring-cyan-200 scale-110' : 'ring-offset-white ring-slate-100'} transition-all hover:scale-110`}
                                        style={{
                                            backgroundColor: color === 'blue' ? '#3b82f6' :
                                                color === 'emerald' ? '#10b981' :
                                                    color === 'purple' ? '#a855f7' : '#6b7280',
                                            boxShadow: color === 'blue' ? '0 0 15px rgba(59,130,246,0.3)' :
                                                color === 'emerald' ? '0 0 15px rgba(16,185,129,0.3)' :
                                                    color === 'purple' ? '0 0 15px rgba(168,85,247,0.3)' : '0 0 15px rgba(107,114,128,0.3)',
                                            borderColor: 'white'
                                        }}
                                    >
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>

                                    {/* Record Card */}
                                    <div
                                        className={`bg-white border ${isExpanded ? 'border-cyan-200 shadow-lg' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-200/60 hover:-translate-y-0.5'} rounded-3xl p-6 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 relative overflow-hidden group`}
                                        id={`record-${record.id}`}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setExpandedId(isExpanded ? null : record.id);
                                                onRecordClick?.(record);
                                            }
                                        }}
                                        onClick={() => {
                                            setExpandedId(isExpanded ? null : record.id);
                                            onRecordClick?.(record);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-lg text-slate-900">
                                                        {record.title}
                                                    </h3>
                                                    <Badge
                                                        variant="outline"
                                                        className={`
                              ${color === 'blue' ? 'text-blue-700 border-blue-200 bg-blue-50' :
                                                                color === 'emerald' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                                                                    color === 'purple' ? 'text-purple-700 border-purple-200 bg-purple-50' :
                                                                        'text-slate-700 border-slate-200 bg-slate-50'}
                              capitalize px-3 py-1 font-semibold text-xs rounded-full
                            `}
                                                    >
                                                        {record.recordType.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(record.createdAt), 'PPP')}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="font-medium text-slate-600">{record.hospitalName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <div className="bg-slate-50/80 border border-slate-200/60 px-3 py-1.5 rounded-xl flex items-center gap-3 shadow-sm hover:shadow transition-all group">
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-50 border border-cyan-100/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                            <span className="text-cyan-700 font-black text-xs">{(record as any).doctorName?.charAt(0) || 'D'}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-800 tracking-tight">Dr. {(record as any).doctorName || 'Authorized Provider'}</span>
                                                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">DID: {(record as any).doctorWallet?.substring(0,8) || record.doctorId.substring(0,8)}...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronDown
                                                className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-cyan-600' : ''
                                                    }`}
                                            />
                                        </div>

                                        {/* Expanded Content */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-5 mt-5 border-t border-slate-100 space-y-4">
                                                        <div className="bg-gradient-to-br from-slate-50/80 to-white backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-inner">
                                                            <div className="text-sm text-slate-700 leading-relaxed">
                                                                {(() => {
                                                                    // @ts-ignore
                                                                    const contentToParse = record.decryptedContent;
                                                                    if (!contentToParse) {
                                                                        return <span className="font-mono text-slate-400 flex items-center gap-2"><Lock className="w-3 h-3" /> Encrypted Content (Please Unlock)</span>;
                                                                    }
                                                                    try {
                                                                        const parsed = JSON.parse(contentToParse);
                                                                        return (
                                                                            <div className="space-y-3">
                                                                                {parsed.diagnosis && (
                                                                                    <div><span className="font-bold text-slate-800 block mb-1">Diagnosis</span> {parsed.diagnosis}</div>
                                                                                )}
                                                                                {parsed.prescription && (
                                                                                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50"><span className="font-bold text-blue-800 block mb-1 flex items-center gap-2"><Pill className="w-3 h-3"/> Prescription</span> <span className="font-mono text-blue-900">{parsed.prescription}</span></div>
                                                                                )}
                                                                                {parsed.allergies && (
                                                                                    <div className="bg-red-50/50 p-3 rounded-lg border border-red-100/50"><span className="font-bold text-red-800 block mb-1 flex items-center gap-2"><AlertTriangle className="w-3 h-3"/> Allergies</span> <span className="font-medium text-red-900">{parsed.allergies}</span></div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    } catch {
                                                                        return <span className="whitespace-pre-line">{contentToParse}</span>;
                                                                    }
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {record.blockchainHash && (
                                                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider mt-4">
                                                                <a 
                                                                    href={`https://sepolia.etherscan.io/tx/${record.blockchainHash}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="font-mono bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-cyan-200 shadow-sm flex items-center gap-1.5 transition-all relative z-10"
                                                                    title="View transaction on Sepolia Etherscan"
                                                                >
                                                                    TX: {record.blockchainHash.substring(0, 16)}...
                                                                    <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                                </a>
                                                                {record.ipfsHash && (
                                                                    <a 
                                                                        href={`https://ipfs.io/ipfs/${record.ipfsHash}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="font-mono bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-emerald-200 shadow-sm flex items-center gap-1.5 transition-all relative z-10"
                                                                        title="View encrypted payload on IPFS"
                                                                    >
                                                                        IPFS: {record.ipfsHash.substring(0, 16)}...
                                                                        <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Empty State */}
                {filteredRecords.length === 0 && (
                    <div
                        className="text-center py-12"
                    >
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">
                            {searchQuery || filterType
                                ? 'No records found matching your criteria'
                                : 'No medical records yet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
