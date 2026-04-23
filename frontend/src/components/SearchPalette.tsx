import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  FileQuestion,
  Home as HomeIcon,
  Mic,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabase } from "../supabaseClient";

const PAGE_ENTRIES: SearchResult[] = [
  { kind: "page", id: "home", target: "home", title: "Home", subtitle: "Dashboard overview", icon: <HomeIcon className="w-4 h-4" /> },
  { kind: "page", id: "materials", target: "materials", title: "Materials", subtitle: "Study materials", icon: <BookOpen className="w-4 h-4" /> },
  { kind: "page", id: "quizzes-page", target: "quizzes", title: "Quizzes", subtitle: "Practice quizzes", icon: <FileQuestion className="w-4 h-4" /> },
  { kind: "page", id: "notes", target: "notes", title: "Voice Notes", subtitle: "Audio notes", icon: <Mic className="w-4 h-4" /> },
  { kind: "page", id: "tasks-page", target: "tasks", title: "Tasks", subtitle: "Your to-dos", icon: <CheckCircle className="w-4 h-4" /> },
  { kind: "page", id: "planner", target: "planner", title: "Calendar", subtitle: "Scheduled study", icon: <Calendar className="w-4 h-4" /> },
  { kind: "page", id: "study-plan", target: "study-plan", title: "Study Plan", subtitle: "Revision planner", icon: <BookOpen className="w-4 h-4" /> },
  { kind: "page", id: "reminders", target: "reminders", title: "Reminders", subtitle: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { kind: "page", id: "progress-page", target: "progress", title: "Progress", subtitle: "Performance insights", icon: <TrendingUp className="w-4 h-4" /> },
  { kind: "page", id: "group-page", target: "group", title: "Group Study", subtitle: "Collaborative sessions", icon: <Users className="w-4 h-4" /> },
  { kind: "page", id: "account", target: "account", title: "Account", subtitle: "Profile & settings", icon: <CheckCircle className="w-4 h-4" /> },
];

type SearchResult = {
  kind: "page" | "task" | "quiz" | "session" | "local-quiz";
  id: string;
  target: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

type SearchPaletteProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  userId?: string;
};

const QUIZ_STORAGE_KEY = "tasktutor_quizzes";

export default function SearchPalette({ open, onClose, onNavigate, userId }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [tasks, setTasks] = useState<SearchResult[]>([]);
  const [quizResults, setQuizResults] = useState<SearchResult[]>([]);
  const [sessions, setSessions] = useState<SearchResult[]>([]);
  const [localQuizzes, setLocalQuizzes] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset + focus on open
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Fetch searchable data once per open
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      // Local quizzes
      try {
        const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setLocalQuizzes(
              parsed.slice(0, 50).map((q: any) => ({
                kind: "local-quiz" as const,
                id: `local-quiz-${q.id}`,
                target: "quizzes",
                title: q.topic ?? "Untitled quiz",
                subtitle: `Quiz · ${q.subject ?? "General"} · ${q.questions?.length ?? 0} questions`,
                icon: <FileQuestion className="w-4 h-4" />,
              }))
            );
          }
        }
      } catch {
        // ignore
      }

      const [tasksRes, quizRes, sessionsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, due_date, priority, status")
          .eq("user_id", userId)
          .order("due_date", { ascending: true })
          .limit(100),
        supabase
          .from("quiz_results")
          .select("id, subject, topic, score, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("group_sessions")
          .select("id, title, subject, starts_at, host_user_id")
          .eq("host_user_id", userId)
          .order("starts_at", { ascending: false })
          .limit(50),
      ]);

      if (cancelled) return;

      setTasks(
        (tasksRes.data ?? []).map((t: any) => ({
          kind: "task" as const,
          id: `task-${t.id}`,
          target: "tasks",
          title: t.title,
          subtitle: `Task · ${t.status} · ${new Date(t.due_date).toLocaleDateString()}`,
          icon: <CheckCircle className="w-4 h-4" />,
        }))
      );

      setQuizResults(
        (quizRes.data ?? []).map((r: any) => ({
          kind: "quiz" as const,
          id: `quiz-${r.id}`,
          target: "progress",
          title: `${r.topic || r.subject}`,
          subtitle: `Quiz result · ${r.subject} · ${r.score}%`,
          icon: <FileQuestion className="w-4 h-4" />,
        }))
      );

      setSessions(
        (sessionsRes.data ?? []).map((s: any) => ({
          kind: "session" as const,
          id: `session-${s.id}`,
          target: "group",
          title: s.title,
          subtitle: `Session · ${s.subject} · ${new Date(s.starts_at).toLocaleDateString()}`,
          icon: <Users className="w-4 h-4" />,
        }))
      );

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const allResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool: SearchResult[] = [
      ...PAGE_ENTRIES,
      ...tasks,
      ...quizResults,
      ...sessions,
      ...localQuizzes,
    ];
    if (!needle) {
      // Show pages first, then a few recent from each category
      return [
        ...PAGE_ENTRIES,
        ...tasks.slice(0, 3),
        ...quizResults.slice(0, 3),
        ...sessions.slice(0, 3),
      ];
    }
    return pool.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.subtitle.toLowerCase().includes(needle)
    );
  }, [query, tasks, quizResults, sessions, localQuizzes]);

  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; items: SearchResult[] }> = {
      page: { label: "Pages", items: [] },
      task: { label: "Tasks", items: [] },
      "local-quiz": { label: "Quizzes", items: [] },
      quiz: { label: "Quiz results", items: [] },
      session: { label: "Group sessions", items: [] },
    };
    for (const r of allResults) {
      groups[r.kind]?.items.push(r);
    }
    return Object.values(groups).filter((g) => g.items.length > 0);
  }, [allResults]);

  // Flat index across groups for keyboard navigation
  const flatResults = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-result-index="${activeIndex}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(flatResults.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const hit = flatResults[activeIndex];
        if (hit) {
          onNavigate(hit.target);
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, flatResults, activeIndex, onNavigate, onClose]);

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#16161e] border border-[#2a2a3a] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a3a]">
          <Search className="w-5 h-5 text-[#8b8b9e] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, tasks, quizzes, sessions…"
            className="flex-1 bg-transparent text-[#e8e8ed] placeholder:text-[#5c5c72] focus:outline-none text-base"
            aria-label="Search query"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-semibold text-[#5c5c72] bg-[#0f0f17] border border-[#2a2a3a] rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {loading && flatResults.length === 0 ? (
            <p className="text-sm text-[#5c5c72] px-4 py-6 text-center">Loading…</p>
          ) : flatResults.length === 0 ? (
            <p className="text-sm text-[#5c5c72] px-4 py-6 text-center">
              No results for "{query}"
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="px-2 py-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5c5c72] px-3 py-1.5">
                  {group.label}
                </p>
                <ul>
                  {group.items.map((r) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const active = idx === activeIndex;
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          data-result-index={idx}
                          onClick={() => {
                            onNavigate(r.target);
                            onClose();
                          }}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            active
                              ? "bg-[#7c5cfc]/15 text-[#e8e8ed]"
                              : "text-[#c8c8da] hover:bg-[#1c1c27]"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 p-1.5 rounded-md ${
                              active
                                ? "bg-[#7c5cfc]/25 text-[#9b82fc]"
                                : "bg-[#1c1c27] text-[#8b8b9e]"
                            }`}
                          >
                            {r.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r.title}</p>
                            <p className="text-xs text-[#5c5c72] truncate">{r.subtitle}</p>
                          </div>
                          {active && (
                            <ArrowRight className="w-4 h-4 text-[#7c5cfc] flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#2a2a3a] px-4 py-2 flex items-center justify-between text-[10px] text-[#5c5c72]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-semibold bg-[#0f0f17] border border-[#2a2a3a] rounded px-1.5 py-0.5">↑</kbd>
              <kbd className="font-semibold bg-[#0f0f17] border border-[#2a2a3a] rounded px-1.5 py-0.5">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-semibold bg-[#0f0f17] border border-[#2a2a3a] rounded px-1.5 py-0.5">↵</kbd>
              to open
            </span>
          </div>
          <span>
            {flatResults.length} result{flatResults.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
