import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import CalendarTimeline from "@/components/CalendarTimeline";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import TaskInput from "@/components/TaskInput";
import DecisionLog from "@/components/DecisionLog";
import OnboardingTooltip from "@/components/OnboardingTooltip";
import PreferencesModal from "@/components/PreferencesModal";
import { BrainCircuit, Loader2, Calendar, CalendarDays, RotateCcw, Settings } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const [viewMode, setViewMode] = useState("day"); // "day" or "week"
  const [onboardingStep, setOnboardingStep] = useState(null);
  const [preferences, setPreferences] = useState({ day_start_hour: 0, day_end_hour: 24 });
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  useEffect(() => {
    const urlSession = searchParams.get("session_id");
    const storedSession = localStorage.getItem("chief_session_id");
    const sid = urlSession || storedSession;
    if (!sid) { navigate("/"); return; }
    if (urlSession) localStorage.setItem("chief_session_id", urlSession);
    setSessionId(sid);
  }, [searchParams, navigate]);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data } = await axios.get(`${API}/auth/session/${sessionId}`);
      setSession(data);
    } catch {
      localStorage.removeItem("chief_session_id");
      navigate("/");
    }
  }, [sessionId, navigate]);

  const fetchEvents = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Calculate week range if in week mode
      let params = { session_id: sessionId, date: selectedDate };

      if (viewMode === "week") {
        const date = new Date(selectedDate);
        const day = date.getDay();
        const monday = new Date(date);
        monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        params.date = monday.toISOString().split("T")[0];
        params.end_date = sunday.toISOString().split("T")[0];
      }

      const { data } = await axios.get(`${API}/calendar/events`, { params });
      setEvents(data);
    } catch (e) {
      if (e.response?.status === 401) {
        toast.error("Session expired. Please reconnect.");
        localStorage.removeItem("chief_session_id");
        navigate("/");
      }
    }
  }, [sessionId, selectedDate, viewMode, navigate]);

  const fetchTasks = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data } = await axios.get(`${API}/tasks`, { params: { session_id: sessionId } });
      setTasks(data);
    } catch (e) { console.error("Tasks error:", e); }
  }, [sessionId]);

  const fetchDecisions = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data } = await axios.get(`${API}/decisions`, { params: { session_id: sessionId } });
      setDecisions(data);
    } catch (e) { console.error("Decisions error:", e); }
  }, [sessionId]);

  const fetchPreferences = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await axios.get(`${API}/preferences`, {
        params: { session_id: sessionId }
      });
      setPreferences(res.data);
    } catch (e) {
      console.error("Failed to fetch preferences:", e);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const loadAll = async () => {
      setLoading(true);
      await fetchSession();
      await Promise.all([fetchEvents(), fetchTasks(), fetchDecisions(), fetchPreferences()]);
      setLoading(false);
    };
    loadAll();
  }, [sessionId, fetchSession, fetchEvents, fetchTasks, fetchDecisions, fetchPreferences]);

  const savePreferences = async (prefs) => {
    try {
      await axios.put(`${API}/preferences`, null, {
        params: {
          session_id: sessionId,
          day_start_hour: prefs.day_start_hour,
          day_end_hour: prefs.day_end_hour
        }
      });
      setPreferences(prefs);
      toast.success("Schedule preferences saved");
    } catch (e) {
      console.error("Save preferences error:", e);
      toast.error("Failed to save preferences");
    }
  };

  // Re-fetch events when view mode changes
  useEffect(() => {
    if (sessionId && !loading) {
      fetchEvents();
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for onboarding on first load
  useEffect(() => {
    const completed = localStorage.getItem("chief_onboarding");
    if (!completed && sessionId && !loading) {
      // Start onboarding after a short delay
      setTimeout(() => setOnboardingStep(0), 500);
    }
  }, [sessionId, loading]);

  const addTask = async (title, priority) => {
    try {
      await axios.post(`${API}/tasks`, { session_id: sessionId, title, priority });
      fetchTasks();
      toast.success("Task added");
    } catch { toast.error("Failed to add task"); }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`, { params: { session_id: sessionId } });
      fetchTasks();
    } catch { toast.error("Failed to delete task"); }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, updates, { params: { session_id: sessionId } });
      fetchTasks();
      toast.success("Task updated");
    } catch { toast.error("Failed to update task"); }
  };

  const planDay = async () => {
    if (tasks.length === 0) { toast.error("Add some tasks first"); return; }
    setPlanning(true);
    try {
      const { data } = await axios.post(`${API}/plan`, { session_id: sessionId, date: selectedDate });
      toast.success(`Chief made ${data.actions_count} change(s)`);
      setActiveTab("log");
      await Promise.all([fetchEvents(), fetchTasks(), fetchDecisions()]);
    } catch (e) {
      toast.error("Planning failed. Please try again.");
      console.error("Plan error:", e);
    } finally { setPlanning(false); }
  };

  const disconnect = async () => {
    try { await axios.delete(`${API}/auth/session/${sessionId}`); } catch { }
    localStorage.removeItem("chief_session_id");
    navigate("/");
  };

  const handleEventMove = async (eventId, newStart, newEnd) => {
    // 1. Optimistic update
    const originalEvents = [...events];
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          start: newStart.toISOString(),
          end: newEnd.toISOString()
        };
      }
      return e;
    }));

    try {
      // 2. Call API
      const { data } = await axios.post(`${API}/calendar/events/move`, {
        session_id: sessionId,
        event_id: eventId,
        new_start: newStart.toISOString(),
        new_end: newEnd.toISOString()
      });

      // 3. Handle specific warnings/success
      if (data.warning) {
        toast.warning("Moved with conflict", {
          description: `Shifted to ${newStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        });
      } else {
        toast.success("Event moved");
      }

      // 4. Refresh to get source-of-truth
      fetchEvents();
      fetchDecisions();

    } catch (e) {
      // 5. Revert on error
      console.error("Move failed:", e);
      toast.error("Failed to move event");
      setEvents(originalEvents);
    }
  };

  const handleClearDecisions = async () => {
    if (!window.confirm("Clear all decisions? This cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`${API}/decisions`, {
        params: { session_id: sessionId }
      });
      toast.success("Decisions cleared");
      fetchDecisions();
    } catch (e) {
      console.error("Clear decisions error:", e);
      toast.error("Failed to clear decisions");
    }
  };

  const handleEventComplete = async (event) => {
    // Optimistic update: Remove event immediately for instant feedback
    const originalEvents = events;
    setEvents(events.filter(e => e.id !== event.id));

    try {
      console.log("Completing event:", event);

      // Find matching task by title
      const task = tasks.find(t =>
        event.title.toLowerCase().includes(t.title.toLowerCase()) ||
        t.title.toLowerCase().includes(event.title.toLowerCase())
      );

      console.log("Found task:", task);

      if (task) {
        // Mark task as completed
        console.log("Marking task complete:", task.id);
        await updateTask(task.id, { ...task, completed: true });
        toast.success(`"${task.title}" marked complete`);
      } else {
        console.warn("No matching task found for event:", event.title);
      }

      // Delete the calendar event
      console.log("Deleting event:", event.id, "session:", sessionId);
      const response = await axios.delete(`${API}/calendar/events/${event.id}`, {
        params: { session_id: sessionId }
      });
      console.log("Delete response:", response.data);

      // Refresh to sync state
      fetchEvents();
      fetchTasks();
    } catch (e) {
      // Rollback on error: restore original events
      setEvents(originalEvents);
      console.error("Event completion error details:", {
        error: e,
        message: e.message,
        response: e.response?.data,
        status: e.response?.status
      });
      toast.error(`Failed to complete task: ${e.response?.data?.detail || e.message}`);
    }
  };

  const handleOnboardingNext = () => {
    if (onboardingStep === 2) {
      // Last step
      localStorage.setItem("chief_onboarding", "completed");
      setOnboardingStep(null);
    } else {
      setOnboardingStep(onboardingStep + 1);
    }
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem("chief_onboarding", "completed");
    setOnboardingStep(null);
  };

  if (loading) {
    return (
      <div className="bg-mesh p-6" data-testid="dashboard-loading">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-14 w-full rounded-xl bg-white/[0.03]" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Skeleton className="h-[620px] md:col-span-7 rounded-2xl bg-white/[0.03]" />
            <div className="md:col-span-5 space-y-5">
              <Skeleton className="h-14 rounded-xl bg-white/[0.03]" />
              <Skeleton className="h-[560px] rounded-2xl bg-white/[0.03]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mesh relative" data-testid="dashboard">
      {/* Background orbs */}
      <div className="bg-orb animate-orb w-[450px] h-[450px] bg-blue-500/[0.05] top-[10%] left-[5%] fixed" />
      <div className="bg-orb animate-orb-slow w-[350px] h-[350px] bg-indigo-500/[0.04] bottom-[10%] right-[10%] fixed" />
      <div className="bg-orb animate-orb w-[300px] h-[300px] bg-cyan-500/[0.03] top-[60%] left-[50%] fixed" />

      <Header
        session={session}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onRefresh={fetchEvents}
        onDisconnect={disconnect}
      />

      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 p-5 md:p-8">
        {/* Calendar panel */}
        <div
          className="md:col-span-7 glass-2 glass-highlight rounded-2xl overflow-hidden animate-glass-in"
          data-testid="calendar-panel"
        >
          <div className="relative z-10 px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
            <h2 className="font-barlow font-bold text-xs tracking-[0.18em] uppercase text-[var(--text-secondary)]">
              {viewMode === "day" ? "Calendar Timeline" : "Weekly View"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)] font-mono mr-2">{events.length} events</span>
              <button
                onClick={() => setViewMode("day")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "day"
                  ? "bg-white/10 text-white"
                  : "text-[var(--text-muted)] hover:bg-white/5"
                  }`}
                title="Day View"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "week"
                  ? "bg-white/10 text-white"
                  : "text-[var(--text-muted)] hover:bg-white/5"
                  }`}
                title="Week View"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
          </div>
          {viewMode === "day" ? (
            <CalendarTimeline
              events={events}
              date={selectedDate}
              onEventMove={handleEventMove}
              onEventComplete={handleEventComplete}
            />
          ) : (
            <WeeklyCalendar
              events={events}
              date={selectedDate}
              onDayClick={(d) => {
                setSelectedDate(d);
                setViewMode("day");
              }}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="md:col-span-5 flex flex-col gap-5">
          {/* Plan button */}
          <div className="flex gap-3 animate-glass-in stagger-1">
            <button
              onClick={planDay}
              disabled={planning || tasks.length === 0}
              className="group flex-1 flex items-center gap-2 px-5 py-3.5 rounded-xl glass-1 glass-highlight glass-hover
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-50
                          border border-white/[0.08] shadow-md transition-all duration-300
                          hover:scale-[1.02] hover:border-blue-400/30"
              data-testid="plan-button"
            >
              <BrainCircuit className={`w-4 h-4 ${planning ? "animate-pulse" : "group-hover:scale-110"} transition-all text-blue-400`} />
              <span className="font-heading font-semibold text-[13px] text-[var(--text-primary)] tracking-tight">
                {planning ? "Planning..." : "Let Chief Plan My Day"}
              </span>
            </button>

            {/* Schedule Preferences Button */}
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="group flex items-center gap-2 px-4 py-3.5 rounded-xl glass-1 glass-highlight glass-hover
                          border border-white/[0.08] shadow-md transition-all duration-300
                          hover:scale-[1.02] hover:border-purple-400/30"
              title="Schedule Preferences"
            >
              <Settings className="w-4 h-4 group-hover:rotate-90 transition-all text-purple-400" />
            </button>
          </div>

          {/* Reset to AI Plan button */}
          <button
            data-testid="reset-plan-btn"
            onClick={async () => {
              try {
                const { data } = await axios.post(`${API}/calendar/reset-to-plan`, {
                  session_id: sessionId,
                  date: selectedDate
                });

                // Show detailed feedback
                if (data.restored_count > 0) {
                  toast.success(`Restored ${data.restored_count} event(s) to AI schedule`);
                } else if (data.skipped_count > 0) {
                  toast.warning(`No events restored. ${data.skipped_count} event(s) skipped (missing event IDs)`);
                } else {
                  toast.info("No events found to restore");
                }

                // Show errors if any
                if (data.errors && data.errors.length > 0) {
                  console.error("Reset errors:", data.errors);
                  toast.error(`${data.errors.length} error(s) occurred. Check console for details.`);
                }

                fetchEvents();
              } catch (e) {
                toast.error("Failed to reset schedule");
                console.error("Reset error:", e);
              }
            }}
            disabled={decisions.length === 0}
            className="glass-btn w-full h-10 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-30 animate-glass-in stagger-1 text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to AI Schedule
          </button>

          {/* Tabs panel */}
          <div
            className="flex-1 glass-2 glass-highlight rounded-2xl overflow-hidden min-h-[520px] animate-glass-in stagger-2"
            data-testid="sidebar-panel"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="relative z-10 w-full bg-transparent rounded-none border-b border-white/[0.05] h-11 p-0">
                <TabsTrigger
                  value="tasks"
                  className="flex-1 rounded-none h-full text-[var(--text-muted)] text-sm font-semibold transition-all duration-200 data-[state=active]:text-white data-[state=active]:bg-white/[0.04] data-[state=active]:border-b-2 data-[state=active]:border-blue-400"
                  data-testid="tasks-tab"
                >
                  Tasks ({tasks.length})
                </TabsTrigger>
                <TabsTrigger
                  value="log"
                  className="flex-1 rounded-none h-full text-[var(--text-muted)] text-sm font-semibold transition-all duration-200 data-[state=active]:text-white data-[state=active]:bg-white/[0.04] data-[state=active]:border-b-2 data-[state=active]:border-blue-400"
                  data-testid="log-tab"
                >
                  Decision Log ({decisions.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tasks" className="flex-1 m-0 overflow-auto">
                <ErrorBoundary>
                  <TaskInput tasks={tasks} onAdd={addTask} onDelete={deleteTask} onUpdate={updateTask} />
                </ErrorBoundary>
              </TabsContent>
              <TabsContent value="log" className="flex-1 m-0 overflow-auto">
                <DecisionLog decisions={decisions} onClear={handleClearDecisions} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Onboarding overlay */}
      {onboardingStep !== null && (
        <OnboardingTooltip
          step={onboardingStep}
          onNext={handleOnboardingNext}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Preferences Modal */}
      <PreferencesModal
        open={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        preferences={preferences}
        onSave={savePreferences}
      />
    </div>
  );
}
