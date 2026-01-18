import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Microscope, Pill, FileText, Search, Filter, ChevronDown } from "lucide-react";
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
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search medical records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterType === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterType(null)}
                        className="gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        All
                    </Button>
                    {recordTypes.map(type => (
                        <Button
                            key={type}
                            variant={filterType === type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterType(type === filterType ? null : type)}
                            className="capitalize"
                        >
                            {type.replace('_', ' ')}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-200 via-purple-200 to-pink-200" />

                <div className="space-y-8">
                    <AnimatePresence>
                        {filteredRecords.map((record, index) => {
                            const Icon = getRecordIcon(record.recordType);
                            const color = getRecordColor(record.recordType);
                            const isExpanded = expandedId === record.id;

                            return (
                                <motion.div
                                    key={record.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative pl-20"
                                >
                                    {/* Timeline Node */}
                                    <motion.div
                                        className={`absolute left-4 w-8 h-8 rounded-full bg-${color}-500 border-4 border-white shadow-lg flex items-center justify-center z-10`}
                                        whileHover={{ scale: 1.2 }}
                                        style={{
                                            backgroundColor: color === 'blue' ? '#3b82f6' :
                                                color === 'emerald' ? '#10b981' :
                                                    color === 'purple' ? '#a855f7' : '#6b7280'
                                        }}
                                    >
                                        <Icon className="w-4 h-4 text-white" />
                                    </motion.div>

                                    {/* Record Card */}
                                    <motion.div
                                        className="diamond-card rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all"
                                        onClick={() => {
                                            setExpandedId(isExpanded ? null : record.id);
                                            onRecordClick?.(record);
                                        }}
                                        whileHover={{ y: -2 }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-lg text-slate-800">
                                                        {record.title}
                                                    </h3>
                                                    <Badge
                                                        variant="outline"
                                                        className={`
                              ${color === 'blue' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                                                color === 'emerald' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                                                                    color === 'purple' ? 'text-purple-600 border-purple-200 bg-purple-50' :
                                                                        'text-gray-600 border-gray-200 bg-gray-50'}
                              capitalize
                            `}
                                                    >
                                                        {record.recordType.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(record.createdAt), 'PPP')}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{record.hospitalName}</span>
                                                </div>
                                            </div>
                                            <ChevronDown
                                                className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''
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
                                                    <div className="pt-4 mt-4 border-t border-slate-200 space-y-3">
                                                        <div className="bg-slate-50 rounded-lg p-4">
                                                            <p className="text-sm text-slate-600 font-mono">
                                                                {record.encryptedContent ? 'Encrypted Content' : 'No content available'}
                                                            </p>
                                                        </div>

                                                        {record.blockchainHash && (
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span className="font-mono bg-purple-50 px-2 py-1 rounded border border-purple-200">
                                                                    TX: {record.blockchainHash.substring(0, 10)}...
                                                                </span>
                                                                {record.ipfsHash && (
                                                                    <span className="font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                                                        IPFS: {record.ipfsHash.substring(0, 10)}...
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {filteredRecords.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">
                            {searchQuery || filterType
                                ? 'No records found matching your criteria'
                                : 'No medical records yet'}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
