import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppKitProvider } from "@reown/appkit/react";
import { mainnet, polygon } from "viem/chains";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import PatientDashboard from "@/pages/patient-dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";

const projectId = "0f835a14e7056382454b2d9f13a0be56";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/patient" component={PatientDashboard} />
      <Route path="/patient/*" component={PatientDashboard} />
      <Route path="/doctor" component={DoctorDashboard} />
      <Route path="/doctor/*" component={DoctorDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AppKitProvider projectId={projectId} networks={[mainnet, polygon]}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppKitProvider>
  );
}

export default App;
