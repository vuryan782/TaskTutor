import { supabase } from "../../supabaseClient";

// ── Types ──────────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  grounded?: boolean;
  error?: "rate_limit" | "blocked" | "empty" | "config" | "other";
  retryAfterSec?: number;
};

type UserContext = {
  quizResults: { subject: string; topic: string; score: number; created_at: string }[];
  tasks: { title: string; due_date: string; status: string; priority: string }[];
  savedNotes: { title: string; text: string; date: string }[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function getApiKey(): string {
  const key = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY");
  return key;
}

async function callGemini(prompt: string, temperature = 0.4): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    console.error("[Study Coach] Gemini API error:", res.status, errorBody);

    // Try to pull a human-readable reason from Gemini's JSON error envelope,
    // plus any retry-delay hint Gemini ships in the error details.
    let reason = "";
    let retryAfterSec: number | undefined;
    try {
      const parsed = JSON.parse(errorBody);
      reason = parsed?.error?.message ?? "";
      const details: any[] = parsed?.error?.details ?? [];
      for (const d of details) {
        if (typeof d?.retryDelay === "string") {
          // Gemini returns strings like "42s"; parse the seconds out.
          const m = /([0-9]+)s/.exec(d.retryDelay);
          if (m) retryAfterSec = Number(m[1]);
        }
      }
    } catch {
      reason = errorBody.slice(0, 200);
    }

    if (res.status === 429) {
      const err = new Error("rate_limit");
      (err as any).reason = reason;
      (err as any).retryAfterSec = retryAfterSec;
      throw err;
    }

    const err = new Error(`gemini_error_${res.status}`);
    (err as any).reason = reason;
    throw err;
  }

  const data = await res.json();

  // Gemini can return 200 OK but refuse to answer (safety filters, empty candidates, etc.)
  const candidate = data.candidates?.[0];
  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) {
    const err = new Error("gemini_blocked");
    (err as any).reason = blockReason;
    throw err;
  }
  const text = candidate?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    const finishReason = candidate?.finishReason ?? "unknown";
    const err = new Error("gemini_empty");
    (err as any).reason = finishReason;
    throw err;
  }

  return text.trim();
}

// ── Context gathering (scoped to current user) ────────────────────────────

async function gatherUserContext(): Promise<UserContext> {
  const quizResults: UserContext["quizResults"] = [];
  const tasks: UserContext["tasks"] = [];

  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (userId) {
      const [quizRes, tasksRes] = await Promise.all([
        supabase
          .from("quiz_results")
          .select("subject, topic, score, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("tasks")
          .select("title, due_date, status, priority")
          .eq("user_id", userId)
          .order("due_date", { ascending: true })
          .limit(30),
      ]);
      if (quizRes.data) quizResults.push(...quizRes.data);
      if (tasksRes.data) tasks.push(...tasksRes.data);
    }
  } catch {
    // continue with whatever we have
  }

  let savedNotes: UserContext["savedNotes"] = [];
  try {
    const raw = localStorage.getItem("voiceNotes");
    if (raw) {
      const parsed = JSON.parse(raw) as { title: string; text: string; date: string }[];
      savedNotes = parsed.slice(0, 10);
    }
  } catch {
    // ignore
  }

  return { quizResults, tasks, savedNotes };
}

function formatContext(ctx: UserContext): string {
  const parts: string[] = [];

  if (ctx.tasks.length > 0) {
    parts.push(
      "USER'S TASKS:\n" +
        ctx.tasks
          .map(
            (t) =>
              `- "${t.title}" | due: ${t.due_date} | status: ${t.status} | priority: ${t.priority}`
          )
          .join("\n")
    );
  } else {
    parts.push("USER'S TASKS: (none yet)");
  }

  if (ctx.quizResults.length > 0) {
    parts.push(
      "RECENT QUIZ RESULTS:\n" +
        ctx.quizResults
          .map((r) => `- ${r.subject}/${r.topic}: ${r.score}% on ${r.created_at}`)
          .join("\n")
    );
  } else {
    parts.push("RECENT QUIZ RESULTS: (none yet)");
  }

  if (ctx.savedNotes.length > 0) {
    parts.push(
      "SAVED VOICE NOTES:\n" +
        ctx.savedNotes
          .map((n) => `- "${n.title}" (${n.date}): ${n.text.slice(0, 120)}...`)
          .join("\n")
    );
  }

  // Note: the Materials feature is not yet wired to persistent storage,
  // so we intentionally do NOT feed the model a materials list. See system
  // prompt rule #3 (no fabrication).

  return parts.join("\n\n");
}

// ── Main chat function ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Task Tutor Study Coach — a helpful, friendly in-app chatbot for the Task Tutor study app.

YOUR CAPABILITIES:
- Answer questions about the user's uploaded study materials
- Summarize notes and explain concepts in simpler terms
- Help generate quizzes or flashcards from study topics
- Recommend what to study next based on quiz results and tasks
- Help plan study sessions
- Explain progress feedback and weak areas
- Guide users on how to use Task Tutor features
- Support group study questions

RULES:
1. Stay strictly within study support scope. If the user asks something unrelated to studying, academics, or Task Tutor features, politely redirect: "I'm here to help with Task Tutor study support — like summarizing notes, explaining concepts, generating quizzes, planning sessions, and reviewing your progress. What can I help you with?"
2. When answering from the user's actual data (notes, quiz scores, tasks), say so. When giving general study advice not tied to their data, note that clearly.
3. Never fabricate quiz scores, materials, tasks, or sessions that don't exist in the user data provided.
4. If data is missing to answer a question, say so and suggest the user add it (e.g., "I don't see any quiz results yet — try taking a quiz first!").
5. Be concise — prefer short, practical answers. Use bullet points for lists.
6. Handle imperfect spelling, grammar, and slang gracefully. Never criticize the user's wording. Infer intent.
7. If the user wants to generate a quiz, tell them to navigate to the Quizzes page and specify the subject/topic — or offer to suggest topics based on their weak areas.
8. If the user asks what they should study, prioritize: overdue/upcoming tasks, weak quiz topics, then general suggestions.

RESPONSE FORMAT:
- Keep responses under 200 words unless the user asks for detail.
- Use markdown for formatting (bold, lists, etc).
- For off-topic: always give examples of what you CAN help with.`;

export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[]
): Promise<ChatMessage> {
  const id = crypto.randomUUID();

  try {
    const ctx = await gatherUserContext();
    const contextBlock = formatContext(ctx);

    const conversationHistory = history
      .slice(-8)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const prompt = `${SYSTEM_PROMPT}

--- USER'S DATA ---
${contextBlock}

--- CONVERSATION HISTORY ---
${conversationHistory}

--- CURRENT MESSAGE ---
User: ${userMessage}

Respond as the Task Tutor Study Coach:`;

    const response = await callGemini(prompt, 0.5);

    return {
      id,
      role: "assistant",
      text: response,
      timestamp: Date.now(),
      grounded: ctx.quizResults.length > 0 || ctx.tasks.length > 0,
    };
  } catch (err: any) {
    console.error("[Study Coach] Error:", err);
    const reason = err.reason ? ` — ${err.reason}` : "";
    let fallback: string;
    let errorKind: ChatMessage["error"] = "other";
    let retryAfterSec: number | undefined;
    if (err.message === "rate_limit") {
      const retry = typeof err.retryAfterSec === "number" ? err.retryAfterSec : 60;
      retryAfterSec = retry;
      const detail = err.reason
        ? ` Gemini said: "${err.reason.slice(0, 160)}"`
        : "";
      fallback = `I've hit the AI service rate limit. Messaging is paused for ${retry} seconds.${detail}`;
      errorKind = "rate_limit";
    } else if (err.message === "Missing VITE_GEMINI_API_KEY") {
      fallback =
        "The Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file and restart the dev server.";
      errorKind = "config";
    } else if (err.message === "gemini_blocked") {
      fallback = `The AI service blocked this response (reason: ${err.reason}). Try rephrasing your question.`;
      errorKind = "blocked";
    } else if (err.message === "gemini_empty") {
      fallback = `The AI service returned an empty response (finish reason: ${err.reason}). Try rephrasing your question.`;
      errorKind = "empty";
    } else if (err.message?.startsWith("gemini_error")) {
      const status = err.message.replace("gemini_error_", "");
      fallback = `AI service error ${status}${reason}`;
    } else {
      fallback = `Something went wrong: ${err.message || "Unknown error"}${reason}. Please try again.`;
    }

    return {
      id,
      role: "assistant",
      text: fallback,
      timestamp: Date.now(),
      error: errorKind,
      retryAfterSec,
    };
  }
}
