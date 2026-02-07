import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-1 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-xs text-[var(--text-secondary)]">
                        {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function TrendChart({ data, title = "Activity Trend", delay = 0 }) {
    // Format data for display (show day names)
    const formattedData = data.map(item => ({
        ...item,
        day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    }));

    return (
        <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className="glass-1 rounded-2xl p-5 border border-white/[0.05]"
        >
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h3>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="day"
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar
                            dataKey="created"
                            name="Created"
                            fill="url(#colorCreated)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                        <Bar
                            dataKey="completed"
                            name="Completed"
                            fill="url(#colorCompleted)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                        <defs>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-cyan-500" />
                    <span className="text-xs text-[var(--text-muted)]">Created</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-green-500" />
                    <span className="text-xs text-[var(--text-muted)]">Completed</span>
                </div>
            </div>
        </motion.div>
    );
}
