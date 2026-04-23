import { useEffect, useState } from "react";
import { Calendar, FileQuestion, TrendingUp, Brain, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";

type QuizResult = {
  id: string;
  subject: string;
  topic: string;
  score: number;
  created_at: string;
};

type TopicSuggestion = {
  topic: string;
  subject: string;
  avgScore: number;
  reason: string;
  priority: "high" | "medium" | "low";
};

type AggregatedTopic = {
  subject: string;
  topic: string;
  avgScore: number;
  attempts: number;
};

async function fetchAISuggestions(topics: AggregatedTopic[]): Promise<TopicSuggestion[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");

  const topicSummary = topics
    .map((t) => `- ${t.subject} / ${t.topic}: avg score ${t.avgScore}% over ${t.attempts} attempt(s)`)
    .join("\n");

  const prompt = `You are a study coach AI. A student has the following quiz performance data:

${topicSummary}

Based on this data, identify the top topics they should review, prioritised by weakest performance.
Respond ONLY with a valid JSON array (no markdown, no explanation) with this exact shape:
[
  {
    "topic": "topic name",
    "subject": "subject name",
    "avgScore": number,
    "reason": "one sentence explaining why they should review this",
    "priority": "high" | "medium" | "low"
  }
]
Priority rules: score < 60 = high, 60-79 = medium, 80+ = low. Only include topics scoring below 85. Max 5 items.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as TopicSuggestion[];
}

const priorityStyles: Record<string, string> = {
  high: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20",
  medium: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  low: "bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/20",
};

export default function ProgressPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  const aggregatedTopics: AggregatedTopic[] = Object.values(
    results.reduce<Record<string, AggregatedTopic>>((acc, r) => {
      const key = `${r.subject}__${r.topic}`;
      if (!acc[key]) {
        acc[key] = { subject: r.subject, topic: r.topic, avgScore: 0, attempts: 0 };
      }
      acc[key].attempts += 1;
      acc[key].avgScore += r.score;
      return acc;
    }, {})
  ).map((t) => ({ ...t, avgScore: Math.round(t.avgScore / t.attempts) }));

  const avgScore = results.length
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const streak = (() => {
    if (!results.length) return 0;
    const days = new Set(results.map((r) => r.created_at.slice(0, 10)));
    const sorted = Array.from(days).sort().reverse();
    let count = 0;
    let cursor = new Date();
    for (const day of sorted) {
      const d = new Date(day);
      const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
      if (diff > 1) break;
      count++;
      cursor = d;
    }
    return count;
  })();

  async function loadData() {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("quiz_results")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setResults(data ?? []);
    setLoadingData(false);
  }

  async function getAISuggestions(topics: AggregatedTopic[]) {
    if (!topics.length) return;
    setLoadingAI(true);
    setAiError("");
    try {
      const result = await fetchAISuggestions(topics);
      setSuggestions(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to get AI suggestions.");
    } finally {
      setLoadingAI(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loadingData && aggregatedTopics.length > 0 && suggestions.length === 0) {
      getAISuggestions(aggregatedTopics);
    }
  }, [loadingData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8e8ed] mb-2">Your Progress</h1>
        <p className="text-[#8b8b9e]">Track your learning journey with AI-powered insights</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 text-center">
          <div className="bg-[#f59e0b]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <FileQuestion className="w-8 h-8 text-[#f59e0b]" />
          </div>
          <p className="text-3xl font-bold text-[#e8e8ed] mb-1">
            {loadingData ? "—" : results.length}
          </p>
          <p className="text-sm text-[#8b8b9e]">Quizzes Completed</p>
        </div>

        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 text-center">
          <div className="bg-[#4ade80]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-[#4ade80]" />
          </div>
          <p className="text-3xl font-bold text-[#e8e8ed] mb-1">
            {loadingData ? "—" : results.length ? `${avgScore}%` : "N/A"}
          </p>
          <p className="text-sm text-[#8b8b9e]">Average Score</p>
        </div>

        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6 text-center">
          <div className="bg-[#f59e0b]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-[#f59e0b]" />
          </div>
          <p className="text-3xl font-bold text-[#e8e8ed] mb-1">
            {loadingData ? "—" : streak}
          </p>
          <p className="text-sm text-[#8b8b9e]">Day Streak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-topic breakdown */}
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <h2 className="text-xl font-bold text-[#e8e8ed] mb-4">Topic Scores</h2>
          {loadingData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 bg-[#2a2a3a] rounded w-2/3 mb-2" />
                  <div className="h-2 bg-[#2a2a3a] rounded w-full" />
                </div>
              ))}
            </div>
          ) : aggregatedTopics.length === 0 ? (
            <p className="text-sm text-[#5c5c72]">
              No results yet. Log a quiz result from the Quizzes page to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {aggregatedTopics
                .sort((a, b) => a.avgScore - b.avgScore)
                .map((t) => (
                  <div key={`${t.subject}__${t.topic}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-[#e8e8ed]">{t.topic}</span>
                        <span className="text-xs text-[#5c5c72] ml-2">({t.subject})</span>
                      </div>
                      <span className="text-sm font-semibold text-[#e8e8ed]">{t.avgScore}%</span>
                    </div>
                    <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          t.avgScore < 60
                            ? "bg-[#ef4444]"
                            : t.avgScore < 80
                            ? "bg-[#f59e0b]"
                            : "bg-[#4ade80]"
                        }`}
                        style={{ width: `${t.avgScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#5c5c72] mt-0.5">{t.attempts} attempt(s)</p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="bg-gradient-to-br from-[#7c5cfc]/10 to-[#6a4ce0]/5 border border-[#7c5cfc]/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#7c5cfc]" />
              <h2 className="text-xl font-bold text-[#e8e8ed]">AI Study Suggestions</h2>
            </div>
            {aggregatedTopics.length > 0 && (
              <button
                onClick={() => getAISuggestions(aggregatedTopics)}
                disabled={loadingAI}
                className="p-2 hover:bg-[#7c5cfc]/10 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh suggestions"
              >
                <RefreshCw className={`w-4 h-4 text-[#7c5cfc] ${loadingAI ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>

          {loadingData || loadingAI ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#16161e] rounded-lg p-4 border border-[#2a2a3a] animate-pulse">
                  <div className="h-3 bg-[#2a2a3a] rounded w-2/3 mb-2" />
                  <div className="h-2 bg-[#2a2a3a] rounded w-full" />
                </div>
              ))}
            </div>
          ) : aiError ? (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#ef4444]">Couldn't load suggestions</p>
                <p className="text-xs text-[#ef4444]/70 mt-1">{aiError}</p>
              </div>
            </div>
          ) : suggestions.length === 0 && aggregatedTopics.length === 0 ? (
            <div className="bg-[#16161e] rounded-lg p-4 border border-[#2a2a3a]">
              <p className="text-sm text-[#8b8b9e]">
                Log quiz results from the Quizzes page and AI will suggest which topics to review.
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="bg-[#16161e] rounded-lg p-4 border border-[#2a2a3a]">
              <p className="text-sm text-[#8b8b9e]">
                Great work! All your topics are scoring above 85%. Keep it up!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="bg-[#16161e] rounded-lg p-4 border border-[#2a2a3a]">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-[#e8e8ed]">{s.topic}</p>
                      <p className="text-xs text-[#5c5c72]">{s.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold text-[#8b8b9e]">{s.avgScore}%</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${priorityStyles[s.priority]}`}>
                        {s.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#8b8b9e] leading-relaxed">{s.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent results table */}
      {results.length > 0 && (
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <h2 className="text-xl font-bold text-[#e8e8ed] mb-4">Recent Results</h2>
          <div className="space-y-2">
            {results.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-[#1c1c27] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-[#e8e8ed]">{r.topic}</p>
                  <p className="text-xs text-[#5c5c72]">{r.subject} • {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  r.score < 60
                    ? "bg-[#ef4444]/10 text-[#ef4444]"
                    : r.score < 80
                    ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                    : "bg-[#4ade80]/10 text-[#4ade80]"
                }`}>
                  {r.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
