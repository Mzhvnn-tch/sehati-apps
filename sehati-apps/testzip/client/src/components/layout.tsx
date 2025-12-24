import { Link, useLocation } from "wouter";
import { Shield, Activity, Lock, FileText, Menu, X, User, Stethoscope } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import logoSrc from "../../public/logo.png";

export default function Layout({ children, type = "patient" }: { children: React.ReactNode; type?: "patient" | "doctor" }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  const patientLinks = [
    { href: "/patient", label: "Overview", icon: Activity },
    { href: "/patient/records", label: "My Records", icon: FileText },
    { href: "/patient/access", label: "Access Control", icon: Lock },
  ];

  const doctorLinks = [
    { href: "/doctor", label: "Scanner", icon: Stethoscope },
    { href: "/doctor/records", label: "Patient Records", icon: FileText },
  ];

  const links = type === "patient" ? patientLinks : doctorLinks;

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-lg transition-transform duration-300 lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-gray-100/50">
          <img src={logoSrc} alt="SEHATI Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <div>
            <h1 className="font-bold text-xl tracking-tight text-primary">SEHATI</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
              {type === "patient" ? "Patient Node" : "Doctor Node"}
            </p>
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
                    : "text-gray-600 hover:bg-secondary hover:text-gray-900"
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400")} />
                  {link.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-white/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
              {user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : (type === "patient" ? "PT" : "DR")}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">
                {user?.name || (type === "patient" ? "Patient" : "Doctor")}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {user?.walletAddress ? `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}` : "Not connected"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/50 bg-white/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="Logo" className="w-6 h-6" />
            <span className="font-bold text-primary">SEHATI</span>
          </div>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/50">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        
        <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}