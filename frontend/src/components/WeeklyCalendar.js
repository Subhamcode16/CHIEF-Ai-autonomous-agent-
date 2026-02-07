import { useMemo } from "react";

const HOUR_HEIGHT = 40;
const START_HOUR = 6;
const END_HOUR = 22;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1));

    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        week.push(d.toISOString().split("T")[0]);
    }
    return week;
}

function formatHour(h) {
    const suffix = h >= 12 ? "pm" : "am";
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}${suffix}`;
}

export default function WeeklyCalendar({ events, date, onDayClick }) {
    const weekDates = useMemo(() => getWeekDates(date), [date]);
    const today = new Date().toISOString().split("T")[0];

    const eventsByDay = useMemo(() => {
        const map = {};
        weekDates.forEach((d) => (map[d] = []));

        events.forEach((event) => {
            const eventDate = event.start?.split("T")[0];
            if (map[eventDate]) {
                map[eventDate].push(event);
            }
        });

        return map;
    }, [events, weekDates]);

    const hours = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
        hours.push(h);
    }

    const getEventPosition = (event) => {
        const startTime = new Date(event.start);
        const endTime = new Date(event.end);

        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

        const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
        const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

        return { top: Math.max(0, top), height: Math.max(20, height) };
    };

    return (
        <div className="flex flex-col h-[600px]">
            {/* Day headers */}
            <div className="flex border-b border-white/[0.05]">
                <div className="w-12 shrink-0" />
                {weekDates.map((d, i) => {
                    const dayDate = new Date(d);
                    const isToday = d === today;
                    const dayNum = dayDate.getDate();
                    const dayName = DAY_NAMES[dayDate.getDay()];

                    return (
                        <div
                            key={d}
                            onClick={() => onDayClick?.(d)}
                            className={`flex-1 py-2 text-center cursor-pointer transition-colors hover:bg-white/[0.03] ${isToday ? "bg-blue-500/10" : ""
                                }`}
                        >
                            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                                {dayName}
                            </div>
                            <div
                                className={`text-sm font-semibold ${isToday ? "text-blue-400" : "text-[var(--text-primary)]"
                                    }`}
                            >
                                {dayNum}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time grid */}
            <div className="flex-1 overflow-auto">
                <div className="flex relative" style={{ height: hours.length * HOUR_HEIGHT }}>
                    {/* Time labels */}
                    <div className="w-12 shrink-0 relative">
                        {hours.map((h) => (
                            <div
                                key={h}
                                className="absolute w-full text-right pr-2 text-[10px] text-[var(--text-muted)]"
                                style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 6 }}
                            >
                                {formatHour(h)}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {weekDates.map((d) => (
                        <div
                            key={d}
                            className="flex-1 relative border-l border-white/[0.03]"
                            onClick={() => onDayClick?.(d)}
                        >
                            {/* Hour lines */}
                            {hours.map((h) => (
                                <div
                                    key={h}
                                    className="absolute w-full border-t border-white/[0.03]"
                                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                                />
                            ))}

                            {/* Events */}
                            {eventsByDay[d]?.map((event) => {
                                const pos = getEventPosition(event);
                                return (
                                    <div
                                        key={event.id}
                                        className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] overflow-hidden cursor-pointer transition-all hover:brightness-110 ${event.is_chief
                                                ? "bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white"
                                                : "bg-white/10 text-[var(--text-primary)]"
                                            }`}
                                        style={{ top: pos.top, height: pos.height }}
                                        title={event.title}
                                    >
                                        <div className="font-medium truncate">{event.title}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
