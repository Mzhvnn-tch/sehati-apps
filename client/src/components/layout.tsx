
import { Link, useLocation } from "wouter";
import { Activity, FileText, Menu, Stethoscope, Lock, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";
import { Hexagon } from "lucide-react";

import { FloatingNav } from "./floating-nav";

const logoSrc = "https://cdn-icons-png.flaticon.com/128/3063/3063205.png";

export default function Layout({ children, type = "patient" }: { children: React.ReactNode; type?: "patient" | "doctor" }) {
  const [location] = useLocation();
  const { user, disconnect } = useAuth();

  const patientLinks = [
    { href: "/patient", label: "Dashboard", icon: Activity },
    { href: "/patient/records", label: "My Records", icon: FileText },
  ];

  const doctorLinks = [
    { href: "/doctor", label: "Scanner", icon: Stethoscope },
    { href: "/doctor/records", label: "Patient Records", icon: FileText },
  ];

  const links = type === "patient" ? patientLinks : doctorLinks;

  return (
    <div className="min-h-screen bg-transparent font-sans text-foreground overflow-x-hidden">
      
      {/* Top Minimal HUD */}
      

      {/* Main Canvas */}
      <main className="pt-8 pb-32 px-4 lg:px-8 max-w-7xl mx-auto w-full min-h-screen animate-in fade-in duration-500">
        {children}
      </main>

      {/* Futuristic Floating Navigation */}
      <FloatingNav links={links} type={type} />
    </div>
  );
}