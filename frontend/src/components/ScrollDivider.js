import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function ScrollDivider() {
    return (
        <div className="relative py-32 flex flex-col items-center justify-center gap-4">
            {/* Background gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent" />

            {/* Subtle ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-cyan-500/5 rounded-full blur-3xl" />

            {/* Main text */}
            <motion.span
                initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
                whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 text-[11px] tracking-[0.25em] uppercase text-[var(--text-muted)] font-manrope font-medium"
            >
                Your stats are below
            </motion.span>

            {/* Animated chevron */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                className="relative z-10"
            >
                <ChevronDown
                    className="w-5 h-5 text-[var(--text-muted)] animate-bounce"
                    style={{ animationDuration: '2s' }}
                />
            </motion.div>
        </div>
    );
}
