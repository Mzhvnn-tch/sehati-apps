import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

import { WagmiProvider } from "wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { config } from "@/lib/wagmi";
import { Suspense, useEffect } from "react";
import { clearWalletConnectStorage } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import PatientDashboard from "@/pages/patient-dashboard";
import Landing from "@/pages/landing";
import DoctorDashboard from "@/pages/doctor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Documentation from "@/pages/documentation";
import NotFound from "@/pages/not-found";

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}



function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/patient" component={PatientDashboard} />
        <Route path="/patient/*" component={PatientDashboard} />
        <Route path="/doctor" component={DoctorDashboard} />
        <Route path="/doctor/*" component={DoctorDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/docs" component={Documentation} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Global Error Handler for WalletConnect "Zombie" Sessions
  useEffect(() => {
    const handleCheck = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || "";

      // Handle WalletConnect Disconnects
      if (msg.includes("No matching key") || msg.includes("session topic doesn't exist")) {
        event.preventDefault();
        console.warn("🛡️  Silencing 'Zombie' Session Error & Resetting...");
        clearWalletConnectStorage();
        window.location.reload();
      }
      // Handle MetaMask Connection Failures (prevent crash)
      else if (msg.includes("Failed to connect to MetaMask")) {
        event.preventDefault();
        console.warn("🛡️ Silencing MetaMask Connection Error");
      }
    };

    window.addEventListener("unhandledrejection", handleCheck);
    return () => window.removeEventListener("unhandledrejection", handleCheck);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
