import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PRIORITIES = [
    { value: "urgent", label: "Urgent", color: "text-red-400", activeBg: "bg-red-500/10 border-red-500/25" },
    { value: "high", label: "High", color: "text-orange-400", activeBg: "bg-orange-500/10 border-orange-500/25" },
    { value: "medium", label: "Med", color: "text-blue-400", activeBg: "bg-blue-500/10 border-blue-500/25" },
    { value: "low", label: "Low", color: "text-slate-400", activeBg: "bg-white/[0.04] border-white/10" },
];

export default function EditTaskDialog({ task, open, onOpenChange, onSave }) {
    const [title, setTitle] = useState(task?.title || "");
    const [priority, setPriority] = useState(task?.priority || "medium");

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setPriority(task.priority);
        }
    }, [task]);

    const handleSave = () => {
        onSave(task.id, { title, priority });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-2 border-white/10 text-[var(--text-primary)]">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title"
                            className="glass-input w-full h-10 rounded-xl px-4 text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-white/20 transition-colors placeholder:text-white/20 text-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        {PRIORITIES.map(p => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setPriority(p.value)}
                                className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg border transition-all duration-150
                  ${priority === p.value
                                        ? `${p.color} ${p.activeBg}`
                                        : "text-[var(--text-muted)] bg-transparent border-white/[0.05] hover:border-white/10"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/5">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!title.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
