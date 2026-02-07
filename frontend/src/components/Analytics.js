import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ListChecks, CheckCircle2, Percent, BrainCircuit, Clock, Loader2, BarChart3 } from "lucide-react";
import StatCard from "./analytics/StatCard";
import TrendChart from "./analytics/TrendChart";
import PriorityChart from "./analytics/PriorityChart";
import ActionTypesChart from "./analytics/ActionTypesChart";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PERIODS = [
    { label: "7 Days", value: 7 },
    { label: "14 Days", value: 14 },
    { label: "30 Days", value: 30 }
];

export default function Analytics({ sessionId, isScrollSection = false }) {
    const [period, setPeriod] = useState(7);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [distributions, setDistributions] = useState(null);

    useEffect(() => {
        if (!sessionId) return;

        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const [summaryRes, trendsRes, distRes] = await Promise.all([
                    axios.get(`${API}/analytics/summary`, { params: { session_id: sessionId, days: period } }),
                    axios.get(`${API}/analytics/trends`, { params: { session_id: sessionId, days: period } }),
                    axios.get(`${API}/analytics/distributions`, { params: { session_id: sessionId, days: period } })
                ]);

                setSummary(summaryRes.data);
                setTrends(trendsRes.data.daily || []);
                setDistributions(distRes.data);
            } catch (err) {
                console.error("Analytics fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [sessionId, period]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-8 h-8 text-cyan-400" />
                </motion.div>
                <p className="text-sm text-[var(--text-muted)] mt-4">Loading analytics...</p>
            </div>
        );
    }

    const hasData = summary && (summary.tasks_created > 0 || summary.ai_actions > 0);

    if (!hasData) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20"
            >
                <div className="w-16 h-16 rounded-2xl glass-1 flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Analytics Yet</h3>
                <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
                    Start adding tasks and let Chief plan your day to see your productivity insights here.
                </p>
            </motion.div>
        );
    }

    return (
        <div className={isScrollSection ? "space-y-6" : "p-4 space-y-6"}>
            {/* Period selector - always show, but different layout for scroll section */}
            <div
                className={`flex items-center ${isScrollSection ? "justify-center" : "justify-between"}`}
            >
                {!isScrollSection && (
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Analytics</h2>
                )}

                <div className="relative flex items-center glass-1 rounded-lg p-1">
                    {/* Fixed sliding indicator */}
                    <motion.div
                        className="absolute top-1 bottom-1 bg-cyan-500/20 border border-cyan-500/30 rounded-md"
                        initial={false}
                        animate={{
                            left: `${PERIODS.findIndex(p => p.value === period) * (100 / PERIODS.length)}%`,
                            width: `${100 / PERIODS.length}%`
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ marginLeft: 4, marginRight: 4, width: `calc(${100 / PERIODS.length}% - 8px)` }}
                    />

                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className="relative px-4 py-1.5 text-xs font-medium rounded-md z-10 flex-1 text-center"
                        >
                            <span className={`transition-colors duration-200 ${period === p.value ? "text-cyan-400" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>
                                {p.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    title="Tasks Created"
                    value={summary?.tasks_created || 0}
                    subtitle={`In last ${period} days`}
                    icon={ListChecks}
                    color="cyan"
                    delay={0}
                />
                <StatCard
                    title="Completed"
                    value={summary?.tasks_completed || 0}
                    subtitle={`${summary?.completion_rate || 0}% completion rate`}
                    icon={CheckCircle2}
                    color="green"
                    delay={0.1}
                />
                <StatCard
                    title="AI Actions"
                    value={summary?.ai_actions || 0}
                    subtitle="Events scheduled"
                    icon={BrainCircuit}
                    color="purple"
                    delay={0.2}
                />
                <StatCard
                    title="Time Saved"
                    value={`${summary?.time_saved_minutes || 0}m`}
                    subtitle="Estimated savings"
                    icon={Clock}
                    color="orange"
                    delay={0.3}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TrendChart
                    data={trends}
                    title="Task Activity (Created vs Completed)"
                    delay={0.4}
                />
                <PriorityChart
                    data={distributions?.priority || {}}
                    title="Priority Distribution"
                    delay={0.5}
                />
            </div>

            {/* AI Actions Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ActionTypesChart
                    data={distributions?.action_types || {}}
                    title="AI Decision Breakdown"
                    delay={0.6}
                />

                {/* Peak Hours Card */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="glass-1 rounded-2xl p-5 border border-white/[0.05]"
                >
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Peak Productivity Hours</h3>

                    {distributions?.peak_hours?.length > 0 ? (
                        <div className="space-y-3">
                            {distributions.peak_hours.map((item, index) => {
                                const maxCount = Math.max(...distributions.peak_hours.map(h => h.count));
                                const percentage = (item.count / maxCount) * 100;
                                const hourLabel = `${item.hour.toString().padStart(2, '0')}:00`;

                                return (
                                    <motion.div
                                        key={item.hour}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.08 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-xs font-mono text-[var(--text-muted)] w-12">
                                            {hourLabel}
                                        </span>
                                        <div className="flex-1 h-6 bg-white/[0.03] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ scaleX: 0 }}
                                                whileInView={{ scaleX: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.5, delay: 0.1 + index * 0.08, ease: "easeOut" }}
                                                style={{ width: `${percentage}%`, transformOrigin: "left" }}
                                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-[var(--text-secondary)] w-8 text-right">
                                            {item.count}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--text-muted)] text-center py-8">
                            Not enough data yet
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
