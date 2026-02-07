import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e"
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="glass-1 rounded-lg p-3 border border-white/10">
                <p className="text-sm font-medium capitalize" style={{ color: data.payload.fill }}>
                    {data.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                    {data.value} tasks ({data.payload.percent}%)
                </p>
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload }) => (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
        {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5">
                <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-[var(--text-muted)] capitalize">
                    {entry.value}
                </span>
            </div>
        ))}
    </div>
);

export default function PriorityChart({ data, title = "Priority Distribution", delay = 0 }) {
    // Transform data for pie chart
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    const chartData = Object.entries(data)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
            name,
            value,
            percent: total > 0 ? Math.round((value / total) * 100) : 0
        }));

    if (total === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay, ease: "easeOut" }}
                className="glass-1 rounded-2xl p-5 border border-white/[0.05] flex items-center justify-center h-64"
            >
                <p className="text-sm text-[var(--text-muted)]">No task data yet</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className="glass-1 rounded-2xl p-5 border border-white/[0.05]"
        >
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{title}</h3>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={delay * 1000}
                            animationDuration={800}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name]}
                                    stroke="transparent"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
