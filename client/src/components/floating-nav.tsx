import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LucideIcon, HeartPulse, X } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function FloatingNav({ links, type }: { links: NavLink[], type: "patient" | "doctor" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const radius = 130; // Spread distance
  const totalNodes = links.length;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-50 flex items-center justify-center">
        <AnimatePresence>
          {isOpen && links.map((link, i) => {
            // Map angle between 180deg (left) and 270deg (top)
            let angle = Math.PI * 1.25; 
            if (totalNodes > 1) {
              const startAngle = Math.PI; 
              const endAngle = Math.PI * 1.5; 
              const step = (endAngle - startAngle) / (totalNodes - 1);
              angle = startAngle + step * i;
            }

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isActive = location === link.href;

            return (
              <motion.div
                key={link.href}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x, y, scale: 1, opacity: 1 }}
                exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.05 }}
                className="absolute"
              >
                <Link href={link.href}>
                  <div 
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-3xl cursor-pointer transition-all hover:scale-110 border backdrop-blur-md",
                      isActive 
                        ? "bg-cyan-500 border-cyan-400 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)]" 
                        : "bg-white/80 border-white/60 text-slate-700 shadow-xl hover:bg-white"
                    )}
                    style={{ width: '90px', height: '90px' }}
                  >
                    <link.icon className={cn("w-7 h-7 mb-1", isActive ? "text-white" : "text-cyan-600")} />
                    <span className="text-[10px] font-bold text-center leading-tight tracking-wide">{link.label}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-2xl relative z-50 border-2",
            type === "doctor" 
              ? "bg-slate-900 border-slate-700 shadow-[0_0_40px_rgba(15,23,42,0.4)]" 
              : "bg-cyan-600 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.4)]"
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {isOpen ? (
              <X className="w-8 h-8 md:w-10 md:h-10 text-white" />
            ) : (
              <HeartPulse className="w-8 h-8 md:w-10 md:h-10 text-white" />
            )}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
