import { CheckCircle, Plus } from "lucide-react";
import { useState } from "react";

import type { Task } from "../../types/study";

type TasksPageProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

export default function TasksPage({ tasks, setTasks }: TasksPageProps) {
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

    const today = new Date(new Date().toISOString().split("T")[0]);
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
    if (!window.confirm(`Delete \"${task.title}\"?`)) return;
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
              <button onClick={() => toggleTaskStatus(task.id)} className="mt-1 flex-shrink-0">
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
