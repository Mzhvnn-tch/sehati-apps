import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CHARS = "-_~\\/[]{}<>";

interface CipherTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export function CipherText({ text, className, delay = 0 }: CipherTextProps) {
    const [display, setDisplay] = useState("");

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let iteration = 0;

        const startAnimation = () => {
            interval = setInterval(() => {
                setDisplay(
                    text
                        .split("")
                        .map((char, index) => {
                            if (index < iteration) {
                                return text[index];
                            }
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        })
                        .join("")
                );

                if (iteration >= text.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 3;
            }, 30);
        };

        const timeout = setTimeout(startAnimation, delay * 1000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [text, delay]);

    return (
        <motion.span className={className}>
            {display}
        </motion.span>
    );
}
