import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarClock, BrainCircuit, ListTodo, ArrowRight, Layers, ChevronDown } from "lucide-react";
import ChiefLogo from "@/components/ChiefLogo";
import { GetStartedButton } from "@/components/ui/get-started-button";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const navigate = useNavigate();

  useEffect(() => {
    const existingSession = localStorage.getItem("chief_session_id");
    if (existingSession) {
      navigate(`/dashboard?session_id=${existingSession}`);
    }
  }, [navigate]);

  const connectCalendar = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/auth/google/login`);
      window.location.href = data.authorization_url;
    } catch (e) {
      console.error("Auth error:", e);
      setLoading(false);
    }
  };

  const features = [
    { icon: CalendarClock, title: "AUTONOMOUS SCHEDULING", desc: "Chief reads your calendar and makes smart scheduling decisions in seconds." },
    { icon: BrainCircuit, title: "AI-POWERED PLANNING", desc: "Gemini AI analyzes priorities and optimizes your entire day for peak output." },
    { icon: ListTodo, title: "TRANSPARENT DECISIONS", desc: "Every action explained. See exactly why Chief made each change." },
  ];

  return (
    <div className="bg-mesh relative overflow-hidden" data-testid="landing-page">
      {/* Background orbs for glass depth */}
      <div className="bg-orb animate-orb w-[500px] h-[500px] bg-blue-500/[0.06] top-[-10%] left-[10%]" />
      <div className="bg-orb animate-orb-slow w-[400px] h-[400px] bg-indigo-500/[0.05] top-[20%] right-[5%]" />
      <div className="bg-orb animate-orb w-[350px] h-[350px] bg-cyan-500/[0.03] bottom-[10%] left-[40%]" />

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center min-h-[75vh] pt-20">
        <div className="max-w-2xl mx-auto">
          {/* Logo + Status Badge */}
          <div className="flex items-center justify-center gap-3 mb-6 animate-glass-in">
            <div className="w-14 h-14 rounded-2xl glass-3 glass-highlight flex items-center justify-center animate-pulse-ring">
              <ChiefLogo size={30} />
            </div>
            <span className="font-barlow font-bold text-2xl tracking-tight uppercase text-white/90">Chief</span>
          </div>

          {/* Autonomous Status Badge */}
          <div className="flex items-center justify-center mb-10 animate-glass-in stagger-1" data-testid="status-badge">
            <div className="glass-1 rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span className="text-[11px] font-semibold tracking-wide uppercase text-green-400/80 font-manrope">Autonomous Mode Active</span>
            </div>
          </div>

          <h1
            className="font-barlow font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase mb-5 animate-glass-in stagger-1"
            data-testid="hero-title"
            style={{
              background: 'linear-gradient(135deg, #F1F5F9 0%, #60A5FA 45%, #3B82F6 65%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your Autonomous AI Chief of Staff
          </h1>

          <p className="text-[var(--text-secondary)] text-base sm:text-lg max-w-xl mx-auto mb-12 animate-glass-in stagger-2 leading-relaxed font-manrope font-light">
            Autonomous daily planning and live rescheduling.<br />
            Chief decides how your day should run — reading your calendar, prioritizing your work, and reshaping your schedule in real time.
          </p>

          {error && (
            <div
              className="mb-6 px-4 py-2.5 glass-2 rounded-xl border-red-500/20 text-red-400 text-sm inline-block"
              data-testid="auth-error"
            >
              Connection failed. Please try again.
            </div>
          )}

          <GetStartedButton
            data-testid="connect-calendar-btn"
            onClick={connectCalendar}
            disabled={loading}
            text={loading ? "Connecting..." : "Let Chief Plan My Day"}
            className="h-13 px-10 rounded-xl font-semibold text-base inline-flex items-center gap-2 animate-glass-in stagger-3 disabled:opacity-40"
          />

          {/* Scroll Cue */}
          <div className="mt-16 animate-glass-in stagger-4 flex flex-col items-center gap-2" data-testid="scroll-cue">
            <span className="text-[11px] tracking-widest uppercase text-[var(--text-muted)] font-manrope">See how Chief decides</span>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 px-6 pb-20 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`glass-2 glass-highlight glass-hover rounded-2xl p-6 animate-glass-up stagger-${i + 3}`}
              data-testid={`feature-card-${i}`}
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl glass-1 flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-barlow font-bold text-xs tracking-[0.18em] uppercase text-[var(--text-secondary)] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-manrope">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom accent */}
        <div className="flex items-center justify-center gap-2 mt-16 text-[var(--text-muted)] text-xs font-manrope animate-glass-in stagger-5">
          <Layers className="w-3.5 h-3.5" />
          <span>Powered by Gemini AI</span>
        </div>
      </div>
    </div>
  );
}
