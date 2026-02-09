import { useState } from "react";
import { BrainCircuit, Pause, Activity, Eye, ChevronDown } from "lucide-react";

const STATUS_CONFIG = {
    active: {
        label: "Autonomous Mode: Active",
        icon: BrainCircuit,
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-400/30",
        dotColor: "bg-green-400",
    },
    planning: {
        label: "Planning…",
        icon: Activity,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-400/30",
        dotColor: "bg-yellow-400",
    },
    monitoring: {
        label: "Monitoring changes",
        icon: Eye,
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-400/30",
        dotColor: "bg-blue-400",
    },
    paused: {
        label: "Paused",
        icon: Pause,
        color: "text-gray-400",
        bgColor: "bg-gray-500/20",
        borderColor: "border-gray-400/30",
        dotColor: "bg-gray-400",
    },
};

export default function AgentStatusIndicator({ status = "paused", onClick }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.paused;
    const Icon = config.icon;

    return (
        <div className="relative">
            <button
                onClick={onClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg glass-1 glass-highlight 
                    border ${config.borderColor} transition-all duration-200 hover:scale-105`}
                data-testid="agent-status-indicator"
                data-status={status}
            >
                {/* Animated status dot */}
                <div className="relative">
                    <div className={`w-2 h-2 rounded-full ${config.dotColor}`}>
                        {status === "active" || status === "planning" ? (
                            <div
                                className={`absolute inset-0 rounded-full ${config.dotColor} animate-ping opacity-75`}
                            />
                        ) : null}
                    </div>
                </div>

                {/* Icon */}
                <Icon className={`w-4 h-4 ${config.color} ${status === "planning" ? "animate-pulse" : ""}`} />

                {/* Label - hide on small screens */}
                <span className={`hidden md:inline font-mono text-xs ${config.color} font-medium`}>
                    {config.label}
                </span>

                {/* Dropdown indicator */}
                <ChevronDown className={`w-3 h-3 ${config.color} opacity-50`} />
            </button>

            {/* Tooltip for mobile */}
            {showTooltip && (
                <div
                    className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-sm text-white 
                      text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 
                      border border-white/10"
                >
                    {config.label}
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-black/90 rotate-45 border-l border-t border-white/10" />
                </div>
            )}
        </div>
    );
}
