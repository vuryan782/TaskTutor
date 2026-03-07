import { FileQuestion, Menu, Plus } from "lucide-react";

export default function QuizzesPage() {
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
