import { useState, useEffect } from "react";
import { CheckCircle2, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export default function TaskFeedbackToast({ show, task, scheduledTime, reasoning, onViewDecision, onDismiss }) {
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            // Auto-dismiss after 8 seconds if not expanded
            if (!expanded) {
                const timer = setTimeout(() => {
                    handleDismiss();
                }, 8000);
                return () => clearTimeout(timer);
            }
        }
    }, [show, expanded]);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => {
            if (onDismiss) onDismiss();
        }, 300);
    };

    if (!show) return null;

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
        >
            <div
                className="glass-2 glass-highlight border border-green-400/30 rounded-xl shadow-2xl 
                      backdrop-blur-xl min-w-[380px] max-w-[450px] overflow-hidden"
                data-testid="task-feedback-toast"
            >
                {/* Header */}
                <div className="flex items-start gap-3 px-4 py-3 border-b border-white/5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mt-0.5">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-semibold text-sm text-white truncate">
                            ✅ Task scheduled automatically
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                            {task}
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-[var(--text-muted)] hover:text-white text-xs px-2 py-1 
                       rounded hover:bg-white/5 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Scheduled time */}
                <div className="px-4 py-2.5 flex items-center gap-2 bg-white/[0.02]">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono text-white font-medium">
                        {scheduledTime}
                    </span>
                </div>

                {/* Reasoning section */}
                {reasoning && (
                    <div className="px-4 py-3 border-t border-white/5">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full flex items-center justify-between text-left group"
                        >
                            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">
                                Reason
                            </span>
                            {expanded ? (
                                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                            )}
                        </button>

                        {expanded && (
                            <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                {reasoning.split('\n').map((line, i) => (
                                    line.trim() && (
                                        <p key={i} className="text-xs text-[var(--text-muted)] leading-relaxed pl-3 border-l-2 border-blue-400/30">
                                            {line.trim()}
                                        </p>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* View decision button */}
                {onViewDecision && (
                    <div className="px-4 py-2.5 border-t border-white/5">
                        <button
                            onClick={() => {
                                onViewDecision();
                                handleDismiss();
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg 
                         glass-1 glass-hover text-xs font-medium text-blue-400 
                         hover:text-blue-300 transition-all group"
                        >
                            View full decision
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
