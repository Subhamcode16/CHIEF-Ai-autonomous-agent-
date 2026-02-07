import { RefreshCw, LogOut, Calendar } from "lucide-react";
import ChiefLogo from "@/components/ChiefLogo";

export default function Header({ session, selectedDate, onDateChange, onRefresh, onDisconnect }) {
  return (
    <header className="sticky top-0 z-50 glass-3 border-b border-white/[0.05]" data-testid="header">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-5 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl glass-2 flex items-center justify-center">
            <ChiefLogo size={22} />
          </div>
          <span className="font-barlow font-bold text-lg tracking-tight uppercase text-white/90">Chief</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 glass-1 rounded-lg px-3 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            data-testid="date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent border-none text-sm text-[var(--text-secondary)] font-mono focus:outline-none cursor-pointer [color-scheme:dark]"
          />
        </div>

        {/* User + Actions */}
        <div className="flex items-center gap-2">
          {session && (
            <div className="hidden md:flex items-center gap-2 mr-1">
              {session.picture && (
                <img src={session.picture} alt="" className="w-6 h-6 rounded-full ring-1 ring-white/10" />
              )}
              <span className="text-xs text-[var(--text-muted)] font-manrope">{session.email}</span>
            </div>
          )}
          <button
            data-testid="refresh-btn"
            onClick={onRefresh}
            className="glass-btn-ghost h-8 w-8 rounded-lg inline-flex items-center justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            data-testid="disconnect-btn"
            onClick={onDisconnect}
            className="glass-btn-ghost h-8 w-8 rounded-lg inline-flex items-center justify-center hover:!text-red-400"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
