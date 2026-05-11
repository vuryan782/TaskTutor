import { supabase } from "../../supabaseClient";

// ── Types ──────────────────────────────────────────────────────────────────

export type ChatAction =
  | {
      kind: "task_created";
      title: string;
      dueDate: string;
      priority: string;
      id: string;
    }
  | {
      kind: "reminder_created";
      title: string;
      remindAt: string;
      id: string;
    }
  | {
      kind: "quiz_created";
      subject: string;
      topic: string;
      questionCount: number;
      id: string;
    }
  | {
      kind: "session_created";
      title: string;
      subject: string;
      startsAt: string;
      id: string;
      sessionCode: string;
    }
  | {
      kind: "error";
      tool: string;
      message: string;
    };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  grounded?: boolean;
  error?: "rate_limit" | "blocked" | "empty" | "config" | "other";
  retryAfterSec?: number;
  action?: ChatAction;
};

type UserContext = {
  quizResults: { subject: string; topic: string; score: number; created_at: string }[];
  tasks: { title: string; due_date: string; status: string; priority: string }[];
  savedNotes: { title: string; text: string; date: string }[];
};

type GeminiFunctionCall = {
  name: string;
  args: Record<string, any>;
};

type GeminiPart =
  | { text: string }
  | { functionCall: GeminiFunctionCall }
  | { functionResponse: { name: string; response: any } };

type GeminiContent = {
  role: "user" | "model" | "function";
  parts: GeminiPart[];
};

// ── Gemini helpers ─────────────────────────────────────────────────────────

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_STREAM_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent";

function getApiKey(): string {
  const key = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY");
  return key;
}

// ── Tool schemas (Gemini function declarations) ────────────────────────────

const TOOL_DECLARATIONS = [
  {
    name: "create_task",
    description:
      "Create a new task in the user's Task Tutor task list. Use when the user says things like 'add a task', 'remind me to study X by Friday', 'I need to finish Y'. Always confirm the title and due date if they are ambiguous.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short title of the task. Example: 'Review Biology Ch 3'.",
        },
        due_date: {
          type: "string",
          description:
            "Due date and time as ISO 8601 string in the user's local timezone, e.g. '2026-04-20T21:00:00'. If user says 'tomorrow', 'Friday', 'next week', resolve against today's date.",
        },
        priority: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Urgency. Default to 'medium' if unspecified.",
        },
        description: {
          type: "string",
          description: "Optional longer notes for the task.",
        },
      },
      required: ["title", "due_date"],
    },
  },
  {
    name: "create_reminder",
    description:
      "Create a notification reminder that will push a browser notification at the specified time. Use when user says 'remind me to…', 'set a reminder for…'.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short reminder title shown in the notification.",
        },
        remind_at: {
          type: "string",
          description:
            "Date-time to fire the reminder, ISO 8601 in local time. Example: '2026-04-19T09:00:00'.",
        },
        message: {
          type: "string",
          description: "Optional longer body for the notification.",
        },
      },
      required: ["title", "remind_at"],
    },
  },
  {
    name: "create_quiz",
    description:
      "Generate a 10-question AI quiz on a given subject and topic. Saves it to the user's Quizzes page. Use when user says 'quiz me on X', 'make me a quiz about Y'.",
    parameters: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "Broad subject area, e.g. 'Biology'.",
        },
        topic: {
          type: "string",
          description: "Specific topic within the subject, e.g. 'Photosynthesis'.",
        },
      },
      required: ["subject", "topic"],
    },
  },
  {
    name: "create_group_session",
    description:
      "Create a new group study session owned by the current user. Use when user says 'schedule a group study session', 'create a study room', etc.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Session title, e.g. 'Chemistry Revision Sprint'.",
        },
        subject: {
          type: "string",
          description: "Subject area. Defaults to 'General' if not given.",
        },
        starts_at: {
          type: "string",
          description:
            "Start date-time, ISO 8601 in local time. Example: '2026-04-20T14:00:00'.",
        },
        is_private: {
          type: "boolean",
          description:
            "If true, session requires a code to join. Default false.",
        },
      },
      required: ["title", "starts_at"],
    },
  },
];

// ── Tool handlers ──────────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data?.session?.user?.id;
  if (!uid) throw new Error("You need to be signed in to do that.");
  return uid;
}

async function executeCreateTask(args: Record<string, any>): Promise<ChatAction> {
  const title = String(args.title ?? "").trim();
  const dueDate = String(args.due_date ?? "").trim();
  const priority = ["high", "medium", "low"].includes(args.priority)
    ? args.priority
    : "medium";
  const description = args.description ? String(args.description) : null;
  if (!title) throw new Error("Task title is required.");
  if (!dueDate) throw new Error("Task due date is required.");

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      description,
      priority,
      status: "pending",
      due_date: new Date(dueDate).toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return {
    kind: "task_created",
    title,
    dueDate: new Date(dueDate).toISOString(),
    priority,
    id: data.id,
  };
}

async function executeCreateReminder(
  args: Record<string, any>
): Promise<ChatAction> {
  const title = String(args.title ?? "").trim();
  const remindAt = String(args.remind_at ?? "").trim();
  const message = args.message ? String(args.message) : null;
  if (!title) throw new Error("Reminder title is required.");
  if (!remindAt) throw new Error("Reminder time is required.");

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      user_id: userId,
      title,
      message,
      remind_at: new Date(remindAt).toISOString(),
      is_sent: false,
      send_push: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return {
    kind: "reminder_created",
    title,
    remindAt: new Date(remindAt).toISOString(),
    id: data.id,
  };
}

const QUIZ_STORAGE_KEY = "tasktutor_quizzes";

type LocalQuiz = {
  id: string;
  subject: string;
  topic: string;
  questions: {
    question: string;
    options: string[];
    answerIndex: number;
  }[];
  createdAt: string;
};

async function generateQuizQuestions(subject: string, topic: string) {
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

  const res = await fetch(`${GEMINI_URL}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Could not generate questions (status ${res.status}).`);
  }
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as LocalQuiz["questions"];
}

async function executeCreateQuiz(
  args: Record<string, any>
): Promise<ChatAction> {
  const subject = String(args.subject ?? "").trim();
  const topic = String(args.topic ?? "").trim();
  if (!subject) throw new Error("Quiz subject is required.");
  if (!topic) throw new Error("Quiz topic is required.");

  const questions = await generateQuizQuestions(subject, topic);

  const newQuiz: LocalQuiz = {
    id: crypto.randomUUID(),
    subject,
    topic,
    questions,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    const existing: LocalQuiz[] = raw ? JSON.parse(raw) : [];
    const updated = [newQuiz, ...existing];
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(updated));
  } catch (err: any) {
    throw new Error(`Could not save quiz locally: ${err?.message ?? err}`);
  }

  return {
    kind: "quiz_created",
    subject,
    topic,
    questionCount: questions.length,
    id: newQuiz.id,
  };
}

function makeSessionCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function executeCreateGroupSession(
  args: Record<string, any>
): Promise<ChatAction> {
  const title = String(args.title ?? "").trim();
  const subject = String(args.subject ?? "General").trim() || "General";
  const startsAt = String(args.starts_at ?? "").trim();
  const isPrivate = args.is_private === true;
  if (!title) throw new Error("Session title is required.");
  if (!startsAt) throw new Error("Session start time is required.");

  const userId = await getCurrentUserId();
  const sessionCode = makeSessionCode();

  const { data, error } = await supabase
    .from("group_sessions")
    .insert({
      host_user_id: userId,
      title,
      subject,
      starts_at: new Date(startsAt).toISOString(),
      is_live: false,
      is_private: isPrivate,
      session_code: sessionCode,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return {
    kind: "session_created",
    title,
    subject,
    startsAt: new Date(startsAt).toISOString(),
    id: data.id,
    sessionCode,
  };
}

async function executeTool(
  name: string,
  args: Record<string, any>
): Promise<ChatAction> {
  switch (name) {
    case "create_task":
      return executeCreateTask(args);
    case "create_reminder":
      return executeCreateReminder(args);
    case "create_quiz":
      return executeCreateQuiz(args);
    case "create_group_session":
      return executeCreateGroupSession(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
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

  const today = new Date();
  parts.push(
    `TODAY'S DATE: ${today.toISOString().slice(0, 10)} (${today.toLocaleDateString(undefined, { weekday: "long" })}). When user says "tomorrow", "Friday", "next week", resolve relative to this.`
  );

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

  return parts.join("\n\n");
}

// ── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are the Task Tutor Study Coach — a helpful study assistant for the Task Tutor app.

YOUR CAPABILITIES:
- Answer questions grounded in the user's real data (tasks, quiz results, voice notes shown in context).
- Summarize notes and explain concepts.
- Recommend what to study based on weak topics and upcoming tasks.
- Help plan study sessions.
- Take ACTIONS on the user's behalf via tools: create_task, create_reminder, create_quiz, create_group_session.

WHEN TO CALL A TOOL (IMPORTANT):
- "Add/create a task", "I need to finish X by Friday", "remind me to study" → create_task.
- "Remind me to…" with a specific time → create_reminder (a push notification).
- "Quiz me on X", "make a quiz about Y" → create_quiz.
- "Schedule a group study session for…" → create_group_session.
- If required parameters are missing or ambiguous, ASK the user for them instead of guessing. Never fabricate times or titles.
- Always resolve relative dates ("tomorrow", "Friday") against the TODAY'S DATE block in the context.

RULES:
1. Stay within study scope. Off-topic → redirect politely.
2. Cite grounding when answering from user data (e.g. "Your lowest score is in X").
3. Never invent quiz scores, tasks, or sessions that aren't in the context.
4. Be concise — under 200 words unless detail is asked for.
5. Use markdown lists / bold for readability.
6. When you CALL a tool, keep any accompanying text short and friendly. The UI will render a separate confirmation card.`;

// ── Main send function ────────────────────────────────────────────────────

function parseErrorAndThrow(status: number, errorBody: string): never {
  console.error("[Study Coach] Gemini API error:", status, errorBody);

  let reason = "";
  let retryAfterSec: number | undefined;
  try {
    const parsed = JSON.parse(errorBody);
    reason = parsed?.error?.message ?? "";
    const details: any[] = parsed?.error?.details ?? [];
    for (const d of details) {
      if (typeof d?.retryDelay === "string") {
        const m = /([0-9]+)s/.exec(d.retryDelay);
        if (m) retryAfterSec = Number(m[1]);
      }
    }
  } catch {
    reason = errorBody.slice(0, 200);
  }

  if (status === 429) {
    const err = new Error("rate_limit");
    (err as any).reason = reason;
    (err as any).retryAfterSec = retryAfterSec;
    throw err;
  }

  const err = new Error(`gemini_error_${status}`);
  (err as any).reason = reason;
  throw err;
}

type StreamResult = {
  text: string;
  functionCall?: GeminiFunctionCall;
};

/**
 * Streams a Gemini response via Server-Sent Events. Fires onTextDelta for
 * every text fragment as it arrives. Returns the full accumulated text plus
 * any function call the model decided to make.
 */
async function streamGemini(
  contents: GeminiContent[],
  onTextDelta?: (delta: string) => void
): Promise<StreamResult> {
  const res = await fetch(
    `${GEMINI_STREAM_URL}?alt=sse&key=${getApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          role: "user",
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        generationConfig: { temperature: 0.4 },
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    parseErrorAndThrow(res.status, errorBody);
  }

  if (!res.body) {
    throw new Error("gemini_empty");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedText = "";
  let functionCall: GeminiFunctionCall | undefined;
  let blockReason: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by \n\n. Handle \r\n\r\n too defensively.
    const separator = /\r?\n\r?\n/;
    let match: RegExpExecArray | null;
    while ((match = separator.exec(buffer)) !== null) {
      const event = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);

      if (!event.startsWith("data:")) continue;
      const json = event.slice(5).trim();
      if (!json) continue;

      try {
        const data = JSON.parse(json);
        if (data.promptFeedback?.blockReason) {
          blockReason = data.promptFeedback.blockReason;
          continue;
        }
        const parts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if ("text" in part && typeof part.text === "string" && part.text) {
            accumulatedText += part.text;
            onTextDelta?.(part.text);
          } else if ("functionCall" in part && part.functionCall) {
            functionCall = part.functionCall;
          }
        }
      } catch {
        // Skip malformed chunks rather than aborting the whole stream.
      }
    }
  }

  if (blockReason) {
    const err = new Error("gemini_blocked");
    (err as any).reason = blockReason;
    throw err;
  }

  if (!accumulatedText && !functionCall) {
    const err = new Error("gemini_empty");
    (err as any).reason = "no_content";
    throw err;
  }

  return { text: accumulatedText, functionCall };
}

export type SendChatOptions = {
  /** Called for every text fragment as it streams in. */
  onTextDelta?: (delta: string) => void;
  /** Fired just before a tool starts running, with the tool name. */
  onToolStart?: (toolName: string) => void;
  /** Fired after the tool completes (success or error). */
  onToolEnd?: () => void;
};

export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[],
  options: SendChatOptions = {}
): Promise<ChatMessage> {
  const replyId = crypto.randomUUID();

  try {
    const ctx = await gatherUserContext();
    const contextBlock = formatContext(ctx);

    // Build Gemini contents. We prepend the context as a system-ish user message
    // so it stays fresh even across long conversations.
    const contents: GeminiContent[] = [];
    contents.push({
      role: "user",
      parts: [{ text: `--- CONTEXT ---\n${contextBlock}` }],
    });
    contents.push({
      role: "model",
      parts: [
        {
          text: "Got it — I'll use this context when answering and will call tools when the user asks me to create something.",
        },
      ],
    });
    for (const m of history.slice(-12)) {
      contents.push({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      });
    }
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    // Phase 1: stream the first response. Text deltas flow to the UI live.
    const phase1 = await streamGemini(contents, options.onTextDelta);
    const functionCall = phase1.functionCall;
    const phase1Text = phase1.text;

    let action: ChatAction | undefined;
    let phase2Text = "";

    if (functionCall) {
      // Run the requested tool. Capture errors as an action record.
      options.onToolStart?.(functionCall.name);
      let toolResponse: any;
      try {
        action = await executeTool(functionCall.name, functionCall.args ?? {});
        toolResponse = { ok: true, result: action };
      } catch (toolErr: any) {
        action = {
          kind: "error",
          tool: functionCall.name,
          message: toolErr?.message ?? "Unknown tool error",
        };
        toolResponse = { ok: false, error: toolErr?.message ?? "Unknown error" };
      }
      options.onToolEnd?.();

      // Phase 2: stream the follow-up natural-language confirmation.
      contents.push({ role: "model", parts: [{ functionCall }] });
      contents.push({
        role: "function",
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response: toolResponse,
            },
          },
        ],
      });

      try {
        const phase2 = await streamGemini(contents, options.onTextDelta);
        phase2Text = phase2.text;
      } catch {
        // If the follow-up stream fails, synthesize a short fallback.
        const fallback =
          action.kind === "error"
            ? `I couldn't complete that — ${action.message}`
            : "Done.";
        phase2Text = fallback;
        options.onTextDelta?.(fallback);
      }
    }

    const text = [phase1Text, phase2Text]
      .filter(Boolean)
      .join("\n")
      .trim() || "Done.";

    return {
      id: replyId,
      role: "assistant",
      text,
      timestamp: Date.now(),
      grounded: ctx.quizResults.length > 0 || ctx.tasks.length > 0,
      action,
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
      id: replyId,
      role: "assistant",
      text: fallback,
      timestamp: Date.now(),
      error: errorKind,
      retryAfterSec,
    };
  }
}
