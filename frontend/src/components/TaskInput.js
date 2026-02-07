import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Flag, Pencil, Check } from "lucide-react";
import EditTaskDialog from "./EditTaskDialog";

const PRIORITIES = [
  { value: "urgent", label: "Urgent", color: "text-red-400", activeBg: "bg-red-500/10 border-red-500/25" },
  { value: "high", label: "High", color: "text-orange-400", activeBg: "bg-orange-500/10 border-orange-500/25" },
  { value: "medium", label: "Med", color: "text-blue-400", activeBg: "bg-blue-500/10 border-blue-500/25" },
  { value: "low", label: "Low", color: "text-slate-400", activeBg: "bg-white/[0.04] border-white/10" },
];

const getPriority = (p) => PRIORITIES.find(pr => pr.value === p) || PRIORITIES[2];

export default function TaskInput({ tasks, onAdd, onDelete, onUpdate }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [editingTask, setEditingTask] = useState(null);
  const [showCompleted, setShowCompleted] = useState(true);

  const handleToggleComplete = (task) => {
    onUpdate(task.id, { ...task, completed: !task.completed });
  };

  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter(t => !t.completed);

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), priority);
    setTitle("");
  };

  return (
    <div className="flex flex-col h-full" data-testid="task-input">
      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-white/[0.04] space-y-3">
        <input
          data-testid="task-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Add a task... (e.g., "Prep for investor pitch")'
          className="glass-input w-full h-10 rounded-xl px-4 text-sm"
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                data-testid={`priority-${p.value}`}
                onClick={() => setPriority(p.value)}
                className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md border transition-all duration-150
                  ${priority === p.value
                    ? `${p.color} ${p.activeBg}`
                    : "text-[var(--text-muted)] bg-transparent border-white/[0.05] hover:border-white/10"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!title.trim()}
            data-testid="add-task-btn"
            className="glass-btn-primary ml-auto h-7 px-3 text-xs rounded-lg inline-flex items-center gap-1 disabled:opacity-30"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </form>

      {/* Task list */}
      <ScrollArea className="flex-1">
        {/* Filter toggle */}
        {tasks.length > 0 && (
          <div className="px-4 py-2 border-b border-white/[0.04] flex items-center justify-between">
            <div className="text-xs text-[var(--text-muted)]">
              <span className="text-[var(--text-primary)] font-semibold">{pendingCount}</span> pending
              {completedCount > 0 && (
                <>
                  {" · "}
                  <span className="text-green-400 font-semibold">{completedCount}</span> completed
                </>
              )}
            </div>
            {completedCount > 0 && (
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-xs text-[var(--text-muted)] hover:text-white transition-colors"
              >
                {showCompleted ? "Hide" : "Show"} completed
              </button>
            )}
          </div>
        )}

        <div className="p-3 space-y-1.5">
          {filteredTasks.length === 0 && !showCompleted && completedCount > 0 ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-12 font-manrope">
              All tasks completed! 🎉
            </p>
          ) : filteredTasks.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-12 font-manrope" data-testid="no-tasks-msg">
              No tasks yet. Add tasks for Chief to schedule.
            </p>
          ) : (
            filteredTasks.map((task, i) => {
              const ps = getPriority(task.priority);
              return (
                <div
                  key={task.id}
                  data-testid={`task-${task.id}`}
                  className={`glass-1 glass-hover rounded-xl flex items-center gap-3 px-3.5 py-2.5 group animate-glass-in transition-all ${task.completed ? "opacity-50" : ""
                    }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Checkbox */}
                  <button
                    data-testid={`complete-task-${task.id}`}
                    onClick={() => handleToggleComplete(task)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${task.completed
                      ? "bg-green-500/20 border-green-500 text-green-400"
                      : "border-white/20 hover:border-white/40 text-transparent hover:text-white/20"
                      }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </button>

                  <Flag className={`w-3.5 h-3.5 shrink-0 ${ps.color} ${task.completed ? "opacity-50" : ""}`} />
                  <span className={`flex-1 text-sm text-[var(--text-primary)] truncate font-manrope ${task.completed ? "line-through opacity-50" : ""
                    }`}>{task.title}</span>
                  <span className={`text-[9px] font-bold tracking-wider uppercase shrink-0 px-1.5 py-0.5 rounded border ${ps.color} ${ps.activeBg} ${task.completed ? "opacity-50" : ""
                    }`}>
                    {task.priority}
                  </span>
                  <button
                    data-testid={`edit-task-${task.id}`}
                    onClick={() => setEditingTask(task)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-blue-400 transition-all duration-150 shrink-0 mr-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid={`delete-task-${task.id}`}
                    onClick={() => onDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all duration-150 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={onUpdate}
      />
    </div>
  );
}
