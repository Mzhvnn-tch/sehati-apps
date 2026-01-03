import { MedicalRecord, User } from "@shared/schema";
import { format } from "date-fns";
import { ExternalLink, Stethoscope, FileText, Pill, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
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
        <div className="group relative bg-white/70 backdrop-blur-sm border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:border-cyan-200/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-cyan-50/30 opacity-50" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4">

                {/* LEFT: Type & Date */}
                <div className="flex-shrink-0 min-w-[150px]">
                    <h3 className="text-xl font-serif font-bold text-slate-800 uppercase tracking-tighter">
                        {record.recordType.replace("_", " ")}
                    </h3>
                    <div className="mt-1 flex flex-col gap-1 text-xs font-medium text-slate-400">
                        <span>{format(new Date(record.createdAt), "dd MMM yyyy")}</span>
                        <span className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            {doctor ? `Dr. ${doctor.name}` : `Doctor ID: ${record.doctorId.substring(0, 6)}...`}
                        </span>
                        <span className="text-cyan-600 font-bold">{record.hospitalName}</span>
                    </div>
                </div>

                {/* CENTER: Clinical Content */}
                <div className="flex-1 space-y-4">
                    {/* Diagnosis */}
                    <div>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium border-l-2 border-slate-200 pl-3">
                            {diagnosisText}
                        </p>
                    </div>

                    {/* Prescription Section */}
                    {prescriptionText && (
                        <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-2 mb-1 text-blue-700 font-bold text-xs uppercase">
                                <Pill className="w-3 h-3" /> Prescription
                            </div>
                            <p className="text-xs text-blue-900 font-mono whitespace-pre-line">
                                {prescriptionText}
                            </p>
                        </div>
                    )}

                    {/* Allergies Section */}
                    {allergiesText && (
                        <div className="bg-red-50/50 rounded-lg p-3 border border-red-100 inline-block">
                            <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase">
                                <AlertTriangle className="w-3 h-3" /> Allergies Noted
                            </div>
                            <p className="text-xs text-red-900 font-medium mt-1">
                                {allergiesText}
                            </p>
                        </div>
                    )}

                    {/* Vitals Section (New Unified) */}
                    {data.vitals && (data.vitals.heartRate || data.vitals.bloodPressure) && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                <Activity className="w-3 h-3" /> Vitals & Observations
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {data.vitals.heartRate && (
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 uppercase block">Heart Rate</span>
                                        <span className="text-sm font-bold text-slate-700">{data.vitals.heartRate} <span className="text-xs font-normal text-slate-400">bpm</span></span>
                                    </div>
                                )}
                                {data.vitals.bloodPressure && (
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 uppercase block">BP</span>
                                        <span className="text-sm font-bold text-slate-700">{data.vitals.bloodPressure}</span>
                                    </div>
                                )}
                                {data.vitals.temperature && (
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 uppercase block">Temp</span>
                                        <span className="text-sm font-bold text-slate-700">{data.vitals.temperature}°C</span>
                                    </div>
                                )}
                                {data.vitals.weight && (
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[10px] text-slate-400 uppercase block">Weight</span>
                                        <span className="text-sm font-bold text-slate-700">{data.vitals.weight} kg</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Actions */}
                <div className="flex-shrink-0 flex flex-col gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 gap-2 hover:bg-slate-50 border-slate-200"
                        onClick={() => window.open(`https://sepolia-blockscout.lisk.com/tx/${record.blockchainHash}`, '_blank')}
                    >
                        <ExternalLink className="w-3 h-3" /> View in Blockscout
                    </Button>
                    <div className="text-[10px] text-center text-slate-300 font-mono uppercase tracking-widest mt-1">
                        Immutable
                    </div>
                </div>

            </div>
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                <div className="absolute top-[18px] right-[18px] w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl" />
            </div>
        </div>
    );
}
