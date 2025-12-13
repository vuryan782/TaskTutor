import { useState } from 'react';
import { BookOpen, Home, Upload, FileQuestion, Calendar, TrendingUp, Users, Menu, X, LogOut, Bell, Search, Plus, ChevronRight } from 'lucide-react';

// Login Page Component
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome Back</h2>
          <p className="text-gray-600 text-center mb-8">Sign in to continue your learning journey</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                <span className="text-gray-700">Remember me</span>
              </label>
              <button type="button" className="text-blue-600 hover:text-blue-700">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Don't have an account?{' '}
            <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
            💡 This is a prototype - enter any email/password to continue
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
        <p className="text-gray-600">Here's your study overview for today</p>
      </div>

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
        {/* Recent Activity */}
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

        {/* Upcoming Tasks */}
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
    { name: 'Biology_Notes.pdf', size: '2.4 MB', date: 'Today', type: 'pdf' },
    { name: 'Chemistry_Ch5.docx', size: '1.8 MB', date: 'Yesterday', type: 'docx' },
    { name: 'Physics_Formulas.txt', size: '45 KB', date: '2 days ago', type: 'txt' },
    { name: 'Math_Problems.pdf', size: '3.1 MB', date: '3 days ago', type: 'pdf' }
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

      {/* Upload Area */}
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

      {/* Materials List */}
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
                    <p className="text-sm text-gray-500">{material.size} • {material.date}</p>
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
            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">Active</span>
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
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Draft</span>
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

// Planner Page
function PlannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Planner</h1>
        <p className="text-gray-600">Schedule and organize your study sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">December 2024</h2>
            <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
            <Calendar className="w-16 h-16 text-amber-600 mx-auto mb-3" />
            <p className="text-gray-600">Calendar view coming soon</p>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Tasks</h2>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked className="mt-1" readOnly />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Review Biology Ch 3</p>
                  <p className="text-xs text-green-700 mt-1">2:00 PM - Completed</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Chemistry Quiz Practice</p>
                  <p className="text-xs text-amber-700 mt-1">4:30 PM - Upcoming</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Group Study Session</p>
                  <p className="text-xs text-gray-600 mt-1">6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

      {/* Stats Grid */}
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

      {/* Progress Details */}
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
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">AI Feedback</h2>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              Great progress! You're consistently scoring above 80%. Focus more on Chemistry chapters 5-7 to strengthen your weak areas. Keep up the excellent work! 🎉
            </p>
          </div>
        </div>
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
        {/* Active Sessions */}
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
              <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">Live</span>
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

        {/* Shared Materials */}
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'materials', label: 'Materials', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes', icon: FileQuestion },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'group', label: 'Group Study', icon: Users },
  ];

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage />;
      case 'materials': return <MaterialsPage />;
      case 'quizzes': return <QuizzesPage />;
      case 'planner': return <PlannerPage />;
      case 'progress': return <ProgressPage />;
      case 'group': return <GroupStudyPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
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
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
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
            onClick={() => setIsLoggedIn(false)}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6 text-gray-600" />
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}