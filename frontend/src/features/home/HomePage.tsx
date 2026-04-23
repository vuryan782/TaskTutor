import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  FileQuestion,
  Flame,
  Plus,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";

import { supabase } from "../../supabaseClient";

type HomePageProps = {
  userId?: string;
  onNavigate?: (page: string) => void;
};

type TaskRow = {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  status: string;
  created_at?: string;
};

type QuizResultRow = {
  id: string;
  subject: string;
  topic: string;
  score: number;
  created_at: string;
};

type GroupSessionRow = {
  id: string;
  title: string;
  subject: string;
  starts_at: string;
  host_user_id: string;
};

type ActivityItem = {
  key: string;
  kind: "quiz" | "task" | "session";
  title: string;
  whenIso: string;
  accent: string;
  target: string;
};

const QUIZ_STORAGE_KEY = "tasktutor_quizzes";

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDueLabel(iso: string): string {
  const due = new Date(iso);
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const timePart = due.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  if (diffDays < 0) return `Overdue (${timePart})`;
  if (diffDays === 0) return `Today at ${timePart}`;
  if (diffDays === 1) return `Tomorrow at ${timePart}`;
  if (diffDays < 7)
    return `${due.toLocaleDateString(undefined, { weekday: "short" })} at ${timePart}`;
  return due.toLocaleDateString();
}

function computeStreak(results: { created_at: string }[]): number {
  if (!results.length) return 0;
  const days = new Set(results.map((r) => r.created_at.slice(0, 10)));
  const sorted = Array.from(days).sort().reverse();
  let count = 0;
  let cursor = new Date();
  for (const day of sorted) {
    const d = new Date(day);
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
    if (diff > 1) break;
    count++;
    cursor = d;
  }
  return count;
}

function priorityPalette(priority: string) {
  switch (priority?.toLowerCase()) {
    case "high":
      return { bg: "bg-[#ef4444]/5", border: "border-[#ef4444]/20", text: "text-[#ef4444]", hoverBg: "hover:bg-[#ef4444]/10", hoverBorder: "hover:border-[#ef4444]/40" };
    case "medium":
      return { bg: "bg-[#f59e0b]/5", border: "border-[#f59e0b]/20", text: "text-[#f59e0b]", hoverBg: "hover:bg-[#f59e0b]/10", hoverBorder: "hover:border-[#f59e0b]/40" };
    case "low":
      return { bg: "bg-[#4ade80]/5", border: "border-[#4ade80]/20", text: "text-[#4ade80]", hoverBg: "hover:bg-[#4ade80]/10", hoverBorder: "hover:border-[#4ade80]/40" };
    default:
      return { bg: "bg-[#60a5fa]/5", border: "border-[#60a5fa]/20", text: "text-[#60a5fa]", hoverBg: "hover:bg-[#60a5fa]/10", hoverBorder: "hover:border-[#60a5fa]/40" };
  }
}

const overviewCardBase =
  "rounded-xl border border-[#2a2a3a] bg-[#16161e] p-4 text-left transition-colors hover:border-[#7c5cfc]/40 hover:bg-[#1a1a24] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cfc]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]";

export default function HomePage({ userId, onNavigate }: HomePageProps) {
  const [dailyGoal, setDailyGoal] = useState(60);
  const [pendingTasksTotal, setPendingTasksTotal] = useState(0);
  const [tasksDueToday, setTasksDueToday] = useState(0);
  const [upcomingTasks, setUpcomingTasks] = useState<TaskRow[]>([]);
  const [recentCompletedTasks, setRecentCompletedTasks] = useState<TaskRow[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultRow[]>([]);
  const [sessionsToday, setSessionsToday] = useState<GroupSessionRow[]>([]);
  const [recentSessions, setRecentSessions] = useState<GroupSessionRow[]>([]);
  const [localQuizCount, setLocalQuizCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const go = (page: string) => () => onNavigate?.(page);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLocalQuizCount(parsed.length);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const todayStart = startOfToday().toISOString();
    const todayEnd = endOfToday().toISOString();

    (async () => {
      setLoading(true);

      const [profileRes, pendingRes, todayTasksRes, upcomingRes, completedRes, quizRes, sessionsTodayRes, recentSessionsRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("daily_goal_minutes")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .neq("status", "completed"),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .neq("status", "completed")
            .gte("due_date", todayStart)
            .lte("due_date", todayEnd),
          supabase
            .from("tasks")
            .select("id, title, due_date, priority, status")
            .eq("user_id", userId)
            .neq("status", "completed")
            .gte("due_date", todayStart)
            .order("due_date", { ascending: true })
            .limit(3),
          supabase
            .from("tasks")
            .select("id, title, due_date, priority, status, created_at")
            .eq("user_id", userId)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("quiz_results")
            .select("id, subject, topic, score, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("group_sessions")
            .select("id, title, subject, starts_at, host_user_id")
            .eq("host_user_id", userId)
            .gte("starts_at", todayStart)
            .lte("starts_at", todayEnd)
            .order("starts_at", { ascending: true }),
          supabase
            .from("group_sessions")
            .select("id, title, subject, starts_at, host_user_id")
            .eq("host_user_id", userId)
            .order("starts_at", { ascending: false })
            .limit(3),
        ]);

      if (cancelled) return;

      if (typeof profileRes.data?.daily_goal_minutes === "number") {
        setDailyGoal(profileRes.data.daily_goal_minutes);
      }
      setPendingTasksTotal(pendingRes.count ?? 0);
      setTasksDueToday(todayTasksRes.count ?? 0);
      setUpcomingTasks((upcomingRes.data as TaskRow[]) ?? []);
      setRecentCompletedTasks((completedRes.data as TaskRow[]) ?? []);
      setQuizResults((quizRes.data as QuizResultRow[]) ?? []);
      setSessionsToday((sessionsTodayRes.data as GroupSessionRow[]) ?? []);
      setRecentSessions((recentSessionsRes.data as GroupSessionRow[]) ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const streak = useMemo(() => computeStreak(quizResults), [quizResults]);
  const quizzesToday = useMemo(
    () =>
      quizResults.filter((r) => new Date(r.created_at) >= startOfToday()).length,
    [quizResults]
  );

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    for (const q of quizResults.slice(0, 5)) {
      items.push({
        key: `quiz-${q.id}`,
        kind: "quiz",
        title: `Completed ${q.topic || q.subject} quiz · ${q.score}%`,
        whenIso: q.created_at,
        accent: "bg-[#a78bfa]",
        target: "quizzes",
      });
    }
    for (const t of recentCompletedTasks) {
      if (!t.created_at) continue;
      items.push({
        key: `task-${t.id}`,
        kind: "task",
        title: `Completed task: ${t.title}`,
        whenIso: t.created_at,
        accent: "bg-[#4ade80]",
        target: "tasks",
      });
    }
    for (const s of recentSessions) {
      items.push({
        key: `session-${s.id}`,
        kind: "session",
        title: `Created session: ${s.title}`,
        whenIso: s.starts_at,
        accent: "bg-[#60a5fa]",
        target: "group",
      });
    }
    items.sort(
      (a, b) => new Date(b.whenIso).getTime() - new Date(a.whenIso).getTime()
    );
    return items.slice(0, 3);
  }, [quizResults, recentCompletedTasks, recentSessions]);

  const loadingNumber = loading ? "…" : undefined;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#7c5cfc] to-[#6a4ce0] rounded-xl p-6 text-white space-y-2">
        <svg
          aria-hidden="true"
          viewBox="0 0 240 160"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-[140%] w-auto opacity-25"
        >
          <defs>
            <linearGradient id="tt-hero-book" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* Open book */}
          <g transform="translate(70 50)">
            <path
              d="M0 20 Q0 14 6 14 L48 14 Q54 14 54 20 L54 70 Q54 64 48 64 L6 64 Q0 64 0 70 Z"
              fill="url(#tt-hero-book)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <path
              d="M110 20 Q110 14 104 14 L62 14 Q56 14 56 20 L56 70 Q56 64 62 64 L104 64 Q110 64 110 70 Z"
              fill="url(#tt-hero-book)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <line x1="12" y1="28" x2="44" y2="28" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="36" x2="40" y2="36" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="44" x2="44" y2="44" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="66" y1="28" x2="98" y2="28" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="66" y1="36" x2="94" y2="36" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="66" y1="44" x2="98" y2="44" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          {/* Sparkles */}
          <g fill="#ffffff">
            <path d="M30 30 L33 37 L40 40 L33 43 L30 50 L27 43 L20 40 L27 37 Z" opacity="0.85" />
            <path d="M210 50 L212 55 L217 57 L212 59 L210 64 L208 59 L203 57 L208 55 Z" opacity="0.7" />
            <path d="M200 110 L202 114 L206 116 L202 118 L200 122 L198 118 L194 116 L198 114 Z" opacity="0.6" />
            <circle cx="50" cy="110" r="1.5" opacity="0.6" />
            <circle cx="60" cy="25" r="1.5" opacity="0.7" />
            <circle cx="180" cy="30" r="1.5" opacity="0.7" />
            <circle cx="40" cy="140" r="1.5" opacity="0.5" />
          </g>
        </svg>
        <h1 className="relative text-3xl font-bold">Welcome back! 👋</h1>
        <p className="relative text-white/70">Here's your study overview for today</p>
      </div>

      <section className="space-y-4" aria-labelledby="study-overview-heading">
        <h2 id="study-overview-heading" className="text-lg font-semibold text-[#e8e8ed]">Today at a glance</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button type="button" onClick={go("account")} className={overviewCardBase}>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[#7c5cfc]" />
              <p className="text-xs text-[#8b8b9e]">Daily Goal</p>
            </div>
            <p className="text-2xl font-bold text-[#e8e8ed]">{formatMinutes(dailyGoal)}</p>
            <p className="text-xs text-[#5c5c72] mt-1">Set in Account settings</p>
          </button>

          <button type="button" onClick={go("quizzes")} className={overviewCardBase}>
            <div className="flex items-center gap-2 mb-1">
              <FileQuestion className="w-4 h-4 text-[#a78bfa]" />
              <p className="text-xs text-[#8b8b9e]">Quizzes Today</p>
            </div>
            <p className="text-2xl font-bold text-[#e8e8ed]">
              {loadingNumber ?? quizzesToday}
            </p>
            <p className="text-xs text-[#5c5c72] mt-1">
              {quizzesToday === 0
                ? "No quizzes completed yet"
                : `${quizzesToday} completed today`}
            </p>
          </button>

          <button type="button" onClick={go("tasks")} className={overviewCardBase}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-[#f59e0b]" />
              <p className="text-xs text-[#8b8b9e]">Tasks Due Today</p>
            </div>
            <p className="text-2xl font-bold text-[#e8e8ed]">
              {loadingNumber ?? tasksDueToday}
            </p>
            <p className="text-xs text-[#5c5c72] mt-1">
              {tasksDueToday === 0 ? "All caught up" : "Let's tackle them"}
            </p>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={go("tasks")}
          className="text-left bg-[#60a5fa]/10 border border-[#60a5fa]/20 rounded-xl p-6 hover:bg-[#60a5fa]/15 hover:border-[#60a5fa]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]/60"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#60a5fa] font-semibold">Tasks</h3>
            <CheckCircle className="w-5 h-5 text-[#60a5fa]" />
          </div>
          <p className="text-3xl font-bold text-[#e8e8ed]">
            {loadingNumber ?? pendingTasksTotal}
          </p>
          <p className="text-sm text-[#60a5fa]/70 mt-1">Pending</p>
        </button>

        <button
          type="button"
          onClick={go("quizzes")}
          className="text-left bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-xl p-6 hover:bg-[#a78bfa]/15 hover:border-[#a78bfa]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/60"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#a78bfa] font-semibold">Quizzes</h3>
            <FileQuestion className="w-5 h-5 text-[#a78bfa]" />
          </div>
          <p className="text-3xl font-bold text-[#e8e8ed]">{localQuizCount}</p>
          <p className="text-sm text-[#a78bfa]/70 mt-1">Saved locally</p>
        </button>

        <button
          type="button"
          onClick={go("progress")}
          className="text-left bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl p-6 hover:bg-[#4ade80]/15 hover:border-[#4ade80]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80]/60"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#4ade80] font-semibold">Streak</h3>
            <Flame className="w-5 h-5 text-[#4ade80]" />
          </div>
          <p className="text-3xl font-bold text-[#e8e8ed]">
            {loadingNumber ?? streak}
          </p>
          <p className="text-sm text-[#4ade80]/70 mt-1">
            {streak === 1 ? "Day in a row" : "Days in a row"}
          </p>
        </button>

        <button
          type="button"
          onClick={go("group")}
          className="text-left bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl p-6 hover:bg-[#f59e0b]/15 hover:border-[#f59e0b]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b]/60"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#f59e0b] font-semibold">Sessions</h3>
            <Calendar className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <p className="text-3xl font-bold text-[#e8e8ed]">
            {loadingNumber ?? sessionsToday.length}
          </p>
          <p className="text-sm text-[#f59e0b]/70 mt-1">Scheduled today</p>
        </button>
      </div>

      <div className="bg-gradient-to-r from-[#7c5cfc] to-[#6a4ce0] rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
        <p className="text-white/70 mb-4">Get started with common tasks</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={go("materials")}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Upload className="w-6 h-6 mb-2" />
            <p className="font-medium">Upload Materials</p>
          </button>
          <button
            type="button"
            onClick={go("quizzes")}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Plus className="w-6 h-6 mb-2" />
            <p className="font-medium">Create Quiz</p>
          </button>
          <button
            type="button"
            onClick={go("planner")}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Calendar className="w-6 h-6 mb-2" />
            <p className="font-medium">Schedule Study</p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#e8e8ed]">Recent Activity</h2>
            <button
              type="button"
              onClick={go("progress")}
              className="text-xs text-[#7c5cfc] hover:text-[#9b82fc] transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-[#5c5c72]">Loading…</p>
            ) : recentActivity.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-[#1c1c27] rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#5c5c72]" />
                <p className="text-sm text-[#8b8b9e]">
                  No activity yet — take a quiz or complete a task to get started.
                </p>
              </div>
            ) : (
              recentActivity.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={go(item.target)}
                  className="w-full flex items-start gap-3 p-3 bg-[#1c1c27] rounded-lg text-left hover:bg-[#22222e] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cfc]/60"
                >
                  <div className={`w-2 h-2 ${item.accent} rounded-full mt-2 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e8e8ed] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#5c5c72]">{relativeTime(item.whenIso)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#e8e8ed]">Upcoming Tasks</h2>
            <button
              type="button"
              onClick={go("tasks")}
              className="text-xs text-[#7c5cfc] hover:text-[#9b82fc] transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-[#5c5c72]">Loading…</p>
            ) : upcomingTasks.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-[#1c1c27] rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#4ade80]" />
                <div className="flex-1">
                  <p className="text-sm text-[#8b8b9e]">
                    No upcoming tasks — you're all caught up.
                  </p>
                  <button
                    type="button"
                    onClick={go("tasks")}
                    className="text-xs text-[#7c5cfc] hover:text-[#9b82fc] transition-colors mt-1"
                  >
                    Add a task →
                  </button>
                </div>
              </div>
            ) : (
              upcomingTasks.map((task) => {
                const palette = priorityPalette(task.priority);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={go("tasks")}
                    className={`w-full flex items-center gap-3 p-3 ${palette.bg} border ${palette.border} rounded-lg text-left ${palette.hoverBg} ${palette.hoverBorder} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cfc]/60`}
                  >
                    <Calendar className={`w-5 h-5 ${palette.text}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e8e8ed] truncate">
                        {task.title}
                      </p>
                      <p className={`text-xs ${palette.text}`}>{formatDueLabel(task.due_date)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
