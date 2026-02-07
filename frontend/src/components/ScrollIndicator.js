import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";

export default function ScrollIndicator() {
    const [visible, setVisible] = useState(false);
    const { scrollY } = useScroll();

    // Hide indicator after scrolling 100px
    const opacity = useTransform(scrollY, [0, 100], [1, 0]);

    useEffect(() => {
        // Show after 1.5 seconds
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Hide completely when scrolled
    useEffect(() => {
        const unsubscribe = scrollY.on("change", (y) => {
            if (y > 150) setVisible(false);
        });
        return () => unsubscribe();
    }, [scrollY]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    style={{ opacity }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                    <motion.div
                        animate={{
                            boxShadow: [
                                "0 0 20px rgba(6, 182, 212, 0.2)",
                                "0 0 40px rgba(6, 182, 212, 0.4)",
                                "0 0 20px rgba(6, 182, 212, 0.2)"
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative group cursor-pointer"
                        onClick={() => {
                            window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                        }}
                    >
                        {/* Glow background */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl" />

                        {/* Main pill */}
                        <div className="relative glass-2 rounded-full px-6 py-3 flex items-center gap-3
                          border border-white/10 backdrop-blur-xl
                          hover:border-cyan-500/30 transition-all duration-300
                          hover:scale-105">

                            {/* Sparkle icon */}
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                            </motion.div>

                            {/* Text with gradient */}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r 
                             from-cyan-400 via-purple-400 to-pink-400 
                             font-semibold text-sm tracking-wide">
                                Your stats are below
                            </span>

                            {/* Animated arrows */}
                            <div className="flex flex-col -space-y-1">
                                <motion.div
                                    animate={{ y: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                >
                                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 3, 0], opacity: [0.3, 0.8, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                >
                                    <ChevronDown className="w-4 h-4 text-purple-400" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
