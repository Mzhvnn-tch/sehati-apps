import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, MouseEvent } from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends ButtonProps {
    strength?: number;
}

export function MagneticButton({
    children,
    className,
    strength = 0.5,
    ...props
}: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
        if (!ref.current) return;

        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();

        const centerX = left + width / 2;
        const centerY = top + height / 2;

        const distanceX = clientX - centerX;
        const distanceY = clientY - centerY;

        x.set(distanceX * strength);
        y.set(distanceY * strength);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            style={{ x: springX, y: springY }}
            className="inline-block"
        >
            <Button
                ref={ref}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={cn("relative overflow-hidden", className)}
                {...props}
            >
                <span className="relative z-10">{children}</span>
                {/* Shine Effect */}
                <motion.div
                    className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
            </Button>
        </motion.div>
    );
}
