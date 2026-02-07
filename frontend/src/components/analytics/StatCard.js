import { motion } from "framer-motion";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "cyan", delay = 0 }) {
    const colorClasses = {
        cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
        green: "from-green-500/20 to-green-600/5 border-green-500/20",
        purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
        orange: "from-orange-500/20 to-orange-600/5 border-orange-500/20"
    };

    const iconColors = {
        cyan: "text-cyan-400",
        green: "text-green-400",
        purple: "text-purple-400",
        orange: "text-orange-400"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className={`
                relative overflow-hidden rounded-2xl p-5
                bg-gradient-to-br ${colorClasses[color]}
                border border-white/[0.05]
                backdrop-blur-xl
            `}
        >
            {/* Background glow effect */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${colorClasses[color]} blur-3xl opacity-30`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        {title}
                    </span>
                    {Icon && (
                        <div className={`p-2 rounded-lg bg-white/[0.05] ${iconColors[color]}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: delay + 0.2 }}
                >
                    <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                        {value}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-[var(--text-secondary)]">
                            {subtitle}
                        </p>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
