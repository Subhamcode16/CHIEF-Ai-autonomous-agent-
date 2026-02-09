import { BrainCircuit, Sparkles } from "lucide-react";

export default function EmptyState({ onActivate }) {
    return (
        <div className="flex items-center justify-center min-h-[400px] px-6">
            <div className="text-center max-w-md space-y-6">
                {/* Animated icon */}
                <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-75" />
                    <div className="relative flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-full border border-blue-400/30">
                        <BrainCircuit className="w-10 h-10 text-blue-400" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <h3 className="font-heading font-bold text-lg text-white">
                        Chief is standing by
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        Activate Autonomous Mode to delegate your day to Chief.
                        <br />
                        Add tasks and let the AI manage your schedule intelligently.
                    </p>
                </div>

                {/* Activate button */}
                {onActivate && (
                    <button
                        onClick={onActivate}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl 
                       bg-blue-500/20 border border-blue-400/30 
                       text-blue-400 font-medium text-sm 
                       hover:bg-blue-500/30 hover:scale-105 
                       transition-all shadow-lg"
                    >
                        <Sparkles className="w-4 h-4" />
                        Activate Autonomous Mode
                    </button>
                )}

                {/* Instructions */}
                <div className="pt-4 space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                        Getting Started
                    </p>
                    <ol className="text-xs text-[var(--text-muted)] text-left space-y-1.5 max-w-xs mx-auto">
                        <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono">
                                1
                            </span>
                            <span>Add tasks with priorities and deadlines</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono">
                                2
                            </span>
                            <span>Set your scheduling preferences (optional)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono">
                                3
                            </span>
                            <span>Click "Let Chief Plan My Day" to start</span>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
