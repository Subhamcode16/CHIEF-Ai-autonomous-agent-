import { X, Sparkles, Edit2 } from "lucide-react";

export default function PreferencesDisplay({ preferences = [], onEdit, onRemove }) {
    if (!preferences || preferences.length === 0) {
        return null;
    }

    return (
        <div className="glass-1 rounded-xl px-4 py-3 border border-purple-400/20 space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="font-heading font-semibold text-xs text-purple-400 uppercase tracking-wide">
                        Active Preferences
                    </h4>
                </div>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs 
                       text-[var(--text-muted)] hover:text-purple-400 
                       hover:bg-purple-500/10 transition-all"
                        title="Edit preferences"
                    >
                        <Edit2 className="w-3 h-3" />
                        Edit
                    </button>
                )}
            </div>

            {/* Preferences chips/tags */}
            <div className="flex flex-wrap gap-2">
                {preferences.map((pref, index) => (
                    <div
                        key={index}
                        className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg 
                       bg-purple-500/10 border border-purple-400/20 
                       hover:border-purple-400/40 transition-all"
                        data-testid={`preference-chip-${index}`}
                    >
                        <span className="text-xs text-purple-300 leading-tight">
                            {pref}
                        </span>
                        {onRemove && (
                            <button
                                onClick={() => onRemove(index)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity 
                           hover:bg-purple-400/20 rounded p-0.5"
                                title="Remove preference"
                            >
                                <X className="w-3 h-3 text-purple-400" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Info text */}
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Chief will respect these preferences when making scheduling decisions.
            </p>
        </div>
    );
}
