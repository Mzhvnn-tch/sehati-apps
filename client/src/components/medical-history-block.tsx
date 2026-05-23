import { MedicalRecord, User } from "@shared/schema";
import { format } from "date-fns";
import { ExternalLink, Stethoscope, FileText, Pill, AlertTriangle, ShieldCheck, Activity, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MedicalHistoryBlockProps {
    record: MedicalRecord & { decryptedContent: string };
    doctor?: User | null;
}

export function MedicalHistoryBlock({ record, doctor }: MedicalHistoryBlockProps) {
    // Parse JSON content if available
    let data: { diagnosis?: string; prescription?: string; allergies?: string; content?: string; vitals?: any } = {};

    try {
        const parsed = JSON.parse(record.decryptedContent);
        // Handle both new JSON structure and potential legacy direct string
        if (parsed === null) {
            data = {};
        } else if (typeof parsed === 'string') {
            data = { diagnosis: parsed };
        } else {
            data = parsed;
        }
    } catch (e) {
        // If not JSON, treat as legacy plain text
        data = { diagnosis: record.decryptedContent };
    }

    // Prioritize "content" key if it exists (legacy)
    const diagnosisText = data.diagnosis || data.content || "No detailed diagnosis.";
    const prescriptionText = data.prescription;
    const allergiesText = data.allergies;

    return (
        <div className="group relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 md:p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-100/40 hover:-translate-y-1 overflow-hidden shadow-xl shadow-slate-200/40">
            {/* Subtle Glassmorphism Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-cyan-50/30 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8">

                {/* LEFT: Type & Date (Visual Anchor) */}
                <div className="flex-shrink-0 min-w-[160px] relative">
                    {/* Glowing Accent Line */}
                    <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-800 uppercase tracking-tight leading-none mb-3">
                        {record.recordType.replace("_", " ")}
                    </h3>
                    <div className="flex flex-col gap-2 text-sm font-medium text-slate-500">
                        <span className="flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-full border border-slate-100/50 w-fit shadow-sm">
                            <Calendar className="w-4 h-4 text-cyan-600" />
                            {(() => {
                                const dateNum = Number(record.createdAt);
                                const dateObj = new Date(isNaN(dateNum) ? record.createdAt : dateNum);
                                return isNaN(dateObj.getTime()) ? "Unknown Date" : format(dateObj, "dd MMM yyyy");
                            })()}
                        </span>
                        <span className="flex items-center gap-2 px-1">
                            <Stethoscope className="w-4 h-4 text-slate-400" />
                            {doctor ? `Dr. ${doctor.name}` : `Dr. ${record.doctorId.substring(0, 6).toUpperCase()}`}
                        </span>
                        <span className="text-cyan-700 font-bold px-1">{record.hospitalName}</span>
                    </div>
                </div>

                {/* CENTER: Clinical Content (Color Grouped Blocks) */}
                <div className="flex-1 space-y-5 w-full">
                    {/* Diagnosis / Title */}
                    <div className="relative pl-4 border-l-2 border-cyan-200/50">
                        <h4 className="text-xl md:text-2xl font-serif font-bold text-cyan-900 mb-2">
                            {record.title}
                        </h4>
                        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                            {diagnosisText}
                        </p>
                    </div>

                    {/* Prescription Section (Blue Block) */}
                    {prescriptionText && (
                        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/30 rounded-2xl p-4 border border-blue-100/50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-400/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                                <Pill className="w-4 h-4" /> Prescribed Medication
                            </div>
                            <p className="text-sm text-blue-900 font-mono whitespace-pre-line leading-relaxed">
                                {prescriptionText}
                            </p>
                        </div>
                    )}

                    {/* Allergies Section (Red Block) */}
                    {allergiesText && (
                        <div className="bg-gradient-to-br from-red-50/80 to-rose-50/30 rounded-2xl p-4 border border-red-100/50 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-red-400/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider mb-2">
                                <AlertTriangle className="w-4 h-4 animate-pulse" /> Critical Allergies
                            </div>
                            <p className="text-sm text-red-900 font-medium leading-relaxed">
                                {allergiesText}
                            </p>
                        </div>
                    )}

                    {/* Vitals Section (Cyan Block) */}
                    {data.vitals && (data.vitals.heartRate || data.vitals.bloodPressure) && (
                        <div className="bg-gradient-to-br from-cyan-50/50 to-teal-50/20 rounded-2xl p-4 border border-cyan-100/30 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 text-cyan-700 font-bold text-xs uppercase tracking-wider">
                                <Activity className="w-4 h-4" /> Recorded Vitals
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {data.vitals.heartRate && (
                                    <div className="bg-white/60 p-3 rounded-xl border border-white shadow-sm flex flex-col justify-center items-center text-center">
                                        <span className="text-[10px] text-cyan-600 uppercase font-bold tracking-widest mb-1">Heart</span>
                                        <span className="text-lg font-black text-slate-800 leading-none">{data.vitals.heartRate}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">bpm</span>
                                    </div>
                                )}
                                {data.vitals.bloodPressure && (
                                    <div className="bg-white/60 p-3 rounded-xl border border-white shadow-sm flex flex-col justify-center items-center text-center">
                                        <span className="text-[10px] text-cyan-600 uppercase font-bold tracking-widest mb-1">BP</span>
                                        <span className="text-lg font-black text-slate-800 leading-none">{data.vitals.bloodPressure}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">mmHg</span>
                                    </div>
                                )}
                                {data.vitals.temperature && (
                                    <div className="bg-white/60 p-3 rounded-xl border border-white shadow-sm flex flex-col justify-center items-center text-center">
                                        <span className="text-[10px] text-cyan-600 uppercase font-bold tracking-widest mb-1">Temp</span>
                                        <span className="text-lg font-black text-slate-800 leading-none">{data.vitals.temperature}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">°C</span>
                                    </div>
                                )}
                                {data.vitals.weight && (
                                    <div className="bg-white/60 p-3 rounded-xl border border-white shadow-sm flex flex-col justify-center items-center text-center">
                                        <span className="text-[10px] text-cyan-600 uppercase font-bold tracking-widest mb-1">Weight</span>
                                        <span className="text-lg font-black text-slate-800 leading-none">{data.vitals.weight}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">kg</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Actions */}
                <div className="flex-shrink-0 flex flex-col items-end md:items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-10 px-4 rounded-xl gap-2 bg-white/50 border-slate-200 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-colors shadow-sm"
                        onClick={() => window.open(`https://sepolia.etherscan.io/tx/${record.blockchainHash}`, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4" /> View Blockscout
                    </Button>
                    
                    {/* Futuristic Immutable Badge */}
                    <div className="flex items-center gap-2 bg-slate-900/5 px-3 py-1.5 rounded-lg border border-slate-900/10 backdrop-blur-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Immutable</span>
                    </div>
                </div>

            </div>
            
            {/* Decorative Glowing Orb in Corner - Sovereignity Gum Theme */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-multiply">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/20 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
