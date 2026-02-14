import { useEffect, useState } from "react";
import {
  BookOpen,
  Home,
  Upload,
  FileQuestion,
  Calendar,
  TrendingUp,
  Users,
  Menu,
  LogOut,
  Bell,
  Search,
  Plus,
  ChevronRight,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

import { supabase } from "./supabaseClient";

// Login Page Component
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // NEW: mode (sign in vs sign up) + loading + message
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMsg("Logged in!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Supabase may require email confirmation depending on project settings
        setMsg("Account created! If email confirmation is on, check your inbox.");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMsg("Enter your email first, then click Forgot password.");
      return;
    }
    setMsg("");
    setLoading(true);
    try {
      // For local dev, redirect back to your app
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:5173",
      });
      if (error) throw error;
      setMsg("Password reset email sent (check your inbox).");
    } catch (err: any) {
      setMsg(err?.message ?? "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl p-4 shadow-2xl mb-4">
            <BookOpen className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Task Tutor</h1>
          <p className="text-blue-100">Your intelligent study companion</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-600 text-center mb-8">
            {mode === "signin"
              ? "Sign in to continue your learning journey"
              : "Sign up to start your learning journey"}
          </p>

          {/* NEW: message area */}
          {msg ? (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {msg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-gray-700">Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Sign In"
                : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMsg("");
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
            💡 Supabase Auth is live — use a real email/password now
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard/Home Page
function HomePage() {
  return (
    <div className="space-y-6">
      <div className="hero-card space-y-2">
        <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
        <p>Here's your study overview for today</p>
      </div>

      {/* BASIC STATS SECTION */}
      <section className="space-y-4" aria-labelledby="study-overview-heading">
        <div className="flex items-center justify-between">
          <h2 id="study-overview-heading" className="text-lg font-semibold text-gray-900">
            Study Overview
          </h2>
          <p className="text-xs text-gray-500">Your recent study performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Study Time</p>
            <p className="text-2xl font-bold text-gray-900">3h 20m</p>
            <p className="text-xs text-gray-600 mt-1">Across 12 sessions</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Today&apos;s Progress</p>
            <p className="text-2xl font-bold text-gray-900">0m</p>
            <p className="text-xs text-gray-600 mt-1">Daily Goal: 60m (0%)</p>

            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: "75%" }} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">This Week</p>
            <p className="text-2xl font-bold text-gray-900">5h 10m</p>
            <p className="text-xs text-gray-600 mt-1">Weekly Goal: 6h (86%)</p>
            <p className="text-xs text-gray-600 mt-2">
              Current Streak: <span className="text-green-700 font-semibold">4 days</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-3">Last 7 Days</p>

          <div className="flex items-end gap-2 h-24">
            {[
              { label: "Mon", height: "35%" },
              { label: "Tue", height: "60%" },
              { label: "Wed", height: "80%" },
              { label: "Thu", height: "45%" },
              { label: "Fri", height: "70%" },
              { label: "Sat", height: "50%" },
              { label: "Sun", height: "20%" },
            ].map((day) => (
              <div key={day.label} className="flex flex-col items-center flex-1">
                <div className="w-4 bg-blue-500 rounded-t-full" style={{ height: day.height }} />
                <span className="mt-1 text-[10px] text-gray-600">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-blue-900 font-semibold">Materials</h3>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">12</p>
          <p className="text-sm text-blue-700 mt-1">Documents uploaded</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-purple-900 font-semibold">Quizzes</h3>
            <FileQuestion className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">8</p>
          <p className="text-sm text-purple-700 mt-1">Quizzes created</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-green-900 font-semibold">Streak</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">7</p>
          <p className="text-sm text-green-700 mt-1">Days in a row</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-amber-900 font-semibold">Sessions</h3>
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-900">3</p>
          <p className="text-sm text-amber-700 mt-1">Scheduled today</p>
        </div>
      </div>

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Uploaded Biology Notes</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Completed Chemistry Quiz</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Joined Group Study Session</p>
                <p className="text-xs text-gray-500">Yesterday</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Review Biology Ch 3</p>
                <p className="text-xs text-amber-700">Today at 2:00 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <FileQuestion className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Chemistry Practice Quiz</p>
                <p className="text-xs text-blue-700">Today at 4:30 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
              <Users className="w-5 h-5 text-violet-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Group Study Session</p>
                <p className="text-xs text-violet-700">Today at 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
        <p className="text-blue-100 mb-4">Get started with common tasks</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-colors">
            <Upload className="w-6 h-6 mb-2" />
            <p className="font-medium">Upload Materials</p>
          </button>
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-colors">
            <Plus className="w-6 h-6 mb-2" />
            <p className="font-medium">Create Quiz</p>
          </button>
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-colors">
            <Calendar className="w-6 h-6 mb-2" />
            <p className="font-medium">Schedule Study</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// Materials Page
function MaterialsPage() {
  const materials = [
    { name: "Biology_Notes.pdf", size: "2.4 MB", date: "Today", type: "pdf" },
    { name: "Chemistry_Ch5.docx", size: "1.8 MB", date: "Yesterday", type: "docx" },
    { name: "Physics_Formulas.txt", size: "45 KB", date: "2 days ago", type: "txt" },
    { name: "Math_Problems.pdf", size: "3.1 MB", date: "3 days ago", type: "pdf" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Materials</h1>
          <p className="text-gray-600">Manage and organize your learning resources</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
          <Upload className="w-5 h-5" />
          Upload Files
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-blue-100 rounded-full p-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-900 font-medium mb-1">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500">PDF, DOCX, TXT supported (Max 10MB)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Your Materials ({materials.length})</h2>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search materials..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {materials.map((material, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{material.name}</p>
                    <p className="text-sm text-gray-500">
                      {material.size} • {material.date}
                    </p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quizzes Page
function QuizzesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Quizzes</h1>
          <p className="text-gray-600">Create and manage your practice quizzes</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Create Quiz
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-purple-600 rounded-lg p-3">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Biology Chapter 3 Quiz</h3>
          <p className="text-sm text-gray-600 mb-4">25 questions • Created 2 days ago</p>
          <div className="flex items-center gap-2">
            <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors text-sm">
              Start Quiz
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Menu className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <FileQuestion className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
              Draft
            </span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Chemistry Midterm Practice</h3>
          <p className="text-sm text-gray-600 mb-4">40 questions • Created last week</p>
          <div className="flex items-center gap-2">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm">
              Continue Editing
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Menu className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer">
          <div className="bg-purple-100 rounded-full p-4 mb-3">
            <Plus className="w-6 h-6 text-purple-600" />
          </div>
          <p className="font-medium text-gray-900 mb-1">Create New Quiz</p>
          <p className="text-sm text-gray-500">Generate from materials or create manually</p>
        </div>
      </div>
    </div>
  );
}

type Task = {
  id: number;
  title: string;
  dueDate: string;
  status: "pending" | "completed";
  priority: "high" | "medium" | "low";
  subject: string;
  course: string;
};

// Planner Page
function PlannerPage({ tasks, setTasks }: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const today = new Date();
  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  const todayDate = today.getDate();

  const parseDate = (dateString: string) => new Date(`${dateString}T00:00:00`);
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
    const taskDate = parseDate(task.dueDate);
    if (taskDate.getFullYear() !== currentMonth.getFullYear() || taskDate.getMonth() !== currentMonth.getMonth()) {
      return acc;
    }
    const day = taskDate.getDate();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const tasksForSelectedDate = tasks.filter((task) => isSameDay(parseDate(task.dueDate), selectedDate));

  const getDueLabel = (dueDate: string) => {
    const due = parseDate(dueDate);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Planner</h1>
          <p className="text-gray-600">Schedule and organize your study sessions</p>
        </div>
        <button
          onClick={() => setShowSyncModal(true)}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Sync Calendars
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 w-40">{monthName}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          <div className="bg-white">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
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
                  const taskDate = parseDate(task.dueDate);
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
                        ? "border-blue-500 bg-blue-100 text-blue-900 hover:bg-blue-200"
                        : tasksByDay[day]
                        ? "border-amber-400 bg-amber-50 text-gray-900 hover:bg-amber-100"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                    } ${isSelected ? "ring-2 ring-blue-400" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{day}</span>
                      {tasksByDay[day] && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {tasksByDay[day]}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(event) => handleDragStart(event, task.id)}
                          className="text-[11px] font-medium bg-white/80 border border-white/60 rounded px-1 py-0.5 truncate"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-[10px] text-gray-600">+{dayTasks.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Selected Day</h2>
          <p className="text-sm text-gray-600 mb-4">
            {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <div className="space-y-3">
            {tasksForSelectedDate.length > 0 ? (
              tasksForSelectedDate.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border ${
                    task.status === "completed"
                      ? "bg-green-50 border-green-200"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${
                        task.status === "completed" ? "bg-green-500" : "bg-amber-500"
                      }`}
                    ></span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p
                        className={`text-xs mt-1 ${
                          task.status === "completed" ? "text-green-700" : "text-amber-700"
                        }`}
                      >
                        {task.status === "completed" ? "Completed" : getDueLabel(task.dueDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No tasks scheduled for this day.</div>
            )}
          </div>
        </div>
      </div>

      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Sync Calendars</h2>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Connect an external calendar to import events into your planner. This is a UI stub for now.
              </p>
              <div className="space-y-3">
                <button className="w-full border border-gray-300 hover:border-gray-400 rounded-lg px-4 py-3 text-left transition-colors">
                  <p className="font-medium text-gray-900">Google Calendar</p>
                  <p className="text-xs text-gray-500">Connect your Google account to sync events</p>
                </button>
                <button className="w-full border border-gray-300 hover:border-gray-400 rounded-lg px-4 py-3 text-left transition-colors">
                  <p className="font-medium text-gray-900">iCal</p>
                  <p className="text-xs text-gray-500">Import an iCal feed URL</p>
                </button>
              </div>
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
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

// Progress Page
function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">Track your learning journey with AI-powered insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <FileQuestion className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">12</p>
          <p className="text-sm text-gray-600">Quizzes Completed</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">85%</p>
          <p className="text-sm text-gray-600">Average Score</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">7</p>
          <p className="text-sm text-gray-600">Day Streak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Goal</h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Study Time</span>
                <span className="text-sm font-medium text-gray-900">68%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  style={{ width: "68%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">AI Feedback</h2>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              Great progress! You're consistently scoring above 80%. Focus more on Chemistry
              chapters 5-7 to strengthen your weak areas. Keep up the excellent work! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tasks Page
function TasksPage({ tasks, setTasks }: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {

  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterDueDate, setFilterDueDate] = useState<"all" | "overdue" | "today" | "week" | "month">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", dueDate: "", priority: "medium", subject: "", course: "" });

  const subjects = Array.from(new Set(tasks.map((t) => t.subject)));

  const getDueDateMatch = (taskDate: string, filterType: string): boolean => {
    if (filterType === "all") return true;
    
    const today = new Date(new Date().toISOString().split('T')[0]);
    const taskDateObj = new Date(taskDate);
    const diffTime = taskDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (filterType) {
      case "overdue":
        return diffDays < 0;
      case "today":
        return diffDays === 0;
      case "week":
        return diffDays > 0 && diffDays <= 7;
      case "month":
        return diffDays > 0 && diffDays <= 30;
      default:
        return true;
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === "all" || task.status === filterStatus;
    const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
    const subjectMatch = filterSubject === "all" || task.subject === filterSubject;
    const dueDateMatch = getDueDateMatch(task.dueDate, filterDueDate);
    const searchValue = searchTerm.trim().toLowerCase();
    const searchMatch =
      searchValue.length === 0 ||
      task.title.toLowerCase().includes(searchValue) ||
      task.subject.toLowerCase().includes(searchValue) ||
      task.course.toLowerCase().includes(searchValue);
    return statusMatch && priorityMatch && subjectMatch && dueDateMatch && searchMatch;
  });

  const toggleTaskStatus = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t)));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate || !formData.subject.trim()) return;

    if (editingId !== null) {
      // Update existing task
      setTasks(tasks.map((t) =>
        t.id === editingId
          ? {
              ...t,
              title: formData.title,
              dueDate: formData.dueDate,
              priority: formData.priority as "high" | "medium" | "low",
              subject: formData.subject,
              course: formData.course,
            }
          : t
      ));
      setEditingId(null);
    } else {
      // Create new task
      const newTask = {
        id: Math.max(...tasks.map((t) => t.id), 0) + 1,
        title: formData.title,
        dueDate: formData.dueDate,
        status: "pending" as const,
        priority: formData.priority as "high" | "medium" | "low",
        subject: formData.subject,
        course: formData.course,
      };
      setTasks([...tasks, newTask]);
    }

    setFormData({ title: "", dueDate: "", priority: "medium", subject: "", course: "" });
    setShowAddForm(false);
  };

  const handleEditClick = (task: any) => {
    setFormData({
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
      subject: task.subject,
      course: task.course,
    });
    setEditingId(task.id);
    setShowAddForm(true);
  };

  const handleDeleteTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 border-red-200 text-red-700";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "low":
        return "bg-green-50 border-green-200 text-green-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">Organize and track all your study tasks</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Add/Edit Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{editingId !== null ? "Edit Task" : "Add New Task"}</h2>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Biology, Chemistry..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes <span className="text-gray-400">(Optional)</span></label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="Add any extra details..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    {editingId !== null ? "Update Task" : "Add Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingId(null);
                      setFormData({ title: "", dueDate: "", priority: "medium", subject: "", course: "" });
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {(["all", "pending", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {status === "all" ? "All Tasks" : status === "pending" ? "Pending" : "Completed"}
            </button>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Title, subject, notes"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Subject:</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Due Date:</label>
            <select
              value={filterDueDate}
              onChange={(e) => setFilterDueDate(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
              <option value="month">Due This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${
                task.status === "completed"
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <button
                onClick={() => toggleTaskStatus(task.id)}
                className="mt-1 flex-shrink-0"
              >
                <CheckCircle
                  className={`w-6 h-6 transition-colors ${
                    task.status === "completed" ? "text-green-600 fill-green-600" : "text-gray-400"
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium transition-all ${
                    task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium text-gray-700">{task.subject}</span>
                  {task.course && <span className="text-gray-500"> • {task.course}</span>}
                  {" "} • Due: {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs border font-medium ${getPriorityColor(task.priority)} flex-shrink-0`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEditClick(task)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 mt-1 px-3 py-1 rounded-lg font-medium text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1 px-3 py-1 rounded-lg font-medium text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No tasks yet</p>
            <p className="text-sm text-gray-500 mt-1">Create a new task to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Group Study Page
function GroupStudyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Group Study</h1>
          <p className="text-gray-600">Collaborate with peers in real-time</p>
        </div>
        <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Create Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-violet-300 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-violet-600 rounded-full p-2">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Chemistry Study Group</h3>
                  <p className="text-sm text-violet-700">5 members active</p>
                </div>
              </div>
              <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                Live
              </span>
            </div>
            <button className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg transition-colors">
              Join Session
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 rounded-full p-2">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Biology Review Session</h3>
                  <p className="text-sm text-gray-600">Scheduled for 6:00 PM</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Set Reminder
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shared Materials</h2>
          <div className="space-y-3">
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">Biology Notes.pdf</p>
              <p className="text-xs text-violet-600">Shared by Sarah</p>
            </div>
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">Math Formulas</p>
              <p className="text-xs text-violet-600">Shared by Mike</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  // NEW: use real Supabase session instead of isLoggedIn boolean
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
    // get current session on load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {
    if (!session) return;

    (async () => {
      // Use a table that exists and is safe to query.
      // This checks connectivity; it does NOT need to return data.
      const { error } = await supabase.from("users").select("id").limit(1);
      setDbStatus(error ? `DB error: ${error.message}` : "DB connected");
    })();
  }, [session]);


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
  ];

  // If not logged in, show login page
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
        return <GroupStudyPage />;
      default:
        return <HomePage />;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={rootClasses}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
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

        {/* Navigation */}
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

        {/* Footer */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <span className="hidden lg:inline text-sm text-gray-600">
                Task Tutor Dashboard
              </span>
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


