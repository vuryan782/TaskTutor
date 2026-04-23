import { ChevronRight, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import type { Task } from "../../types/study";

type PlannerPageProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

type GoogleCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
};

const GOOGLE_TOKEN_KEY = "tasktutor_google_token";
const GOOGLE_TOKEN_EXP_KEY = "tasktutor_google_token_exp";

export default function PlannerPage({ tasks, setTasks }: PlannerPageProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const today = new Date();
  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  const todayDate = today.getDate();
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "";

  const parseTaskDate = (dateString: string) => new Date(`${dateString}T00:00:00`);
  const parseCalendarDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return new Date(`${dateString}T00:00:00`);
  };
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, () => null);

  const tasksByDay = tasks.reduce<Record<number, number>>((acc, task) => {
    const taskDate = parseTaskDate(task.dueDate);
    if (taskDate.getFullYear() !== currentMonth.getFullYear() || taskDate.getMonth() !== currentMonth.getMonth()) {
      return acc;
    }
    const day = taskDate.getDate();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const tasksForSelectedDate = tasks.filter((task) => isSameDay(parseTaskDate(task.dueDate), selectedDate));
  const eventsForSelectedDate = googleEvents.filter((event) =>
    isSameDay(parseCalendarDate(event.start), selectedDate)
  );

  const getStoredGoogleToken = () => {
    const token = localStorage.getItem(GOOGLE_TOKEN_KEY);
    const expRaw = localStorage.getItem(GOOGLE_TOKEN_EXP_KEY);
    const exp = expRaw ? Number(expRaw) : 0;
    if (!token || !exp || Date.now() >= exp) return null;
    return token;
  };

  const clearGoogleConnection = () => {
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    localStorage.removeItem(GOOGLE_TOKEN_EXP_KEY);
    setGoogleConnected(false);
    setGoogleEvents([]);
  };

  const mapGoogleEvents = (items: any[]): GoogleCalendarEvent[] => {
    return items
      .filter((item) => item?.start?.dateTime || item?.start?.date)
      .map((item) => {
        const start = item.start.dateTime ? item.start.dateTime : `${item.start.date}T00:00:00`;
        const end = item.end?.dateTime ? item.end.dateTime : `${item.end?.date ?? item.start.date}T00:00:00`;
        return {
          id: item.id,
          title: item.summary || "Untitled event",
          start,
          end,
          allDay: Boolean(item.start.date && !item.start.dateTime),
        };
      });
  };

  const syncGoogleCalendar = async (token: string) => {
    setGoogleLoading(true);
    setGoogleError("");
    try {
      const timeMin = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
      const timeMax = new Date(new Date().setDate(new Date().getDate() + 180)).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          clearGoogleConnection();
          setGoogleError("Google session expired. Reconnect your calendar.");
          return;
        }
        const text = await res.text();
        throw new Error(`Google Calendar sync failed (${res.status}): ${text}`);
      }

      const data = await res.json();
      setGoogleEvents(mapGoogleEvents(data.items ?? []));
      setGoogleConnected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not sync Google Calendar.";
      setGoogleError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const startGoogleConnect = () => {
    if (!googleClientId) {
      setGoogleError("Missing VITE_GOOGLE_CLIENT_ID. Add it in frontend/.env and restart dev server.");
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&include_granted_scopes=true&prompt=consent`;

    window.location.href = authUrl;
  };

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const expiresIn = Number(hashParams.get("expires_in") ?? "0");

    if (accessToken) {
      const expiresAt = Date.now() + Math.max(expiresIn - 60, 300) * 1000;
      localStorage.setItem(GOOGLE_TOKEN_KEY, accessToken);
      localStorage.setItem(GOOGLE_TOKEN_EXP_KEY, String(expiresAt));
      window.history.replaceState({}, document.title, window.location.pathname);
      syncGoogleCalendar(accessToken);
      return;
    }

    const token = getStoredGoogleToken();
    if (token) {
      syncGoogleCalendar(token);
    }
  }, []);

  const getDueLabel = (dueDate: string) => {
    const due = parseTaskDate(dueDate);
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffMs = due.getTime() - base.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays === -1) return "Was due yesterday";

    return `Due on ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const handleDragStart = (event: React.DragEvent, taskId: number) => {
    event.dataTransfer.setData("text/plain", taskId.toString());
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: React.DragEvent, day: number) => {
    event.preventDefault();
    const taskId = Number(event.dataTransfer.getData("text/plain"));
    if (!taskId) return;

    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const targetDateString = targetDate.toISOString().split("T")[0];

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, dueDate: targetDateString } : task))
    );
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const eventsByDay = googleEvents.reduce<Record<number, number>>((acc, event) => {
    const eventDate = parseCalendarDate(event.start);
    if (eventDate.getFullYear() !== currentMonth.getFullYear() || eventDate.getMonth() !== currentMonth.getMonth()) {
      return acc;
    }
    const day = eventDate.getDate();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8e8ed] mb-2">Study Planner</h1>
          <p className="text-[#8b8b9e]">Schedule and organize your study sessions</p>
        </div>
        <button
          onClick={() => setShowSyncModal(true)}
          className="bg-[#1c1c27] border border-[#2a2a3a] hover:bg-[#222233] text-[#e8e8ed] px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Sync Calendars
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 hover:bg-[#1c1c27] rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-[#8b8b9e] rotate-180" />
              </button>
              <h2 className="text-xl font-bold text-[#e8e8ed] w-40">{monthName}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-[#1c1c27] rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-[#8b8b9e]" />
              </button>
            </div>
            <button className="bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          <div>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-[#5c5c72] text-sm py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {days.map((day) => {
                const dayTasks = tasks.filter((task) => {
                  const taskDate = parseTaskDate(task.dueDate);
                  return (
                    taskDate.getFullYear() === currentMonth.getFullYear() &&
                    taskDate.getMonth() === currentMonth.getMonth() &&
                    taskDate.getDate() === day
                  );
                });
                const isSelected = isSameDay(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
                  selectedDate
                );

                return (
                  <div
                    key={day}
                    onDragOver={handleDragOver}
                    onDrop={(event) => handleDrop(event, day)}
                    onClick={() =>
                      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
                    }
                    className={`aspect-square rounded-lg border-2 p-2 cursor-pointer transition-colors ${
                      isCurrentMonth && day === todayDate
                        ? "border-[#7c5cfc] bg-[#7c5cfc]/10 text-[#e8e8ed] hover:bg-[#7c5cfc]/15"
                        : tasksByDay[day] || eventsByDay[day]
                        ? "border-[#f59e0b]/30 bg-[#f59e0b]/5 text-[#e8e8ed] hover:bg-[#f59e0b]/10"
                        : "border-[#2a2a3a] hover:border-[#5c5c72] hover:bg-[#1c1c27] text-[#8b8b9e]"
                    } ${isSelected ? "ring-2 ring-[#7c5cfc]" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{day}</span>
                      <div className="flex items-center gap-1">
                        {eventsByDay[day] ? (
                          <span className="text-[10px] font-semibold text-[#60a5fa] bg-[#60a5fa]/10 border border-[#60a5fa]/20 px-2 py-0.5 rounded-full">
                            G{eventsByDay[day]}
                          </span>
                        ) : null}
                        {tasksByDay[day] ? (
                          <span className="text-[10px] font-semibold text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
                            {tasksByDay[day]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(event) => handleDragStart(event, task.id)}
                          className="text-[11px] font-medium bg-[#1c1c27] border border-[#2a2a3a] text-[#8b8b9e] rounded px-1 py-0.5 truncate"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {googleEvents
                        .filter((event) => {
                          const eventDate = parseCalendarDate(event.start);
                          return (
                            eventDate.getFullYear() === currentMonth.getFullYear() &&
                            eventDate.getMonth() === currentMonth.getMonth() &&
                            eventDate.getDate() === day
                          );
                        })
                        .slice(0, 1)
                        .map((event) => (
                          <div
                            key={event.id}
                            className="text-[11px] font-medium bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[#60a5fa] rounded px-1 py-0.5 truncate"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                      {dayTasks.length > 2 && (
                        <div className="text-[10px] text-[#5c5c72]">+{dayTasks.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <h2 className="text-xl font-bold text-[#e8e8ed] mb-1">Selected Day</h2>
          <p className="text-sm text-[#8b8b9e] mb-4">
            {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <div className="space-y-3">
            {tasksForSelectedDate.length > 0 ? (
              tasksForSelectedDate.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border ${
                    task.status === "completed"
                      ? "bg-[#4ade80]/10 border-[#4ade80]/20"
                      : "bg-[#f59e0b]/10 border-[#f59e0b]/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        task.status === "completed" ? "bg-[#4ade80]" : "bg-[#f59e0b]"
                      }`}
                    ></span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#e8e8ed]">{task.title}</p>
                      <p
                        className={`text-xs mt-1 ${
                          task.status === "completed" ? "text-[#4ade80]" : "text-[#f59e0b]"
                        }`}
                      >
                        {task.status === "completed" ? "Completed" : getDueLabel(task.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-[#5c5c72]">No tasks scheduled for this day.</div>
            )}

            {eventsForSelectedDate.length > 0 ? (
              <div className="pt-2">
                <p className="text-xs font-semibold tracking-wide text-[#60a5fa] mb-2">GOOGLE CALENDAR</p>
                <div className="space-y-2">
                  {eventsForSelectedDate.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg border border-[#60a5fa]/20 bg-[#60a5fa]/10">
                      <p className="text-sm font-medium text-[#60a5fa]">{event.title}</p>
                      <p className="text-xs text-[#60a5fa]/70 mt-1">
                        {event.allDay
                          ? "All day"
                          : new Date(event.start).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showSyncModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#e8e8ed]">Sync Calendars</h2>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="text-[#5c5c72] hover:text-[#e8e8ed] transition-colors"
                  aria-label="Close"
                >
                  x
                </button>
              </div>
              <p className="text-sm text-[#8b8b9e] mb-4">
                Connect your Google Calendar to import events into your planner.
              </p>
              <div className="space-y-3">
                <button
                  onClick={startGoogleConnect}
                  className="w-full border border-[#2a2a3a] hover:border-[#5c5c72] hover:bg-[#1c1c27] rounded-lg px-4 py-3 text-left transition-colors"
                >
                  <p className="font-medium text-[#e8e8ed]">Google Calendar</p>
                  <p className="text-xs text-[#5c5c72]">Connect your Google account to sync events</p>
                </button>

                <button
                  onClick={() => {
                    const token = getStoredGoogleToken();
                    if (!token) {
                      setGoogleError("Google is not connected yet.");
                      return;
                    }
                    syncGoogleCalendar(token);
                  }}
                  className="w-full border border-[#7c5cfc]/30 hover:border-[#7c5cfc]/50 hover:bg-[#7c5cfc]/5 rounded-lg px-4 py-3 text-left transition-colors"
                  disabled={googleLoading}
                >
                  <p className="font-medium text-[#7c5cfc]">{googleLoading ? "Syncing..." : "Sync Now"}</p>
                  <p className="text-xs text-[#7c5cfc]/60">Refresh your Google events in planner</p>
                </button>

                <button
                  onClick={clearGoogleConnection}
                  className="w-full border border-[#ef4444]/20 hover:border-[#ef4444]/40 hover:bg-[#ef4444]/5 rounded-lg px-4 py-3 text-left transition-colors"
                >
                  <p className="font-medium text-[#ef4444]">Disconnect Google Calendar</p>
                  <p className="text-xs text-[#ef4444]/60">Remove saved token and synced events</p>
                </button>

                <div className="text-xs text-[#8b8b9e] bg-[#1c1c27] border border-[#2a2a3a] rounded-lg px-3 py-2">
                  Status: {googleConnected ? `Connected (${googleEvents.length} events)` : "Not connected"}
                </div>

                {googleError ? (
                  <div className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2">
                    {googleError}
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="bg-[#1c1c27] hover:bg-[#222233] text-[#e8e8ed] border border-[#2a2a3a] px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
