import { BookOpen, Calendar, FileQuestion, Plus, TrendingUp, Upload, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="hero-card space-y-2">
        <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
        <p>Here's your study overview for today</p>
      </div>

      <section className="space-y-4" aria-labelledby="study-overview-heading">
        <div className="flex items-center justify-between">
          <h2 id="study-overview-heading" className="text-lg font-semibold text-gray-900">Study Overview</h2>
          <p className="text-xs text-gray-500">Your recent study performance</p>
        </div>

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
      </section>

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
    </div>
  );
}
