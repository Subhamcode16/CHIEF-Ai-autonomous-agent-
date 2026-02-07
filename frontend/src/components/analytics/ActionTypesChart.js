import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = {
    create_event: "#22c55e",
    move_event: "#3b82f6",
    move_event_manual: "#a855f7",
    error: "#ef4444"
};

const LABELS = {
    create_event: "Created",
    move_event: "AI Moved",
    move_event_manual: "Manual",
    error: "Errors"
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass-1 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium" style={{ color: COLORS[data.name] }}>
                    {LABELS[data.name]}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                    {data.value} actions
                </p>
            </div>
        );
    }
    return null;
};

export default function ActionTypesChart({ data, title = "AI Actions", delay = 0 }) {
    // Transform data for bar chart
    const chartData = Object.entries(data)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
            name,
            label: LABELS[name],
            value
        }));

    const total = chartData.reduce((a, b) => a + b.value, 0);

    if (total === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay, ease: "easeOut" }}
                className="glass-1 rounded-2xl p-5 border border-white/[0.05] flex items-center justify-center h-64"
            >
                <p className="text-sm text-[var(--text-muted)]">No AI actions yet</p>
            </motion.div>
        );
    }

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
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                    >
                        <XAxis
                            type="number"
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                            width={55}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar
                            dataKey="value"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={24}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t border-white/[0.05] text-center">
                <span className="text-xs text-[var(--text-muted)]">
                    Total: <span className="font-semibold text-[var(--text-primary)]">{total}</span> AI actions
                </span>
            </div>
        </motion.div>
    );
}
