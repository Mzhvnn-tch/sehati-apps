import { motion } from "framer-motion";
import { ParticleNetwork } from "./particle-network";

export const LivingBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0B0C10]">
        {/* Subtle Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C10] via-[#111318] to-[#0B0C10]" />

        {/* Aurora 1 - Ultra Slow & Subtle */}
        <motion.div
            animate={{
                scale: [1, 1.15, 1],
                opacity: [0.15, 0.25, 0.15],
                rotate: [0, 20, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[1200px] h-[1200px] bg-primary/10 rounded-full blur-[180px] mix-blend-screen"
        />

        {/* Aurora 2 - Deep Blue Drift */}
        <motion.div
            animate={{
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.2, 0.1],
                x: [0, 150, 0],
                y: [0, -50, 0]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-blue-900/20 rounded-full blur-[200px] mix-blend-screen"
        />

        {/* Global Noise Overlay for Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

        {/* Particle Network - Low Opacity */}
        <div className="opacity-30">
            <ParticleNetwork />
        </div>
    </div>
);
