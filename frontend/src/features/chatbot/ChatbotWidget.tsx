import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  BookOpen,
  FileQuestion,
  Brain,
  Calendar,
  TrendingUp,
  Loader2,
  ChevronDown,
  Clock,
} from "lucide-react";
import { sendChatMessage, type ChatMessage } from "./chatbotService";

const RATE_LIMIT_COOLDOWN_MS = 60_000;

const QUICK_ACTIONS = [
  { label: "Summarize my notes", icon: BookOpen, prompt: "Summarize my study notes" },
  { label: "Quiz me", icon: FileQuestion, prompt: "Generate a quiz for me based on my weak areas" },
  { label: "Explain a topic", icon: Brain, prompt: "Can you explain a topic from my materials?" },
  { label: "What should I study?", icon: TrendingUp, prompt: "What should I study next?" },
  { label: "Plan my session", icon: Calendar, prompt: "Help me plan a study session" },
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cooldownRemainingSec =
    cooldownEndsAt !== null
      ? Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000))
      : 0;
  const isCoolingDown = cooldownRemainingSec > 0;

  // Tick while a cooldown is active; stop when it elapses.
  useEffect(() => {
    if (cooldownEndsAt === null) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownEndsAt) {
        setCooldownEndsAt(null);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || isCoolingDown) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: msg,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const reply = await sendChatMessage(msg, [...messages, userMsg]);
    setMessages((prev) => [...prev, reply]);
    setLoading(false);

    if (reply.error === "rate_limit") {
      const retrySec =
        typeof reply.retryAfterSec === "number"
          ? reply.retryAfterSec
          : RATE_LIMIT_COOLDOWN_MS / 1000;
      setCooldownEndsAt(Date.now() + retrySec * 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#7c5cfc] to-[#6a4ce0] text-white rounded-full p-4 shadow-lg shadow-[#7c5cfc]/20 hover:shadow-[#7c5cfc]/40 hover:scale-105 transition-all duration-200"
        title="Open Study Coach"
        aria-label="Open Study Coach chatbot"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-[#111118] rounded-2xl shadow-2xl border border-[#2a2a3a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7c5cfc] to-[#6a4ce0] px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-1.5">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Study Coach</h3>
            <p className="text-white/70 text-xs">Your Task Tutor assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOpen(false)}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Minimize"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setMessages([]);
            }}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Close and clear"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="bg-[#7c5cfc]/10 border border-[#7c5cfc]/20 rounded-xl p-4 text-sm">
              <p className="font-medium mb-1 text-[#e8e8ed]">Hey there! I'm your Study Coach.</p>
              <p className="text-[#8b8b9e] text-xs">
                I can help you summarize notes, explain concepts, plan study
                sessions, recommend what to study, and more. Try a quick action
                below or just ask me anything study-related!
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.prompt)}
                    disabled={loading || isCoolingDown}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1c1c27] hover:bg-[#7c5cfc]/10 text-[#8b8b9e] hover:text-[#7c5cfc] text-xs font-medium rounded-lg border border-[#2a2a3a] hover:border-[#7c5cfc]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#7c5cfc] text-white rounded-2xl rounded-br-md"
                  : "bg-[#1c1c27] text-[#e8e8ed] rounded-2xl rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div
                  className="chatbot-prose"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }}
                />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1c1c27] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-[#8b8b9e] text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions shown after conversation starts */}
      {messages.length > 0 && messages.length < 6 && !loading && !isCoolingDown && (
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
          {QUICK_ACTIONS.slice(0, 3).map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(action.prompt)}
              className="whitespace-nowrap text-xs px-2.5 py-1.5 bg-[#1c1c27] hover:bg-[#7c5cfc]/10 text-[#8b8b9e] hover:text-[#7c5cfc] rounded-full border border-[#2a2a3a] hover:border-[#7c5cfc]/30 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Rate-limit cooldown banner */}
      {isCoolingDown && (
        <div className="mx-4 mb-2 flex items-center gap-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-xs rounded-lg px-3 py-2 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1">
            Rate limit reached. Messaging paused for{" "}
            <span className="font-semibold tabular-nums">{cooldownRemainingSec}s</span>
            {" "}while the quota resets.
          </span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#2a2a3a] px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isCoolingDown
                ? `Paused — try again in ${cooldownRemainingSec}s…`
                : "Ask me anything about studying..."
            }
            disabled={loading || isCoolingDown}
            className="flex-1 bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading || isCoolingDown}
            className={`p-2.5 rounded-xl transition-colors ${
              !input.trim() || loading || isCoolingDown
                ? "bg-[#2a2a3a] text-[#5c5c72] cursor-not-allowed"
                : "bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white"
            }`}
            aria-label={isCoolingDown ? `Paused, ${cooldownRemainingSec}s remaining` : "Send message"}
          >
            {isCoolingDown ? (
              <Clock className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, '<code class="bg-[#2a2a3a] text-[#e8e8ed] px-1 rounded text-xs">$1</code>');

  html = html.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(
    /(<li[^>]*>.*<\/li>\n?)+/g,
    (match) => `<ul class="space-y-1 my-1">${match}</ul>`
  );

  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
  html = html.replace(
    /(<li class="ml-4 list-decimal">.*<\/li>\n?)+/g,
    (match) => `<ol class="space-y-1 my-1">${match}</ol>`
  );

  html = html.replace(/\n{2,}/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  html = `<p>${html}</p>`;

  return html;
}
