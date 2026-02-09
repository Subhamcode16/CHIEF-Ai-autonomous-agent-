import { useState } from "react";

export default function AutonomyToggle({ enabled, onChange, disabled = false }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <label className="font-heading font-semibold text-sm text-white cursor-pointer">
                        Autonomous Mode
                    </label>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {enabled
                            ? "Chief is actively managing your schedule"
                            : "Chief is standing by"}
                    </p>
                </div>
                <button
                    onClick={() => !disabled && onChange(!enabled)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    disabled={disabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
                      ${enabled ? "bg-blue-500" : "bg-gray-700"}
                      ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                      ${isHovered && !disabled ? "scale-110" : "scale-100"}`}
                    role="switch"
                    aria-checked={enabled}
                    data-testid="autonomy-toggle"
                >
                    <span className="sr-only">Toggle Autonomous Mode</span>
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
                        ${enabled ? "translate-x-6" : "translate-x-1"}
                        shadow-md`}
                    />
                </button>
            </div>

            {/* Helper text */}
            <div
                className={`glass-1 rounded-lg px-3 py-2 border transition-all duration-300 
                    ${enabled ? "border-blue-400/30 bg-blue-500/10" : "border-gray-400/20 bg-gray-500/5"}`}
            >
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {enabled ? (
                        <>
                            <span className="text-blue-400 font-medium">◉ Active: </span>
                            Chief will actively manage your schedule and make decisions for you.
                        </>
                    ) : (
                        <>
                            <span className="text-gray-400 font-medium">◉ Paused: </span>
                            Chief will stop making changes until reactivated.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
