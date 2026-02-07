import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Info } from "lucide-react";

export default function PreferencesModal({ open, onClose, preferences, onSave }) {
    const [dayStart, setDayStart] = useState(preferences?.day_start_hour ?? 0);
    const [dayEnd, setDayEnd] = useState(preferences?.day_end_hour ?? 24);

    const handleSave = () => {
        onSave({ day_start_hour: dayStart, day_end_hour: dayEnd });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Schedule Preferences
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Day Start */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Day starts at:
                        </label>
                        <select
                            value={dayStart}
                            onChange={(e) => setDayStart(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg
                         text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        >
                            {[...Array(24)].map((_, i) => (
                                <option key={i} value={i} className="bg-[var(--bg-primary)] text-black">
                                    {i.toString().padStart(2, '0')}:00
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Day End */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Day ends at:
                        </label>
                        <select
                            value={dayEnd}
                            onChange={(e) => setDayEnd(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg
                         text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        >
                            {[...Array(25)].map((_, i) => (
                                <option key={i} value={i} className="bg-[var(--bg-primary)] text-black">
                                    {i === 24 ? '24:00' : i.toString().padStart(2, '0') + ':00'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Info Tips */}
                    <div className="glass-1 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                            <Info className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                            <p>Chief will only schedule tasks within these hours.</p>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] ml-6">
                            💡 <strong>Tip:</strong> Set 00:00 - 24:00 for 24/7 scheduling
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        Save Preferences
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
