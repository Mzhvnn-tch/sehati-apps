import { MedicalRecord, User } from "@shared/schema";
import { format } from "date-fns";
import { ExternalLink, Stethoscope, FileText, Pill, AlertTriangle, ShieldCheck, Activity, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MedicalHistoryBlockProps {
    record: MedicalRecord & { decryptedContent: string };
    doctor?: User | null;
    compact?: boolean;
}

export function MedicalHistoryBlock({ record, doctor, compact = false }: MedicalHistoryBlockProps) {
    let data: { diagnosis?: string; prescription?: string; allergies?: string; content?: string; vitals?: any } = {};
    let isEncrypted = false;

    try {
        if (!record.decryptedContent) throw new Error("Missing decrypted content");
        const parsed = JSON.parse(record.decryptedContent);
        if (parsed === null) data = {};
        else if (typeof parsed === 'string') data = { diagnosis: parsed };
        else data = parsed;
    } catch (e) {
        // If it's not JSON, it's genuinely encrypted/locked
        isEncrypted = true;
    }

    const diagnosisText = data.diagnosis || data.content || "No detailed diagnosis.";
    const prescriptionText = data.prescription;
    const allergiesText = data.allergies;

    return (
        <div className="bg-[#020617] border-2 border-[#020617] rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] hover:shadow-[6px_6px_0px_0px_rgba(203,213,225,1)] transition-all">
            <div className={`flex ${compact ? 'flex-col' : 'flex-col xl:flex-row'} justify-between items-start gap-6`}>
                {/* LEFT: Meta info */}
                <div className={`flex-shrink-0 ${compact ? 'w-full' : 'min-w-[200px]'} border-l-4 border-slate-600 pl-4`}>
                    <h3 className="font-heading text-lg font-medium text-white uppercase tracking-tight mb-3">
                        {record.recordType.replace("_", " ")}
                    </h3>
                    <div className="space-y-2 font-mono text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {(() => {
                                const dateNum = Number(record.createdAt);
                                const dateObj = new Date(isNaN(dateNum) ? record.createdAt : dateNum);
                                return isNaN(dateObj.getTime()) ? "Unknown Date" : format(dateObj, "dd MMM yyyy");
                            })()}
                        </div>
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-3 h-3 text-slate-400" />
                            {doctor ? `Dr. ${doctor.name}` : "Attending Physician"}
                        </div>
                        <div className="text-slate-300">
                            {record.hospitalName}
                        </div>
                    </div>
                </div>

                {/* CENTER: Clinical Content */}
                <div className="flex-1 space-y-6 w-full overflow-hidden">
                    <div>
                        <h4 className="font-heading text-xl text-white mb-2">{record.title}</h4>
                        
                        {isEncrypted ? (
                            <div className="mt-4 p-6 bg-[#020617] border border-slate-800 relative overflow-hidden group">
                                {/* Animated effect for locked state */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(51,65,85,0.1)_50%,transparent_100%)] bg-[length:100%_4px] animate-pulse opacity-50" />
                                
                                <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3 py-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500">
                                        <Lock className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <h5 className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">Confidential Record</h5>
                                    <p className="font-serif text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
                                        This clinical history is protected for patient privacy. The patient must grant explicit access to view past records.
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-slate-700 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800/50">
                                        <ShieldCheck className="w-3 h-3" /> Secured Privacy Record
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="font-serif text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                                {diagnosisText}
                            </p>
                        )}
                    </div>

                    {!isEncrypted && prescriptionText && (
                        <div className="bg-white/5 border border-white/10 p-4">
                            <div className="flex items-center gap-2 mb-2 font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400">
                                <Pill className="w-3 h-3" /> Prescription Protocol
                            </div>
                            <p className="font-mono text-xs text-white whitespace-pre-wrap break-words leading-relaxed">
                                {prescriptionText}
                            </p>
                        </div>
                    )}

                    {!isEncrypted && allergiesText && (
                        <div className="bg-red-950/30 border border-red-900/50 p-4">
                            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-red-500 mb-2">
                                <AlertTriangle className="w-3 h-3" /> Contraindications / Alerts
                            </div>
                            <p className="font-mono text-xs text-red-200 font-bold leading-relaxed uppercase whitespace-pre-wrap break-words">
                                {allergiesText}
                            </p>
                        </div>
                    )}

                    {!isEncrypted && data.vitals && (data.vitals.heartRate || data.vitals.bloodPressure) && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">
                                <Activity className="w-3 h-3" /> Recorded Telemetry
                            </div>
                            <div className={`grid grid-cols-2 ${compact ? '' : 'sm:grid-cols-4'} gap-3`}>
                                {data.vitals.heartRate && (
                                    <div className="bg-white/5 border border-white/10 p-3 text-center">
                                        <span className="block font-mono text-[9px] text-slate-400 uppercase tracking-widest mb-1">HR</span>
                                        <span className="font-mono text-lg font-bold text-white leading-none">{data.vitals.heartRate}</span>
                                        <span className="font-mono text-[8px] text-slate-500 ml-1">bpm</span>
                                    </div>
                                )}
                                {data.vitals.bloodPressure && (
                                    <div className="bg-white/5 border border-white/10 p-3 text-center">
                                        <span className="block font-mono text-[9px] text-slate-400 uppercase tracking-widest mb-1">BP</span>
                                        <span className="font-mono text-lg font-bold text-white leading-none">{data.vitals.bloodPressure}</span>
                                        <span className="font-mono text-[8px] text-slate-500 ml-1">mmHg</span>
                                    </div>
                                )}
                                {data.vitals.temperature && (
                                    <div className="bg-white/5 border border-white/10 p-3 text-center">
                                        <span className="block font-mono text-[9px] text-slate-400 uppercase tracking-widest mb-1">Temp</span>
                                        <span className="font-mono text-lg font-bold text-white leading-none">{data.vitals.temperature}</span>
                                        <span className="font-mono text-[8px] text-slate-500 ml-1">°C</span>
                                    </div>
                                )}
                                {data.vitals.weight && (
                                    <div className="bg-white/5 border border-white/10 p-3 text-center">
                                        <span className="block font-mono text-[9px] text-slate-400 uppercase tracking-widest mb-1">Weight</span>
                                        <span className="font-mono text-lg font-bold text-white leading-none">{data.vitals.weight}</span>
                                        <span className="font-mono text-[8px] text-slate-500 ml-1">kg</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Actions (Stacked to avoid overflow) */}
                <div className={`flex-shrink-0 flex ${compact ? 'flex-row w-full justify-between' : 'xl:flex-col items-start xl:items-end'} gap-3 mt-4 ${compact ? '' : 'xl:mt-0 border-t xl:border-t-0'} border-slate-800 pt-4 ${compact ? '' : 'xl:pt-0'}`}>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] font-mono uppercase tracking-widest font-bold h-9 px-3 rounded-none border-slate-700 bg-transparent text-slate-300 hover:bg-white hover:text-[#020617] transition-colors"
                        onClick={() => window.open(`https://sepolia.etherscan.io/tx/${record.blockchainHash}`, '_blank')}
                    >
                        <ExternalLink className="w-3 h-3 mr-2" /> Audit Trail
                    </Button>
                    
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 border border-white/10">
                        <Lock className="w-3 h-3 text-slate-300" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white">Verified Record</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
