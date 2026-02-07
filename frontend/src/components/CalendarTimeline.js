import { useMemo, useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";

const HOUR_HEIGHT = 64;
const START_HOUR = 6;
const END_HOUR = 22;
const SNAP_MINUTES = 15;
const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;

const formatHour = (h) => {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

export default function CalendarTimeline({ events, date, onEventMove, onEventComplete }) {
  const containerRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [currentDragTop, setCurrentDragTop] = useState(0);

  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i), []);

  // Process events for rendering
  const positionedEvents = useMemo(() => {
    return events
      .filter(e => !e.is_all_day && e.start && e.end)
      .map(event => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;
        const top = (startHour - START_HOUR) * HOUR_HEIGHT;
        const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 30);
        const isChief = event.is_chief || (event.description && event.description.includes("Created by Chief"));
        return { ...event, top, height, isChief, startTime: start, endTime: end };
      });
  }, [events]);

  const allDayEvents = useMemo(() => events.filter(e => e.is_all_day), [events]);

  // Handle Dragging
  const handleMouseDown = (e, event) => {
    e.stopPropagation(); // Prevent scroll capture if needed
    setDraggingId(event.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset(e.clientY - rect.top); // Offset within the element
    setCurrentDragTop(event.top);

    // Disable text selection during drag
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!draggingId || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - containerRect.top - 16; // 16px padding
    const rawTop = relativeY - dragOffset;

    // Snap logic
    const snapPixels = (SNAP_MINUTES / 60) * HOUR_HEIGHT;
    const snappedTop = Math.round(rawTop / snapPixels) * snapPixels;

    // Boundary checks
    const maxTop = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
    const clampedTop = Math.max(0, Math.min(snappedTop, maxTop));

    setCurrentDragTop(clampedTop);
  };

  const handleMouseUp = () => {
    if (draggingId) {
      const event = positionedEvents.find(e => e.id === draggingId);
      if (event && onEventMove) {
        // Calculate new times
        const droppedHourOffset = currentDragTop / HOUR_HEIGHT;
        const newStartHour = START_HOUR + droppedHourOffset;

        const durationHours = (event.endTime - event.startTime) / (1000 * 60 * 60);

        const newStart = new Date(event.startTime);
        newStart.setHours(Math.floor(newStartHour));
        newStart.setMinutes((newStartHour % 1) * 60);
        newStart.setSeconds(0);

        const newEnd = new Date(newStart);
        newEnd.setTime(newEnd.getTime() + durationHours * 60 * 60 * 1000);

        // Only trigger update if time changed
        if (newStart.getTime() !== event.startTime.getTime()) {
          onEventMove(event.id, newStart, newEnd);
        }
      }
    }
    setDraggingId(null);
    setDragOffset(0);
    document.body.style.userSelect = '';
  };

  // Global mouse listeners for drag
  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, currentDragTop]);

  // Conflict detection for current drag
  const getDragConflict = (dragTop, currentId, currentHeight) => {
    if (!draggingId) return false;
    const dragBottom = dragTop + currentHeight;

    return positionedEvents.some(e => {
      if (e.id === currentId) return false;
      const eBottom = e.top + e.height;
      // Simple interval overlap
      return (dragTop < eBottom && dragBottom > e.top);
    });
  };

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const isToday = date === now.toISOString().split("T")[0];
  const currentTimeTop = (nowHour - START_HOUR) * HOUR_HEIGHT;

  return (
    <ScrollArea className="h-[570px]" data-testid="calendar-timeline">
      {allDayEvents.length > 0 && (
        <div className="px-5 py-2.5 border-b border-white/[0.04] flex flex-wrap gap-1.5">
          {allDayEvents.map(e => (
            <span key={e.id} className="text-[11px] text-blue-300/80 glass-1 px-2.5 py-0.5 rounded-full">
              {e.title}
            </span>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative px-4 pt-4 pb-4"
        style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT + 24 }}
      >
        {/* Hour grid */}
        {hours.map(hour => (
          <div key={hour} className="absolute w-full left-0 flex items-start" style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}>
            <span className="font-mono text-[10px] text-[var(--text-muted)] w-14 -mt-1.5 text-right pr-3 select-none shrink-0 opacity-60">
              {formatHour(hour)}
            </span>
            <div className="flex-1 border-t border-white/[0.03]" />
          </div>
        ))}

        {/* Event blocks — glass cards */}
        {positionedEvents.map(event => {
          const isDragging = draggingId === event.id;
          const top = isDragging ? currentDragTop : event.top;
          const isConflict = isDragging ? getDragConflict(top, event.id, event.height) : false;

          return (
            <div
              key={event.id}
              data-testid={`calendar-event-${event.id}`}
              onMouseDown={(e) => handleMouseDown(e, event)}
              className={`absolute left-16 right-3 rounded-xl px-3 py-1.5 transition-all duration-75 cursor-grab active:cursor-grabbing backdrop-blur-md group
                  ${isDragging ? "z-50 shadow-lg scale-[1.02]" : "z-10"}
                  ${isConflict ? "border-red-500/50 bg-red-500/10" :
                  event.isChief
                    ? "glass-2 border-green-500/15"
                    : "glass-2 border-blue-500/15"
                }`}
              style={{
                top: top + 2, // Matches original +2 offset
                height: Math.max(event.height - 4, 26),
                borderColor: isConflict ? 'rgba(239,68,68,0.5)' : (event.isChief ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)'),
                background: isConflict
                  ? 'rgba(239,68,68,0.1)'
                  : (event.isChief
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))'
                    : 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))')
              }}
            >
              {/* Completion button - only for Chief events */}
              {event.isChief && onEventComplete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventComplete(event);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 
                             w-5 h-5 rounded-md bg-green-500/20 hover:bg-green-500/30 
                             border border-green-500/30 flex items-center justify-center
                             transition-opacity z-10"
                  title="Mark task complete"
                >
                  <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
                </button>
              )}

              <p className={`text-xs font-semibold truncate ${isConflict ? "text-red-200" : (event.isChief ? "text-green-300/90" : "text-blue-300/90")
                }`}>
                {event.isChief && !isConflict && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                )}
                {event.title}
                {isConflict && <span className="ml-2 text-[10px] uppercase tracking-wide opacity-80">(Conflict)</span>}
              </p>
              {event.height > 40 && (
                <p className={`text-[10px] mt-0.5 font-mono ${isConflict ? "text-red-300/70" : "text-[var(--text-muted)]"}`}>
                  {isDragging
                    ? (() => {
                      // Calculate preview time for dragging
                      const droppedHourOffset = top / HOUR_HEIGHT;
                      const newStartHour = START_HOUR + droppedHourOffset;
                      const h = Math.floor(newStartHour);
                      const m = (newStartHour % 1) * 60;
                      const startStr = `${h > 12 ? h - 12 : (h === 0 ? 12 : h)}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                      return `${startStr} (New)`;
                    })()
                    : `${event.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${event.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  }
                </p>
              )}
              {event.height > 60 && event.location && (
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate opacity-60">{event.location}</p>
              )}
            </div>
          );
        })}

        {/* Current time indicator */}
        {isToday && nowHour >= START_HOUR && nowHour <= END_HOUR && (
          <div className="time-indicator" style={{ top: currentTimeTop }} data-testid="current-time-indicator" />
        )}

        {/* Empty state */}
        {events.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[var(--text-muted)] text-sm font-manrope" data-testid="no-events-msg">No events for this day</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
