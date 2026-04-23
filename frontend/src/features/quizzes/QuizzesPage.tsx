import { FileQuestion, Plus, Trash2, Brain, ChevronRight, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import ConfirmDialog from "../../components/ConfirmDialog";

// ── Types ──────────────────────────────────────────────────────────────────

type Question = {
  question: string;
  options: string[];
  answerIndex: number;
};

type Quiz = {
  id: string;
  subject: string;
  topic: string;
  questions: Question[];
  createdAt: string;
};

type ViewState = "list" | "creating" | "taking" | "results";

// ── Gemini question generation ─────────────────────────────────────────────

async function generateQuestions(subject: string, topic: string): Promise<Question[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY in .env.local");

  const prompt = `Generate 10 multiple choice questions about "${topic}" in the subject "${subject}".
Return ONLY a valid JSON array, no markdown, no explanation. Use this exact shape:
[
  {
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "answerIndex": 0
  }
]
answerIndex is the zero-based index of the correct answer in the options array.
Make questions progressively harder. Mix factual recall and conceptual understanding.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
    }
  );

  if (!res.ok) {
    if (res.status === 429) throw new Error("Too many requests — please wait a moment and try again.");
    throw new Error(`Gemini API error: ${res.status}`);
  }
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as Question[];
}

// ── Local storage helpers ──────────────────────────────────────────────────

const STORAGE_KEY = "tasktutor_quizzes";

function loadQuizzes(): Quiz[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveQuizzes(quizzes: Quiz[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
}

// ── Main component ─────────────────────────────────────────────────────────

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [view, setView] = useState<ViewState>("list");

  // Create form
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  // Taking a quiz
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  // Results
  const [savingResult, setSavingResult] = useState(false);
  const [pendingDeleteQuiz, setPendingDeleteQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    setQuizzes(loadQuizzes());
  }, []);

  // ── Create quiz ────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) return;
    setGenerating(true);
    setGenError("");
    try {
      const questions = await generateQuestions(subject.trim(), topic.trim());
      const newQuiz: Quiz = {
        id: crypto.randomUUID(),
        subject: subject.trim(),
        topic: topic.trim(),
        questions,
        createdAt: new Date().toISOString(),
      };
      const updated = [newQuiz, ...quizzes];
      setQuizzes(updated);
      saveQuizzes(updated);
      setSubject("");
      setTopic("");
      setView("list");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate questions. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  function deleteQuiz(id: string) {
    const quiz = quizzes.find((q) => q.id === id);
    if (!quiz) return;
    setPendingDeleteQuiz(quiz);
  }

  function confirmDeleteQuiz() {
    if (!pendingDeleteQuiz) return;
    const updated = quizzes.filter((q) => q.id !== pendingDeleteQuiz.id);
    setQuizzes(updated);
    saveQuizzes(updated);
    setPendingDeleteQuiz(null);
  }

  // ── Take quiz ──────────────────────────────────────────────────────────

  function startQuiz(quiz: Quiz) {
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setSelected(null);
    setConfirmed(false);
    setAnswers([]);
    setView("taking");
  }

  function confirmAnswer() {
    if (selected === null) return;
    setConfirmed(true);
  }

  function nextQuestion() {
    const newAnswers = [...answers, selected!];
    if (currentQ + 1 < activeQuiz!.questions.length) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setConfirmed(false);
    } else {
      finishQuiz(newAnswers);
    }
  }

  async function finishQuiz(finalAnswers: number[]) {
    if (!activeQuiz) return;
    const correct = finalAnswers.filter(
      (ans, i) => ans === activeQuiz.questions[i].answerIndex
    ).length;
    const score = Math.round((correct / activeQuiz.questions.length) * 100);
    setAnswers(finalAnswers);
    setView("results");

    // Auto-save to Supabase
    setSavingResult(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("quiz_results").insert({
        user_id: user?.id,
        subject: activeQuiz.subject,
        topic: activeQuiz.topic,
        score,
      });
    } catch (err) {
      console.error("Failed to save quiz result:", err);
    } finally {
      setSavingResult(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────

  const score = activeQuiz
    ? Math.round(
        (answers.filter((ans, i) => ans === activeQuiz.questions[i].answerIndex).length /
          activeQuiz.questions.length) *
          100
      )
    : 0;

  // ── Render: Creating ───────────────────────────────────────────────────

  if (view === "creating") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView("list"); setGenError(""); }}
            className="text-[#8b8b9e] hover:text-[#e8e8ed] text-sm flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-[#e8e8ed]">Create Quiz</h1>
        </div>

        <div className="max-w-lg bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-[#7c5cfc]/10 rounded-lg p-2">
              <Brain className="w-5 h-5 text-[#7c5cfc]" />
            </div>
            <div>
              <p className="font-semibold text-[#e8e8ed]">AI Question Generator</p>
              <p className="text-xs text-[#5c5c72]">Gemini will generate 10 questions instantly</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8b8b9e] mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, Chemistry, History..."
                className="w-full px-4 py-2 rounded-lg bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8b8b9e] mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cell Mitosis, The French Revolution..."
                className="w-full px-4 py-2 rounded-lg bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
                required
              />
            </div>

            {genError && (
              <p className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-2">
                {genError}
              </p>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-[#7c5cfc] hover:bg-[#6a4ce0] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating questions...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Generate Quiz
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: Taking ─────────────────────────────────────────────────────

  if (view === "taking" && activeQuiz) {
    const q = activeQuiz.questions[currentQ];
    const isCorrect = confirmed && selected === q.answerIndex;
    const isWrong = confirmed && selected !== q.answerIndex;
    const progress = ((currentQ) / activeQuiz.questions.length) * 100;

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <p className="text-sm text-[#5c5c72] mb-1">{activeQuiz.subject} / {activeQuiz.topic}</p>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-[#e8e8ed]">
              Question {currentQ + 1} of {activeQuiz.questions.length}
            </h1>
            <span className="text-sm text-[#8b8b9e]">{Math.round(progress)}% done</span>
          </div>
          <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7c5cfc] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <p className="text-lg font-semibold text-[#e8e8ed] mb-6">{q.question}</p>

          <div className="space-y-3">
            {q.options.map((option, i) => {
              let style = "border-[#2a2a3a] bg-[#1c1c27] hover:bg-[#222233] text-[#e8e8ed]";
              if (confirmed) {
                if (i === q.answerIndex) {
                  style = "border-[#4ade80] bg-[#4ade80]/10 text-[#4ade80]";
                } else if (i === selected) {
                  style = "border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]";
                } else {
                  style = "border-[#2a2a3a] bg-[#1c1c27] text-[#5c5c72]";
                }
              } else if (selected === i) {
                style = "border-[#7c5cfc] bg-[#7c5cfc]/10 text-[#e8e8ed]";
              }

              return (
                <button
                  key={i}
                  onClick={() => !confirmed && setSelected(i)}
                  disabled={confirmed}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors font-medium flex items-center justify-between ${style}`}
                >
                  <span>{option}</span>
                  {confirmed && i === q.answerIndex && <CheckCircle className="w-5 h-5 text-[#4ade80] flex-shrink-0" />}
                  {confirmed && i === selected && i !== q.answerIndex && <XCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {confirmed && (
            <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${isCorrect ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
              {isCorrect
                ? "Correct!"
                : `Incorrect — the correct answer is: "${q.options[q.answerIndex]}"`}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          {!confirmed ? (
            <button
              onClick={confirmAnswer}
              disabled={selected === null}
              className="bg-[#7c5cfc] hover:bg-[#6a4ce0] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Confirm Answer
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {currentQ + 1 < activeQuiz.questions.length ? "Next Question" : "See Results"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Results ────────────────────────────────────────────────────

  if (view === "results" && activeQuiz) {
    const correct = answers.filter((ans, i) => ans === activeQuiz.questions[i].answerIndex).length;

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-8 text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
            score >= 80 ? "bg-[#4ade80]/10" : score >= 60 ? "bg-[#f59e0b]/10" : "bg-[#ef4444]/10"
          }`}>
            <span className={`text-3xl font-bold ${
              score >= 80 ? "text-[#4ade80]" : score >= 60 ? "text-[#f59e0b]" : "text-[#ef4444]"
            }`}>
              {score}%
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#e8e8ed] mb-1">Quiz Complete!</h2>
          <p className="text-[#8b8b9e] mb-1">
            {correct} out of {activeQuiz.questions.length} correct
          </p>
          <p className="text-sm text-[#5c5c72] mb-1">
            {activeQuiz.topic} — {activeQuiz.subject}
          </p>
          {savingResult ? (
            <p className="text-xs text-[#7c5cfc] mt-2">Saving result to your progress...</p>
          ) : (
            <p className="text-xs text-[#4ade80] mt-2">Result saved to your Progress page</p>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => startQuiz(activeQuiz)}
              className="bg-[#1c1c27] hover:bg-[#222233] text-[#e8e8ed] border border-[#2a2a3a] px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Retry Quiz
            </button>
            <button
              onClick={() => setView("list")}
              className="bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>

        {/* Answer review */}
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <h3 className="font-bold text-[#e8e8ed] mb-4">Review Answers</h3>
          <div className="space-y-4">
            {activeQuiz.questions.map((q, i) => {
              const wasCorrect = answers[i] === q.answerIndex;
              return (
                <div key={i} className={`p-4 rounded-lg border ${wasCorrect ? "bg-[#4ade80]/10 border-[#4ade80]/20" : "bg-[#ef4444]/10 border-[#ef4444]/20"}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {wasCorrect
                      ? <CheckCircle className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />}
                    <p className="text-sm font-medium text-[#e8e8ed]">{q.question}</p>
                  </div>
                  {!wasCorrect && (
                    <div className="ml-6 space-y-1 text-xs">
                      <p className="text-[#ef4444]">Your answer: {q.options[answers[i]]}</p>
                      <p className="text-[#4ade80]">Correct answer: {q.options[q.answerIndex]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: List ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8e8ed] mb-2">My Quizzes</h1>
          <p className="text-[#8b8b9e]">AI-generated quizzes tailored to your topics</p>
        </div>
        <button
          onClick={() => setView("creating")}
          className="bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Quiz
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ── Original mock cards (preserved) ── */}
          <div className="bg-gradient-to-br from-[#7c5cfc]/20 to-[#6a4ce0]/10 border-2 border-[#7c5cfc]/30 rounded-xl p-6 hover:shadow-lg hover:shadow-[#7c5cfc]/5 transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-[#7c5cfc] rounded-lg p-3">
                <FileQuestion className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs bg-[#7c5cfc]/10 text-[#7c5cfc] px-2 py-1 rounded-full">Active</span>
            </div>
            <h3 className="font-bold text-[#e8e8ed] mb-2">Biology Chapter 3 Quiz</h3>
            <p className="text-sm text-[#8b8b9e] mb-4">25 questions • Created 2 days ago</p>
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white py-2 rounded-lg transition-colors text-sm">
                Start Quiz
              </button>
            </div>
          </div>

          <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-6 hover:shadow-lg hover:shadow-black/10 transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-[#1c1c27] rounded-lg p-3">
                <FileQuestion className="w-6 h-6 text-[#8b8b9e]" />
              </div>
              <span className="text-xs bg-[#8b8b9e]/10 text-[#8b8b9e] px-2 py-1 rounded-full">Draft</span>
            </div>
            <h3 className="font-bold text-[#e8e8ed] mb-2">Chemistry Midterm Practice</h3>
            <p className="text-sm text-[#8b8b9e] mb-4">40 questions • Created last week</p>
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white py-2 rounded-lg transition-colors text-sm">
                Continue Editing
              </button>
            </div>
          </div>

          {/* ── AI-generated quizzes ── */}
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-6 hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-[#1c1c27] rounded-lg p-3">
                  <FileQuestion className="w-6 h-6 text-[#7c5cfc]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#4ade80]/10 text-[#4ade80] px-2 py-1 rounded-full">AI</span>
                  <button
                    onClick={() => deleteQuiz(quiz.id)}
                    className="p-1 text-[#5c5c72] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-[#e8e8ed] mb-1">{quiz.topic}</h3>
              <p className="text-sm text-[#8b8b9e] mb-1">{quiz.subject}</p>
              <p className="text-xs text-[#5c5c72] mb-4">
                {quiz.questions.length} questions • {new Date(quiz.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => startQuiz(quiz)}
                className="w-full bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Start Quiz
              </button>
            </div>
          ))}

          {/* ── Create new card ── */}
          <div
            onClick={() => setView("creating")}
            className="border-2 border-dashed border-[#2a2a3a] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[#7c5cfc] hover:bg-[#7c5cfc]/5 transition-colors cursor-pointer"
          >
            <div className="bg-[#7c5cfc]/10 rounded-full p-4 mb-3">
              <Plus className="w-6 h-6 text-[#7c5cfc]" />
            </div>
            <p className="font-medium text-[#e8e8ed] mb-1">Create New Quiz</p>
            <p className="text-sm text-[#5c5c72]">AI generates 10 questions instantly</p>
          </div>
        </div>

      <ConfirmDialog
        open={pendingDeleteQuiz !== null}
        title="Delete quiz?"
        message={
          pendingDeleteQuiz
            ? `"${pendingDeleteQuiz.topic}" and its ${pendingDeleteQuiz.questions.length} questions will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteQuiz}
        onCancel={() => setPendingDeleteQuiz(null)}
      />
    </div>
  );
}
