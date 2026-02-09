import { useEffect, useState } from "react";
import { X, BrainCircuit } from "lucide-react";

export default function AutonomousBanner({ show, onDismiss }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            // Auto-dismiss after 5 seconds
            const timer = setTimeout(() => {
                handleDismiss();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => {
            if (onDismiss) onDismiss();
        }, 300); // Wait for fade animation
    };

    if (!show) return null;

    return (
        <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                }`}
        >
            <div
                className="glass-2 glass-highlight border border-blue-400/30 rounded-xl px-5 py-3.5 shadow-xl 
                      flex items-center gap-3 min-w-[400px] max-w-[600px] backdrop-blur-xl"
                data-testid="autonomous-banner"
            >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <div className="flex-1">
                    <h3 className="font-heading font-semibold text-sm text-white mb-0.5">
                        🧠 Autonomous Mode Active
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        Chief is now managing your schedule and will adjust it as new tasks or conflicts appear.
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-white/10 transition-colors 
                     flex items-center justify-center text-[var(--text-muted)] hover:text-white"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
