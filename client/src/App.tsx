import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import PatientDashboard from "@/pages/patient-dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Documentation from "@/pages/documentation";
import { wagmiAdapter, projectId, networks } from "@/lib/wagmi";

// Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  features: {
    analytics: true
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#06b6d4', // Cyan Neon
    '--w3m-border-radius-master': '1px',
    '--w3m-font-family': '"Space Grotesk", sans-serif',
    '--w3m-color-mix': '#ffffff',
    '--w3m-color-mix-strength': 10
  }
});

function Router() {
  return (
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
  );
}

import { useEffect } from "react";
import { clearWalletConnectStorage } from "@/lib/utils";

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
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
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
