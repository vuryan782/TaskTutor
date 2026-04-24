import { useEffect, useState } from "react";
import {
  BookOpen,
  Home,
  FileQuestion,
  Calendar,
  TrendingUp,
  Users,
  LogOut,
  Bell,
  CheckCircle,
  Mic,
  Search,

} from "lucide-react";
import "./App.css";

import { supabase } from "./supabaseClient";
import type { Task } from "./types/study";
import Logo from "./components/Logo";
import SearchPalette from "./components/SearchPalette";
import LoginPage from "./features/auth/LoginPage";
import HomePage from "./features/home/HomePage";
import MaterialsPage from "./features/materials/MaterialsPage";
import QuizzesPage from "./features/quizzes/QuizzesPage";
import TasksPage from "./features/tasks/TasksPage";
import PlannerPage from "./features/planner/PlannerPage";
import ProgressPage from "./features/progress/ProgressPage";
import GroupStudyPage from "./features/groupStudy/GroupStudyPage";
import RemindersPage from "./features/reminders/RemindersPage";
import RevisionPlannerPage from "./RevisionPlannerPage";
import NotesPage from "./features/notes/NotesPage";
import AccountPage from "./features/account/AccountPage";
import ChatbotWidget from "./features/chatbot/ChatbotWidget";

function deriveInitials(email: string | undefined | null): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._\-+\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

export default function App() {
  const [session, setSession] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(() => {
    const g = [
      { label: "Study", items: ["materials", "quizzes", "notes"] },
      { label: "Planning", items: ["tasks", "planner", "study-plan", "reminders"] },
      { label: "Insights", items: ["progress"] },
      { label: "Collaborate", items: ["group"] },
    ].find((g) => g.items.includes("home" as never));
    return g?.label ?? null;
  });
  const isMac =
    typeof navigator !== "undefined" && /mac/i.test(navigator.userAgent);

  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
  });

  // Large text — scale the HTML root so all rem-based Tailwind text scales correctly
  useEffect(() => {
    document.documentElement.style.fontSize = accessibility.largeText
      ? "120%"
      : "";
  }, [accessibility.largeText]);

  // Global Ctrl+K / Cmd+K to open search, regardless of where focus is
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Cursor-following ambient spotlight — writes CSS variables consumed by .app-spotlight.
  // Throttled via rAF so we don't thrash style recalcs on every mousemove.
  useEffect(() => {
    let frame = 0;
    let lastX = 0;
    let lastY = 0;
    function onMove(e: MouseEvent) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        document.documentElement.style.setProperty("--tt-mouse-x", `${lastX}px`);
        document.documentElement.style.setProperty("--tt-mouse-y", `${lastY}px`);
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Reduce motion — honour the OS preference OR the user toggle
  useEffect(() => {
    if (accessibility.reduceMotion) {
      document.documentElement.setAttribute("data-reduce-motion", "true");
    } else {
      document.documentElement.removeAttribute("data-reduce-motion");
    }
  }, [accessibility.reduceMotion]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Review Biology Ch 3",
      dueDate: "2026-02-13",
      status: "completed",
      priority: "high",
      subject: "Biology",
      course: "Biology 101",
    },
    {
      id: 2,
      title: "Chemistry Quiz Practice",
      dueDate: "2026-02-13",
      status: "pending",
      priority: "high",
      subject: "Chemistry",
      course: "Chem 201",
    },
    {
      id: 3,
      title: "Math Problem Set 5",
      dueDate: "2026-02-14",
      status: "pending",
      priority: "medium",
      subject: "Math",
      course: "Calculus II",
    },
    {
      id: 4,
      title: "Read Physics Chapter 6",
      dueDate: "2026-02-15",
      status: "pending",
      priority: "low",
      subject: "Physics",
      course: "",
    },
    {
      id: 5,
      title: "Group Study Session",
      dueDate: "2026-02-13",
      status: "pending",
      priority: "medium",
      subject: "Biology",
      course: "Biology 101",
    },
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load persisted accessibility prefs from the profile once we have a session,
  // so toggles apply immediately on any page (not just after opening Account).
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("accessibility_prefs")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled || !data?.accessibility_prefs) return;
      setAccessibility((prev) => ({ ...prev, ...data.accessibility_prefs }));
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const rootClasses = [
    "min-h-screen flex",
    "app-bg",
    accessibility.highContrast ? "a11y-high-contrast" : "",
    accessibility.largeText ? "a11y-large-text" : "",
    accessibility.reduceMotion ? "a11y-reduce-motion" : "",
  ].join(" ");

  const menuGroups = [
    {
      label: null,
      accent: null,
      groupIcon: null,
      items: [{ id: "home", label: "Home", icon: Home }],
    },
    {
      label: "Study",
      accent: "#7c5cfc",
      groupIcon: BookOpen,
      items: [
        { id: "materials", label: "Materials", icon: BookOpen },
        { id: "quizzes", label: "Quizzes", icon: FileQuestion },
        { id: "notes", label: "Voice Notes", icon: Mic },
      ],
    },
    {
      label: "Planning",
      accent: "#60a5fa",
      groupIcon: Calendar,
      items: [
        { id: "tasks", label: "Tasks", icon: CheckCircle },
        { id: "planner", label: "Calendar", icon: Calendar },
        { id: "study-plan", label: "Study Plan", icon: BookOpen },
        { id: "reminders", label: "Reminders", icon: Bell },
      ],
    },
    {
      label: "Insights",
      accent: "#4ade80",
      groupIcon: TrendingUp,
      items: [
        { id: "progress", label: "Progress", icon: TrendingUp },
      ],
    },
    {
      label: "Collaborate",
      accent: "#f59e0b",
      groupIcon: Users,
      items: [
        { id: "group", label: "Group Study", icon: Users },
      ],
    },
  ] as const;

  if (!session) {
    return <LoginPage />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const initials = deriveInitials(session?.user?.email);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage userId={session?.user?.id} onNavigate={setCurrentPage} />
        );
      case "materials":
        return <MaterialsPage />;
      case "quizzes":
        return <QuizzesPage />;
      case "tasks":
        return <TasksPage tasks={tasks} setTasks={setTasks} />;
      case "planner":
        return <PlannerPage tasks={tasks} setTasks={setTasks} />;
      case "progress":
        return <ProgressPage />;
      case "group":
        return (
          <GroupStudyPage
            userId={session.user.id}
            userLabel={session.user.email ?? "Student"}
          />
        );
      case "reminders":
        return <RemindersPage />;
      case "study-plan":
        return <RevisionPlannerPage />;
      case "notes":
        return <NotesPage />;
      case "account":
        return (
          <AccountPage
            session={session}
            initials={initials}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
            accessibility={accessibility}
            onAccessibilityChange={setAccessibility}
          />
        );
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={rootClasses}>
      <div className="app-spotlight" aria-hidden="true" />
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-[#111118] border-r border-[#2a2a3a] transition-all duration-300 flex flex-col overflow-hidden flex-shrink-0`}
      >
        <div className="p-6 border-b border-[#2a2a3a] min-w-[16rem]">
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
            title="Hide sidebar"
          >
            <Logo size={40} className="rounded-lg shadow-lg shadow-[#7c5cfc]/20" />
            <div className="text-left">
              <h1 className="font-bold text-[#e8e8ed]">Task Tutor</h1>
              <p className="text-xs text-[#5c5c72]">Study Smart</p>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto min-w-[16rem]">
          <div className="space-y-4">
            {menuGroups.map((group, gi) => {
              const groupHasActive = group.items.some((i) => i.id === currentPage);
              const isOpen =
                group.label == null || activeSection === group.label;
              const GroupIcon = group.groupIcon;
              return (
              <div
                key={gi}
                onMouseEnter={() =>
                  group.label && setActiveSection(group.label)
                }
              >
                {group.label && GroupIcon && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection((curr) =>
                        curr === group.label ? null : group.label
                      )
                    }
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                      isOpen || groupHasActive
                        ? "text-[#e8e8ed]"
                        : "text-[#8b8b9e] hover:text-[#e8e8ed]"
                    }`}
                    style={
                      isOpen || groupHasActive
                        ? {
                            backgroundColor: `${group.accent}1a`,
                            boxShadow: `inset 2px 0 0 ${group.accent}`,
                          }
                        : undefined
                    }
                    aria-expanded={isOpen}
                  >
                    <GroupIcon
                      className="w-3.5 h-3.5"
                      style={{ color: group.accent ?? undefined }}
                    />
                    <span className="flex-1 text-left">{group.label}</span>
                    <span
                      className="w-1.5 h-1.5 rounded-full transition-opacity"
                      style={{
                        backgroundColor: group.accent ?? undefined,
                        opacity: isOpen || groupHasActive ? 1 : 0.3,
                      }}
                    />
                  </button>
                )}
                <ul
                  className={`space-y-0.5 mt-1 overflow-hidden transition-[max-height,opacity] duration-200 ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setCurrentPage(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                            currentPage === item.id
                              ? "bg-[#7c5cfc]/10 text-[#7c5cfc]"
                              : "text-[#8b8b9e] hover:bg-[#1c1c27] hover:text-[#e8e8ed]"
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium text-sm">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-[#2a2a3a] min-w-[16rem]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[#8b8b9e] hover:bg-[#1c1c27] hover:text-[#e8e8ed] rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="app-shell flex-1 flex flex-col">
        <header className="bg-[#111118] border-b border-[#2a2a3a] px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg hover:opacity-80 transition-opacity"
                  title="Show sidebar"
                >
                  <Logo size={36} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="group flex items-center gap-3 min-w-[18rem] max-w-md flex-1 px-3 py-2 bg-[#1c1c27] hover:bg-[#22222e] border border-[#2a2a3a] hover:border-[#7c5cfc]/40 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cfc]/60"
                title="Search (Ctrl+K)"
              >
                <Search className="w-4 h-4 text-[#5c5c72] group-hover:text-[#8b8b9e]" />
                <span className="text-sm text-[#5c5c72] group-hover:text-[#8b8b9e] flex-1 text-left">
                  Search pages, tasks, quizzes…
                </span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#8b8b9e] bg-[#0f0f17] border border-[#2a2a3a] rounded px-1.5 py-0.5">
                  {isMac ? "⌘" : "Ctrl"} K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage("reminders")}
                className="p-2 hover:bg-[#1c1c27] rounded-lg relative"
                title="Reminders"
              >
                <Bell className="w-6 h-6 text-[#8b8b9e]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full"></span>
              </button>
              <button
                onClick={() => setCurrentPage("account")}
                title="Account settings"
                aria-label="Open account settings"
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all hover:ring-2 hover:ring-[#7c5cfc]/60 hover:ring-offset-2 hover:ring-offset-[#111118] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cfc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111118] ${
                  currentPage === "account"
                    ? "bg-gradient-to-br from-[#9b82fc] to-[#6a4ce0] ring-2 ring-[#7c5cfc] ring-offset-2 ring-offset-[#111118]"
                    : "bg-gradient-to-br from-[#9b82fc] to-[#6a4ce0] hover:shadow-lg hover:shadow-[#7c5cfc]/30"
                }`}
              >
                {initials}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">{renderPage()}</main>
      </div>

      <ChatbotWidget onNavigate={setCurrentPage} />

      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={setCurrentPage}
        userId={session?.user?.id}
      />
    </div>
  );
}
