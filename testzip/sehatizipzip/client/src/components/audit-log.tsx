import { CheckCircle2, Clock, ShieldAlert, Key, FileUp } from "lucide-react";
import type { AuditLog as AuditLogType } from "@shared/schema";

export function AuditLog({ logs }: { logs: AuditLogType[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const getIcon = () => {
          switch (log.action) {
            case "RecordAdded":
              return <FileUp className="w-4 h-4" />;
            case "AccessGranted":
              return <Key className="w-4 h-4" />;
            case "AccessRevoked":
              return <ShieldAlert className="w-4 h-4" />;
            case "RecordViewed":
              return <CheckCircle2 className="w-4 h-4" />;
            default:
              return <CheckCircle2 className="w-4 h-4" />;
          }
        };

        const getColor = () => {
          switch (log.action) {
            case "RecordAdded":
              return "bg-blue-100 text-blue-600";
            case "AccessRevoked":
              return "bg-orange-100 text-orange-600";
            default:
              return "bg-green-100 text-green-600";
          }
        };

        return (
          <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 bg-white/50 hover:bg-white transition-colors">
            <div className={`mt-1 p-2 rounded-full ${getColor()}`}>
              {getIcon()}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-gray-900">{log.action}</h4>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {log.entityType === "record" && `Medical record operation`}
                {log.entityType === "access" && `Access control event`}
                {log.entityType === "user" && `User profile update`}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-500 border border-gray-200">
                  TX: {log.transactionHash?.substring(0, 16) || "N/A"}...
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}