import { useState, useEffect, useMemo } from "react";
import { Calendar, FileQuestion, TrendingUp, Loader2, LayoutDashboard, Activity, BarChart2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import type { QuizResult } from "../../types/study";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from "recharts";
import { format, parseISO, differenceInDays, startOfDay } from "date-fns";

type ViewMode = "overview" | "scores" | "activity";

export default function ProgressPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("quiz_results").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStreak = useMemo(() => {
    if (!results.length) return 0;
    
    // Sort by date descending
    const sortedDates = [...results]
      .map(r => startOfDay(parseISO(r.created_at || new Date().toISOString())).getTime())
      .sort((a, b) => b - a);
  
    // Remove duplicates
    const uniqueDates = Array.from(new Set(sortedDates));
  
    if (uniqueDates.length === 0) return 0;
  
    let streak = 1;
    const today = startOfDay(new Date()).getTime();
    let lastDate = uniqueDates[0];
  
    // If the last activity was more than 1 day ago (from today), streak is 0
    if (differenceInDays(today, lastDate) > 1) {
      return 0;
    }
  
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = differenceInDays(lastDate, uniqueDates[i]);
      if (diff === 1) {
        streak++;
        lastDate = uniqueDates[i];
      } else {
        break;
      }
    }
  
    return streak;
  }, [results]);
  
  const scoreData = useMemo(() => {
    if (!results.length) return [];
    return results.map((r, i) => ({
      name: `Quiz ${i + 1}`,
      score: Math.round((r.score / r.total_questions) * 100),
      date: r.created_at ? format(parseISO(r.created_at), 'MMM dd') : 'Unknown'
    }));
  }, [results]);
  
  const activityData = useMemo(() => {
    if (!results.length) return [];
    
    const counts: Record<string, number> = {};
    results.forEach(r => {
      if (!r.created_at) return;
      const dateStr = format(parseISO(r.created_at), 'MMM dd');
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
  
    // Sort dates
    return Object.keys(counts)
      .map(date => ({
        date,
        quizzes: counts[date]
      }));
  }, [results]);

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

  const studyTimeProgress = Math.min(totalCompleted * 15, 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-600">Track your learning journey with AI-powered insights</p>
        </div>

        {/* View Mode Selector */}
        <div className="flex p-1 bg-gray-100 rounded-xl max-w-fit shadow-inner">
          <button
            onClick={() => setViewMode("overview")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "overview" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setViewMode("scores")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "scores" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Scores</span>
          </button>
          <button
            onClick={() => setViewMode("activity")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "activity" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {viewMode === "overview" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <FileQuestion className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{totalCompleted}</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Quizzes Completed</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{avgScore}%</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Average Score</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-br from-orange-100 to-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Calendar className="w-8 h-8 text-rose-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{currentStreak}</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Day Streak</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Goal</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Study Time Progress</span>
                    <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">{studyTimeProgress}%</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${studyTimeProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  AI Feedback
                </span>
              </h2>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-5 border border-purple-100 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
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
      )}

      {viewMode === "scores" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Score History</h2>
            <p className="text-sm text-gray-500">Your performance across recent quizzes</p>
          </div>
          
          {scoreData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <Activity className="w-12 h-12 mb-3 opacity-20" />
              <p>No quiz scores available yet.</p>
            </div>
          )}
        </div>
      )}

      {viewMode === "activity" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Study Activity</h2>
            <p className="text-sm text-gray-500">Number of quizzes completed per day</p>
          </div>
          
          {activityData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    allowDecimals={false}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dx={-10}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                  />
                  <Bar 
                    dataKey="quizzes" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <BarChart2 className="w-12 h-12 mb-3 opacity-20" />
              <p>No activity data available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
