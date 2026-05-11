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
        <Loader2 className="w-8 h-8 text-[#7c5cfc] animate-spin" />
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
          <h1 className="text-3xl font-bold text-[#e8e8ed] mb-2">Your Progress</h1>
          <p className="text-[#8b8b9e]">Track your learning journey with AI-powered insights</p>
        </div>

        {/* View Mode Selector */}
        <div className="flex p-1 bg-[#1c1c27] rounded-xl max-w-fit shadow-inner">
          <button
            onClick={() => setViewMode("overview")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "overview" 
                ? "bg-[#2a2a3a] text-[#e8e8ed] shadow-sm" 
                : "text-[#5c5c72] hover:text-[#e8e8ed] hover:bg-[#222233]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setViewMode("scores")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "scores" 
                ? "bg-[#2a2a3a] text-[#e8e8ed] shadow-sm" 
                : "text-[#5c5c72] hover:text-[#e8e8ed] hover:bg-[#222233]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Scores</span>
          </button>
          <button
            onClick={() => setViewMode("activity")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "activity" 
                ? "bg-[#2a2a3a] text-[#e8e8ed] shadow-sm" 
                : "text-[#5c5c72] hover:text-[#e8e8ed] hover:bg-[#222233]"
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
            <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 text-center shadow-sm hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <div className="bg-[#f59e0b]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <FileQuestion className="w-8 h-8 text-[#f59e0b]" />
              </div>
              <p className="text-4xl font-bold text-[#e8e8ed] mb-1">{totalCompleted}</p>
              <p className="text-sm font-medium text-[#5c5c72] uppercase tracking-wider">Quizzes Completed</p>
            </div>

            <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 text-center shadow-sm hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <div className="bg-[#4ade80]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <TrendingUp className="w-8 h-8 text-[#4ade80]" />
              </div>
              <p className="text-4xl font-bold text-[#e8e8ed] mb-1">{avgScore}%</p>
              <p className="text-sm font-medium text-[#5c5c72] uppercase tracking-wider">Average Score</p>
            </div>

            <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 text-center shadow-sm hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <div className="bg-[#ef4444]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Calendar className="w-8 h-8 text-[#ef4444]" />
              </div>
              <p className="text-4xl font-bold text-[#e8e8ed] mb-1">{currentStreak}</p>
              <p className="text-sm font-medium text-[#5c5c72] uppercase tracking-wider">Day Streak</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#e8e8ed] mb-4">Weekly Goal</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#8b8b9e]">Study Time Progress</span>
                    <span className="text-sm font-bold text-[#7c5cfc]">{studyTimeProgress}%</span>
                  </div>
                  <div className="h-4 bg-[#1c1c27] rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-[#7c5cfc] rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${studyTimeProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#e8e8ed] mb-3 flex items-center">
                <span className="text-[#7c5cfc]">
                  AI Feedback
                </span>
              </h2>
              <div className="bg-[#1c1c27] rounded-lg p-5 border border-[#2a2a3a] shadow-sm">
                <p className="text-sm text-[#e8e8ed] leading-relaxed font-medium">
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
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#e8e8ed]">Score History</h2>
            <p className="text-sm text-[#5c5c72]">Your performance across recent quizzes</p>
          </div>
          
          {scoreData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8b8b9e', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8b8b9e', fontSize: 12 }} 
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #2a2a3a', backgroundColor: '#1c1c27', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#e8e8ed', marginBottom: '4px' }}
                    itemStyle={{ color: '#e8e8ed' }}
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#7c5cfc" 
                    strokeWidth={3}
                    dot={{ fill: '#7c5cfc', strokeWidth: 2, r: 4, stroke: '#16161e' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-[#5c5c72]">
              <Activity className="w-12 h-12 mb-3 opacity-20" />
              <p>No quiz scores available yet.</p>
            </div>
          )}
        </div>
      )}

      {viewMode === "activity" && (
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#e8e8ed]">Study Activity</h2>
            <p className="text-sm text-[#5c5c72]">Number of quizzes completed per day</p>
          </div>
          
          {activityData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8b8b9e', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    allowDecimals={false}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8b8b9e', fontSize: 12 }} 
                    dx={-10}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#222233' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #2a2a3a', backgroundColor: '#1c1c27', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#e8e8ed', marginBottom: '4px' }}
                    itemStyle={{ color: '#e8e8ed' }}
                  />
                  <Bar 
                    dataKey="quizzes" 
                    fill="#7c5cfc" 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-[#5c5c72]">
              <BarChart2 className="w-12 h-12 mb-3 opacity-20" />
              <p>No activity data available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
