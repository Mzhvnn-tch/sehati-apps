import { CheckCircle2, Clock, ShieldAlert, Key, FileUp } from "lucide-react";
import type { AuditLog as AuditLogType } from "@shared/schema";

export function AuditLog({ logs }: { logs: AuditLogType[] }) {
  if (logs.length === 0) {
    return (
      <div className="border-2 border-[#020617] bg-white p-12 text-center shadow-[8px_8px_0px_0px_rgba(2,6,23,1)]">
        <span className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#020617]">Vault is Empty</span>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-slate-500">No cryptographic audit trails found.</p>
      </div>
    );
  }

  return (
    <div className="w-full border-2 border-[#020617] bg-white shadow-[12px_12px_0px_0px_rgba(2,6,23,1)]">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-6 border-b-2 border-[#020617] bg-[#020617] text-white">
        <div className="col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Action</div>
        <div className="col-span-2 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Timestamp</div>
        <div className="col-span-4 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Details</div>
        <div className="col-span-3 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">On-Chain TX</div>
      </div>

      {/* Table Body */}
      <div className="divide-y-2 divide-[#020617]">
        {logs.map((log) => {
          return (
            <div key={log.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 hover:bg-slate-50 transition-colors group">
              {/* Action */}
              <div className="col-span-3 flex flex-col justify-center">
                <span className="font-heading text-2xl md:text-3xl text-[#020617] tracking-tight group-hover:translate-x-1 transition-transform">
                  {log.action}
                </span>
              </div>
              
              {/* Timestamp */}
              <div className="col-span-2 flex flex-col justify-center">
                <span className="font-mono text-xs text-[#020617] font-bold">
                  {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>

              {/* Details */}
              <div className="col-span-4 flex flex-col justify-center">
                <span className="font-mono text-xs text-[#020617]">
                  {log.entityType === "record" && `MEDICAL RECORD OPERATION`}
                  {log.entityType === "access" && `ACCESS CONTROL EVENT`}
                  {log.entityType === "user" && `USER PROFILE UPDATE`}
                </span>
              </div>

              {/* Transaction Hash */}
              <div className="col-span-3 flex flex-col justify-center">
                <div className="inline-block border border-[#020617] bg-[#fafafa] px-3 py-2 w-fit">
                  <span className="font-mono text-[10px] text-[#020617] tracking-wider">
                    {log.transactionHash ? log.transactionHash.substring(0, 16) + '...' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}