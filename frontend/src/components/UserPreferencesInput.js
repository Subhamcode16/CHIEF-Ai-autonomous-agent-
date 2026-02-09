import { useState } from "react";
import { Sparkles, Save, X } from "lucide-react";

export default function UserPreferencesInput({ preferences = "", onSave, onClose }) {
    const [text, setText] = useState(preferences);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(text);
            if (onClose) onClose();
        } catch (error) {
            console.error("Failed to save preferences:", error);
        } finally {
            setSaving(false);
        }
    };

    const examplePreferences = [
        "Deep work preferred in the morning",
        "Avoid meetings after 6:00 PM",
        "At least one break mid-day",
        "No calls before 9:00 AM",
        "Friday afternoons for creative work"
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="font-heading font-semibold text-base text-white">
                        Your Scheduling Preferences
                    </h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Tell Chief how you prefer to work. These preferences will guide all scheduling decisions
                    throughout your session.
                </p>
            </div>

            {/* Input area */}
            <div className="space-y-2">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Examples:\n${examplePreferences.join('\n')}`}
                    className="w-full h-36 px-4 py-3 rounded-xl glass-1 border border-white/10 
                     text-sm text-white placeholder-[var(--text-muted)] resize-none
                     focus:outline-none focus:border-purple-400/30 focus:ring-2 
                     focus:ring-purple-400/10 transition-all"
                    data-testid="preferences-textarea"
                />
                <p className="text-xs text-[var(--text-muted)]">
                    One preference per line. Be specific about times, work types, and constraints.
                </p>
            </div>

            {/* Examples */}
            <div className="glass-1 rounded-lg px-3 py-2.5 border border-purple-400/20">
                <p className="text-xs font-medium text-purple-400 mb-2">Example preferences:</p>
                <ul className="space-y-1">
                    {examplePreferences.slice(0, 3).map((pref, i) => (
                        <li key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5">•</span>
                            <span>{pref}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving || !text.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg 
                     bg-purple-500/20 border border-purple-400/30 text-purple-400 
                     font-medium text-sm hover:bg-purple-500/30 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="save-preferences-btn"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Preferences"}
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-lg glass-1 glass-hover border border-white/10 
                       text-[var(--text-muted)] hover:text-white font-medium text-sm transition-all"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
