import { useState, useEffect } from "react";
import { Calendar, FileQuestion, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import type { QuizResult } from "../../types/study";

export default function ProgressPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("quiz_results").select("*");
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const totalCompleted = results.length;
  
  const avgScore = totalCompleted === 0 ? 0 : 
    Math.round(results.reduce((acc, curr) => acc + (curr.score / curr.total_questions), 0) / totalCompleted * 100);

  // Simple mock mapping for other stats 
  const studyTimeProgress = Math.min(totalCompleted * 15, 100); // Give 15% per quiz for visual

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
        <p className="text-gray-600">Track your learning journey with AI-powered insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <FileQuestion className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalCompleted}</p>
          <p className="text-sm text-gray-600">Quizzes Completed</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{avgScore}%</p>
          <p className="text-sm text-gray-600">Average Score</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalCompleted > 0 ? 1 : 0}</p>
          <p className="text-sm text-gray-600">Day Streak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Goal</h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Study Time Progress</span>
                <span className="text-sm font-medium text-gray-900">{studyTimeProgress}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${studyTimeProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">AI Feedback</h2>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {totalCompleted === 0 ? (
                "You haven't completed any quizzes yet! Generate and take your first quiz to get started."
              ) : avgScore >= 80 ? (
                "Great progress! You're consistently scoring well. Keep up the excellent work! 🎉"
              ) : (
                "You're making steady progress. Consider generating some more quizzes on the topics you scored lower in to strengthen your weak areas."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
