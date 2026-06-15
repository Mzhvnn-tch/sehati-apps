import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Search, Filter, ChevronDown, Lock, ShieldAlert, Pill, FileText, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { MedicalRecord } from "@shared/schema";
import { format } from "date-fns";

interface HealthTimelineProps {
    records: MedicalRecord[];
    onRecordClick?: (record: MedicalRecord) => void;
}

export function HealthTimeline({ records, onRecordClick }: HealthTimelineProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredRecords = useMemo(() => {
        let filtered = [...records];
        if (filterType) filtered = filtered.filter(r => r.recordType === filterType);
        if (searchQuery) {
            filtered = filtered.filter(r =>
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.hospitalName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [records, searchQuery, filterType]);

    const recordTypes = Array.from(new Set(records.map(r => r.recordType)));

    return (
        <div className="space-y-12 w-full font-sans text-[#020617]">
            {/* Search and Filter Tape */}
            <div className="flex flex-col lg:flex-row gap-0 items-stretch border border-[#020617] bg-[#fafafa]">
                <div className="w-full lg:w-1/2 relative border-b lg:border-b-0 lg:border-r border-[#020617] group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#020617] transition-colors" />
                    <Input
                        placeholder="INDEX SEARCH..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-14 bg-transparent border-none rounded-none h-16 font-mono text-xs uppercase tracking-widest focus-visible:ring-0 placeholder:text-slate-400 text-[#020617]"
                    />
                </div>
                <div className="flex flex-1 divide-x divide-[#020617] overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setFilterType(null)}
                        className={`px-8 h-16 font-mono text-[10px] uppercase tracking-[0.2em] font-bold shrink-0 transition-colors ${filterType === null ? 'bg-[#020617] text-white' : 'hover:bg-slate-100'}`}
                    >
                        All Records
                    </button>
                    {recordTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type === filterType ? null : type)}
                            className={`px-8 h-16 font-mono text-[10px] uppercase tracking-[0.2em] font-bold shrink-0 transition-colors ${filterType === type ? 'bg-[#020617] text-white' : 'hover:bg-slate-100'}`}
                        >
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline List */}
            <div className="space-y-8 mt-8">
                        {filteredRecords.map((record, index) => {
                            const isExpanded = expandedId === record.id;
                            
                            // Extract data robustly
                            let parsed = {} as any;
                            // @ts-ignore
                            try { if (record.decryptedContent) parsed = JSON.parse(record.decryptedContent); } catch(e){}
                            const doctorName = (record as any).doctorName || parsed.doctorName || "Unknown Provider";
                            const hospitalName = record.hospitalName || parsed.hospital || "Unknown Hospital";

                            return (
                                <div
                                    key={record.id}
                                    className="group relative border-2 border-[#020617] bg-white p-8 md:p-10 hover:shadow-[8px_8px_0px_0px_rgba(2,6,23,1)] transition-all duration-300 cursor-pointer hover:-translate-y-1"
                                    onClick={() => {
                                        setExpandedId(isExpanded ? null : record.id);
                                        onRecordClick?.(record);
                                    }}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                                <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold px-3 py-1 bg-[#020617] text-white">
                                                    {record.recordType.replace('_', ' ')}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                    {format(new Date(record.createdAt), 'dd MMM yyyy')}
                                                </span>
                                                <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-600">
                                                    <div className="w-1.5 h-1.5 bg-[#020617]" />
                                                    {hospitalName}
                                                </span>
                                            </div>
                                            
                                            <h3 className="font-heading text-3xl md:text-4xl mb-4 text-[#020617]">
                                                {record.title}
                                            </h3>
                                            
                                            {/* Preview details so it reads more detailed without expanding */}
                                            {(!isExpanded && parsed.diagnosis) && (
                                                <p className="text-slate-600 mb-6 text-sm md:text-base border-l-[3px] border-[#020617] pl-4">{parsed.diagnosis}</p>
                                            )}
                                            
                                            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-widest text-slate-600">
                                                <span className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 border border-[#020617]" />
                                                    DR. {doctorName}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-end shrink-0">
                                            <div className={`w-12 h-12 border border-[#020617] flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-[#020617] text-white' : 'bg-white group-hover:bg-[#020617] group-hover:text-white'}`}>
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content Drawer */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                className="overflow-hidden px-6 md:px-0"
                                            >
                                                <div className="mt-8 border border-[#020617] bg-[#fafafa] p-8 md:p-12 relative">
                                                    {/* Decorative corners */}
                                                    <div className="absolute top-0 left-0 w-2 h-2 bg-[#020617]" />
                                                    <div className="absolute top-0 right-0 w-2 h-2 bg-[#020617]" />
                                                    <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#020617]" />
                                                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#020617]" />

                                                    <div className="mb-8 border-b border-[#020617]/10 pb-4">
                                                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500">Decrypted Payload</span>
                                                    </div>

                                                    <div className="font-sans text-sm leading-relaxed text-[#020617] space-y-6">
                                                        {(() => {
                                                            // @ts-ignore
                                                            const contentToParse = record.decryptedContent;
                                                            if (!contentToParse) {
                                                                return (
                                                                    <div className="flex items-center gap-3 p-4 border border-dashed border-[#020617]/30 bg-slate-50">
                                                                        <Lock className="w-4 h-4" /> 
                                                                        <span className="font-mono text-xs uppercase tracking-widest font-bold">Encrypted Content (Awaiting Keystore Unlock)</span>
                                                                    </div>
                                                                );
                                                            }
                                                            try {
                                                                const parsed = JSON.parse(contentToParse);
                                                                return (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                        {parsed.diagnosis && (
                                                                            <div className="border-l-[3px] border-[#020617] pl-4">
                                                                                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block mb-2">Diagnosis</span> 
                                                                                <div className="text-lg">{parsed.diagnosis}</div>
                                                                            </div>
                                                                        )}
                                                                        {parsed.prescription && (
                                                                            <div className="border-l-[3px] border-[#020617] pl-4">
                                                                                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block mb-2">Prescription</span> 
                                                                                <div className="font-mono text-sm bg-white border border-[#020617]/10 p-3">{parsed.prescription}</div>
                                                                            </div>
                                                                        )}
                                                                        {parsed.allergies && (
                                                                            <div className="border-l-[3px] border-[#020617] pl-4">
                                                                                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block mb-2">Allergies / Warnings</span> 
                                                                                <div className="font-mono text-sm bg-white border border-[#020617]/10 p-3">{parsed.allergies}</div>
                                                                            </div>
                                                                        )}
                                                                        {parsed.notes && (
                                                                            <div className="border-l-[3px] border-[#020617] pl-4 md:col-span-2">
                                                                                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 block mb-2">Clinical Notes</span> 
                                                                                <div className="text-base text-slate-700 whitespace-pre-wrap">{parsed.notes}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            } catch {
                                                                return <span className="whitespace-pre-wrap font-mono text-xs">{contentToParse}</span>;
                                                            }
                                                        })()}
                                                    </div>

                                                    {/* Cryptographic Footprint */}
                                                    {(record.blockchainHash || record.ipfsHash) && (
                                                        <div className="mt-12 pt-6 border-t border-[#020617]/10 flex flex-wrap gap-4">
                                                            {record.blockchainHash && (
                                                                <a 
                                                                    href={`https://sepolia.etherscan.io/tx/${record.blockchainHash}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="group/link flex items-center gap-3 bg-white border border-[#020617] px-4 py-2 hover:bg-[#020617] hover:text-white transition-colors"
                                                                >
                                                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">ETH Signature</span>
                                                                    <span className="font-mono text-xs opacity-50 group-hover/link:opacity-100">{record.blockchainHash.substring(0, 8)}...</span>
                                                                    <ArrowUpRight className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                            {record.ipfsHash && (
                                                                <a 
                                                                    href={`https://ipfs.io/ipfs/${record.ipfsHash}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="group/link flex items-center gap-3 bg-white border border-[#020617] px-4 py-2 hover:bg-[#020617] hover:text-white transition-colors"
                                                                >
                                                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">IPFS CID</span>
                                                                    <span className="font-mono text-xs opacity-50 group-hover/link:opacity-100">{record.ipfsHash.substring(0, 8)}...</span>
                                                                    <ArrowUpRight className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                {/* Empty State */}
                {filteredRecords.length === 0 && (
                    <div className="text-center py-24 border-t border-[#020617]/20">
                        <FileText className="w-12 h-12 text-[#020617]/20 mx-auto mb-6" />
                        <h3 className="font-heading text-3xl text-[#020617] mb-2">No Records Found</h3>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                            {searchQuery || filterType
                                ? 'Adjust your index filters to view results.'
                                : 'The clinical archive is empty.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
