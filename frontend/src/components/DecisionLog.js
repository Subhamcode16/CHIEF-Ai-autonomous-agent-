import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, CalendarPlus, History, AlertCircle, Hand, Trash2 } from "lucide-react";

const ACTION_CONFIG = {
  move_event: { Icon: ArrowRight, color: "text-blue-400", bg: "bg-blue-500/10", label: "Moved", badgeBorder: "border-blue-500/20" },
  move_event_manual: { Icon: Hand, color: "text-purple-400", bg: "bg-purple-500/10", label: "Manual", badgeBorder: "border-purple-500/20" },
  create_event: { Icon: CalendarPlus, color: "text-green-400", bg: "bg-green-500/10", label: "Created", badgeBorder: "border-green-500/20" },
  error: { Icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Error", badgeBorder: "border-red-500/20" },
};

export default function DecisionLog({ decisions, onClear }) {
  // Removed auto-scroll useEffect to prevent unwanted scroll behavior

  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="decision-log-empty">
        <div className="w-14 h-14 rounded-2xl glass-1 flex items-center justify-center mb-4">
          <History className="w-6 h-6 text-[var(--text-muted)] opacity-40" />
        </div>
        <p className="text-[var(--text-muted)] text-sm text-center font-manrope leading-relaxed">
          No decisions yet.<br />Click &ldquo;Let Chief Plan My Day&rdquo; to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header */}
      <div className="px-4 py-3 border-b border-white/[0.05] space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-sm text-white">
              Decision Log
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
              Every scheduling decision Chief makes — and why.
            </p>
          </div>
          {onClear && decisions.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-red-400 hover:text-red-300 
                         hover:bg-red-500/10 rounded-md transition-colors"
              title="Clear all decisions"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
        <div className="glass-1 rounded-lg px-3 py-2 border border-blue-400/20">
          <p className="text-xs text-blue-400 leading-relaxed">
            <span className="font-medium">Autonomous Mode:</span> These decisions happen automatically while autonomous mode is active.
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1" data-testid="decision-log">
        <div className="p-3 space-y-2">
          {decisions.map((d, i) => {
            const config = ACTION_CONFIG[d.action_type] || ACTION_CONFIG.error;
            const { Icon } = config;

            return (
              <div
                key={d.id || i}
                data-testid={`decision-${d.id || i}`}
                className="glass-1 glass-highlight glass-hover rounded-xl p-3.5 animate-glass-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="relative z-10 flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{d.event_title}</span>
                      <span className={`text-[9px] font-bold tracking-wider uppercase shrink-0 px-1.5 py-0.5 rounded border ${config.color} ${config.bg} ${config.badgeBorder}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-2 font-manrope">{d.description}</p>

                    {/* Why Chief Acted — glass inset */}
                    <div className="glass-1 rounded-lg px-3 py-2.5 space-y-1">
                      <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">
                        Why Chief Acted
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-manrope">
                        {d.reason}
                      </p>
                    </div>

                    <p className="text-[10px] text-[var(--text-muted)] mt-2 font-mono opacity-60">
                      {d.timestamp ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
