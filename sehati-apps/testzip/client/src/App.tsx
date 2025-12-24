import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { AppKitProvider } from "@/lib/appkit-provider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import PatientDashboard from "@/pages/patient-dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";
import "@/lib/appkit-config";

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
    <AppKitProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </AppKitProvider>
  );
}

export default App;
