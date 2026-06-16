import { MedicalRecord, User } from "@shared/schema";
import { format } from "date-fns";
import { ExternalLink, Stethoscope, FileText, Pill, AlertTriangle, ShieldCheck, Activity, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MedicalHistoryBlockProps {
    record: MedicalRecord & { decryptedContent: string };
    doctor?: User | null;
}

export function MedicalHistoryBlock({ record, doctor }: MedicalHistoryBlockProps) {
    let data: { diagnosis?: string; prescription?: string; allergies?: string; content?: string; vitals?: any } = {};
    try {
        const parsed = JSON.parse(record.decryptedContent);
        if (parsed === null) data = {};
        else if (typeof parsed === 'string') data = { diagnosis: parsed };
        else data = parsed;
    } catch (e) {
        data = { diagnosis: record.decryptedContent };
    }

    const diagnosisText = data.diagnosis || data.content || "No detailed diagnosis.";
    const prescriptionText = data.prescription;
    const allergiesText = data.allergies;

    return (
        <div className="bg-[#020617] border-2 border-[#020617] rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] hover:shadow-[6px_6px_0px_0px_rgba(203,213,225,1)] transition-all">
            <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
                {/* LEFT: Meta info */}
                <div className="flex-shrink-0 min-w-[200px] border-l-4 border-slate-600 pl-4">
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
                <div className="flex-1 space-y-6 w-full">
                    <div>
                        <h4 className="font-heading text-xl text-white mb-2">{record.title}</h4>
                        <p className="font-serif text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                            {diagnosisText}
                        </p>
                    </div>

                    {prescriptionText && (
                        <div className="bg-white/5 border border-white/10 p-4">
                            <div className="flex items-center gap-2 mb-2 font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400">
                                <Pill className="w-3 h-3" /> Prescription Protocol
                            </div>
                            <p className="font-mono text-xs text-white whitespace-pre-line leading-relaxed">
                                {prescriptionText}
                            </p>
                        </div>
                    )}

                    {allergiesText && (
                        <div className="bg-red-950/30 border border-red-900/50 p-4">
                            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-red-500 mb-2">
                                <AlertTriangle className="w-3 h-3" /> Contraindications / Alerts
                            </div>
                            <p className="font-mono text-xs text-red-200 font-bold leading-relaxed uppercase">
                                {allergiesText}
                            </p>
                        </div>
                    )}

                    {data.vitals && (data.vitals.heartRate || data.vitals.bloodPressure) && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 font-mono text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500">
                                <Activity className="w-3 h-3" /> Recorded Telemetry
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <div className="flex-shrink-0 flex xl:flex-col items-start xl:items-end gap-3 mt-4 xl:mt-0 border-t xl:border-t-0 border-slate-800 pt-4 xl:pt-0">
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
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white">Immutable Record</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
