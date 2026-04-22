import { useEffect, useState } from "react";
import {
  BookOpen,
  Home,
  FileQuestion,
  Calendar,
  TrendingUp,
  Users,
  Menu,
  LogOut,
  Bell,
  CheckCircle,
  Mic,
} from "lucide-react";

import { supabase } from "./supabaseClient";
import type { Task } from "./types/study";
import LoginPage from "./features/auth/LoginPage";
import HomePage from "./features/home/HomePage";
import MaterialsPage from "./features/materials/MaterialsPage";
import QuizzesPage from "./features/quizzes/QuizzesPage";
import TasksPage from "./features/tasks/TasksPage";
import PlannerPage from "./features/planner/PlannerPage";
import ProgressPage from "./features/progress/ProgressPage";
import GroupStudyPage from "./features/groupStudy/GroupStudyPage";
import RevisionPlannerPage from "./RevisionPlannerPage";
import NotesPage from "./features/notes/NotesPage";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
  });

  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Review Biology Ch 3", dueDate: "2026-02-13", status: "completed", priority: "high", subject: "Biology", course: "Biology 101" },
    { id: 2, title: "Chemistry Quiz Practice", dueDate: "2026-02-13", status: "pending", priority: "high", subject: "Chemistry", course: "Chem 201" },
    { id: 3, title: "Math Problem Set 5", dueDate: "2026-02-14", status: "pending", priority: "medium", subject: "Math", course: "Calculus II" },
    { id: 4, title: "Read Physics Chapter 6", dueDate: "2026-02-15", status: "pending", priority: "low", subject: "Physics", course: "" },
    { id: 5, title: "Group Study Session", dueDate: "2026-02-13", status: "pending", priority: "medium", subject: "Biology", course: "Biology 101" },
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

  const rootClasses = [
    "min-h-screen flex",
    "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
    accessibility.highContrast ? "a11y-high-contrast" : "",
    accessibility.largeText ? "a11y-large-text" : "",
    accessibility.reduceMotion ? "a11y-reduce-motion" : "",
  ].join(" ");

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "materials", label: "Materials", icon: BookOpen },
    { id: "quizzes", label: "Quizzes", icon: FileQuestion },
    { id: "tasks", label: "Tasks", icon: CheckCircle },
    { id: "planner", label: "Planner", icon: Calendar },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "group", label: "Group Study", icon: Users },
    { id: "study-plan", label: "Study Plan Generator", icon: BookOpen },
    { id: "notes", label: "Voice Notes", icon: Mic },
  ];

  if (!session) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
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
        return <GroupStudyPage userId={session.user.id} userLabel={session.user.email ?? "Student"} />;
      case "study-plan":
        return <RevisionPlannerPage />;
      case "notes":
        return <NotesPage />;
      default:
        return <HomePage />;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={rootClasses}>
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-2">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-900">Task Tutor</h1>
                <p className="text-xs text-gray-500">Study Smart</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentPage === item.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-2"
          >
            <Menu className="w-5 h-5" />
            {sidebarOpen && <span>Collapse</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <span className="hidden lg:inline text-sm text-gray-600">Task Tutor Dashboard</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 mr-1">Accessibility:</span>
              <button
                onClick={() =>
                  setAccessibility((prev) => ({ ...prev, highContrast: !prev.highContrast }))
                }
                className={`px-4 py-2 rounded-full text-sm ${
                  accessibility.highContrast ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                High contrast
              </button>
              <button
                onClick={() =>
                  setAccessibility((prev) => ({ ...prev, largeText: !prev.largeText }))
                }
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  accessibility.largeText
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Large text
              </button>
              <button
                onClick={() =>
                  setAccessibility((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion }))
                }
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  accessibility.reduceMotion
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Reduce motion
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  JD
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">{renderPage()}</main>
      </div>
    </div>
  );
}
