import { useState, useEffect } from "react";
import { RotateCw, ExternalLink } from "lucide-react";

export default function RescheduleToast({ show, message, details, onViewDecision, onDismiss }) {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            // Auto-dismiss after 7 seconds
            const timer = setTimeout(() => {
                handleDismiss();
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => {
            if (onDismiss) onDismiss();
        }, 300);
    };

    if (!show) return null;

    return (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
        >
            <div
                className="glass-2 glass-highlight border border-blue-400/30 rounded-xl shadow-2xl 
                      backdrop-blur-xl min-w-[400px] max-w-[500px] overflow-hidden"
                data-testid="reschedule-toast"
            >
                {/* Main message */}
                <div className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mt-0.5">
                        <RotateCw className="w-5 h-5 text-blue-400 animate-spin-slow" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-heading font-semibold text-sm text-white">
                            🔄 {message || "Schedule updated automatically"}
                        </h4>
                        {details && (
                            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                                {details}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-[var(--text-muted)] hover:text-white text-xs px-2 py-1 
                       rounded hover:bg-white/5 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* View decision button */}
                {onViewDecision && (
                    <div className="px-4 pb-3">
                        <button
                            onClick={() => {
                                onViewDecision();
                                handleDismiss();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg 
                         glass-1 glass-hover text-xs font-medium text-blue-400 
                         hover:text-blue-300 transition-all group border border-blue-400/20"
                        >
                            View decision
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
